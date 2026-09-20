from pathlib import Path
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")


# =====================================================
# DATABASE CONFIGURATION
# =====================================================

if DATABASE_URL:
    # PostgreSQL / external database
    engine = create_engine(DATABASE_URL)
else:
    # Local SQLite fallback for development/demo
    DATABASE_PATH = BASE_DIR / "railway_eta.db"
    engine = create_engine(
        f"sqlite:///{DATABASE_PATH}",
        connect_args={"check_same_thread": False}
    )


# =====================================================
# DATABASE SESSION
# =====================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =====================================================
# BASE MODEL
# =====================================================

Base = declarative_base()