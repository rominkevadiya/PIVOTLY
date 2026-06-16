"""Authentication endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter()


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Build the auth service dependency."""
    user_repository = UserRepository(db)
    return AuthService(user_repository)


@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """Create a new user account."""
    user = auth_service.register_user(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
    )
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        created_at=user.created_at,
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Authenticate a user and return a JWT."""
    token_data = auth_service.login_user(
        email=payload.email,
        password=payload.password,
    )
    return TokenResponse(**token_data)


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at,
    )
