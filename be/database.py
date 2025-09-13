import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

load_dotenv()

db_user = os.getenv("POSTGRES_USER", "postgres")
db_password = os.getenv("POSTGRES_PASSWORD", "password")
db_server = os.getenv("POSTGRES_SERVER", "localhost") # Fallback to localhost if not set
db_port = os.getenv("POSTGRES_PORT", "5432")
db_name = os.getenv("POSTGRES_DB", "postgres")
DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_server}:{db_port}/{db_name}"

SQLALCHEMY_DATABASE_URL = DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    This function is a dependency for FastAPI routes.
    It creates a new database session for each request,
    yields it to the route, and then closes it.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()