from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict

from services.query_engine import QueryEngine
from api.dependencies import get_query_engine
from api.models.query import NaturalLanguageQuery

router = APIRouter()

def get_query_history_store(request: Request) -> List:
    """Dependency to get the shared query history store."""
    return request.app.state.query_history

@router.post("/")
async def process_natural_language_query(
    nl_query: NaturalLanguageQuery,
    query_engine: QueryEngine = Depends(get_query_engine),
    query_history: List = Depends(get_query_history_store)
):
    """
    Processes a natural language query against the currently connected data sources.
    """
    if not query_engine or "error" in query_engine.schema:
        raise HTTPException(
            status_code=400,
            detail="System not ready. Please connect to a database via the ingestion endpoint first."
        )

    result = await query_engine.process_query(nl_query.query)
    
    if "error" not in result:
        # Store the query if it was successful
        if len(query_history) > 100: # Keep history to a reasonable size
            query_history.pop(0)
        query_history.append(nl_query.query)

    return result

@router.get("/history", response_model=List[str])
async def get_query_history(query_history: List = Depends(get_query_history_store)):
    """
    Returns a list of the most recent successful queries.
    """
    return query_history
