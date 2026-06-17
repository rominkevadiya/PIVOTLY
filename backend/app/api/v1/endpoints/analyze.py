"""Startup idea analysis endpoint."""

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.report_service import ReportService
from app.api.v1.dependencies import get_rate_limited_report_service

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_201_CREATED)
async def analyze_idea(
    payload: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_rate_limited_report_service),
) -> AnalyzeResponse:
    """Analyze a startup idea and persist the generated report."""
    report = await report_service.analyze_idea(
        idea_text=payload.idea_text,
        user_id=current_user.id,
        region=payload.region,
        budget_range=payload.budget_range
    )
    return AnalyzeResponse(report_id=str(report.id))

