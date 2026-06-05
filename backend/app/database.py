from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/job_assistant")

_engine = None
_SessionLocal = None
Base = declarative_base()


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL)
    return _engine


def SessionLocal():
    """Lazy-initialized sessionmaker. Calling this returns a new Session."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_get_engine())
    return _SessionLocal()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_tables():
    """Create all tables. Safe to call even if DB is unreachable."""
    try:
        Base.metadata.create_all(bind=_get_engine())
    except Exception:
        pass  # DB not available — app works without it
