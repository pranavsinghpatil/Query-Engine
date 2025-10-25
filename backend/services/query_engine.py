import logging
import time
import asyncio
import re

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine

from services.schema_discovery import SchemaDiscovery
from services.document_processor import DocumentProcessor
from services.query_cache import QueryCache

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class QueryEngine:
    """
    Orchestrates query processing by classifying queries, generating SQL,
    searching documents, and caching results.
    """
    def __init__(self, connection_string: str, document_processor: DocumentProcessor):
        self.connection_string = connection_string
        self.schema_discovery = SchemaDiscovery()
        self.document_processor = document_processor
        self.cache = QueryCache()
        self.schema = {}

    async def initialize(self):
        """Asynchronously connects to the DB and analyzes the schema."""
        self.async_engine = create_async_engine(self.connection_string)
        try:
            async with self.async_engine.connect():
                logging.info("Database connection successful.")
            sync_connection_string = self.connection_string.replace("+aiosqlite", "")
            self.schema = await asyncio.to_thread(self.schema_discovery.analyze_database, sync_connection_string)
            if "error" in self.schema:
                logging.error(f"Schema analysis failed: {self.schema['error']}")
            else:
                logging.info(f"Schema analysis complete. Found {len(self.schema.get('tables', []))} tables.")
        except Exception as e:
            logging.error(f"Database initialization failed: {e}")
            self.schema = {"error": str(e)}

    def _classify_query(self, query: str) -> str:
        """Classifies a query as SQL, document search, or hybrid."""
        query_lower = query.lower()
        doc_keywords = ["document", "resume", "policy", "handbook", "file"]
        sql_keywords = ["table", "column", "database", "average", "count", "sum", "list", "show me"]

        is_doc = any(keyword in query_lower for keyword in doc_keywords)
        is_sql = any(keyword in query_lower for keyword in sql_keywords)

        if is_doc and not is_sql:
            return "document"
        if is_sql and not is_doc:
            return "sql"
        
        # If keywords from both are present, or none are, default to hybrid
        return "hybrid"

    def _generate_sql(self, mapping: dict) -> str:
        """
        Generates a SQL query based on the mapped schema, including column selection
        and basic WHERE clauses.
        """
        best_table = mapping.get("best_table_match")
        mapped_columns = mapping.get("mapped_columns", [])
        
        if not best_table:
            return None

        # Select specific columns if mapped, otherwise select all
        select_columns = []
        if mapped_columns:
            for col_match, score in mapped_columns:
                table_name, col_name = col_match.split('.')
                if table_name == best_table:
                    select_columns.append(f'"{col_name}"')
            if not select_columns: # Fallback if mapped columns are not for the best table
                select_columns = ["*"]
        else:
            select_columns = ["*"]
        
        select_clause = ", ".join(select_columns)
        sql = f'SELECT {select_clause} FROM "{best_table}"'
        
        # Basic WHERE clause generation (example for demonstration - needs much more NLP processing)
        where_clauses = []
        query_lower = mapping["query"].lower()

        # Example: look for simple equality phrases like 'X is Y' or 'X = Y'
        # This is a very simplistic approach and needs significant NLP for real-world use
        if best_table == "employees": # Example for a specific table
            if "department" in query_lower:
                match = re.search(r'department (is|=)?\s*(\w+)', query_lower)
                if match:
                    department_name = match.group(2).strip()
                    where_clauses.append(f'"department" = \'{department_name.capitalize()}\'') # Assuming capitalized department names

            if "salary" in query_lower:
                match = re.search(r'salary (>|<|=)?\s*(\d+)', query_lower)
                if match:
                    operator = match.group(1) or '='
                    salary_value = match.group(2).strip()
                    where_clauses.append(f'"salary" {operator} {salary_value}')

        if where_clauses:
            sql += " WHERE " + " AND ".join(where_clauses)

        sql += " LIMIT 20;" # Always limit results for safety

        return sql

    async def process_query(self, query: str) -> dict:
        """Main method to process a user's natural language query."""
        start_time = time.time()

        cached_result = self.cache.get(query)
        if cached_result:
            cached_result["cached"] = True
            return cached_result

        if "error" in self.schema:
            return {"error": f"Cannot process query, schema not loaded: {self.schema['error']}"}

        query_type = self._classify_query(query)
        result = {"type": query_type, "performance_metrics": {}}
        
        sql_result, doc_result = None, None

        # Run SQL and/or Document search based on classification
        if query_type in ["sql", "hybrid"]:
            sql_result = await self._execute_sql_query(query)
        
        if query_type in ["document", "hybrid"]:
            doc_result = await self.document_processor.search_documents(query)

        result["sql_result"] = sql_result
        result["doc_result"] = doc_result
        
        end_time = time.time()
        result["performance_metrics"]["response_time"] = end_time - start_time
        
        self.cache.set(query, result)
        return result

    async def _execute_sql_query(self, query: str) -> dict:
        """Generates and executes a SQL query."""
        try:
            # Map NL query to schema
            mapping = self.schema_discovery.map_natural_language_to_schema(query, self.schema)
            
            # Generate SQL from mapping
            sql_query = self._generate_sql(mapping)
            if not sql_query:
                return {"error": "Could not determine a database table to query."}

            # Execute query
            async with self.async_engine.connect() as conn:
                result_proxy = await conn.execute(text(sql_query))
                data = [dict(row) for row in result_proxy.mappings()]
            
            return {"generated_sql": sql_query, "data": data}
        except Exception as e:
            logging.error(f"Error executing SQL query: {e}")
            return {"error": str(e)}