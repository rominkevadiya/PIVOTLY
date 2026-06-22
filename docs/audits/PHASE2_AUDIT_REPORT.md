# Pivotly V2: Phase 2 Architecture Audit

## Overview
This document evaluates the Phase 2 implementation of the multi-agent Venture Intelligence Engine to determine if it meets production standards before proceeding to Phase 3 (Orchestration & Frontend).

---

## 1. Agent Independence
**Status:** Partial Independence (DAG Structure)
- **Observations:** The agents are cleanly separated into domains (Research, Competitor, Moat, Contrarian). However, they are not entirely independent. 
  - `CompetitorService` requires `ResearchContext`.
  - `ContrarianService` requires `ResearchContext`.
  - `MoatService` requires `CompetitorAnalysis`.
- **Overlap:** There is minimal overlap. `ContrarianService` handles risks, while `MoatService` handles defensibility.
- **Verdict:** The separation of concerns is excellent, but they cannot be executed in a single parallel `asyncio.gather`. They must be orchestrated as a Directed Acyclic Graph (DAG).

## 2. Evidence Quality
**Status:** High Risk of Downstream Hallucination
- **Observations:** The new `Evidence` schema (claim, source_url, reliability) is a massive improvement over V1.
- **The Flaw:** `ResearchService` has access to the raw Tavily web search results, so it can accurately cite `source_url`. However, downstream agents (`CompetitorService`, `MoatService`, `ContrarianService`) are only fed the *JSON output* of the previous agents. They do not have access to the raw web search.
- **Impact:** If `ContrarianService` or `CompetitorService` is forced to provide an `Evidence` object with a `source_url`, it will hallucinate the URL because it cannot see the raw search data.
- **Fix Required:** Pass `raw_search_context` to ALL agents, not just `ResearchService`.

## 3. Deterministic Scoring Validation
**Status:** Excellent
- **Observations:** `ScoringService` completely removes the LLM from mathematical scoring.
- **Traceability:**
  - `market_size_score`: Driven by `len(research.market_size_indicators)`
  - `competitive_advantage_score`: Driven by `moat.overall_defensibility` Enum.
  - `technical_feasibility_score`: Penalized by `len(contrarian.hidden_risks)`.
- **Verdict:** Fully deterministic and completely insulated from LLM hallucinations.

## 4. Token Usage & Latency Analysis
**Status:** Increased Cost, Optimized Quality
- **V1 Single Prompt:** ~1,500 input tokens | ~2,500 output tokens | 1 API Call | Latency: ~15-20s
- **V2 Multi-Agent (Estimated):**
  - **Research:** ~2,000 in | ~500 out
  - **Competitor:** ~2,500 in (Idea + Search + Research) | ~800 out
  - **Moat:** ~1,500 in (Idea + Competitor) | ~400 out
  - **Contrarian:** ~2,500 in (Idea + Search + Research) | ~500 out
  - **Totals:** ~8,500 input tokens | ~2,200 output tokens | 4 API Calls
- **Latency Impact:** Because generation involves smaller outputs per call, individual calls are faster. However, the DAG execution (Research -> [Competitor, Contrarian] -> Moat) means total latency will likely increase to **25-30 seconds**. This is an acceptable tradeoff for vastly superior quality.

## 5. Failure Mode Analysis
**Status:** Brittle Pipeline
- **Validation:** `ai_service.py` has excellent Tenacity exponential backoff (3 retries) and basic auto-repair.
- **Pipeline Failure:** If `ResearchService` fails (e.g., Pydantic validation cannot be repaired), an `AIServiceError` is raised. Because all downstream agents depend on Research, the entire report generation will fatally crash.
- **Verdict:** We need partial-report fallback logic in Phase 3. If an agent fails, the system should still generate a report with that section marked as "Data Unavailable".

## 6. Concurrency Readiness
**Status:** Safe but Sequential
- **Shared State:** The agents are stateless. `ai_service.py` uses the async Gemini client safely.
- **Thread Safety:** Fully safe for `asyncio`.
- **Execution:** We cannot simply use `asyncio.gather(*all_agents)`. We must wait for `Research`, then `asyncio.gather(Competitor, Contrarian)`, then `Moat`.

## 7. VentureReportV2 Readiness
**Status:** Feature Regression Detected
- **Observations:** `VentureReportV2` currently includes `research_context`, `competitor_analysis`, `moat_analysis`, `contrarian_analysis`.
- **Missing Features:** V1 included `GoToMarketSection`, `NextStepItem`, `UnitEconomicsSection`, and `InvestorVerdictSection`. These are currently missing from the V2 schema.
- **Impact:** If we launch V2 as-is, users will lose actionable Go-To-Market advice and Unit Economics, degrading the product's utility for founders needing execution steps.

---

## 8. Production Recommendation

**DECISION: C. Stop and refactor Phase 2 first.**

### Justification:
While the code quality and deterministic scoring are exceptional, we cannot proceed to Phase 3 (Orchestration & Frontend) because of two critical architectural flaws:

1. **Hallucination Trap:** We must update `prompt_builder.py` and the Service layer so that `CompetitorService`, `MoatService`, and `ContrarianService` receive the raw `search_context` string. Otherwise, their `Evidence` citations will be fabricated.
2. **Feature Regression:** We must add an `ActionService` (or `GTMService`) to generate Go-To-Market phases, Unit Economics, and Next Steps. Without this, `VentureReportV2` provides great analysis but zero actionable execution advice, making it inferior to V1.

### Scores
- **Architecture Score:** 7/10 (DAG is clean, but data access is flawed)
- **Reliability Score:** 8/10 (Tenacity retries are great, but pipeline is brittle)
- **Maintainability Score:** 9/10 (Modular and clean)
- **Token Efficiency Score:** 6/10 (Heavier, but justifiable)
- **Deployment Readiness:** 4/10 (Feature regressions and hallucination risks)

### Action Items Before Phase 3:
1. Update `AIService` and Agent definitions to pass `search_context` to all agents.
2. Create an `action_service.py` to restore GTM and Next Steps functionality.
3. Update `VentureReportV2` to include the `ActionPlan` output.
