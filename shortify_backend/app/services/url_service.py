import hashlib
import math
import uuid
from datetime import UTC, datetime, timedelta
from pydantic import AnyHttpUrl
from fastapi import BackgroundTasks
from nanoid import generate as nanoid_generate
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis import RedisCache, URL_CACHE_TTL, url_cache_key
from app.exceptions.url_exceptions import (
    AliasAlreadyExistsException,
    URLExpiredException,
    URLNotFoundException,
    URLOwnershipException,
)
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.url_repository import URLRepository
from app.schemas.url import URLCreate, URLListResponse, URLResponse, URLUpdate

NANOID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-"


def _generate_slug(length: int) -> str:
    return nanoid_generate(alphabet=NANOID_ALPHABET, size=length)


def _hash_url(url: str | AnyHttpUrl) -> str:
    return hashlib.sha256(str(url).encode("utf-8")).hexdigest()


def _build_short_url(slug: str) -> str:
    return f"{settings.BASE_URL}/{slug}"


class URLService:
    def __init__(self, db: AsyncSession, cache: RedisCache) -> None:
        self._url_repo = URLRepository(db)
        self._analytics_repo = AnalyticsRepository(db)
        self._cache = cache

    async def create_short_url(
        self,
        data: URLCreate,
        owner_id: uuid.UUID,
    ) -> URLResponse:
        long_url = str(data.long_url)
        url_hash = _hash_url(long_url)

        existing = await self._url_repo.hash_exists_for_owner(url_hash, owner_id)
        if existing:
            return self._to_response(existing)

        if data.custom_alias:
            if await self._url_repo.slug_exists(data.custom_alias):
                raise AliasAlreadyExistsException(f"Alias '{data.custom_alias}' is already taken")
            slug = data.custom_alias
            is_custom = True
        else:
            slug = await self._generate_unique_slug()
            is_custom = False

        url = await self._url_repo.create(
            slug=slug,
            long_url=long_url,
            url_hash=url_hash,
            owner_id=owner_id,
            title=data.title,
            is_custom_alias=is_custom,
            expires_at=data.expires_at,
        )

        await self._cache.set(url_cache_key(slug), long_url, ttl=URL_CACHE_TTL)
        return self._to_response(url)

    async def redirect(
        self,
        slug: str,
        background_tasks: BackgroundTasks,
        request_meta: dict,
    ) -> str:
        cached_url = await self._cache.get(url_cache_key(slug))
        if cached_url:
            background_tasks.add_task(
                self._record_click_background,
                slug=slug,
                request_meta=request_meta,
            )
            return cached_url

        url = await self._url_repo.get_by_slug(slug)
        if not url or not url.is_active:
            raise URLNotFoundException(f"Slug '{slug}' not found")

        if url.expires_at and url.expires_at < datetime.now(UTC):
            raise URLExpiredException(f"URL '{slug}' has expired")

        await self._cache.set(url_cache_key(slug), url.long_url, ttl=URL_CACHE_TTL)

        background_tasks.add_task(
            self._record_click_background,
            slug=slug,
            request_meta=request_meta,
        )
        return url.long_url

    async def _record_click_background(self, slug: str, request_meta: dict) -> None:
        url = await self._url_repo.get_by_slug(slug)
        if not url:
            return

        await self._url_repo.increment_click_count(slug)
        await self._analytics_repo.record_click(
            url_id=url.id,
            visitor_hash=request_meta.get("visitor_hash"),
            ip_address=request_meta.get("ip"),
            country_code=request_meta.get("country"),
            city=request_meta.get("city"),
            browser=request_meta.get("browser"),
            os=request_meta.get("os"),
            device_type=request_meta.get("device"),
            referrer=request_meta.get("referrer"),
            user_agent=request_meta.get("user_agent"),
        )

    async def get_url(self, slug: str, owner_id: uuid.UUID) -> URLResponse:
        url = await self._get_owned_url(slug, owner_id)
        return self._to_response(url)

    async def list_urls(
        self,
        owner_id: uuid.UUID,
        page: int = 1,
        size: int = 20,
    ) -> URLListResponse:
        items, total = await self._url_repo.get_by_owner(owner_id, page=page, size=size)
        return URLListResponse(
            items=[self._to_response(u) for u in items],
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    async def update_url(
        self,
        slug: str,
        data: URLUpdate,
        owner_id: uuid.UUID,
    ) -> URLResponse:
        url = await self._get_owned_url(slug, owner_id)
        update_fields = data.model_dump(exclude_unset=True)

        if "long_url" in update_fields:
            update_fields["long_url"] = str(update_fields["long_url"])
            update_fields["url_hash"] = _hash_url(update_fields["long_url"])

        updated = await self._url_repo.update(url, **update_fields)
        await self._cache.delete(url_cache_key(slug))
        return self._to_response(updated)

    async def delete_url(self, slug: str, owner_id: uuid.UUID) -> None:
        url = await self._get_owned_url(slug, owner_id)
        await self._url_repo.delete(url)
        await self._cache.delete(url_cache_key(slug))

    async def _get_owned_url(self, slug: str, owner_id: uuid.UUID):
        url = await self._url_repo.get_by_slug(slug)
        if not url:
            raise URLNotFoundException(f"URL '{slug}' not found")
        if url.owner_id != owner_id:
            raise URLOwnershipException("You don't own this URL")
        return url

    async def _generate_unique_slug(self, max_retries: int = 3) -> str:
        for attempt in range(max_retries):
            slug = _generate_slug(settings.NANOID_LENGTH)
            if not await self._url_repo.slug_exists(slug):
                return slug
            if attempt == max_retries - 1:
                return _generate_slug(settings.NANOID_LENGTH + 2)
        return _generate_slug(settings.NANOID_LENGTH + 2)

    def _to_response(self, url) -> URLResponse:
        response = URLResponse.model_validate(url)
        response.short_url = _build_short_url(url.slug)
        return response
