"""Analytics endpoints — click stats and the current user's top URLs."""

from fastapi import APIRouter, Depends, Query

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import CurrentUser
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
        "Returns comprehensive click analytics for one of the current user's short URLs: "
        "total clicks, unique visitors, breakdown by country/browser/OS/device, "
        "and daily click history."
    ),
)
async def get_url_analytics(
    slug: str,
    current_user: CurrentUser,
    analytics_service: AnalyticsService = Depends(_get_analytics_service),
):
    return await analytics_service.get_url_analytics(slug, current_user)


@router.get(
    "/top/urls",
    response_model=list[TopURLResponse],
    summary="Get the current user's top URLs by click count",
    description="Returns the current user's most-clicked URLs. Never includes other users' links.",
)
async def get_top_urls(
    current_user: CurrentUser,
    limit: int = Query(10, ge=1, le=50),
    analytics_service: AnalyticsService = Depends(_get_analytics_service),
):
    return await analytics_service.get_top_urls(current_user, limit)
