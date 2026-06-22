# Pivotly V2: Phase 2 Cost & Performance Audit

## Overview
This audit evaluates the token consumption, operational latency, and economic viability of the Phase 2 multi-agent architecture before moving to orchestration and frontend integration.

---

## 1. Token Consumption Analysis
The current architecture duplicates the raw `search_context` (Tavily web results) across multiple agents to prevent hallucination.

**Estimated Consumption Per Report:**
- **Raw Search Context:** ~2,000 tokens (injected repeatedly)
- **Research Agent:** ~2,050 IN / ~300 OUT
- **Competitor Agent:** ~2,350 IN / ~400 OUT
- **Moat Agent:** ~2,450 IN / ~300 OUT
- **Contrarian Agent:** ~2,350 IN / ~300 OUT
- **Action Agent:** ~250 IN / ~400 OUT

**Totals per Report:**
- **Total Input Tokens:** ~9,450
- **Total Output Tokens:** ~1,700
- **Total Gemini Calls:** 5 API calls
- **Duplicated Context:** ~6,000 tokens (Search Context is sent to Competitor, Moat, and Contrarian redundantly).

---

## 2. Context Optimization
- **Does Competitor/Moat/Contrarian require raw search context?** 
  Currently, *yes*. Without it, they cannot accurately cite `source_url` for their Evidence fields and will hallucinate URLs.
- **Can they operate using ResearchContext instead?** 
  Only if `ResearchContext` is drastically expanded into a comprehensive "Evidence Ledger" that extracts *every single* competitor URL, market size metric, and risk factor found in the raw search. 
- **Verdict:** While passing an Evidence JSON would save ~6,000 tokens per report, it would overburden the Research Agent and risk dropping niche data (like a hidden risk) that the Contrarian agent would have otherwise spotted in the raw text.

---

## 3. ActionService Review
- **Current State:** ActionService currently only takes the `idea_text` and `scoring_json`.
- **Sufficiency:** This is *insufficient* for high-quality, personalized execution plans. Go-To-Market and Unit Economics require knowledge of the target audience and competitors. 
- **Recommendation:** ActionService must ingest the JSON outputs of `ResearchContext`, `CompetitorAnalysis`, and `ContrarianAnalysis` to provide truly actionable advice, rather than generic startup platitudes based solely on mathematical scores.

---

## 4. DAG Optimization
**Optimal Directed Acyclic Graph (DAG) Execution:**
To minimize latency while respecting dependencies, the Orchestration layer should execute in 4 sequential time-steps:

1. **Step 1:** `ResearchService` (Sync wait)
2. **Step 2:** `CompetitorService` & `ContrarianService` (Execute concurrently via `asyncio.gather` using Research output)
3. **Step 3:** `MoatService` (Sync wait, requires Competitor output)
4. **Step 4:** `Scoring` (Instant Python logic) → `ActionService` (Sync wait, requires Scoring + all previous JSONs)

**Expected Latency:** 4 sequential AI generations (~20–25 seconds total).

---

## 5. Production Cost Estimate
Assuming the use of **Gemini 1.5 Pro** for maximum reasoning quality:
- Pricing: ~$3.50 / 1M Input | ~$10.50 / 1M Output
- Tokens/Report: 9,450 IN | 1,700 OUT
- **Estimated Cost Per Report:** **~$0.05**

**Projected Costs at Scale:**
- **100 reports/day:** $5 / day ($150 / month)
- **500 reports/day:** $25 / day ($750 / month)
- **1,000 reports/day:** $50 / day ($1,500 / month)

*(Note: Switching to Gemini 1.5 Flash would reduce this cost by 95% to < $0.002 per report, but may degrade analysis depth).*

---

## 6. Recommendation

**DECISION: A. Proceed to Phase 3**

### Justification:
At **$0.05 per report**, the economic cost of the multi-agent system is exceptionally low compared to the immense value of a hallucination-free, highly structured Venture Intelligence report. Optimizing out the redundant 6,000 tokens of raw search context would save only ~$0.02 per report but dramatically increase the complexity of the Research Agent and risk data loss. The current architecture prioritizes *correctness and defensibility* over micro-optimizations, which is exactly what the V2 engine demands.

### Scores
- **Token Efficiency Score:** 6/10 (Redundant context, but acceptable tradeoff).
- **Scalability Score:** 8/10 (DAG allows safe concurrency; only rate-limits pose a threat).
- **Cost Score:** 9/10 (Highly profitable assuming any reasonable monetization or user limit).
- **Final Recommendation:** Update ActionService to ingest all JSON contexts, then immediately build the Phase 3 `report_service.py` Orchestrator.
