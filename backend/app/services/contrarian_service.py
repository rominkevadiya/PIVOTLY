import logging

from app.schemas.report import ContrarianAnalysis
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class ContrarianService:
    """Service responsible for finding critical assumptions and hidden risks in an idea."""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        
    async def run_analysis(self, idea_text: str, search_context: str, research_context_json: str):
        """Run contrarian analysis using the AI agent."""
        logger.info(f"Running contrarian analysis for idea: {idea_text[:30]}...")
        
        return await self.ai_service.generate_contrarian_analysis(
            idea_text=idea_text,
            search_context=search_context,
            research_context_json=research_context_json
        )
