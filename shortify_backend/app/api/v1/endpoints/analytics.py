"""Analytics endpoints — click stats and top URL leaderboard."""

from fastapi import APIRouter, Depends, Query

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.dependencies.auth import CurrentUser
from app.exceptions.url_exceptions import URLOwnershipException
from app.repositories.url_repository import URLRepository
from app.schemas.analytics import TopURLResponse, URLAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db=db)


@router.get(
    "/{slug}",
    response_model=URLAnalyticsResponse,
    summary="Get URL analytics",
    description=(
        "Returns comprehensive click analytics for a short URL: "
        "total clicks, unique visitors, breakdown by country/browser/OS/device, "
        "and daily click history."
    ),
)
async def get_url_analytics(
    slug: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    analytics_service: AnalyticsService = Depends(_get_analytics_service),
):
    # Verify ownership before exposing analytics
    url_repo = URLRepository(db)
    url = await url_repo.get_by_slug(slug)
    if url and url.owner_id != current_user.id and current_user.role != "admin":
        raise URLOwnershipException("You don't have access to this URL's analytics")

    return await analytics_service.get_url_analytics(slug)


@router.get(
    "/top/urls",
    response_model=list[TopURLResponse],
    summary="Get top URLs by click count",
    description="Returns the most-clicked URLs globally. Useful for leaderboards.",
)
async def get_top_urls(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = None,  # Optional auth
):
    url_repo = URLRepository(db)
    urls = await url_repo.get_top_urls(limit=limit)
    return [
        TopURLResponse(
            slug=u.slug,
            long_url=u.long_url,
            title=u.title,
            click_count=u.click_count,
            short_url=f"{settings.BASE_URL}/{u.slug}",
        )
        for u in urls
    ]
