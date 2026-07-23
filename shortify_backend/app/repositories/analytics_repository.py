"""Analytics Repository — data access for click analytics."""

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import URLAnalytics


class AnalyticsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def record_click(
        self,
        *,
        url_id: uuid.UUID,
        visitor_hash: str | None,
        ip_address: str | None,
        country_code: str | None,
        city: str | None,
        browser: str | None,
        os: str | None,
        device_type: str | None,
        referrer: str | None,
        user_agent: str | None,
    ) -> URLAnalytics:
        record = URLAnalytics(
            url_id=url_id,
            visitor_hash=visitor_hash,
            ip_address=ip_address,
            country_code=country_code,
            city=city,
            browser=browser,
            os=os,
            device_type=device_type,
            referrer=referrer,
            user_agent=user_agent,
        )
        self._db.add(record)
        await self._db.commit()
        return record

    async def get_total_clicks(self, url_id: uuid.UUID) -> int:
        result = await self._db.execute(
            select(func.count(URLAnalytics.id)).where(URLAnalytics.url_id == url_id)
        )
        return result.scalar_one() or 0

    async def get_unique_visitors(self, url_id: uuid.UUID) -> int:
        result = await self._db.execute(
            select(func.count(func.distinct(URLAnalytics.visitor_hash))).where(
                URLAnalytics.url_id == url_id,
                URLAnalytics.visitor_hash != None,  # noqa: E711
            )
        )
        return result.scalar_one() or 0

    async def get_clicks_by_date(self, url_id: uuid.UUID) -> list[dict]:
        result = await self._db.execute(
            select(
                func.date(URLAnalytics.clicked_at).label("date"),
                func.count(URLAnalytics.id).label("clicks"),
            )
            .where(URLAnalytics.url_id == url_id)
            .group_by(func.date(URLAnalytics.clicked_at))
            .order_by(func.date(URLAnalytics.clicked_at))
        )
        return [{"date": str(row.date), "clicks": row.clicks} for row in result]

    async def get_clicks_by_country(self, url_id: uuid.UUID) -> list[dict]:
        result = await self._db.execute(
            select(
                URLAnalytics.country_code,
                func.count(URLAnalytics.id).label("clicks"),
            )
            .where(URLAnalytics.url_id == url_id)
            .group_by(URLAnalytics.country_code)
            .order_by(func.count(URLAnalytics.id).desc())
            .limit(20)
        )
        return [{"country_code": row.country_code, "clicks": row.clicks} for row in result]

    async def get_clicks_by_browser(self, url_id: uuid.UUID) -> list[dict]:
        result = await self._db.execute(
            select(
                URLAnalytics.browser,
                func.count(URLAnalytics.id).label("clicks"),
            )
            .where(URLAnalytics.url_id == url_id)
            .group_by(URLAnalytics.browser)
            .order_by(func.count(URLAnalytics.id).desc())
        )
        return [{"browser": row.browser, "clicks": row.clicks} for row in result]

    async def get_clicks_by_os(self, url_id: uuid.UUID) -> list[dict]:
        result = await self._db.execute(
            select(
                URLAnalytics.os,
                func.count(URLAnalytics.id).label("clicks"),
            )
            .where(URLAnalytics.url_id == url_id)
            .group_by(URLAnalytics.os)
            .order_by(func.count(URLAnalytics.id).desc())
        )
        return [{"os": row.os, "clicks": row.clicks} for row in result]

    async def get_clicks_by_device(self, url_id: uuid.UUID) -> list[dict]:
        result = await self._db.execute(
            select(
                URLAnalytics.device_type,
                func.count(URLAnalytics.id).label("clicks"),
            )
            .where(URLAnalytics.url_id == url_id)
            .group_by(URLAnalytics.device_type)
            .order_by(func.count(URLAnalytics.id).desc())
        )
        return [{"device_type": row.device_type, "clicks": row.clicks} for row in result]
