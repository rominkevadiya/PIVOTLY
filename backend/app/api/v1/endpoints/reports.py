"""Report retrieval endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.report import ReportResponse, ReportSummary
from app.services.report_service import ReportService
from app.api.v1.dependencies import get_report_service

router = APIRouter()


@router.get("/reports", response_model=list[ReportSummary])
def list_reports(
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
) -> list[ReportSummary]:
    """Return all reports owned by the authenticated user (history view) with pagination."""
    offset = (page - 1) * limit
    reports = report_service.get_user_reports(current_user.id, limit, offset)
    return [
        ReportSummary(
            id=r.id,
            idea_snippet=r.idea_text[:80] + ("..." if len(r.idea_text) > 80 else ""),
            industry=r.industry,
            market_potential=r.market_potential,
            recommendation=r.recommendation,
            created_at=r.created_at,
        )
        for r in reports
    ]


@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
) -> ReportResponse:
    """Return a persisted venture analysis report."""
    report = report_service.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    # Enforce ownership: user can only access their own reports
    if report.user_id is not None and report.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return ReportResponse(
        id=report.id,
        idea_text=report.idea_text,
        report_json=report_service.validate_stored_report(report.report_json),
        industry=report.industry,
        market_potential=report.market_potential,
        recommendation=report.recommendation,
        created_at=report.created_at,
    )
