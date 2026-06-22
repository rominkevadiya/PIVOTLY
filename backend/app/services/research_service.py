import logging

from app.schemas.report import ResearchContext
from app.services.ai_service import AIService
from app.services.search_service import search_venture_context

logger = logging.getLogger(__name__)

class ResearchService:
    """Service responsible for aggregating web search data into a structured ResearchContext."""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        
    async def run_research(self, idea_text: str) -> ResearchContext:
        """Run web search and synthesize results into a structured context."""
        logger.info(f"Running research phase for idea: {idea_text[:30]}...")
        
        # 1. Fetch raw web data
        search_context = await search_venture_context(idea_text)
        
        # 2. Synthesize using AI agent
        research_context = await self.ai_service.generate_research_context(
            idea_text=idea_text,
            search_context=search_context
        )
        
        return research_context
