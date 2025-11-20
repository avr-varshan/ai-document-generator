import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Use DATABASE_URL from environment variable (Supabase) or fallback to SQLite for local dev
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback to SQLite for local development
    DATABASE_URL = "sqlite:///./ai_doc_platform.db"
    print("Using LOCAL SQLite database:", DATABASE_URL)
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Use Supabase PostgreSQL connection
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Dependency to get database session for FastAPI endpoints.
    
    Yields:
        Database session for use in endpoints
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()