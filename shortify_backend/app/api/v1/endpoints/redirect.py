"""
Redirect endpoint — the hottest route in the system.

GET /{slug} → 302 redirect to long URL

IMPORTANT: This router must be included LAST in main.py to avoid shadowing
other routes. The /{slug} path pattern matches everything — we explicitly
exclude known system paths to avoid swallowing health/docs routes.

PERFORMANCE DESIGN:
- Redis cache check first (< 1ms typical latency)
- PostgreSQL only on cache miss
- Analytics recording is a BackgroundTask (non-blocking)

WHY 302 not 301?
- 301 Permanent: Browser caches indefinitely → can't update/delete URLs
- 302 Found: Browser re-requests every time → analytics + mutability
"""

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from fastapi.responses import RedirectResponse

import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import RedisCache, get_redis
from app.services.url_service import URLService
from app.utils.request_parser import extract_request_meta

router = APIRouter(tags=["Redirect"])

# Paths that should NOT be treated as slugs
_EXCLUDED_PATHS = frozenset([
    "health", "docs", "redoc", "openapi.json", "favicon.ico",
    "api", "static", "metrics",
])


def _get_url_service(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> URLService:
    return URLService(db=db, cache=RedisCache(redis))


@router.get(
    "/{slug}",
    summary="Redirect to long URL",
    description=(
        "Resolves the short URL slug and redirects to the original long URL. "
        "Uses Redis cache for sub-millisecond lookups on cache hits. "
        "Analytics are recorded asynchronously."
    ),
    response_class=RedirectResponse,
    status_code=302,
    responses={
        302: {"description": "Redirect to the original URL"},
        404: {"description": "Slug not found"},
        410: {"description": "URL has expired"},
    },
)
async def redirect_to_url(
    slug: str,
    request: Request,
    background_tasks: BackgroundTasks,
    url_service: URLService = Depends(_get_url_service),
):
    # Guard: don't treat system paths as slugs
    if slug in _EXCLUDED_PATHS:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")

    request_meta = extract_request_meta(request)
    long_url = await url_service.redirect(slug, background_tasks, request_meta)
    print("LONG URL =", repr(long_url), type(long_url))
    return RedirectResponse(url=long_url, status_code=302)
