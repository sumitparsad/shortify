"""
User ORM model.

DESIGN NOTES:
- UUID primary key instead of sequential integer.
  WHY? Sequential IDs are predictable — an attacker can enumerate all users.
  UUIDs are 128-bit random values; guessing one is computationally infeasible.
  Also avoids hotspot writes on PostgreSQL's B-tree index with sequential IDs.

- Role field: "user" | "admin" | "moderator"
  Role-based access control (RBAC) is implemented at the dependency level.
  The model stores only the role string; permission checks happen in code.
  WHY NOT a roles table? For this scale, enum/string is simpler.
  Google/Stripe use policy engines (Cedar, Casbin) for complex RBAC.

- is_active: Soft disable instead of delete.
  WHY? Hard deletes break referential integrity and audit logs.
  Setting is_active=False is the standard production approach.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    urls: Mapped[list["URL"]] = relationship(  # noqa: F821
        "URL", back_populates="owner", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
