from pydantic import BaseModel

class DatabaseConnection(BaseModel):
    """Pydantic model for the database connection string."""
    connection_string: str
