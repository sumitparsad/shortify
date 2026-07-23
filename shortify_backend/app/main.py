from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.api.v1.endpoints.redirect import router as redirect_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.core.redis import close_redis_pool, get_redis_pool
from app.exceptions.handlers import register_exception_handlers
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIDMiddleware

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifespan: startup -> yield -> shutdown."""
    configure_logging(settings.ENVIRONMENT)
    logger.info("Starting Shortify API", environment=settings.ENVIRONMENT, base_url=settings.BASE_URL)
    try:
        redis = await get_redis_pool()
        await redis.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error("Redis connection failed", error=str(e))

    yield

    logger.info("Shutting down Shortify API")
    await close_redis_pool()


def create_app() -> FastAPI:
    """Create and configure FastAPI application instance."""
    app = FastAPI(
        title="Shortify API",
        description="High-performance URL shortener with analytics and edge redirection.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS_LIST,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # Exception Handlers
    register_exception_handlers(app)

    # Health Endpoints
    @app.get("/health", tags=["Health"], summary="Liveness probe")
    async def health_check():
        return JSONResponse(
            content={
                "status": "healthy",
                "version": "1.0.0",
                "environment": settings.ENVIRONMENT,
            }
        )

    @app.get("/health/ready", tags=["Health"], summary="Readiness probe")
    async def readiness_check():
        try:
            redis = await get_redis_pool()
            await redis.ping()
            redis_ok = True
        except Exception:
            redis_ok = False

        return JSONResponse(
            status_code=200 if redis_ok else 503,
            content={
                "status": "ready" if redis_ok else "not_ready",
                "redis": "ok" if redis_ok else "error",
            },
        )

    # API V1 Routes
    app.include_router(api_router)

    # Redirect catch-all (Must be registered last)
    app.include_router(redirect_router)

    return app


app = create_app()
