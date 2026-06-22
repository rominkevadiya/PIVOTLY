import logging

from app.schemas.report import MoatAnalysis
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class MoatService:
    """Service responsible for analyzing the defensibility and network effects of an idea."""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        
    async def run_analysis(self, idea_text: str, search_context: str, competitor_analysis_json: str):
        """Run moat analysis using the AI agent."""
        logger.info(f"Running moat analysis for idea: {idea_text[:30]}...")
        
        return await self.ai_service.generate_moat_analysis(
            idea_text=idea_text,
            search_context=search_context,
            competitor_analysis_json=competitor_analysis_json
        )
