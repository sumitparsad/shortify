"""
Import all models here so Alembic's env.py can discover them via Base.metadata.

Alembic compares Base.metadata (Python ORM state) against the live DB schema
to generate migration scripts. If a model is not imported here, Alembic won't
know it exists and won't generate migrations for it.
"""

from app.models.analytics import URLAnalytics  # noqa: F401
from app.models.url import URL  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = ["User", "URL", "URLAnalytics"]
