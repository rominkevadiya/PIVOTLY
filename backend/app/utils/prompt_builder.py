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
2. Identify 3 to 5 real competitors. For each, provide the name, website, category, competitor_type (Direct, Indirect, Substitute), threat level, and reason_for_inclusion. You MUST provide an `evidence` quote or data point and its `source_url`. Include a 1-100 confidence_score per competitor.
3. Assess market potential (TAM, SAM, SOM). You MUST provide explicit `evidence` and a `source_url` proving these numbers. Include a strict 1-100 confidence_score.
4. Identify major failure risks. You MUST provide `evidence` for each risk (e.g., historical precedent, regulatory data) and a 1-100 confidence_score. Identify opportunity gaps.
5. Provide specific improvement suggestions.
6. Provide a final recommendation (Build, Pivot, Research Further, Avoid) with explicit `evidence` supporting the decision and a strict 1-100 confidence_score.
7. Provide an overall scoring rubric (1-10 per category, overall out of 100).
8. Cite 2 to 5 specific source websites from the search results.
9. Provide an explicit SWOT analysis.
10. Design a phased Go-to-Market strategy.
11. List concrete next steps with priority and timeframe.
12. Estimate unit economics (CAC, LTV, revenue model).
13. INVESTOR VERDICT: Provide a boolean (`would_invest`), an `investment_confidence` (1-100), `investment_reasoning`, AND list 2+ `expected_concerns` and 2+ `potential_strengths`.
14. CONTRARIAN ANALYSIS: Act as a pessimistic skeptic. Challenge your own conclusions by providing `counterarguments`, `alternative_interpretations`, and `recommendation_risks`.

IMPORTANT RULES:
- CONCISENESS: Be extremely concise. Keep all description, rationale, evidence, and reasoning fields short and to the point (maximum 1-2 sentences each). This is critical to fit the entire structured response within the token limit.
- EVIDENCE: Whenever you make a claim about Market Size, Competitor Strength, or Risk, you MUST populate the `evidence` field with a direct data point or quote, preferably from the LIVE WEB SEARCH RESULTS. Do not hallucinate numbers.
- CONFIDENCE SCORES: Calculate `confidence_score` (1-100) based strictly on evidence. If you have exact numbers from search results, score > 85. If you are guessing based on parametric memory, score < 50.
"""
