"""
Alembic migration environment.

KEY DESIGN DECISIONS:
─────────────────────
1. We import all models via `app.models` so Alembic can detect schema changes.
   Without these imports, autogenerate would miss tables.

2. We use the SYNC database URL for migrations.
   Alembic's autogenerate doesn't support asyncpg — it needs a synchronous
   psycopg2 connection to inspect the live schema.
   (The async engine is used only at runtime by FastAPI.)

3. target_metadata = Base.metadata tells Alembic what the ORM expects.
   Alembic diffs this against the live DB to generate migration scripts.

4. include_schemas=True ensures we capture non-public schemas if used.

COMMANDS:
  # Generate migration from model changes:
  alembic revision --autogenerate -m "add users table"

  # Apply all pending migrations:
  alembic upgrade head

  # Roll back one migration:
  alembic downgrade -1

  # View migration history:
  alembic history --verbose

  # Show current revision:
  alembic current
"""

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Add project root to Python path so `app.*` imports work
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import settings BEFORE importing models
from app.core.config import settings  # noqa: E402

# Import Base and ALL models so Alembic discovers them
from app.core.database import Base  # noqa: E402
import app.models  # noqa: E402, F401 — side-effect import registers all models

# Alembic Config object (wraps alembic.ini)
config = context.config

# Set the sync DB URL dynamically from environment
# This overrides sqlalchemy.url in alembic.ini (which we leave blank)
config.set_main_option("sqlalchemy.url", settings.SYNC_DATABASE_URL)

# Configure Python logging from alembic.ini [loggers] section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate comparison
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    
    Generates SQL scripts without a live DB connection.
    Useful for: reviewing SQL before applying, or environments without DB access.
    `alembic upgrade head --sql > migration.sql`
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Naming convention for constraints — critical for reliable ALTER TABLE
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode (connected to a live DB).
    
    Uses a synchronous psycopg2 connection — asyncpg is not supported
    by Alembic's schema inspection tooling.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # Don't pool for migrations — one-shot operation
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,  # Required for SQLite; harmless for PostgreSQL
            compare_type=True,     # Detect column type changes
            compare_server_default=True,  # Detect server-side default changes
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
