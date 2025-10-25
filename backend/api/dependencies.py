from fastapi import Request
from services.query_engine import QueryEngine

def get_query_engine(request: Request) -> QueryEngine:
    """Dependency to get the query engine instance from the application state."""
    return request.app.state.query_engine
