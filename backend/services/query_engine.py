from services.schema_discovery import SchemaDiscovery
from sqlalchemy import create_engine, text

class QueryEngine:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.engine = create_engine(connection_string)
        self.schema = SchemaDiscovery().analyze_database(connection_string)

    def process_query(self, query: str):
        # TEMP: raw SQL direct execution (we improve later)
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query))
                rows = [dict(r) for r in result]
                return {"type": "sql", "data": rows}
        except Exception as e:
            return {"error": str(e)}
