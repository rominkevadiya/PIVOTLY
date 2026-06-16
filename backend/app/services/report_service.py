"""Report generation and retrieval orchestration."""

import uuid
from datetime import date

from app.core.exceptions import RateLimitExceededError
from app.models.report import Report
from app.repositories.report_repository import ReportRepository
from app.repositories.rate_limit_repository import RateLimitRepository
from app.schemas.report import VentureReport
from app.services.ai_service import AIService


class ReportService:
    """Application service for venture reports."""

    def __init__(
        self,
        repository: ReportRepository,
        ai_service: AIService,
        rate_limit_repo: RateLimitRepository | None = None,
    ) -> None:
        self.repository = repository
        self.ai_service = ai_service
        self.rate_limit_repo = rate_limit_repo

    def analyze_idea(self, idea_text: str, user_id: uuid.UUID | None = None) -> Report:
        """Generate an AI report and persist it, subject to rate limits."""
        if user_id and self.rate_limit_repo:
            today = date.today()
            current_count = self.rate_limit_repo.get_count(user_id, "idea_submission", today)
            if current_count >= 5:
                raise RateLimitExceededError("Daily analysis limit reached")

        report = self.ai_service.generate_report(idea_text)
        
        persisted_report = self.repository.create(
            idea_text=idea_text,
            report_json=report.model_dump(mode="json"),
            industry=report.industry.primary_industry,
            market_potential=report.market_potential.rating,
            recommendation=report.recommendation.decision,
            user_id=user_id,
        )

        if user_id and self.rate_limit_repo:
            self.rate_limit_repo.increment(user_id, "idea_submission", date.today())

        return persisted_report

    def get_report(self, report_id: uuid.UUID) -> Report | None:
        """Retrieve a report by ID."""
        return self.repository.get_by_id(report_id)

    def get_user_reports(self, user_id: uuid.UUID) -> list[Report]:
        """Retrieve all reports for a user."""
        return self.repository.get_by_user_id(user_id)

    @staticmethod
    def validate_stored_report(report_json: dict) -> VentureReport:
        """Validate report JSON loaded from persistence."""
        return VentureReport.model_validate(report_json)
