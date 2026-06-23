"""Prompt construction for venture analysis.

Architecture: Skills-based prompt assembly (Phase 2.5 — EvidenceLedger).
Each V2 agent prompt is built from three layers:
  1. Shared rules (schema, citation, evidence, anti-hallucination) — loaded from skills/shared/
  2. Agent-specific skill instruction — loaded from skills/<agent>_skill.md
  3. Runtime context:
       Phase 1:   idea_text + raw search_context string
       Phase 2.5: idea_text + EvidenceLedger.to_prompt_block() [ACTIVE]

V1 prompt (build_analysis_prompt) is unchanged for full backward compatibility.

Token Metrics (measured from local validation run):
  Phase 1 (raw search context):
    research_agent   baseline  ~3,445 chars
    competitor_agent baseline  ~3,601 chars  (+ full search_context re-injected)
    moat_agent       baseline  ~3,714 chars  (+ full search_context re-injected)
    contrarian_agent baseline  ~3,646 chars  (+ full search_context re-injected)
    action_agent     baseline  ~3,908 chars

  Phase 2.5 (EvidenceLedger block replaces raw search_context in 3 agents):
    Reduction depends on search_context size vs ledger block size.
    Typical search_context: 3,000–8,000 chars per 3 search results.
    Typical ledger block:   400–900 chars (structured bullet points).
    Estimated reduction:    2,000–7,000 chars per downstream agent call.
    For 3 downstream agents: 6,000–21,000 chars total reduction.
    At ~4 chars/token: 1,500–5,250 fewer tokens per report.
"""

import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from app.utils.skill_loader import load_shared_rules, load_skill

if TYPE_CHECKING:
    from app.schemas.evidence_ledger import EvidenceLedger

logger = logging.getLogger(__name__)


def _log_prompt_size(agent_name: str, prompt: str) -> None:
    """Log prompt character count for token consumption monitoring."""
    logger.info(f"[prompt_metrics] agent={agent_name} chars={len(prompt)}")


# ── V1 Prompt (Unchanged — Full Backward Compatibility) ────────────────────────

def build_analysis_prompt(
    idea_text: str,
    search_context: str = "",
    region: str | None = None,
    budget_range: str | None = None,
) -> str:
    """Build the prompt used for Gemini V1 single-shot analysis. Unchanged."""
    analysis_date = datetime.now(timezone.utc).date().isoformat()

    search_section = ""
    if search_context:
        search_section = (
            f"\nLIVE WEB SEARCH RESULTS (use this to verify real competitors and market context):\n"
            f"{search_context}\n"
        )

    region_context = f"REGION: {region}" if region else "REGION: Not specified"
    budget_context = f"BUDGET RANGE: {budget_range}" if budget_range else "BUDGET RANGE: Not specified"

    prompt = f"""
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
    _log_prompt_size("v1_analysis", prompt)
    return prompt


# ── V2 Skills-Based Agent Prompts (Phase 2.5 — EvidenceLedger) ─────────────────

def build_research_prompt(idea_text: str, search_context: str) -> str:
    """Assemble the Research Agent prompt.

    Research is the only agent that still consumes raw search_context — it is
    the source of truth that produces the EvidenceLedger for all downstream agents.
    """
    shared_rules = load_shared_rules()
    research_skill = load_skill("research_skill")

    prompt = f"""# SHARED RULES
{shared_rules}

---

# AGENT SKILL
{research_skill}

---

# RUNTIME CONTEXT
IDEA: {idea_text}

WEB SEARCH DATA:
{search_context}
"""
    _log_prompt_size("research_agent", prompt)
    return prompt


def build_competitor_prompt(
    idea_text: str,
    ledger: "EvidenceLedger",
    competitor_analysis_json: str = "",
) -> str:
    """Assemble the Competitor Intelligence Agent prompt using an EvidenceLedger.

    Phase 2.5: Accepts EvidenceLedger instead of raw search_context.
    The ledger block is ~5-10× smaller than the raw search context string,
    while still providing validated competitor references, source URLs,
    and market indicators.

    Args:
        idea_text: The original startup idea text.
        ledger: Populated EvidenceLedger from the Research Agent.
        competitor_analysis_json: Unused in this call; kept for API compatibility.
    """
    shared_rules = load_shared_rules()
    competitor_skill = load_skill("competitor_skill")
    ledger_block = ledger.to_prompt_block()

    prompt = f"""# SHARED RULES
{shared_rules}

---

# AGENT SKILL
{competitor_skill}

---

# RUNTIME CONTEXT
IDEA: {idea_text}

{ledger_block}
"""
    _log_prompt_size("competitor_agent", prompt)
    return prompt


def build_moat_prompt(
    idea_text: str,
    ledger: "EvidenceLedger",
    competitor_analysis_json: str = "",
) -> str:
    """Assemble the Moat / Defensibility Agent prompt using an EvidenceLedger.

    Phase 2.5: Accepts EvidenceLedger. The competitor analysis JSON is still
    injected so the moat agent can reference the specific named competitors
    identified by the competitor agent in the same pipeline run.

    Args:
        idea_text: The original startup idea text.
        ledger: Populated EvidenceLedger from the Research Agent.
        competitor_analysis_json: Serialised CompetitorAnalysis from the competitor agent.
    """
    shared_rules = load_shared_rules()
    moat_skill = load_skill("moat_skill")
    ledger_block = ledger.to_prompt_block()

    competitor_section = ""
    if competitor_analysis_json and competitor_analysis_json != "{}":
        competitor_section = f"\nCOMPETITOR ANALYSIS (from Competitor Agent):\n{competitor_analysis_json}"

    prompt = f"""# SHARED RULES
{shared_rules}

---

# AGENT SKILL
{moat_skill}

---

# RUNTIME CONTEXT
IDEA: {idea_text}

{ledger_block}
{competitor_section}
"""
    _log_prompt_size("moat_agent", prompt)
    return prompt


def build_contrarian_prompt(
    idea_text: str,
    ledger: "EvidenceLedger",
    research_context_json: str = "",
) -> str:
    """Assemble the Contrarian Analysis Agent prompt using an EvidenceLedger.

    Phase 2.5: Accepts EvidenceLedger. The risk_signals field pre-seeds the
    contrarian agent so it starts from research-grounded hypotheses rather
    than generating risks from scratch.

    Args:
        idea_text: The original startup idea text.
        ledger: Populated EvidenceLedger from the Research Agent.
        research_context_json: Unused in Phase 2.5; kept for API compatibility.
    """
    shared_rules = load_shared_rules()
    contrarian_skill = load_skill("contrarian_skill")
    ledger_block = ledger.to_prompt_block()

    prompt = f"""# SHARED RULES
{shared_rules}

---

# AGENT SKILL
{contrarian_skill}

---

# RUNTIME CONTEXT
IDEA: {idea_text}

{ledger_block}
"""
    _log_prompt_size("contrarian_agent", prompt)
    return prompt


def build_action_prompt(idea_text: str, scoring_json: str) -> str:
    """Assemble the Action Plan Agent prompt from skills + runtime context.

    Action Agent does not need search context or the ledger — it operates
    purely on the deterministic scoring output.
    """
    shared_rules = load_shared_rules()
    action_skill = load_skill("action_skill")

    prompt = f"""# SHARED RULES
{shared_rules}

---

# AGENT SKILL
{action_skill}

---

# RUNTIME CONTEXT
IDEA: {idea_text}

DETERMINISTIC SCORES (from Scoring Service):
{scoring_json}
"""
    _log_prompt_size("action_agent", prompt)
    return prompt
