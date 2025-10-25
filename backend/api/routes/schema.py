from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from services.query_engine import QueryEngine
from api.dependencies import get_query_engine

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_current_schema(query_engine: QueryEngine = Depends(get_query_engine)):
    """
    Returns the currently loaded database schema that was discovered on startup.
    """
    if not query_engine or "error" in query_engine.schema:
        raise HTTPException(
            status_code=404,
            detail="Schema not loaded. Please connect to a database first."
        )
    return query_engine.schema
