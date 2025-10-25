import logging
import time
import asyncio

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
        Generates a simple SQL query based on the mapped schema.
        This is a simplified implementation for demonstration.
        """
        if not mapping.get("best_table_match"):
            return None

        table = mapping["best_table_match"]
        
        # Simple implementation: select all columns from the best-matched table.
        # A more advanced version would select specific columns based on mapped_columns.
        sql = f'SELECT * FROM "{table}" LIMIT 20;'
        
        # Basic WHERE clause generation (demonstration only)
        # This part is complex; a real implementation would use more advanced NLP
        # to understand entities and relationships.
        if mapping.get("mapped_columns"):
            # Example: if query was "show me employees with salary over 50000"
            # and 'salary' is a mapped column, one could try to parse 'over 50000'.
            # This is beyond the scope of this simplified generator.
            pass

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