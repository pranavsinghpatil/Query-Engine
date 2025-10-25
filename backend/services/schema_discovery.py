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
        in the discovered schema using semantic similarity and fuzzy matching.
        """
        if not schema or "tables" not in schema:
            return {"error": "Invalid schema provided."}

        model = get_sentence_transformer_model()
        if not model:
            return {"error": "SentenceTransformer model not available for mapping."}

        query_embedding = model.encode([query])[0]

        table_scores = []
        column_scores = []

        for table_name, table_info in schema["tables"].items():
            # Aggregate column embeddings for table representation
            table_embeddings = [col['embedding'] for col in table_info['columns']]
            if table_embeddings:
                avg_table_embedding = np.mean(table_embeddings, axis=0)
                table_similarity = fuzz.ratio(query.lower(), table_name.lower()) # Keep fuzzy for table names
                # semantic_similarity = np.dot(query_embedding, avg_table_embedding) / (np.linalg.norm(query_embedding) * np.linalg.norm(avg_table_embedding))
                # For simplicity, we'll just use fuzzy ratio for table names for now, 
                # as semantic similarity for aggregated table embeddings can be complex.
                table_scores.append((table_name, table_similarity))

            for col_info in table_info['columns']:
                col_name = col_info['name']
                col_embedding = col_info['embedding']
                
                semantic_similarity = np.dot(query_embedding, col_embedding) / (np.linalg.norm(query_embedding) * np.linalg.norm(col_embedding))
                fuzzy_similarity = fuzz.ratio(query.lower(), col_name.lower())
                
                # Combine semantic and fuzzy similarity (e.g., weighted average)
                # This weighting can be tuned. Semantic is more important for conceptual match.
                combined_similarity = (semantic_similarity * 0.7 + fuzzy_similarity * 0.3)
                column_scores.append((f"{table_name}.{col_name}", combined_similarity))

        # Sort by combined similarity in descending order
        table_scores.sort(key=lambda x: x[1], reverse=True)
        column_scores.sort(key=lambda x: x[1], reverse=True)

        best_table_match = table_scores[0] if table_scores and table_scores[0][1] > 60 else None # Lower threshold for fuzzy table match
        best_column_match = column_scores[0] if column_scores and column_scores[0][1] > 0.5 else None # Threshold for combined similarity

        # If no strong table match, try to infer from best column match
        if not best_table_match and best_column_match:
            best_col_table = best_column_match[0].split('.')[0]
            best_table_match = (best_col_table, 100) # Assume high confidence if column matches

        return {
            "query": query,
            "best_table_match": best_table_match[0] if best_table_match else None,
            "mapped_tables": [m for m in table_scores if m[1] > 60],
            "mapped_columns": [m for m in column_scores if m[1] > 0.5],
        }