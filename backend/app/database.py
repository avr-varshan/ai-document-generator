import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Use Supabase DATABASE_URL or fallback to SQLite locally
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Local dev fallback
    DATABASE_URL = "sqlite:///./ai_doc_platform.db"
    print("Using LOCAL SQLite database:", DATABASE_URL)
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Supabase requires SSL ALWAYS
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require"}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
