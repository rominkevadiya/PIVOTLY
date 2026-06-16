"""User profile and statistics endpoints."""

from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.report import Report
from app.repositories.rate_limit_repository import RateLimitRepository

router = APIRouter()

class UserStatsResponse(BaseModel):
    total_analyses: int
    analyses_today: int
    daily_limit: int
    analyses_remaining_today: int

@router.get("/users/me/stats", response_model=UserStatsResponse)
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserStatsResponse:
    """Return usage statistics for the current user."""
    # Get total analyses
    total_analyses = db.query(func.count(Report.id)).filter(Report.user_id == current_user.id).scalar() or 0
    
    # Get analyses today
    rate_limit_repo = RateLimitRepository(db)
    today = date.today()
    analyses_today = rate_limit_repo.get_count(current_user.id, "idea_submission", today)
    
    daily_limit = 5
    analyses_remaining_today = max(0, daily_limit - analyses_today)
    
    return UserStatsResponse(
        total_analyses=total_analyses,
        analyses_today=analyses_today,
        daily_limit=daily_limit,
        analyses_remaining_today=analyses_remaining_today
    )
