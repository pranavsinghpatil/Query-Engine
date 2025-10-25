from fastapi import APIRouter
from services import global_query_engine

router = APIRouter()

@router.get("/db/status")
async def get_db_status():
    if global_query_engine and global_query_engine.db_connected:
        return {"connected": True}
    else:
        return {"connected": False}
