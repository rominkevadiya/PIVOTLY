"""Database access for users."""

import uuid

from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Repository for user persistence and retrieval."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, email: str, full_name: str, hashed_password: str) -> User:
        """Persist a new user."""
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """Fetch a user by UUID."""
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        """Fetch a user by email address."""
        return self.db.query(User).filter(User.email == email).first()
