# Pivotly V2 Roadmap & Rollout Strategy

## Overview
This roadmap outlines the phased execution strategy to transition Pivotly from a V1 monolithic AI generator to a V2 Multi-Agent Venture Intelligence Platform. The goal is to maximize evidence quality, reduce hallucinations, and maintain zero downtime during the transition.

---

## Phase 1: Foundation & Data Modeling (Weeks 1-2)
**Goal:** Prepare the backend to support V2 structures without breaking V1 reports.

- [ ] Create `VentureReportV2` Pydantic schemas in `backend/app/schemas/`.
- [ ] Create agent-specific sub-schemas (`ResearchContext`, `CompetitorAnalysis`, `MoatAnalysis`, `ContrarianAnalysis`, `Scorecard`, `Evidence`).
- [ ] Create Alembic migration to add `schema_version` (Integer, default=1) to the `reports` table.
- [ ] Create Alembic migration to add deterministic scalar columns (`market_score`, `moat_score`, etc.) to `reports`.
- [ ] Update Typescript interfaces in `frontend/src/types/report.ts`.

---

## Phase 2: Agent Isolation (Weeks 3-4)
**Goal:** Build the isolated Python services that represent the new personas.

- [ ] Build `ResearchService`: Modify Tavily search parsing to output strict `ResearchContext` JSON.
- [ ] Build `CompetitorService`: Write specialized prompt and integrate with Gemini SDK to output `CompetitorAnalysis`.
- [ ] Build `ContrarianService`: Write specialized prompt for failure/risk analysis.
- [ ] Build `MoatService`: Write specialized prompt for defensibility analysis.
- [ ] Build `ScoringService`: Write the deterministic Python logic that takes the outputs above and calculates a 0-100 score.

---

## Phase 3: Pipeline Orchestration (Week 5)
**Goal:** Wire the agents together using the DAG approach.

- [ ] Update `ReportService.process_report()` to execute the new DAG.
  - Step 1: `ResearchService` (awaits).
  - Step 2: `asyncio.gather(CompetitorService, ContrarianService, MoatService)` (run concurrently).
  - Step 3: `SynthesisService` (replaces SWOT, awaits).
  - Step 4: `ScoringService` (synchronous math calculation).
- [ ] Map the combined outputs into `VentureReportV2`.
- [ ] Save to Postgres with `schema_version = 2`.

---

## Phase 4: Frontend Overhaul (Weeks 6-7)
**Goal:** Build the interactive V2 tabbed dashboard.

- [ ] Build legacy fallback wrapper (`if schema_version === 1`).
- [ ] Implement Tabbed Navigation component for V2 reports.
- [ ] Build `EvidenceCard` component.
- [ ] Build `ScorecardView` and `MoatMeter` visual components.
- [ ] Integrate V2 dummy data to verify layouts and responsiveness.

---

## Phase 5: Testing & QA (Week 8)
**Goal:** Ensure the multi-agent pipeline is reliable and cost-effective.

- [ ] **Latency Audit:** Verify that `asyncio.gather` keeps the total report generation time under the V1 average (approx 30-40 seconds).
- [ ] **Token Audit:** Verify that the total Gemini input/output tokens do not exceed acceptable free-tier or low-cost thresholds.
- [ ] **Validation Audit:** Run 50 random startup ideas to ensure Pydantic doesn't throw `ValidationError` on the new agent outputs.
- [ ] **Recovery Test:** Ensure that if `ContrarianService` fails, the background task safely aborts and marks the report as `FAILED`.

---

## Phase 6: Production Rollout (Week 9)
**Goal:** Safely expose V2 to users.

- [ ] Deploy database migrations.
- [ ] Deploy backend code.
- [ ] Deploy frontend code.
- [ ] Monitor logs for 48 hours focusing on Pydantic validation failures. 
- [ ] Collect user feedback on the quality of the new deterministic scores vs the old hallucinated scores.
