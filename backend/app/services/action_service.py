import logging

from app.schemas.report import ActionPlan
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class ActionService:
    """Service responsible for generating Go-To-Market and execution plans."""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        
    async def run_analysis(self, idea_text: str, scoring_json: str):
        """Run action plan generation using the AI agent."""
        logger.info(f"Running action plan for idea: {idea_text[:30]}...")
        
        return await self.ai_service.generate_action_plan(
            idea_text=idea_text,
            scoring_json=scoring_json
        )
