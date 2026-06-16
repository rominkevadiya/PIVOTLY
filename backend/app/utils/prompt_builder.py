"""Prompt construction for venture analysis."""

from datetime import UTC, datetime


def build_analysis_prompt(
    idea_text: str, 
    search_context: str = "",
    region: str | None = None,
    budget_range: str | None = None
) -> str:
    """Build the strict JSON prompt used for Gemini analysis."""
    analysis_date = datetime.now(UTC).date().isoformat()
    
    search_section = ""
    if search_context:
        search_section = f"\nLIVE WEB SEARCH RESULTS (use this to verify real competitors and market context):\n{search_context}\n"

    region_context = f"REGION: {region}" if region else "REGION: Not specified"
    budget_context = f"BUDGET RANGE: {budget_range}" if budget_range else "BUDGET RANGE: Not specified"

    return f"""
You are an expert startup analyst and venture capital researcher.
Evaluate the startup idea provided and return a structured JSON analysis.
Be realistic, critical, and data-aware. Do not be overly optimistic.

Return ONLY valid JSON. Do not include markdown, code fences, comments, or commentary outside the JSON.

{search_section}
IDEA: {idea_text}
{region_context}
{budget_context}
DATE: {analysis_date}

Perform this analysis:
1. Identify the primary industry and sub-industry.
2. Identify primary and secondary target audience segments.
3. Identify 3 to 5 real or plausible competitors with name, description, strength, and threat level.
4. Assess market potential as High, Medium, or Low with a concise rationale and realistic estimations for TAM, SAM, and SOM (e.g., '$10B', '$1.2B', '$80M').
5. Identify 3 to 5 major failure risks with severity levels.
6. Identify 2 to 3 opportunity gaps or underserved niches.
7. Suggest exactly 3 specific improvements to strengthen the idea.
8. Provide a final recommendation: Build, Pivot, Research Further, or Avoid.
9. Provide a concise rationale and confidence level.
10. Provide a scoring rubric rating 5 categories (market_size, competitive_advantage, technical_feasibility, monetization_potential, founder_fit) out of 10, plus an overall score out of 100. Assume the "founder" is a typical college student or first-time founder unless stated otherwise.
11. Extract and cite 2 to 5 specific source websites or reference links from the LIVE WEB SEARCH RESULTS that are highly relevant to the competitors or market context.

Return your analysis as a JSON object with this exact structure:
{{
  "overview": {{
    "idea_summary": "string",
    "one_line_pitch": "string"
  }},
  "industry": {{
    "primary_industry": "string",
    "sub_industry": "string",
    "industry_context": "string"
  }},
  "target_audience": {{
    "primary_segment": "string",
    "secondary_segment": "string",
    "audience_insight": "string"
  }},
  "competitors": [
    {{
      "name": "string",
      "description": "string",
      "strength": "string",
      "threat_level": "High|Medium|Low"
    }}
  ],
  "market_potential": {{
    "rating": "High|Medium|Low",
    "rationale": "string",
    "estimated_market_context": "string",
    "tam": "string",
    "sam": "string",
    "som": "string"
  }},
  "failure_risks": [
    {{
      "risk": "string",
      "description": "string",
      "severity": "High|Medium|Low"
    }}
  ],
  "opportunity_gaps": [
    {{
      "gap": "string",
      "description": "string"
    }}
  ],
  "improvement_suggestions": [
    {{
      "suggestion": "string",
      "rationale": "string"
    }}
  ],
  "recommendation": {{
    "decision": "Build|Pivot|Research Further|Avoid",
    "rationale": "string",
    "confidence": "High|Medium|Low"
  }},
  "scoring_rubric": {{
    "market_size": {{ "score": 1, "reasoning": "string" }},
    "competitive_advantage": {{ "score": 1, "reasoning": "string" }},
    "technical_feasibility": {{ "score": 1, "reasoning": "string" }},
    "monetization_potential": {{ "score": 1, "reasoning": "string" }},
    "founder_fit": {{ "score": 1, "reasoning": "string" }},
    "overall_score": 50
  }},
  "references": [
    {{
      "name": "string (name of the site/competitor, e.g. TechCrunch or competitor name)",
      "url": "string (the exact URL from search results, e.g. https://...)"
    }}
  ]
}}
""".strip()
