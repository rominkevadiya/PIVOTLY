# Pivotly V2 Gap Analysis

## Overview
This document assesses the existing Pivotly codebase against the V2 Venture Intelligence Engine requirements. It identifies the gap between the current single-prompt architecture and the desired multi-agent, evidence-driven architecture.

---

## Gap Analysis Summary

| Feature | Current State | Missing Work | Risk | Priority |
|----------|--------------|--------------|------|----------|
| 1. Research Layer | Handled by `search_service.py` but raw output passed to LLM. | Parse raw search into `ResearchContext` JSON. Create `research_service.py`. | Low | High |
| 2. Competitor Intel | Simple list generated in massive LLM JSON output. | Isolate to `competitor_service.py`. Add threat and copy-risk analysis. | Med | High |
| 3. Moat Analysis | Non-existent or hallucinated in SWOT. | Create `moat_service.py`. Prompt for defensibility and network effects. | Med | High |
| 4. Contrarian Intel | Generic "Failure Risks" in giant JSON output. | Create `contrarian_service.py`. Prompt for critical assumptions. | Med | High |
| 5. Scoring Engine | Hallucinated numeric scores generated directly by Gemini. | Move math to backend logic. Build deterministic `scoring_service.py`. | High | High |
| 6. Evidence System | Minimal. Search context is provided but citations are loose. | Implement `Evidence` schema across all qualitative outputs. | Med | High |
| 7. V2 Schema | Single massive `VentureReport` with heavy nesting. | Flatten schema into modular agents (`VentureReportV2`). | High | Critical |
| 8. Prompt Refactor | One giant `build_analysis_prompt()` in `prompt_builder.py`. | Break into 5 separate, modular prompts per agent. | Med | High |
| 9. UI Changes | Long vertical scroll of generic report text. | Build tabbed React dashboard with Scorecards and Evidence Cards. | High | Med |
| 10. DB Changes | Stores JSONB and single `overall_score`. | Add `schema_version` and specific sub-scores as scalar columns. | Low | Critical |
| 11. API Changes | Endpoint returns basic `id` and status correctly. | Endpoint requires no change; only the underlying orchestration. | Low | Low |
| 12. Backward Compat | System assumes all reports are V1. | Backend/Frontend routing based on `schema_version`. | Med | Critical |

---

## Detailed Component Analysis

### 1. Research Layer
- **Current implementation status:** Uses `search_service.py` to hit Tavily API, but simply dumps raw text into the Gemini prompt.
- **Existing files involved:** `backend/app/services/search_service.py`
- **Required code changes:** Filter/compress raw Tavily data into a structured `ResearchContext` Pydantic model before passing it downstream.
- **Estimated complexity:** Low
- **Breaking change risk:** Low
- **Dependencies:** Tavily API limits.
- **Recommended implementation order:** Step 2 (After Base Schemas)

### 2. Competitor Intelligence Layer
- **Current implementation status:** Part of the massive `VentureReport` schema. Output is generic.
- **Existing files involved:** `backend/app/services/ai_service.py`, `prompt_builder.py`
- **Required code changes:** Create `competitor_service.py`. Needs dedicated prompt focusing on `copy_risk` and threat levels based on the `ResearchContext`.
- **Estimated complexity:** Medium
- **Breaking change risk:** Low
- **Dependencies:** Research Layer.
- **Recommended implementation order:** Step 4

### 3. Moat Analysis Layer
- **Current implementation status:** Missing. Handled poorly via generic SWOT.
- **Existing files involved:** None currently dedicated.
- **Required code changes:** Create `moat_service.py`. Evaluate `CompetitorAnalysis` to determine network effects or switching costs.
- **Estimated complexity:** Medium
- **Breaking change risk:** Low
- **Dependencies:** Competitor Intel Layer.
- **Recommended implementation order:** Step 5

