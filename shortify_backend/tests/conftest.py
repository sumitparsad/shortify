"""
Pytest configuration and shared fixtures.

TESTING ARCHITECTURE:
─────────────────────
1. SQLite in-memory database per test function — fully isolated, zero setup.
2. Each test gets a fresh DB — no state leaks between tests.
3. FastAPI dependency overrides — inject test doubles cleanly.
4. Mock Redis — in-memory dict, no running Redis required.
"""

import asyncio
import uuid
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.redis import get_redis
from app.main import create_app
from app.models import User, URL, URLAnalytics  # noqa: F401


# ── Per-test SQLite engine ─────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def db_engine():
    """Fresh in-memory SQLite database per test."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a fresh DB session backed by the per-test engine."""
    factory = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with factory() as session:
        yield session


@pytest.fixture
def mock_redis() -> MagicMock:
    """In-memory mock Redis per test."""
    store: dict[str, Any] = {}

    redis_mock = MagicMock()
    redis_mock.get = AsyncMock(side_effect=lambda k: store.get(k))
    redis_mock.setex = AsyncMock(side_effect=lambda k, ttl, v: store.update({k: v}))
    redis_mock.delete = AsyncMock(side_effect=lambda k: store.pop(k, None))
    redis_mock.exists = AsyncMock(side_effect=lambda k: int(k in store))

    def _incr(k):
        store[k] = store.get(k, 0) + 1
        return store[k]

    redis_mock.incr = AsyncMock(side_effect=_incr)
    redis_mock.expire = AsyncMock(return_value=True)
    redis_mock.ping = AsyncMock(return_value=True)
    redis_mock.zadd = AsyncMock(return_value=1)
    redis_mock.zincrby = AsyncMock(return_value=1.0)
    redis_mock.zrevrange = AsyncMock(return_value=[])
    redis_mock.aclose = AsyncMock()
    return redis_mock


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, mock_redis: MagicMock) -> AsyncGenerator[AsyncClient, None]:
    """
    Async HTTP test client with injected test DB and mock Redis.
    Uses a unique test user email per test via unique suffix.
    """
    app = create_app()

    async def override_get_db():
        yield db_session

    async def override_get_redis():
        yield mock_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# ── User fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture
def unique_id() -> str:
    """Short unique suffix to make emails/usernames unique per test."""
    return uuid.uuid4().hex[:8]


@pytest.fixture
def user_payload(unique_id: str) -> dict:
    return {
        "email": f"test_{unique_id}@example.com",
        "username": f"user_{unique_id}",
        "password": "TestPass1",
    }


@pytest_asyncio.fixture
async def registered_user(client: AsyncClient, user_payload: dict) -> dict:
    response = await client.post("/api/v1/auth/register", json=user_payload)
    assert response.status_code == 201, response.text
    return response.json()


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, user_payload: dict, registered_user: dict) -> dict:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": user_payload["email"], "password": user_payload["password"]},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def url_payload() -> dict:
    return {
        "long_url": "https://www.example.com/very/long/path?query=value",
        "title": "Example Site",
    }
