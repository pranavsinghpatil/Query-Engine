# NLP Query Engine

This project is a full-stack application designed to answer natural language questions about structured (SQL databases) and unstructured (documents) data. It features a FastAPI backend that dynamically discovers database schemas and a React frontend for user interaction.

## Features

- **Dynamic Schema Discovery**: Automatically analyzes a connected SQL database (PostgreSQL, SQLite, etc.) to understand its tables, columns, and relationships without any hard-coding.
- **Natural Language to SQL**: Translates natural language questions into SQL queries.
- **Document Search**: Ingests and indexes text from documents (PDF, DOCX, TXT) to find relevant information.
- **Hybrid Querying**: Answers questions by combining information from both the database and uploaded documents.
- **RESTful API**: A clean, asynchronous API built with FastAPI.
- **Modular Architecture**: Services for schema discovery, document processing, and query orchestration are separated for clarity and maintainability.

## Project Structure

```
Query-Engine/
├── backend/
│   ├── api/            # FastAPI routers and models
│   ├── services/       # Core logic (QueryEngine, SchemaDiscovery, etc.)
│   ├── main.py         # FastAPI app entry point
│   └── requirements.txt
├── frontend/
│   ├── src/            # React components and source
│   ├── package.json
│   └── ...
├── uploaded_documents/ # Temporary storage for uploaded files
├── query_list.txt      # Sample queries for testing
└── README.md
```

## Setup and Installation

### Prerequisites

- Python 3.8+
- Node.js and npm (for the frontend)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment and activate it:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the backend server:**
    ```bash
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
    ```
    The API will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install npm packages:**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Start the development server:**
    ```bash
    npm start
    ```
    The frontend will be available at `http://localhost:3000` and will be proxied to the backend.

## API Usage

The backend provides several endpoints to interact with the query engine.

- `POST /api/ingest/connect-database`
  Connects the engine to a new database. The application starts with a default in-memory SQLite database.
  **Body**: `{ "connection_string": "your_database_connection_string" }`

- `POST /api/ingest/upload-documents`
  Uploads one or more documents (`.pdf`, `.docx`, `.txt`) for processing and semantic search.

- `GET /api/ingest/ingestion-status/{job_id}`
  Checks the status of a background document ingestion job.

- `POST /api/query/`
  The main endpoint for asking natural language questions.
  **Body**: `{ "query": "Your natural language query" }`

- `GET /api/query/history`
  Returns a list of the most recent successful queries.

- `GET /api/schema/`
  Returns the JSON representation of the currently discovered database schema.
