"""Startup idea analysis endpoint."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.report_repository import ReportRepository
from app.repositories.rate_limit_repository import RateLimitRepository
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.ai_service import AIService
from app.services.report_service import ReportService

router = APIRouter()


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    """Build the report service dependency."""
    settings = get_settings()
    repository = ReportRepository(db)
    rate_limit_repo = RateLimitRepository(db)
    ai_service = AIService(settings)
    return ReportService(repository, ai_service, rate_limit_repo)


@router.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_201_CREATED)
async def analyze_idea(
    payload: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
) -> AnalyzeResponse:
    """Analyze a startup idea and persist the generated report."""
    report = await report_service.analyze_idea(payload.idea_text, user_id=current_user.id)
    return AnalyzeResponse(report_id=str(report.id))
