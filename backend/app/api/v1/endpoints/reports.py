"""Report retrieval endpoint."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.repositories.report_repository import ReportRepository
from app.schemas.report import ReportResponse
from app.services.ai_service import AIService
from app.services.report_service import ReportService

router = APIRouter()


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    """Build the report service dependency."""
    settings = get_settings()
    repository = ReportRepository(db)
    ai_service = AIService(settings)
    return ReportService(repository, ai_service)


@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: UUID,
    report_service: ReportService = Depends(get_report_service),
) -> ReportResponse:
    """Return a persisted venture analysis report."""
    report = report_service.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    return ReportResponse(
        id=report.id,
        idea_text=report.idea_text,
        report_json=report_service.validate_stored_report(report.report_json),
        industry=report.industry,
        market_potential=report.market_potential,
        recommendation=report.recommendation,
        created_at=report.created_at,
    )
