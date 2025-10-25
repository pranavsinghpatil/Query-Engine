from fastapi import APIRouter, Request, Depends
from typing import Dict

router = APIRouter()

@router.get("/")
async def get_metrics(request: Request) -> Dict:
    """
    Returns application performance metrics.
    """
    # Metrics are stored in the application state and updated by other processes
    metrics = {
        "queries_processed": request.app.state.metrics.get("queries_processed", 0),
        "documents_indexed": request.app.state.metrics.get("documents_indexed", 0),
        "avg_response_time": request.app.state.metrics.get("avg_response_time", 0.0),
    }
    return metrics
