import logging
from sqlalchemy import create_engine, inspect, text
from rapidfuzz import process, fuzz
import numpy as np

# Lazy loading for sentence-transformers
_model = None

def get_sentence_transformer_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        except ImportError:
            logging.error("Sentence-transformers library not found. Please install it.")
            return None
    return _model

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class SchemaDiscovery:
    """
    Analyzes a database to discover its schema and maps natural language to it.
    """

    def analyze_database(self, connection_string: str) -> dict:
        """
        Connects to a database to automatically discover tables, columns, and relationships.
        It also generates semantic embeddings for columns to aid in NLP mapping.
        """
        model = get_sentence_transformer_model()
        if not model:
            return {"error": "SentenceTransformer model not available."}

        logging.info(f"Analyzing database: {connection_string}")
        try:
            engine = create_engine(connection_string)
            inspector = inspect(engine)
        except Exception as e:
            logging.error(f"Failed to create database engine: {e}")
            return {"error": f"Invalid connection string: {e}"}

        schema = {"tables": {}}
        try:
            table_names = inspector.get_table_names()
            with engine.connect() as connection:
                for table_name in table_names:
                    columns = []
                    for column in inspector.get_columns(table_name):
                        col_info = {
                            "name": column['name'],
                            "type": str(column['type']),
                            "embedding": model.encode([column['name']])[0].tolist(),
                        }
                        
                        # Augment embedding with sample data if possible
                        try:
                            sample_query = text(f'SELECT "{column["name"]}" FROM {table_name} WHERE "{column["name"]}" IS NOT NULL LIMIT 5')
                            sample_result = connection.execute(sample_query).fetchall()
                            if sample_result:
                                sample_data = [str(row[0]) for row in sample_result]
                                sample_embedding = model.encode(sample_data)
                                # Average the column name embedding with data embeddings
                                col_info["embedding"] = np.mean([col_info["embedding"]] + list(sample_embedding), axis=0).tolist()
                        except Exception:
                            pass # Ignore sampling errors
                        
                        columns.append(col_info)

                    schema["tables"][table_name] = {
                        "columns": columns,
                        "primary_key": inspector.get_pk_constraint(table_name),
                        "foreign_keys": inspector.get_foreign_keys(table_name),
                    }
            logging.info(f"Database analysis complete. Found {len(table_names)} tables.")
        except Exception as e:
            logging.error(f"An error occurred during schema inspection: {e}")
            return {"error": f"Schema inspection failed: {e}"}
            
        return schema

    def map_natural_language_to_schema(self, query: str, schema: dict) -> dict:
        """
        Maps terms in a natural language query to the most likely tables and columns
        in the discovered schema using fuzzy string matching.
        """
        if not schema or "tables" not in schema:
            return {"error": "Invalid schema provided."}

        query_terms = query.lower().split()
        all_tables = list(schema["tables"].keys())
        all_columns = []
        for table in all_tables:
            for col in schema["tables"][table]["columns"]:
                all_columns.append(f"{table}.{col['name']}")

        mapped_tables = process.extract(query, all_tables, scorer=fuzz.WRatio, limit=5)
        mapped_columns = process.extract(query, all_columns, scorer=fuzz.WRatio, limit=10)

        # Filter matches with a score below a certain threshold
        min_score = 75
        best_table_match = mapped_tables[0] if mapped_tables and mapped_tables[0][1] > min_score else None
        
        # Find the best table match based on column matches if no direct table match is good
        if not best_table_match and mapped_columns:
            # Get the table from the best column match
            best_col_table = mapped_columns[0][0].split('.')[0]
            best_table_match = (best_col_table, 100) # Assume high confidence

        return {
            "query": query,
            "best_table_match": best_table_match[0] if best_table_match else None,
            "mapped_tables": [m for m in mapped_tables if m[1] > min_score],
            "mapped_columns": [m for m in mapped_columns if m[1] > min_score],
        }