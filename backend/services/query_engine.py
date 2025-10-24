from sqlalchemy import create_engine, text
from services.schema_discovery import SchemaDiscovery
from services.nl_mapper import NLMapper

class QueryEngine:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.engine = create_engine(connection_string)
        self.schema = SchemaDiscovery().analyze_database(connection_string)
        self.mapper = NLMapper(self.schema)

    def detect_table(self, query_words):
        best_table = None
        best_score = 0

        for table in self.schema.keys():
            score = len(set(query_words) & set(self.schema[table]))
            if score > best_score:
                best_score = score
                best_table = table

        return best_table

    def build_sql(self, user_query: str):
        words = user_query.lower().split()

        table = self.detect_table(words)
        if not table:
            table = list(self.schema.keys())[0]  # fallback

        columns = self.schema[table]
        select_cols = []

        for w in words:
            col = self.mapper.best_match(w, table)
            if col and col not in select_cols:
                select_cols.append(col)

        if len(select_cols) == 0:
            select_cols = columns[:3]  # minimal fallback

        sql = f"SELECT {', '.join(select_cols)} FROM {table} LIMIT 20"
        return sql

    def process_query(self, query: str):
        sql = self.build_sql(query)

        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(sql))
                rows = [dict(r) for r in result]
                return {"type": "sql", "sql": sql, "data": rows}
        except Exception as e:
            return {"error": str(e), "sql": sql}
