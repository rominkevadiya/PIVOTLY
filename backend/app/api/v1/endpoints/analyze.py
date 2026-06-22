"""Startup idea analysis endpoint."""

from fastapi import APIRouter, Depends, status, BackgroundTasks

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.report_service import ReportService
from app.api.v1.dependencies import get_rate_limited_report_service

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_202_ACCEPTED)
def analyze_idea(
    payload: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_rate_limited_report_service),
) -> AnalyzeResponse:
    """Analyze a startup idea and schedule report generation in background."""
    report = report_service.create_pending_report(
        idea_text=payload.idea_text,
        user_id=current_user.id,
    )
    
    background_tasks.add_task(
        report_service.process_report,
        report_id=report.id,
        idea_text=payload.idea_text,
        user_id=current_user.id,
        region=payload.region,
        budget_range=payload.budget_range
    )
    
    return AnalyzeResponse(report_id=str(report.id), status="PENDING")

