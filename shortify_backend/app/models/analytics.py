"""
URL Analytics ORM model.

DESIGN DECISIONS:
─────────────────
WHY STORE ANALYTICS IN POSTGRESQL AND NOT JUST REDIS?
- Redis is ephemeral; PostgreSQL provides durability
- Time-series queries (clicks over time, daily aggregates) are SQL-native
- At Bitly scale: ClickHouse or Cassandra for analytics (append-only, time-series)
  For this project, PostgreSQL + partial indexes is sufficient to ~1B rows

TABLE PARTITIONING (future):
- Partition analytics by month (range partitioning on timestamp)
- Each month is a separate physical file → old data can be archived/dropped cheaply
- CREATE TABLE analytics_2026_01 PARTITION OF url_analytics FOR VALUES FROM (...)

CLICK COUNT STRATEGY:
- url_analytics: fine-grained event log (every click)
- urls.click_count: denormalized counter (fast reads, eventual consistency)
- Redis: real-time counter, periodically flushed to PostgreSQL by background job
  This is the "write-back" cache strategy — avoids a DB write per redirect

COUNTRY/BROWSER/OS:
- Derived from IP (MaxMind GeoIP2) and User-Agent header
- Stored as string codes for storage efficiency
- Indexed for aggregation queries
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class URLAnalytics(Base):
    __tablename__ = "url_analytics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("urls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Visitor fingerprint (hashed IP — privacy-preserving)
    visitor_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    country_code: Mapped[str | None] = mapped_column(String(2), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(50), nullable=True)
    os: Mapped[str | None] = mapped_column(String(50), nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    clicked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,  # Range queries: clicks between date A and date B
    )

    # Relationship
    url: Mapped["URL"] = relationship("URL", back_populates="analytics")  # noqa: F821

    __table_args__ = (
        Index("ix_analytics_url_clicked", "url_id", "clicked_at"),
        Index("ix_analytics_url_country", "url_id", "country_code"),
        Index("ix_analytics_visitor", "url_id", "visitor_hash"),
    )

    def __repr__(self) -> str:
        return f"<URLAnalytics url_id={self.url_id} clicked_at={self.clicked_at}>"
