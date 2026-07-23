"""
URL Shortener CRUD endpoints.

Routes:
  POST   /api/v1/urls/          → Create short URL
  GET    /api/v1/urls/          → List user's URLs (paginated)
  GET    /api/v1/urls/{slug}    → Get URL details
  PATCH  /api/v1/urls/{slug}    → Update URL
  DELETE /api/v1/urls/{slug}    → Soft delete URL
"""

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status

import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import RedisCache, get_redis
from app.dependencies.auth import CurrentUser
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.url import URLCreate, URLListResponse, URLResponse, URLUpdate
from app.services.url_service import URLService

router = APIRouter(prefix="/urls", tags=["URLs"])


def _get_url_service(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> URLService:
    return URLService(db=db, cache=RedisCache(redis))


@router.post(
    "/",
    response_model=URLResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a short URL",
    description=(
        "Shorten a long URL. Optionally provide a custom alias and expiration date. "
        "If the same long URL was already shortened by this user, returns the existing short URL."
    ),
)
async def create_url(
    data: URLCreate,
    current_user: CurrentUser,
    url_service: URLService = Depends(_get_url_service),
):
    return await url_service.create_short_url(data, owner_id=current_user.id)


@router.get(
    "/",
    response_model=URLListResponse,
    summary="List your URLs",
    description="Return a paginated list of all active URLs owned by the current user.",
)
async def list_urls(
    current_user: CurrentUser,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    url_service: URLService = Depends(_get_url_service),
):
    return await url_service.list_urls(current_user.id, page=page, size=size)


@router.get(
    "/{slug}",
    response_model=URLResponse,
    summary="Get URL details",
    description="Retrieve full details for a short URL owned by the current user.",
)
async def get_url(
    slug: str,
    current_user: CurrentUser,
    url_service: URLService = Depends(_get_url_service),
):
    return await url_service.get_url(slug, owner_id=current_user.id)


@router.patch(
    "/{slug}",
    response_model=URLResponse,
    summary="Update URL",
    description="Update the long URL, title, expiration, or active status.",
)
async def update_url(
    slug: str,
    data: URLUpdate,
    current_user: CurrentUser,
    url_service: URLService = Depends(_get_url_service),
):
    return await url_service.update_url(slug, data, owner_id=current_user.id)


@router.delete(
    "/{slug}",
    response_model=APIResponse,
    summary="Delete URL",
    description="Soft-delete a short URL. The slug becomes unavailable for redirects.",
)
async def delete_url(
    slug: str,
    current_user: CurrentUser,
    url_service: URLService = Depends(_get_url_service),
):
    await url_service.delete_url(slug, owner_id=current_user.id)
    return APIResponse(success=True, message=f"URL '{slug}' deleted successfully")
