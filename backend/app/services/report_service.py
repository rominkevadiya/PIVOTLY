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
            # Increment synchronously to prevent race conditions
            self.rate_limit_repo.increment(user_id, "idea_submission", today)

        # 1. Create report immediately (status: PENDING)
        pending_report = self.repository.create(
            idea_text=idea_text,
            user_id=user_id,
            schema_version=2,
        )
            
        return pending_report

    async def _run_agent_with_polling(self, db_repo: ReportRepository, report_id: uuid.UUID, func, *args, **kwargs):
        """Runs an agent, polling and waiting if no Gemini keys are available."""
        from app.services.gemini.key_manager import NoAvailableGeminiKey
        import asyncio
        while True:
            try:
                # Always ensure status is GENERATING before proceeding.
                current_report = db_repo.get_by_id(report_id)
                if current_report and current_report.status == "WAITING_FOR_API":
                    db_repo.update_status(report_id, "GENERATING")
                return await func(*args, **kwargs)
            except NoAvailableGeminiKey:
                db_repo.update_status(report_id, "WAITING_FOR_API")
                # Wait before polling again
                await asyncio.sleep(10)

    async def process_report(
        self,
        report_id: uuid.UUID,
        idea_text: str,
        user_id: uuid.UUID | None = None,
        region: str | None = None,
        budget_range: str | None = None
    ) -> None:
        """Execute the heavy AI and search operations in the background.

        Phase 2.5 orchestration DAG:
          search_context → Research Agent → ResearchContext
                                          → EvidenceLedger (built here)
          EvidenceLedger → Competitor Agent → CompetitorAnalysis
          EvidenceLedger → Moat Agent      → MoatAnalysis
          EvidenceLedger → Contrarian Agent → ContrarianAnalysis
          [all results]  → ScoringService  → ScoringRubric
          ScoringRubric  → Action Agent    → ActionPlan
        """
        import logging
        from app.core.database import SessionLocal
        from app.repositories.report_repository import ReportRepository
        from app.repositories.rate_limit_repository import RateLimitRepository

        dag_logger = logging.getLogger(__name__)

        new_db = SessionLocal()
        background_repo = ReportRepository(new_db)
        bg_rate_limit_repo = RateLimitRepository(new_db) if user_id else None

        try:
            # 2. Start Scraping (status: SCRAPING)
            background_repo.update_status(report_id, "SCRAPING")

            # Fetch live competitor context using Tavily Search API
            search_context = await search_venture_context(idea_text)
            dag_logger.info(f"[dag] search_context_chars={len(search_context)}")

            # 3. Start Generating (status: GENERATING)
            background_repo.update_status(report_id, "GENERATING")

            # Quota is now enforced and incremented synchronously in create_pending_report.

            from app.schemas.report import SectionError

            # ── Agent 1: Research (consumes raw search_context) ────────────────
            research_context = await self._run_agent_with_polling(
                background_repo, report_id, self.ai_service.generate_research_context, idea_text, search_context
            )

            # ── Build EvidenceLedger from Research output ──────────────────────
            # If Research succeeded → build typed ledger (Phase 2.5 path)
            # If Research failed    → build minimal ledger with raw search context only
            if not isinstance(research_context, SectionError):
                ledger = self.ai_service.build_evidence_ledger(research_context, search_context)
            else:
                from app.schemas.evidence_ledger import EvidenceLedger
                ledger = EvidenceLedger(raw_search_context=search_context)
                dag_logger.warning("[dag] Research agent failed; using minimal EvidenceLedger fallback.")

            ledger_block_chars = len(ledger.to_prompt_block())
            dag_logger.info(
                f"[dag] ledger built: block_chars={ledger_block_chars} "
                f"(raw_search_context was {len(search_context)} chars) "
                f"estimated_reduction_chars={len(search_context) - ledger_block_chars}"
            )

            from app.services.gemini.key_manager import KeyManager
            from app.services.gemini.execution_mode import ExecutionMode
            import asyncio

            mode = KeyManager.get_instance().current_execution_mode()

            if mode == ExecutionMode.ECONOMY:
                dag_logger.info("[dag] Executing ECONOMY pipeline (sequential)")
                # ── Agent 2: Competitor (consumes EvidenceLedger) ─────────────────
                competitor_analysis = await self._run_agent_with_polling(
                    background_repo, report_id, self.ai_service.generate_competitor_analysis, idea_text, ledger
                )

                # ── Agent 4: Contrarian (consumes EvidenceLedger) ─────────────────
                contrarian_analysis = await self._run_agent_with_polling(
                    background_repo, report_id, self.ai_service.generate_contrarian_analysis, idea_text, ledger
                )

                # ── Agent 3: Moat (consumes EvidenceLedger + CompetitorAnalysis) ──
                competitor_json = (
                    competitor_analysis.model_dump_json()
                    if not isinstance(competitor_analysis, SectionError)
                    else "{}"
                )
                moat_analysis = await self._run_agent_with_polling(
                    background_repo, report_id, self.ai_service.generate_moat_analysis, idea_text, ledger, competitor_json
                )
                
            else:
                dag_logger.info(f"[dag] Executing {mode.value} pipeline (concurrent)")
                # ── Agent 2 & 4: Competitor and Contrarian run concurrently ───────
                competitor_task = self._run_agent_with_polling(
                    background_repo, report_id, self.ai_service.generate_competitor_analysis, idea_text, ledger
                )
                contrarian_task = self._run_agent_with_polling(
                    background_repo, report_id, self.ai_service.generate_contrarian_analysis, idea_text, ledger
                )
                
                competitor_analysis, contrarian_analysis = await asyncio.gather(competitor_task, contrarian_task)

                # ── Agent 3: Moat (consumes EvidenceLedger + CompetitorAnalysis) ──
                competitor_json = (
                    competitor_analysis.model_dump_json()
                    if not isinstance(competitor_analysis, SectionError)
                    else "{}"
                )
                moat_analysis = await self._run_agent_with_polling(
                    background_repo, report_id, self.ai_service.generate_moat_analysis, idea_text, ledger, competitor_json
                )

            # ── Deterministic Scoring ──────────────────────────────────────────
            from app.services.scoring_service import ScoringService
            scoring = ScoringService.calculate_score(
                research_context, competitor_analysis, moat_analysis, contrarian_analysis
            )

            # ── Agent 5: Action Plan (consumes scoring only) ───────────────────
            action_plan = await self._run_agent_with_polling(
                background_repo, report_id, self.ai_service.generate_action_plan, idea_text, scoring.model_dump_json()
            )

            from app.schemas.report import VentureReportV2

            recommendation = ScoringService.generate_recommendation(scoring.overall_score)

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
                recommendation=recommendation.decision,
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
