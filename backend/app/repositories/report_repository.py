"""Database access for reports."""

import uuid

from sqlalchemy.orm import Session

from app.models.report import Report


class ReportRepository:
    """Repository for report persistence and retrieval."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        idea_text: str,
        report_json: dict,
        industry: str,
        market_potential: str,
        recommendation: str,
    ) -> Report:
        """Persist a generated report."""
        report = Report(
            idea_text=idea_text,
            report_json=report_json,
            industry=industry,
            market_potential=market_potential,
            recommendation=recommendation,
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_by_id(self, report_id: uuid.UUID) -> Report | None:
        """Fetch a report by UUID."""
        return self.db.get(Report, report_id)
