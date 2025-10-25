from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class NLMapper:
    def __init__(self, schema: dict):
        self.schema = schema
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

    def map_natural_language_to_schema(self, query: str) -> dict:
        """
        Map user's natural language to actual database structure using semantic similarity.
        """
        query_embedding = self.model.encode([query])

        best_match = {
            "table": None,
            "column": None,
            "score": 0
        }

        for table_name, table_info in self.schema["tables"].items():
            for column_info in table_info["columns"]:
                column_embedding = column_info["semantic_embedding"]
                similarity = cosine_similarity(query_embedding, [column_embedding])[0][0]

                if similarity > best_match["score"]:
                    best_match["table"] = table_name
                    best_match["column"] = column_info["name"]
                    best_match["score"] = similarity

        return {
            "query": query,
            "mapped_table": best_match["table"],
            "mapped_column": best_match["column"],
            "similarity_score": float(best_match["score"])
        }
