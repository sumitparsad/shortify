"""Analytics Service — aggregate and return analytics data."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.url_exceptions import URLNotFoundException
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.url_repository import URLRepository
from app.schemas.analytics import URLAnalyticsResponse


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self._url_repo = URLRepository(db)
        self._analytics_repo = AnalyticsRepository(db)

    async def get_url_analytics(self, slug: str) -> URLAnalyticsResponse:
        url = await self._url_repo.get_by_slug(slug)
        if not url:
            raise URLNotFoundException(f"URL '{slug}' not found")

        total_clicks = await self._analytics_repo.get_total_clicks(url.id)
        unique_visitors = await self._analytics_repo.get_unique_visitors(url.id)
        clicks_by_date = await self._analytics_repo.get_clicks_by_date(url.id)
        clicks_by_country = await self._analytics_repo.get_clicks_by_country(url.id)
        clicks_by_browser = await self._analytics_repo.get_clicks_by_browser(url.id)
        clicks_by_os = await self._analytics_repo.get_clicks_by_os(url.id)
        clicks_by_device = await self._analytics_repo.get_clicks_by_device(url.id)

        return URLAnalyticsResponse(
            slug=slug,
            total_clicks=total_clicks,
            unique_visitors=unique_visitors,
            clicks_by_date=[{"date": r["date"], "clicks": r["clicks"]} for r in clicks_by_date],
            clicks_by_country=[{"country_code": r["country_code"], "clicks": r["clicks"]} for r in clicks_by_country],
            clicks_by_browser=[{"browser": r["browser"], "clicks": r["clicks"]} for r in clicks_by_browser],
            clicks_by_os=[{"os": r["os"], "clicks": r["clicks"]} for r in clicks_by_os],
            clicks_by_device=[{"device_type": r["device_type"], "clicks": r["clicks"]} for r in clicks_by_device],
        )
