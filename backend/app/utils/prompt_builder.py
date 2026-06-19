"""Prompt construction for venture analysis."""

from datetime import datetime, timezone


def build_analysis_prompt(
    idea_text: str,
    search_context: str = "",
    region: str | None = None,
    budget_range: str | None = None,
) -> str:
    """Build the prompt used for Gemini analysis."""
    analysis_date = datetime.now(timezone.utc).date().isoformat()

    search_section = ""
    if search_context:
        search_section = (
            f"\nLIVE WEB SEARCH RESULTS (use this to verify real competitors and market context):\n"
            f"{search_context}\n"
        )

    region_context = f"REGION: {region}" if region else "REGION: Not specified"
    budget_context = f"BUDGET RANGE: {budget_range}" if budget_range else "BUDGET RANGE: Not specified"

    return f"""
You are an expert startup analyst and venture capital researcher.
Evaluate the startup idea provided. Be realistic, critical, and data-aware. Do not be overly optimistic.

{search_section}
IDEA: {idea_text}
{region_context}
{budget_context}
DATE: {analysis_date}

Perform this analysis and ensure you provide ALL of the following in the required structured output:
1. Identify primary industry, sub-industry, and audience segments. Provide a strict 1-100 confidence_score for the industry section based on your knowledge certainty.
2. Identify 1 to 5 real competitors. For each, provide the name, website (if available), competitor_type (Direct, Indirect, Substitute), threat level, and a concise description. Do not include categories, strengths, confidence scores, or evidence fields.
3. Assess market potential (TAM, SAM, SOM). You MUST provide explicit `evidence` and a `source_url` proving these numbers. Include a strict 1-100 confidence_score.
4. Identify 3 to 5 major failure risks, with a `title`, `severity` (High, Medium, Low), and a concise `description`. Do not include confidence scores or evidence quotes. Identify 2 to 3 opportunity gaps.
5. Provide 1 to 5 specific improvement suggestions.
6. Provide a final recommendation (Build, Pivot, Research Further, Avoid) with explicit `evidence` supporting the decision and a strict 1-100 confidence_score.
7. Provide an overall scoring rubric (market_size_score, competitive_advantage_score, technical_feasibility_score, monetization_potential_score, founder_fit_score from 1-10; overall_score out of 100) with a single global `overall_rationale` explaining these scores.
8. Provide a SWOT analysis (strengths, weaknesses, opportunities, threats) with 1 to 3 items per quadrant.
9. Design a phased Go-to-Market strategy with 1 to 4 phases, where each phase is described as a single detailed string (specifying phase name, duration, channel, and key actions in a clean, self-contained statement).
10. List concrete next steps with priority (1-5), action, rationale, and timeframe.
11. Estimate unit economics (CAC, LTV, revenue model, pricing notes).
12. INVESTOR VERDICT: Provide a boolean (`would_invest`), an `investment_confidence` (1-100), `investment_reasoning`, and list 1 to 3 `expected_concerns` and 1 to 3 `potential_strengths`.

IMPORTANT RULES:
- CONCISENESS: Be extremely concise. Keep all description, rationale, evidence, and reasoning fields short and to the point (maximum 1-2 sentences each). This is critical to fit the entire structured response within the token limit.
- EVIDENCE: Whenever you make a claim about Market Size or the Final Recommendation, you MUST populate the `evidence` field with a direct data point or quote, preferably from the LIVE WEB SEARCH RESULTS. Do not hallucinate numbers.
- CONFIDENCE SCORES: Calculate `confidence_score` (1-100) based strictly on evidence. If you have exact numbers from search results, score > 85. If you are guessing based on parametric memory, score < 50.
"""
