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
            schema_version=2,
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
            
            from app.schemas.report import SectionError
            
            # V2 Pipeline Orchestration
            research_context = await self.ai_service.generate_research_context(idea_text, search_context)
            
            competitor_analysis = await self.ai_service.generate_competitor_analysis(
                idea_text, search_context, 
                research_context.model_dump_json() if not isinstance(research_context, SectionError) else "{}"
            )
            
            moat_analysis = await self.ai_service.generate_moat_analysis(
                idea_text, search_context, 
                competitor_analysis.model_dump_json() if not isinstance(competitor_analysis, SectionError) else "{}"
            )
            
            contrarian_analysis = await self.ai_service.generate_contrarian_analysis(
                idea_text, search_context, 
                research_context.model_dump_json() if not isinstance(research_context, SectionError) else "{}"
            )
            
            from app.services.scoring_service import ScoringService
            scoring = ScoringService.calculate_score(research_context, competitor_analysis, moat_analysis, contrarian_analysis)
            
            action_plan = await self.ai_service.generate_action_plan(idea_text, scoring.model_dump_json())
            
            from app.schemas.report import VentureReportV2, RecommendationSection
            
            decision = "Build" if scoring.overall_score >= 70 else "Research Further" if scoring.overall_score >= 50 else "Pivot"
            confidence = "High" if scoring.overall_score >= 70 else "Medium" if scoring.overall_score >= 50 else "Low"
            recommendation = RecommendationSection(
                decision=decision,
                confidence=confidence,
                confidence_score=scoring.overall_score,
                evidence=f"Deterministic scoring pipeline returned {scoring.overall_score}/100.",
                rationale=f"Based on an overall score of {scoring.overall_score}/100, the calculated recommendation is to {decision}."
            )
            
            report = VentureReportV2(
                idea_summary=idea_text,
                research_context=research_context,
                competitor_analysis=competitor_analysis,
                moat_analysis=moat_analysis,
                contrarian_analysis=contrarian_analysis,
                action_plan=action_plan,
                scoring_rubric=scoring,
                recommendation=recommendation
            )
            
            primary_industry = getattr(research_context, "primary_industry", "Unknown") if not isinstance(research_context, SectionError) else "Unknown"
            market_potential = getattr(research_context, "market_potential", "Unknown") if not isinstance(research_context, SectionError) else "Unknown"
            
            # 4. Success (status: COMPLETED)
            background_repo.mark_completed(
                report_id=report_id,
                report_json=report.model_dump(mode="json"),
                industry=primary_industry,
                market_potential=market_potential,
                recommendation=decision,
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
