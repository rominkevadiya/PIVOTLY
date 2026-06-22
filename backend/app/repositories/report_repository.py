"""Database access for reports."""

import uuid

from sqlalchemy import desc
from sqlalchemy.orm import Session, defer

from app.models.report import Report


class ReportRepository:
    """Repository for report persistence and retrieval."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        idea_text: str,
        user_id: uuid.UUID | None = None,
        schema_version: int = 1,
    ) -> Report:
        """Persist a new pending report."""
        report = Report(
            idea_text=idea_text,
            user_id=user_id,
            status="PENDING",
            schema_version=schema_version,
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def update_status(self, report_id: uuid.UUID, status: str) -> None:
        """Update the status of a report."""
        report = self.get_by_id(report_id)
        if report:
            report.status = status
            self.db.commit()

    def mark_failed(self, report_id: uuid.UUID, error_message: str) -> None:
        """Mark a report as failed with an error message."""
        report = self.get_by_id(report_id)
        if report:
            report.status = "FAILED"
            report.error_message = error_message
            self.db.commit()

    def mark_completed(
        self,
        report_id: uuid.UUID,
        report_json: dict,
        industry: str,
        market_potential: str,
        recommendation: str,
    ) -> Report | None:
        """Mark a report as completed with its generated content."""
        report = self.get_by_id(report_id)
        if report:
            report.status = "COMPLETED"
            report.report_json = report_json
            report.industry = industry
            report.market_potential = market_potential
            report.recommendation = recommendation
            self.db.commit()
            self.db.refresh(report)
        return report

    def get_by_id(self, report_id: uuid.UUID) -> Report | None:
        """Fetch a report by UUID."""
        return self.db.get(Report, report_id)

    def get_by_user_id(self, user_id: uuid.UUID, limit: int = 10, offset: int = 0) -> list[Report]:
        """Fetch all reports owned by a user, most recent first, with pagination."""
        return (
            self.db.query(Report)
            .filter(Report.user_id == user_id)
            .options(defer(Report.report_json))
            .order_by(desc(Report.created_at))
            .limit(limit)
            .offset(offset)
            .all()
        )
