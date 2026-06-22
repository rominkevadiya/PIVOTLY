# Pivotly V2 Execution Plan

## Overview
This document outlines the phased, realistic execution roadmap for upgrading Pivotly to the V2 architecture based on the Gap Analysis. Implementation avoids "big bang" rewrites in favor of incremental delivery.

---

## Phase 1: Quick Wins (<1 Day)
**Focus:** Establish the data foundation and backward compatibility safety net.

### Expected Outcome
The database and schemas are prepared to handle the new V2 data structures alongside legacy V1 data. The codebase remains fully functional and ready to accept new service layers.

### Files to Modify
- `backend/app/models/report.py` (Add `schema_version` column)
- `backend/app/schemas/report.py` (Create new models: `Evidence`, `ResearchContext`, `VentureReportV2`)
- `backend/alembic/versions/*` (Create new migration script)

### Risk Level
**Low**. Adding nullable columns and new Pydantic definitions that aren't yet active in the orchestration layer will not break existing functionality.

### Testing Strategy
- Generate a new Alembic revision and apply it locally.
- Run a V1 report through the pipeline to ensure the `schema_version` defaults to `1` and the existing UI parses it correctly.

---

## Phase 2: High ROI Improvements (2-3 Days)
**Focus:** Build the Deterministic Scoring Engine and the new specific Agent prompts without fully dismantling the orchestration yet.

### Expected Outcome
The mathematical algorithms for scoring are locked into Python logic. The LLM prompts are modularized to prevent hallucination. 

### Files to Modify
- `backend/app/utils/prompt_builder.py` (Break down giant string into specific agent prompts)
- `backend/app/services/scoring_service.py` (New file: create deterministic scoring logic)
- `backend/app/services/research_service.py` (New file: parse Tavily into `ResearchContext`)
- `backend/app/services/ai_service.py` (Expose targeted generation methods rather than one giant one)

### Risk Level
**Medium**. Splitting prompts and relying on the Gemini SDK to return multiple smaller structured outputs could introduce unexpected Pydantic validation errors if the prompts are not tuned correctly.

### Testing Strategy
- Write unit tests for `scoring_service.py` passing in mock agent classifications to verify the math is deterministic.
- Run a standalone test script to feed an idea into `ai_service.py` and print out the modular `ResearchContext` and `CompetitorAnalysis` to verify schema adherence.

---

## Phase 3: Major Architecture Improvements (1 Week)
**Focus:** Wire the new multi-agent DAG into the main execution pipeline and overhaul the Frontend React dashboard.

### Expected Outcome
When a user hits `/api/v1/analyze`, the background task executes the agents concurrently, runs the deterministic score, and saves a `VentureReportV2` JSON payload. The React frontend natively renders this as a tabbed, professional UI.

### Files to Modify
- `backend/app/services/report_service.py` (Rewrite `process_report` to utilize `asyncio.gather` for the new agents)
- `frontend/src/types/report.ts` (Implement V2 types)
- `frontend/src/pages/ReportPage.tsx` (Add `schema_version` routing)
- `frontend/src/components/report/*` (Build tabs, MoatMeter, EvidenceCards, Scorecards)

### Risk Level
**High**. This is the core migration. It completely alters how the backend generates content and how the frontend displays it.

### Testing Strategy
- End-to-End (E2E) testing: Submit 5 distinct startup ideas. Verify the BackgroundTask completes without timeouts.
- Frontend Verification: Load 5 legacy V1 reports and confirm they render using the old UI. Load 5 new V2 reports and confirm they render using the tabbed UI. Verify no React rendering crashes occur due to missing keys.

---

## Phase 4: Optional Future Enhancements
**Focus:** Post-launch optimizations that improve performance, scalability, and UX, but are not strict blockers for the V2 core launch.

### Expected Outcome
Faster report generation times, lower LLM costs, and better shareability for users.

### Files to Modify
- `backend/app/services/search_service.py` (Implement Postgres caching for identical searches)
- `backend/app/api/v1/endpoints/reports.py` (Add public share-link endpoints)
- `frontend/src/pages/SharePage.tsx` (New file for public read-only views)

### Risk Level
**Low**. These are additive features that do not alter the core generation pipeline.

### Testing Strategy
- Database performance analysis (checking hit-rates on the search cache).
- Security testing on public share links to ensure user PII is not leaked.
