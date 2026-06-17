"""Shared service-level dependency factories for API v1 routes."""

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.repositories.rate_limit_repository import RateLimitRepository
from app.repositories.report_repository import ReportRepository
from app.services.ai_service import AIService
from app.services.report_service import ReportService


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    """Build a ReportService **without** rate-limit enforcement.

    Used by read-only report endpoints that do not need to count or cap
    per-user submissions (GET /reports, GET /reports/{id}).
    """
    settings = get_settings()
    repository = ReportRepository(db)
    ai_service = AIService(settings)
    return ReportService(repository, ai_service)


def get_rate_limited_report_service(db: Session = Depends(get_db)) -> ReportService:
    """Build a ReportService **with** rate-limit enforcement.

    Used by the idea analysis endpoint (POST /analyze) which enforces the
    5-analyses-per-user-per-day cap.
    """
    settings = get_settings()
    repository = ReportRepository(db)
    rate_limit_repo = RateLimitRepository(db)
    ai_service = AIService(settings)
    return ReportService(repository, ai_service, rate_limit_repo)
