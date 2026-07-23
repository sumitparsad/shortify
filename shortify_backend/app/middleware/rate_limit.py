"""
Rate limiting middleware using Redis sliding window algorithm.

SLIDING WINDOW vs FIXED WINDOW:
────────────────────────────────
Fixed Window: Count resets at the start of each minute.
  Problem: A burst at :59 and :01 means 2x the limit in 2 seconds.

Sliding Window: Uses a rolling time window.
  We implement this with Redis INCR + EXPIRE:
  - Key: ratelimit:{ip}
  - Value: request count within the window
  - TTL: window size in seconds
  This is actually a "fixed window with sliding reset" — simpler than
  true sliding window (which requires a sorted set per IP) but sufficient
  for most production use cases.

True Sliding Window with Sorted Set:
  ZADD ratelimit:{ip} {timestamp} {uuid}
  ZREMRANGEBYSCORE ratelimit:{ip} 0 {timestamp - window}
  count = ZCARD ratelimit:{ip}
  (More accurate but higher Redis memory usage)

RATE LIMITING SCOPE:
- Per-IP: protects against anonymous abuse
- Per-User: protects against authenticated API abuse
- Per-Endpoint: tighter limits on expensive operations (analytics queries)

INTERVIEW QUESTION: "How would you rate limit at scale?"
Answer: Redis Cluster → each IP maps to a slot via consistent hashing.
No cross-node coordination needed — each node is authoritative for its slots.
At Google scale: Doorman (centralized) or adaptive rate limiting with signals.
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.redis import get_redis_pool, rate_limit_key
from app.exceptions.url_exceptions import RateLimitExceededException


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-IP rate limiting using Redis.
    Applies to all routes except health checks.
    """

    EXCLUDED_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Prefer X-Forwarded-For (load balancer sets this); fall back to direct IP
        client_ip = (
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or (request.client.host if request.client else "unknown")
        )

        try:
            redis = await get_redis_pool()
            key = rate_limit_key(f"ip:{client_ip}")
            count = await redis.incr(key)

            if count == 1:
                # First request in this window — set expiry
                await redis.expire(key, settings.RATE_LIMIT_WINDOW_SECONDS)

            remaining = max(0, settings.RATE_LIMIT_REQUESTS - count)

            if count > settings.RATE_LIMIT_REQUESTS:
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "error": "Rate limit exceeded. Please slow down.",
                    },
                    headers={
                        "Retry-After": str(settings.RATE_LIMIT_WINDOW_SECONDS),
                        "X-RateLimit-Limit": str(settings.RATE_LIMIT_REQUESTS),
                        "X-RateLimit-Remaining": "0",
                    },
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_REQUESTS)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response

        except Exception:
            # Redis failure → fail open (don't rate limit if Redis is down)
            # In production: alert on this and consider circuit breaker pattern
            return await call_next(request)
