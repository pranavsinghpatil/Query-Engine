from pydantic import BaseModel

class NaturalLanguageQuery(BaseModel):
    """Pydantic model for a user's natural language query."""
    query: str
