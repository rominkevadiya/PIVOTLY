import asyncio
import os
from dotenv import load_dotenv

from app.core.config import get_settings
from app.services.ai_service import AIService
from app.services.search_service import search_venture_context

async def run_v2_tests():
    print("Testing V2 Agents...")
    load_dotenv(".env")
    settings = get_settings()
    ai_service = AIService(settings)
    
    idea_text = "An AI-powered tool for automatically fixing lint errors in legacy codebases."
    
    print(f"Idea: {idea_text}")
    print("1. Running Search Service...")
    search_context = await search_venture_context(idea_text)
    print(f"Search context length: {len(search_context)}")
    
    print("2. Running ResearchContext parsing...")
    research_context = await ai_service.generate_research_context(idea_text, search_context)
    print("ResearchContext Schema Validated:", research_context.model_dump_json(indent=2))
    
    print("3. Running Competitor Analysis...")
    competitor_analysis = await ai_service.generate_competitor_analysis(idea_text, search_context, research_context.model_dump_json())
    print("CompetitorAnalysis Schema Validated:", competitor_analysis.model_dump_json(indent=2))
    
    print("4. Running Moat Analysis...")
    moat_analysis = await ai_service.generate_moat_analysis(idea_text, search_context, competitor_analysis.model_dump_json())
    print("MoatAnalysis Schema Validated:", moat_analysis.model_dump_json(indent=2))
    
    print("5. Running Contrarian Analysis...")
    contrarian_analysis = await ai_service.generate_contrarian_analysis(idea_text, search_context, research_context.model_dump_json())
    print("ContrarianAnalysis Schema Validated:", contrarian_analysis.model_dump_json(indent=2))
    
    print("6. Calculating Deterministic Scores...")
    from app.services.scoring_service import ScoringService
    scoring = ScoringService.calculate_score(research_context, competitor_analysis, moat_analysis, contrarian_analysis)
    
    print("7. Running Action Plan...")
    action_plan = await ai_service.generate_action_plan(idea_text, scoring.model_dump_json())
    print("ActionPlan Schema Validated:", action_plan.model_dump_json(indent=2))
    
    print("\n--- Testing Partial Failures ---")
    print("8. Triggering Competitor Agent Failure...")
    # Mocking failure by passing something that makes the prompt very invalid or just monkey patching
    original_call = ai_service._call_gemini
    async def mock_fail_call(prompt, schema_class):
        raise ValueError("Simulated API Error")
    
    ai_service._call_gemini = mock_fail_call
    failed_comp = await ai_service.generate_competitor_analysis(idea_text, search_context, research_context.model_dump_json())
    print("Failed Competitor Result:", failed_comp.model_dump_json())
    
    failed_action = await ai_service.generate_action_plan(idea_text, scoring.model_dump_json())
    print("Failed Action Result:", failed_action.model_dump_json())
    ai_service._call_gemini = original_call

    print("V2 Agent Pipeline successfully parsed schemas and handled partial failures!")

if __name__ == "__main__":
    asyncio.run(run_v2_tests())
