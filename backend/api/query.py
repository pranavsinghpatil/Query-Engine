from fastapi import APIRouter
from services.query_engine import QueryEngine

router = APIRouter()
engine = None

@router.post("/query")
async def process_query(query: str, connection_string: str):
    global engine
    if engine is None or engine.connection_string != connection_string:
        engine = QueryEngine(connection_string)
    result = engine.process_query(query)
    return result