### 4. Contrarian Analysis Layer
- **Current implementation status:** Embedded as `failure_risks` array.
- **Existing files involved:** `ai_service.py`, `prompt_builder.py`
- **Required code changes:** Create `contrarian_service.py`. Prompt as a Sequoia Partner to actively find holes in the idea.
- **Estimated complexity:** Medium
- **Breaking change risk:** Low
- **Dependencies:** Research Layer.
- **Recommended implementation order:** Step 4

### 5. Deterministic Scoring Engine
- **Current implementation status:** Fully hallucinated by Gemini in `VentureReport`.
- **Existing files involved:** `report.py` (models and schemas).
- **Required code changes:** Strip scores from LLM prompts. Build `scoring_service.py` using a Python math algorithm that grades inputs from the Agents.
- **Estimated complexity:** High
- **Breaking change risk:** High (Changes how overall viability is communicated).
- **Dependencies:** All other agent layers.
- **Recommended implementation order:** Step 6

### 6. Evidence System
- **Current implementation status:** Loosely requested in current prompt but prone to hallucination.
- **Existing files involved:** `schemas/report.py`
- **Required code changes:** Enforce an `evidence_list` array in all new agent schemas using a unified `Evidence` model.
- **Estimated complexity:** Medium
- **Breaking change risk:** Low
- **Dependencies:** Schema design.
- **Recommended implementation order:** Step 1

### 7. VentureReport V2 Schema
- **Current implementation status:** `VentureReport` is highly nested and prone to validation failures.
- **Existing files involved:** `backend/app/schemas/report.py`
- **Required code changes:** Define `VentureReportV2` utilizing the modular agent outputs.
- **Estimated complexity:** High
- **Breaking change risk:** High (Affects frontend parsing directly).
- **Dependencies:** None.
- **Recommended implementation order:** Step 1

### 8. Prompt Refactoring
- **Current implementation status:** One massive prompt string.
- **Existing files involved:** `backend/app/utils/prompt_builder.py`
- **Required code changes:** Disassemble into `build_research_prompt`, `build_competitor_prompt`, `build_moat_prompt`, etc.
- **Estimated complexity:** Medium
- **Breaking change risk:** Low
- **Dependencies:** Schema design.
- **Recommended implementation order:** Step 3

### 9. Frontend Report UI Changes
- **Current implementation status:** Vertical scroll rendering single JSON payload.
- **Existing files involved:** `frontend/src/pages/ReportPage.tsx` and components.
- **Required code changes:** Add tabbed navigation, Evidence Cards, Scorecards. 
- **Estimated complexity:** High
- **Breaking change risk:** Medium (Mitigated by versioning).
- **Dependencies:** Backward compatibility, V2 Schema.
- **Recommended implementation order:** Step 8

### 10. Database Changes
- **Current implementation status:** Single `report_json` column and limited scalar scores.
- **Existing files involved:** `backend/app/models/report.py`, Alembic migrations.
- **Required code changes:** Add `schema_version` to support backwards compatibility.
- **Estimated complexity:** Low
- **Breaking change risk:** Low
- **Dependencies:** None.
- **Recommended implementation order:** Step 1

### 11. API Changes
- **Current implementation status:** Stable, utilizing FastAPI BackgroundTasks.
- **Existing files involved:** `backend/app/api/v1/endpoints/analyze.py`
- **Required code changes:** None specifically for V2 endpoints, purely orchestration inside the service.
- **Estimated complexity:** Low
- **Breaking change risk:** None.
- **Dependencies:** Orchestration logic in `report_service.py`.
- **Recommended implementation order:** N/A

### 12. Backward Compatibility
- **Current implementation status:** Assumes one schema structure.
- **Existing files involved:** `ReportService.validate_stored_report()`, Frontend `ReportPage`.
- **Required code changes:** Wrap JSON validation logic in an `if schema_version == 1` statement across stack.
- **Estimated complexity:** Medium
- **Breaking change risk:** High (If missed, old reports crash the app).
- **Dependencies:** Database Changes.
- **Recommended implementation order:** Step 7
