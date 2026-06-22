import asyncio
import uuid
import logging
from unittest.mock import AsyncMock, patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import SessionLocal
from app.models.report import Report
from app.repositories.report_repository import ReportRepository
from app.services.report_service import ReportService
from app.services.ai_service import AIService

class MockAIService:
    async def generate_report(self, *args, **kwargs):
        await asyncio.sleep(2)
        # Mock VentureReport return
        from app.schemas.report import VentureReport
        class MockReport:
            def model_dump(self, mode):
                return {"mock": "data"}
            class _Industry:
                primary_industry = "Tech"
            industry = _Industry()
            class _Market:
                rating = "High"
            market_potential = _Market()
            class _Rec:
                decision = "Build"
            recommendation = _Rec()
        return MockReport()

async def test_lifecycle():
    db = SessionLocal()
    repo = ReportRepository(db)
    ai_service = MockAIService()
    service = ReportService(repo, ai_service)
    
    print("--- Test A & B: Normal Lifecycle ---")
    idea = "Test Idea " + str(uuid.uuid4())
    
    # Run analyze_idea as a task so we can poll
    with patch("app.services.report_service.search_venture_context", new_callable=AsyncMock) as mock_search:
        async def mock_search_fn(*args):
            await asyncio.sleep(1)
            return "context"
        mock_search.side_effect = mock_search_fn
        
        task = asyncio.create_task(service.analyze_idea(idea_text=idea))
        
        # Poll DB
        last_status = None
        for _ in range(50):
            await asyncio.sleep(0.1)
            # Fresh session to check status
            poll_db = SessionLocal()
            report = poll_db.query(Report).filter(Report.idea_text == idea).first()
            if report and report.status != last_status:
                print(f"Status changed to: {report.status}")
                last_status = report.status
            poll_db.close()
            if last_status == "COMPLETED":
                break
        
        await task
        
    print("\n--- Test C: Forced Failure ---")
    idea_fail = "Test Idea Fail " + str(uuid.uuid4())
    ai_service_fail = MockAIService()
    async def fail_generate(*args, **kwargs):
        await asyncio.sleep(1)
        raise Exception("Gemini quota exceeded")
    ai_service_fail.generate_report = fail_generate
    
    service_fail = ReportService(repo, ai_service_fail)
    
    with patch("app.services.report_service.search_venture_context", new_callable=AsyncMock) as mock_search:
        async def mock_search_fn(*args):
            await asyncio.sleep(1)
            return "context"
        mock_search.side_effect = mock_search_fn
        
        task = asyncio.create_task(service_fail.analyze_idea(idea_text=idea_fail))
        
        last_status = None
        for _ in range(50):
            await asyncio.sleep(0.1)
            poll_db = SessionLocal()
            report = poll_db.query(Report).filter(Report.idea_text == idea_fail).first()
            if report and report.status != last_status:
                print(f"Status changed to: {report.status}")
                if report.status == "FAILED":
                    print(f"Error message: {report.error_message}")
                last_status = report.status
            poll_db.close()
            if last_status == "FAILED":
                break
        try:
            await task
        except Exception:
            pass

    db.close()

if __name__ == "__main__":
    asyncio.run(test_lifecycle())
