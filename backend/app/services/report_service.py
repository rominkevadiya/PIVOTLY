"""Report generation and retrieval orchestration."""

import uuid

from app.models.report import Report
from app.repositories.report_repository import ReportRepository
from app.schemas.report import VentureReport
from app.services.ai_service import AIService


class ReportService:
    """Application service for venture reports."""

    def __init__(self, repository: ReportRepository, ai_service: AIService) -> None:
        self.repository = repository
        self.ai_service = ai_service

    def analyze_idea(self, idea_text: str) -> Report:
        """Generate an AI report and persist it."""
        report = self.ai_service.generate_report(idea_text)
        return self.repository.create(
            idea_text=idea_text,
            report_json=report.model_dump(mode="json"),
            industry=report.industry.primary_industry,
            market_potential=report.market_potential.rating,
            recommendation=report.recommendation.decision,
        )

    def get_report(self, report_id: uuid.UUID) -> Report | None:
        """Retrieve a report by ID."""
        return self.repository.get_by_id(report_id)

    @staticmethod
    def validate_stored_report(report_json: dict) -> VentureReport:
        """Validate report JSON loaded from persistence."""
        return VentureReport.model_validate(report_json)
