"""Database access for rate limits."""

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.rate_limit import RateLimit


class RateLimitRepository:
    """Repository for managing API rate limits."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_count(self, user_id: uuid.UUID, action: str, window_date: date) -> int:
        """Get the current action count for a user in the specified date window."""
        stmt = select(RateLimit.count).where(
            RateLimit.user_id == user_id,
            RateLimit.action == action,
            RateLimit.window_date == window_date,
        )
        return self.db.execute(stmt).scalar() or 0

    def increment(self, user_id: uuid.UUID, action: str, window_date: date) -> int:
        """Increment the action count for a user in the specified date window.

        Uses PostgreSQL ON CONFLICT to perform atomic upsert.
        Returns the updated count.
        """
        stmt = (
            insert(RateLimit)
            .values(
                user_id=user_id,
                action=action,
                window_date=window_date,
                count=1,
            )
            .on_conflict_do_update(
                constraint="uq_user_action_date",
                set_={
                    "count": RateLimit.count + 1,
                    "updated_at": func.now(),
                },
            )
            .returning(RateLimit.count)
        )
        updated_count = self.db.execute(stmt).scalar()
        self.db.commit()
        return updated_count or 1
