"""Analytics Service — aggregate and return analytics data."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.url_exceptions import URLNotFoundException
from app.models.user import User
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.url_repository import URLRepository
from app.schemas.analytics import TopURLResponse, URLAnalyticsResponse
from app.services.url_service import _build_short_url


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self._url_repo = URLRepository(db)
        self._analytics_repo = AnalyticsRepository(db)

    async def get_url_analytics(self, slug: str, user: User) -> URLAnalyticsResponse:
        url = await self._url_repo.get_by_slug(slug)
        # Another user's link is reported as not found so its existence isn't revealed
        if not url or (url.owner_id != user.id and user.role != "admin"):
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
            clicks_by_date=clicks_by_date,
            clicks_by_country=clicks_by_country,
            clicks_by_browser=clicks_by_browser,
            clicks_by_os=clicks_by_os,
            clicks_by_device=clicks_by_device,
        )

    async def get_top_urls(self, user: User, limit: int) -> list[TopURLResponse]:
        urls = await self._url_repo.get_top_urls(owner_id=user.id, limit=limit)
        return [
            TopURLResponse(
                slug=u.slug,
                long_url=u.long_url,
                title=u.title,
                click_count=u.click_count,
                short_url=_build_short_url(u.slug),
            )
            for u in urls
        ]
