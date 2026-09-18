"""URL Repository — data access layer for URL model."""

import math
import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.url import URL


class URLRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(
        self,
        *,
        slug: str,
        long_url: str,
        url_hash: str,
        owner_id: uuid.UUID,
        title: str | None = None,
        is_custom_alias: bool = False,
        expires_at=None,
    ) -> URL:
        url = URL(
            slug=slug,
            long_url=long_url,
            url_hash=url_hash,
            owner_id=owner_id,
            title=title,
            is_custom_alias=is_custom_alias,
            expires_at=expires_at,
        )
        self._db.add(url)
        await self._db.commit()
        await self._db.refresh(url)
        return url

    async def get_by_slug(self, slug: str) -> URL | None:
        result = await self._db.execute(select(URL).where(URL.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_id(self, url_id: uuid.UUID) -> URL | None:
        result = await self._db.execute(select(URL).where(URL.id == url_id))
        return result.scalar_one_or_none()

    async def get_by_owner(
        self,
        owner_id: uuid.UUID,
        *,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[URL], int]:
        """Returns (items, total_count) for pagination, including both active and deactivated links."""
        base_query = select(URL).where(
            URL.owner_id == owner_id,
        )
        count_result = await self._db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        result = await self._db.execute(
            base_query.order_by(URL.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return result.scalars().all(), total

    async def slug_exists(self, slug: str) -> bool:
        result = await self._db.execute(select(URL.id).where(URL.slug == slug))
        return result.scalar_one_or_none() is not None

    async def hash_exists_for_owner(self, url_hash: str, owner_id: uuid.UUID) -> URL | None:
        """Check if this user already shortened this URL (by content hash)."""
        result = await self._db.execute(
            select(URL).where(
                URL.url_hash == url_hash,
                URL.owner_id == owner_id,
                URL.is_active == True,  # noqa: E712
            ).limit(1)
        )
        return result.scalars().first()

    async def update(self, url: URL, **fields: object) -> URL:
        for field, value in fields.items():
            setattr(url, field, value)
        await self._db.commit()
        await self._db.refresh(url)
        return url

    async def increment_click_count(self, slug: str) -> None:
        """
        Atomic increment using SQL UPDATE — no read-modify-write race condition.
        This is called asynchronously (BackgroundTask) so it doesn't block redirects.
        """
        await self._db.execute(
            update(URL)
            .where(URL.slug == slug)
            .values(click_count=URL.click_count + 1)
        )
        await self._db.commit()

    async def delete(self, url: URL) -> None:
        """Permanently delete URL record from database."""
        await self._db.delete(url)
        await self._db.commit()

    async def get_top_urls(self, owner_id: uuid.UUID, limit: int = 10) -> list[URL]:
        result = await self._db.execute(
            select(URL)
            .where(URL.owner_id == owner_id, URL.is_active == True)  # noqa: E712
            .order_by(URL.click_count.desc())
            .limit(limit)
        )
        return result.scalars().all()
