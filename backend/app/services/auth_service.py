"""Authentication business logic."""

import logging

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.utils.security import create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)


class AuthService:
    """Application service for user authentication."""

    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    def register_user(self, email: str, password: str, full_name: str) -> User:
        """Register a new user account."""
        existing = self.user_repository.get_by_email(email)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered.",
            )

        hashed = hash_password(password)
        user = self.user_repository.create(
            email=email,
            full_name=full_name,
            hashed_password=hashed,
        )
        logger.info("User registered: %s", user.email)
        return user

    def login_user(self, email: str, password: str) -> dict:
        """Authenticate a user and return a JWT token."""
        user = self.user_repository.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated.",
            )

        settings = get_settings()
        token = create_access_token(str(user.id), user.email)
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
        }
