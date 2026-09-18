"""
Application configuration using Pydantic Settings.

WHY PYDANTIC SETTINGS?
- Type-safe environment variable parsing (no silent failures from wrong types)
- Automatic validation at startup — catches config errors before serving traffic
- Supports .env files in development, real env vars in production/Docker
- Single source of truth for all app-wide constants
"""

from functools import lru_cache
from typing import Any

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # Silently ignore unknown env vars
    )

    # ── PostgreSQL ────────────────────────────────────────────────────────────
    DATABASE_HOSTNAME: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_USERNAME: str = "postgres"
    DATABASE_PASSWORD: str = "postgres"
    DATABASE_NAME: str = "urlshortener"

    @property
    def DATABASE_URL(self) -> str:
        """Build async DSN dynamically."""
        return (
            f"postgresql+asyncpg://{self.DATABASE_USERNAME}:{self.DATABASE_PASSWORD}"
            f"@{self.DATABASE_HOSTNAME}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Synchronous URL used only by Alembic migrations."""
        return (
            f"postgresql+psycopg://{self.DATABASE_USERNAME}:{self.DATABASE_PASSWORD}"
            f"@{self.DATABASE_HOSTNAME}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT ───────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── App ───────────────────────────────────────────────────────────────────
    BASE_URL: str = "http://localhost:8000"
    ENVIRONMENT: str = "development"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ── Proxy ─────────────────────────────────────────────────────────────────
    # Number of trusted reverse proxies in front of the app (Render = 1). Each proxy
    # appends to X-Forwarded-For, so the client IP is the Nth entry from the right;
    # anything further left is client-supplied and spoofable. 0 = ignore the header.
    TRUSTED_PROXY_HOPS: int = 1

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # ── URL Config ────────────────────────────────────────────────────────────
    NANOID_LENGTH: int = 8
    DEFAULT_URL_EXPIRY_DAYS: int = 365

    # ── Connection Pool ───────────────────────────────────────────────────────
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800  # Recycle connections every 30 min

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
