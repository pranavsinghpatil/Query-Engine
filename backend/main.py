 
from fastapi import FastAPI
from api import ingestion, query, schema

app = FastAPI(title="NLP Query Engine")

app.include_router(ingestion.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(schema.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "API running"}
