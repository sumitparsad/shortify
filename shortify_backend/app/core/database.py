"""
Async database engine and session management.

ARCHITECTURE DECISIONS:
───────────────────────
1. create_async_engine()
   FastAPI is async — we need async DB access to avoid blocking the event loop.
   Blocking the loop with sync SQLAlchemy would kill concurrency under load.

2. async_sessionmaker()
   Factory that produces AsyncSession objects.
   Each HTTP request gets its own session (unit of work pattern).
   Sessions are NOT thread-safe; one per request ensures isolation.

3. get_db() dependency
   FastAPI's dependency injection calls this for every route that needs DB.
   The `try/finally` guarantees session.close() even if an exception is raised.
   SQLAlchemy's async session is a context manager, but DI requires a generator.

4. Connection Pool
   pool_size=10       → Keep 10 connections alive permanently
   max_overflow=20    → Allow 20 extra connections under burst (total 30)
   pool_timeout=30    → Raise if no connection available in 30s
   pool_recycle=1800  → Replace connections older than 30min (avoid stale TCP)

INTERVIEW QUESTION: "What's the difference between Engine and Session?"
Answer: Engine = connection pool (process-level singleton, expensive to create).
        Session = unit of work (request-level, cheap, tracks ORM state).
        Never create an Engine per request — that would exhaust DB connections.

SCALING NOTE:
With PgBouncer (connection pooler) in front of PostgreSQL, you can serve
10K concurrent users with only 50-100 real DB connections.
FastAPI app servers → PgBouncer → PostgreSQL
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """
    SQLAlchemy 2.0 declarative base.

    All ORM models inherit from this.
    WHY NOT metadata.create_all()? We use Alembic for schema management.
    create_all() is fine for toy projects but breaks in production:
      - No rollback on failure
      - No incremental schema evolution
      - No audit trail of schema changes
    """
    pass


# ── Engine (singleton per process) ───────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=not settings.is_production,  # Log SQL only in development
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=True,  # Verify connection health before checkout
)

# ── Session factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Keep attribute access after commit (avoids lazy-load errors)
    autocommit=False,
    autoflush=False,  # Explicit flush control — we flush manually before queries
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session per request.

    Usage:
        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            ...

    The session is automatically closed after the response is sent,
    even if an exception is raised in the route handler.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
