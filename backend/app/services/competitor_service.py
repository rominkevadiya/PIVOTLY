import logging

from app.schemas.report import CompetitorAnalysis
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class CompetitorService:
    """Service responsible for generating a Competitor Analysis based on ResearchContext."""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        
    async def run_analysis(self, idea_text: str, search_context: str, research_context_json: str):
        """Run competitor analysis using the AI agent."""
        logger.info(f"Running competitor analysis for idea: {idea_text[:30]}...")
        
        return await self.ai_service.generate_competitor_analysis(
            idea_text=idea_text,
            search_context=search_context,
            research_context_json=research_context_json
        )
