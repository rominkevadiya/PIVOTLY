"""Report generation and retrieval orchestration."""

import uuid
from datetime import date

from app.core.exceptions import RateLimitExceededError
from app.models.report import Report
from app.repositories.report_repository import ReportRepository
from app.repositories.rate_limit_repository import RateLimitRepository
from app.services.ai_service import AIService
from app.services.search_service import search_venture_context


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

    def create_pending_report(
        self, 
        idea_text: str, 
        user_id: uuid.UUID | None = None
    ) -> Report:
        """Create a pending report synchronously before backgrounding."""
        if user_id and self.rate_limit_repo:
            today = date.today()
            current_count = self.rate_limit_repo.get_count(user_id, "idea_submission", today)
            if current_count >= 5:
                raise RateLimitExceededError("Daily analysis limit reached")

        # 1. Create report immediately (status: PENDING)
        pending_report = self.repository.create(
            idea_text=idea_text,
            user_id=user_id,
        )
            
        return pending_report

    async def process_report(
        self,
        report_id: uuid.UUID,
        idea_text: str,
        user_id: uuid.UUID | None = None,
        region: str | None = None,
        budget_range: str | None = None
    ) -> None:
        """Execute the heavy AI and search operations in the background."""
        from app.core.database import SessionLocal
        from app.repositories.report_repository import ReportRepository
        from app.repositories.rate_limit_repository import RateLimitRepository
        
        new_db = SessionLocal()
        background_repo = ReportRepository(new_db)
        bg_rate_limit_repo = RateLimitRepository(new_db) if user_id else None

        try:
            # 2. Start Scraping (status: SCRAPING)
            background_repo.update_status(report_id, "SCRAPING")
            
            # Fetch live competitor context using Tavily Search API
            search_context = await search_venture_context(idea_text)
            
            # 3. Start Generating (status: GENERATING)
            background_repo.update_status(report_id, "GENERATING")
            
            if bg_rate_limit_repo and user_id:
                # Re-verify quota to prevent concurrent spam
                current_count = bg_rate_limit_repo.get_count(user_id, "idea_submission", date.today())
                if current_count >= 5:
                    background_repo.mark_failed(report_id, "Daily analysis limit reached.")
                    return
                # Increment quota now that heavy generation (paid API) is starting
                bg_rate_limit_repo.increment(user_id, "idea_submission", date.today())
            
            report = await self.ai_service.generate_report(
                idea_text, 
                search_context, 
                region, 
                budget_range
            )
            
            # 4. Success (status: COMPLETED)
            background_repo.mark_completed(
                report_id=report_id,
                report_json=report.model_dump(mode="json"),
                industry=report.industry.primary_industry,
                market_potential=report.market_potential.rating,
                recommendation=report.recommendation.decision,
            )

        except Exception as e:
            background_repo.mark_failed(report_id, str(e))
        finally:
            new_db.close()

    def get_report(self, report_id: uuid.UUID) -> Report | None:
        """Retrieve a report by ID."""
        return self.repository.get_by_id(report_id)

    def get_user_reports(self, user_id: uuid.UUID, limit: int = 10, offset: int = 0) -> list[Report]:
        """Retrieve all reports for a user with pagination."""
        return self.repository.get_by_user_id(user_id, limit, offset)

    @staticmethod
    def validate_stored_report(report_json: dict, schema_version: int | None = 1):
        """Validate report JSON loaded from persistence using the validation factory."""
        from app.services.report_validation_factory import validate_stored_report as factory_validate
        return factory_validate(report_json, schema_version)
