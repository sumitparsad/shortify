"""
User Repository — data access layer for User model.

WHY REPOSITORY PATTERN?
- Separates data access logic from business logic
- Route handlers should never contain SQL queries — that's the repository's job
- Easy to mock in tests: swap the real repository for a fake one
- If you switch from PostgreSQL to another DB, only the repository changes

SERVICE VS REPOSITORY:
- Repository: knows how to query/mutate a single model (User, URL)
- Service: orchestrates across repositories + external systems (Redis, email)
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, *, email: str, username: str, hashed_password: str) -> User:
        """Create and persist a new User record."""
        user = User(
            email=email.lower(),
            username=username,
            hashed_password=hashed_password,
        )
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)
        return user

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def update(self, user: User, **fields: object) -> User:
        for field, value in fields.items():
            setattr(user, field, value)
        await self._db.commit()
        await self._db.refresh(user)
        return user

    async def delete(self, user: User) -> None:
        """Soft delete: deactivate instead of hard delete."""
        user.is_active = False
        await self._db.commit()

    async def email_exists(self, email: str) -> bool:
        result = await self._db.execute(
            select(User.id).where(User.email == email.lower())
        )
        return result.scalar_one_or_none() is not None

    async def username_exists(self, username: str) -> bool:
        result = await self._db.execute(
            select(User.id).where(User.username == username)
        )
        return result.scalar_one_or_none() is not None
