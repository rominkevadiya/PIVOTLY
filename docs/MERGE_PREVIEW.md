# Documentation Merge Preview & Dependency Map

## 1. Dependency Map

Before executing the documentation consolidation, we mapped how the fragmented V2 planning documents relate to the core "Source of Truth" documents.

*   `V2_PROMPT_FLOW.md` -> **Depends on** core multi-agent concepts. **Supplies** DAG logic to `AI_PIPELINE.md`.
*   `V2_SCORING_ENGINE.md` -> **Depends on** agent outputs. **Supplies** deterministic math to `AI_PIPELINE.md`.
*   `V2_SCHEMA_DESIGN.md` -> **Depends on** DB JSONB columns. **Supplies** Pydantic schemas to `DATABASE.md` and `AI_PIPELINE.md`.
*   `V2_EXECUTION_PLAN.md` -> **Depends on** project timeline. **Supplies** Phase 3 (Orchestration) and Phase 4 (Caching) tasks to `ROADMAP.md`.
*   `V2_FRONTEND_CHANGES.md` -> **Depends on** React UI. **Supplies** component architecture to `ROADMAP.md`.
*   `UPDATED_V2_ROADMAP.md` -> **Standalone**. Forms the base of the new `ROADMAP.md`.

---

## 2. Merge Operations

### Merge A: `V2_PROMPT_FLOW.md` → `AI_PIPELINE.md`
*   **Sections to Copy:**
    *   `## Flow Diagram` (The Mermaid DAG).
    *   `## Agent Prompts` (Personas for Research, Competitor, Contrarian, Moat, Action, Synthesis).
    *   `## Token Optimization Strategy`.
*   **Sections to Discard:**
    *   `## Overview` (Redundant).

### Merge B: `V2_SCORING_ENGINE.md` → `AI_PIPELINE.md`
*   **Sections to Copy:**
    *   `## Category Scoring Logic (0-10)` (Formulas for Market, Competition, Moat, Execution Risk).
    *   `## Overall Score Calculation (0-100)` (Weightings).
*   **Sections to Discard:**
    *   `## Implementation Steps` (Already completed).
    *   `## Overview` (Redundant).

### Merge C: `V2_SCHEMA_DESIGN.md` → `DATABASE.md` & `AI_PIPELINE.md`
*   **Sections to Copy to `DATABASE.md`:**
    *   `## Final V2 Report Schema` (The master `VentureReportV2` structure stored in `JSONB`).
*   **Sections to Copy to `AI_PIPELINE.md`:**
    *   `## Reusable Primitives` (`Evidence` Schema definition).
    *   `## Agent Output Schemas` (`ResearchContext`, `CompetitorAnalysis`, etc.).
*   **Sections to Discard:**
    *   `## Design Rationale` (Already covered in Refactor Reports).

### Merge D: `UPDATED_V2_ROADMAP.md` + `V2_EXECUTION_PLAN.md` + `V2_FRONTEND_CHANGES.md` → `ROADMAP.md`
*   **Sections to Copy to `ROADMAP.md`:**
    *   Entire `UPDATED_V2_ROADMAP.md` (Serves as the base document).
    *   From `V2_EXECUTION_PLAN.md`: Phase 3 (Orchestration) and Phase 4 (Optional Enhancements) task lists.
    *   From `V2_FRONTEND_CHANGES.md`: Component Architecture (EvidenceCard, ScorecardView, MoatMeter) and backward compatibility rules.
*   **Sections to Discard:**
    *   Phase 1 and Phase 2 from `V2_EXECUTION_PLAN.md` (Already completed).
    *   Redundant introductions.

---

## 3. Final Content Outlines

### `AI_PIPELINE.md`
1.  **Overview:** The RAG-lite multi-agent approach.
2.  **Architecture (DAG):** Mermaid diagram showing Research → Competitor/Contrarian → Moat → Scoring → Action.
3.  **Agent Personas & Schemas:** 
    *   Research Service (Extracts facts).
    *   Competitor Service.
    *   Contrarian Service.
    *   Moat Service.
    *   Action Service.
    *   *Includes Pydantic schemas from V2_SCHEMA_DESIGN.md.*
4.  **Deterministic Scoring Engine:**
    *   Math formulas and weightings from `V2_SCORING_ENGINE.md`.
5.  **Fault Tolerance:** How `SectionError` enables graceful degradation.
6.  **Prompt Strategy:** The `search_context` grounding technique.

### `DATABASE.md`
1.  **Overview:** PostgreSQL architecture.
2.  **Entity Relationship Diagram.**
3.  **Table Documentation:**
    *   `users`
    *   `reports` (Updated to reflect `schema_version`).
    *   `rate_limits`
4.  **JSONB Payload Structure:**
    *   Detailed breakdown of the `VentureReportV2` structure from `V2_SCHEMA_DESIGN.md`.
5.  **Query Patterns & Caching:** Notes on the `search_caches` table.

### `ROADMAP.md`
1.  **Executive Summary:** Zero-AWS-Cost strategy.
2.  **Phase 3: Orchestration & Frontend (Active):**
    *   Backend `asyncio.gather` DAG implementation.
    *   React Tabbed UI implementation.
    *   Component specs (MoatMeter, EvidenceCard, Scorecard) from `V2_FRONTEND_CHANGES.md`.
    *   V1 Backward Compatibility logic.
3.  **Phase 4: Future Enhancements (Backlog):**
    *   Postgres search caching.
    *   Public Share Links.
4.  **Risk Matrix & Scale Blueprint.**
