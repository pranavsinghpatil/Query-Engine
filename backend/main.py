import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api.routes import ingestion, query, schema, metrics
from services.query_engine import QueryEngine
from services.document_processor import DocumentProcessor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI(
    title="NLP Query Engine",
    description="A system to query structured and unstructured data using natural language.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
async def startup_event():
    """
    Application startup event. Initializes the query engine and shared state.
    """
    logging.info("Starting application initialization...")
    
    # Initialize shared state objects
    app.state.ingestion_status = {}
    app.state.query_history = []
    app.state.metrics = {
        "queries_processed": 0,
        "documents_indexed": 0,
        "avg_response_time": 0.0,
    }

    # Use an in-memory SQLite database by default for demo purposes.
    # The user can connect to a different database via the /api/connect-database endpoint.
    default_connection_string = "sqlite+aiosqlite:///./default_database.db"
    logging.info(f"Using default database: {default_connection_string}")

    document_processor = DocumentProcessor()
    query_engine = QueryEngine(default_connection_string, document_processor)
    
    # Initialize the engine (connects to DB, discovers schema)
    await query_engine.initialize()
    
    # Store the initialized engine in the application state
    app.state.query_engine = query_engine
    logging.info("Application initialization complete.")

# Include API routers
app.include_router(ingestion.router, prefix="/api/ingest", tags=["Data Ingestion"])
app.include_router(query.router, prefix="/api/query", tags=["Query"])
app.include_router(schema.router, prefix="/api/schema", tags=["Schema"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])

@app.get("/", tags=["Root"])
async def read_root():
    """A simple endpoint to confirm the API is running."""
    return {"status": "API is running"}