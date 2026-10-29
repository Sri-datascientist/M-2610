from collections.abc import Generator
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.config import settings

logger = logging.getLogger(__name__)

# Declarative Base for ORM models
Base = declarative_base()


def create_resilient_engine():
    """
    Connects to the configured PostgreSQL DATABASE_URL.
    If the database is not accessible yet (e.g. user hasn't connected PostgreSQL yet),
    gracefully falls back to local SQLite so the backend remains functional and responsive.
    """
    db_url = settings.DATABASE_URL
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    try:
        eng = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True,
        )
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        safe_db_url = make_url(db_url).render_as_string(hide_password=True)
        logger.info("Successfully connected to primary database: %s", safe_db_url)
        return eng, False
    except Exception as exc:
        logger.warning(
            "Primary database connection check failed (%s). "
            "Falling back to local SQLite database ('sqlite:///./meyveda_dev.db') "
            "so the backend functions immediately. Whenever PostgreSQL credentials are provided in .env, "
            "PostgreSQL will be used.",
            exc,
        )
        fallback_url = "sqlite:///./meyveda_dev.db"
        eng = create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
        return eng, True


engine, is_db_fallback = create_resilient_engine()

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session and ensuring safe cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict[str, str]:
    """
    Verify database connectivity safely without crashing the application.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        engine_type = "sqlite_dev_fallback" if is_db_fallback else "postgresql"
        return {"status": "connected", "database": "accessible", "type": engine_type}
    except Exception as exc:
        logger.warning("Database connectivity check failed: %s", exc)
        return {"status": "unavailable", "database": "unreachable", "detail": "Database service is temporarily unavailable"}


def init_db():
    """
    Create tables and seed initial data if needed.
    """
    import databases.schema.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
