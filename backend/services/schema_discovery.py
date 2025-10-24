from sqlalchemy import create_engine, inspect

class SchemaDiscovery:
    def analyze_database(self, connection_string: str) -> dict:
        engine = create_engine(connection_string)
        inspector = inspect(engine)

        schema = {}
        for table in inspector.get_table_names():
            columns = inspector.get_columns(table)
            schema[table] = [col["name"] for col in columns]

        return schema
