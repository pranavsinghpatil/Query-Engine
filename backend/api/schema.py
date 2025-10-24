from fastapi import APIRouter
from services.schema_discovery import SchemaDiscovery

router = APIRouter()
schema_manager = SchemaDiscovery()

@router.post("/connect-database")
async def connect_database(connection_string: str):
    schema = schema_manager.analyze_database(connection_string)
    return {"schema": schema}
