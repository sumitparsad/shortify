"""
Redis client management.

WHY REDIS FOR CACHING/RATE LIMITING?
- In-memory → microsecond latency vs milliseconds for PostgreSQL
- Atomic operations (INCR, EXPIRE, SETNX) enable race-condition-free rate limiting
- Pub/Sub and Sorted Sets enable advanced patterns (leaderboards, streams)
- Single-threaded event loop = no locks needed for atomic ops

CACHE-ASIDE PATTERN (used throughout this project):
1. Request arrives → check Redis (cache hit? return immediately)
2. Cache miss → query PostgreSQL → store result in Redis with TTL → return result
3. On update/delete → invalidate Redis key → next request re-populates from DB

WHY NOT WRITE-THROUGH?
Write-through keeps cache always warm but adds latency on writes.
Cache-aside is better for read-heavy workloads (URL redirects are 95% reads).

INTERVIEW QUESTION: "How does Redis reduce PostgreSQL load?"
Answer: A popular short URL might get 10,000 redirects/minute.
Without Redis, each redirect hits PostgreSQL → 10K queries/min.
With Redis cache (TTL=1h), only the first redirect hits PostgreSQL.
Redis can serve ~100K ops/second on a single instance.

DISTRIBUTED REDIS:
- Redis Cluster: Shards keys across 16384 slots (hash slots)
- Redis Sentinel: HA with automatic failover
- At Bitly/Google scale: Redis Cluster + read replicas per shard
"""

from collections.abc import AsyncGenerator
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

# ── Cache TTL constants (seconds) ────────────────────────────────────────────
URL_CACHE_TTL = 3600          # 1 hour for URL lookups
USER_CACHE_TTL = 300          # 5 min for user data
ANALYTICS_CACHE_TTL = 60      # 1 min for analytics (acceptable staleness)
RATE_LIMIT_TTL = settings.RATE_LIMIT_WINDOW_SECONDS

# ── Redis key namespace helpers ───────────────────────────────────────────────
def url_cache_key(slug: str) -> str:
    return f"url:slug:{slug}"

def user_cache_key(user_id: str) -> str:
    return f"user:id:{user_id}"

def rate_limit_key(identifier: str) -> str:
    return f"ratelimit:{identifier}"

def token_blocklist_key(jti: str) -> str:
    return f"auth:blocklist:{jti}"

def analytics_key(slug: str, date: str) -> str:
    return f"analytics:{slug}:{date}"

def hot_urls_key() -> str:
    return "urls:hot"


# ── Redis Connection Pool ────────────────────────────────────────────────────
_redis_pool: aioredis.Redis | None = None


async def get_redis_pool() -> aioredis.Redis:
    """
    Returns a connection-pooled Redis client (singleton).

    WHY CONNECTION POOL?
    Same reason as PostgreSQL: connection establishment has overhead.
    redis-py manages the pool internally — max_connections limits resource use.
    """
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )
    return _redis_pool


async def close_redis_pool() -> None:
    """Gracefully close the Redis connection pool on app shutdown."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.aclose()
        _redis_pool = None


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """FastAPI dependency for Redis client injection."""
    pool = await get_redis_pool()
    yield pool


class RedisCache:
    """
    High-level cache abstraction wrapping raw Redis operations.
    Centralizes serialization and error handling.
    """

    def __init__(self, redis: aioredis.Redis) -> None:
        self._r = redis

    async def get(self, key: str) -> str | None:
        """Cache-aside get. Returns None on cache miss."""
        try:
            return await self._r.get(key)
        except Exception:
            return None  # Fail open: cache errors should not break the app

    async def set(self, key: str, value: str, ttl: int) -> None:
        """Set with TTL. Silently swallows errors (cache is optional)."""
        try:
            await self._r.setex(key, ttl, value)
        except Exception:
            pass

    async def delete(self, key: str) -> None:
        """Cache invalidation. Called on URL update/delete."""
        try:
            await self._r.delete(key)
        except Exception:
            pass

    async def exists(self, key: str) -> bool:
        try:
            return bool(await self._r.exists(key))
        except Exception:
            return False

    async def increment(self, key: str, ttl: int | None = None) -> int:
        """
        Atomic increment — safe for rate limiting.
        Redis INCR is atomic: no race condition even with multiple app instances.
        """
        count = await self._r.incr(key)
        if count == 1 and ttl:
            await self._r.expire(key, ttl)
        return count

    async def zadd(self, key: str, mapping: dict[str, float], ttl: int | None = None) -> None:
        """Sorted set add — used for leaderboards / top URLs."""
        await self._r.zadd(key, mapping)
        if ttl:
            await self._r.expire(key, ttl)

    async def zincrby(self, key: str, amount: float, member: str) -> None:
        """Atomic sorted set increment — used for real-time click counting."""
        await self._r.zincrby(key, amount, member)

    async def zrevrange(self, key: str, start: int, end: int) -> list[str]:
        """Get top N members by score (descending)."""
        return await self._r.zrevrange(key, start, end)
