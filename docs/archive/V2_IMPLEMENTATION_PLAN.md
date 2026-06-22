# Pivotly V2 Implementation Plan

## Overview
This document outlines the execution strategy to migrate Pivotly from a single-prompt AI generator to a multi-stage deterministic Venture Intelligence Engine.

## 1. Exact Files to be Modified / Created

### **Backend Schemas (`backend/app/schemas/`)**
- `report.py`: Replace `VentureReport` with `VentureReportV2` (less nesting, new structure).
- *New* `evidence.py`: Reusable `Evidence` model for citations.
- *New* `research.py`: `ResearchContext` output schema for ResearchService.
- *New* `competitor.py`: `CompetitorAnalysis` output schema for CompetitorService.
- *New* `moat.py`: `MoatAnalysis` output schema for MoatService.
- *New* `contrarian.py`: `ContrarianAnalysis` output schema for ContrarianService.

### **Backend Services (`backend/app/services/`)**
- `report_service.py`: Refactor orchestration to manage multi-agent DAG pipeline.
- `ai_service.py`: Split out single `generate_report` into specific isolated agent calls.
- `prompt_builder.py`: Remove giant prompt. Break into smaller modular prompts.
- *New* `research_service.py`: Handles gathering of factual data.
- *New* `competitor_service.py`: Analyzes copy risks.
- *New* `moat_service.py`: Determines defensibility.
- *New* `contrarian_service.py`: VC failure analysis.
- *New* `scoring_service.py`: Deterministic scoring logic.

### **Database Models & Migrations (`backend/app/models/` & Alembic)**
- `report.py`: Update `report_json` to support `VentureReportV2`. Adjust generated scalar columns (e.g., `overall_score`) to match new metrics.
- *New Migration*: Add new scalar columns for specific calculated scores if required, or simply store everything in `report_json`.

### **Frontend Components (`frontend/src/`)**
- `types/report.ts`: Update TypeScript definitions to match `VentureReportV2`.
- `components/report/ReportView.tsx`: Implement new tabbed UI (Overview, Market, Competitors, Risks, Moat, Scorecard).
- `components/report/EvidenceCard.tsx` (New): Render evidence schemas with source links.
- `components/report/MoatMeter.tsx` (New): Render visual moat strengths.
- `components/report/ScoreExplanation.tsx` (New): Explain backend deterministic scores.

## 2. API Changes
- **POST `/api/v1/analyze`**: No schema changes required (still accepts `idea_text`, `region`, `budget_range`).
- **GET `/api/v1/reports/{id}`**: Will return the new `VentureReportV2` structure in the `report_json` field.
- **GET `/api/v1/reports/{id}/status`**: Will transition through more granular states (e.g., `RESEARCHING`, `SCORING`, `ANALYZING`) or retain the existing states.

## 3. Schema Changes
The core AI schema will migrate from a deeply nested `VentureReport` to a flatter `VentureReportV2` incorporating:
- `Executive Summary`
- `Market Intelligence`
- `Competitor Intelligence`
- `Moat Analysis`
- `Opportunity Gaps`
- `Failure Analysis`
- `Why This Could Win`
- `Why This Could Fail`
- `What Must Be True`
- `Biggest Unknowns`
- `Deterministic Scorecard`
- `Recommendation`
- `Evidence References`

All quantitative scores will be removed from LLM generation schemas and calculated by the backend using deterministic algorithms.

## 4. Migration Requirements
- Existing reports stored in PostgreSQL (`report_json`) adhere to V1 schema.
- **Requirement:** The frontend must maintain backward compatibility for rendering V1 reports, OR a backend migration script must map V1 JSON to V2 JSON. 
- *Recommendation:* Introduce a `schema_version` integer on the `reports` table. V1 = 1, V2 = 2. 

## 5. Rollout Strategy
1. **Phase 1 (Backend Core):** Create new specific output schemas and services (`scoring_service`, `research_service`, etc.) in parallel to existing ones.
2. **Phase 2 (Orchestration):** Modify `report_service.py` to pipe the new services together.
3. **Phase 3 (Frontend Layout):** Update React components to parse `VentureReportV2` utilizing a generic fallback for V1 versions.
4. **Phase 4 (Validation):** Run 50 test ideas through the V2 pipeline to ensure latency stays under 45s (via BackgroundTasks) and all validations pass.

## 6. Backward Compatibility Plan
- Create an Alembic migration adding `schema_version = Column(Integer, default=1)`.
- New reports will generate with `schema_version = 2`.
- The Frontend API client will look at `schema_version`. If `1`, it renders the legacy UI components. If `2`, it renders the new tabbed UI.

## 7. Risk Analysis
- **Latency Increase:** Breaking the prompt into multiple calls (Research -> Competitor/Contrarian -> Scoring) could increase overall processing time. *Mitigation:* Run independent LLM calls concurrently via `asyncio.gather`.
- **Cost Increase:** More Gemini calls mean more tokens. *Mitigation:* Ensure `ResearchContext` is concise and strictly formatted to keep input token size low for downstream agents.
- **Rate Limits:** More frequent calls to Gemini or Tavily per report. *Mitigation:* Aggressive exponential backoff in `ai_service.py` (already implemented) and potential caching of `ResearchContext` for similar queries.
