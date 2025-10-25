import os
import shutil
import asyncio
from uuid import uuid4
from typing import List, Dict

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    BackgroundTasks,
    Depends,
    Request
)

from services.query_engine import QueryEngine
from services.document_processor import DocumentProcessor
from api.dependencies import get_query_engine
from api.models.database import DatabaseConnection

router = APIRouter()

# A temporary directory to store uploaded files before processing.
UPLOAD_DIR = "uploaded_documents_temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_ingestion_status_store(request: Request) -> Dict:
    """Dependency to get the shared ingestion status store."""
    return request.app.state.ingestion_status


async def process_documents_background(
    document_processor: DocumentProcessor,
    file_paths: List[str],
    job_id: str,
    status_store: Dict
):
    """Asynchronous background task to process documents."""
    try:
        await document_processor.process_documents(file_paths, job_id, status_store)
    except Exception as e:
        status_store[job_id]["status"] = "Failed"
        status_store[job_id]["message"] = str(e)
    finally:
        # Clean up temporary files
        for path in file_paths:
            try:
                os.remove(path)
            except OSError:
                pass


@router.post("/connect-database")
async def connect_database(db_connection: DatabaseConnection, request: Request):
    """
    Connects the application to a new database by creating and initializing a
    new QueryEngine instance with the provided connection string.
    """
    try:
        # Create a new document processor for the new engine
        document_processor = DocumentProcessor()
        # Create and initialize the new query engine
        new_query_engine = QueryEngine(db_connection.connection_string, document_processor)
        await new_query_engine.initialize()

        if "error" in new_query_engine.schema:
            raise HTTPException(status_code=400, detail=f"Failed to analyze database: {new_query_engine.schema['error']}")

        # Replace the old engine in the app state with the new one
        request.app.state.query_engine = new_query_engine
        
        return {"message": "Database connected and schema discovered successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to database: {e}")


@router.post("/upload-documents")
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    query_engine: QueryEngine = Depends(get_query_engine),
    status_store: Dict = Depends(get_ingestion_status_store)
):
    """
    Accepts multiple document uploads and processes them in the background.
    """
    if not query_engine:
        raise HTTPException(status_code=400, detail="Database not connected. Please connect to a database first.")

    job_id = str(uuid4())
    file_paths = []
    for f in files:
        file_location = os.path.join(UPLOAD_DIR, f.filename)
        try:
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(f.file, buffer)
            file_paths.append(file_location)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not save file {f.filename}: {e}")

    status_store[job_id] = {"status": "Starting", "progress": 0, "message": "File upload complete, starting processing."}
    
    background_tasks.add_task(
        process_documents_background,
        query_engine.document_processor,
        file_paths,
        job_id,
        status_store
    )

    return {"message": "Document ingestion started in the background.", "job_id": job_id}


@router.get("/ingestion-status/{job_id}")
async def get_ingestion_status(job_id: str, status_store: Dict = Depends(get_ingestion_status_store)):
    """
    Returns the progress of a document processing job.
    """
    job = status_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job ID not found.")
    return job
