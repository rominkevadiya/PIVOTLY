# Pivotly Status

**Current Version:** 2.1.0
**Current Phase:** Phase 3 — Production Stable (2 commits ahead of EC2)
**Production Status:** Live — EC2 running `1b55980`; local `main` at `96c46a7` (not yet deployed)
**Latest Production Commit:** `1b55980` — fix(backend): safely handle SectionError in ScoringService
**Latest Local Commit:** `96c46a7` — feat(backend): Phase 2.5 — EvidenceLedger orchestration

---

## Completed

- **V1 Base Platform:** Monolithic Gemini prompt, PostgreSQL persistence, React scrolling report, PDF export.
- **Phase 1 — V2 Data Foundation:** `schema_version` column added to `reports` table; Alembic migration for dual-schema backward compatibility.
- **Phase 2 — Multi-Agent DAG:** Monolithic prompt decomposed into a 5-agent Directed Acyclic Graph: `ResearchService`, `CompetitorService`, `ContrarianService`, `MoatService`, `ActionService`. `SectionError` fallback for partial failure recovery.
- **Phase 2.5 — EvidenceLedger & Skills Architecture:**
  - Introduced `EvidenceLedger` — a typed, token-efficient context object that replaces raw `search_context` injection into downstream agents.
  - Migrated agent prompts from inline Python strings to external `.md` skill files (`backend/app/skills/`).
  - Reduces redundant context injection from ~9,500 chars per downstream call to a single structured block.
- **Phase 3 — BackgroundTasks Orchestration:**
  - `POST /api/v1/analyze` returns `{report_id, status: "PENDING"}` immediately.
  - AI generation runs in `FastAPI BackgroundTasks`, with status lifecycle: `PENDING → SCRAPING → GENERATING → COMPLETED | FAILED`.
  - Frontend polls `GET /api/v1/reports/{id}/status` until `COMPLETED`.
- **Deterministic Scoring Engine:** Replaced arbitrary LLM scores with a Python math engine (`ScoringService`). Category scores feed a weighted overall score (0–100).
- **V1/V2 Compatibility:** `ReportValidationFactory` routes stored JSON to the correct Pydantic validator based on `schema_version`.
- **Frontend V2 Dashboard:** Tabbed React report view rendering `VentureReportV2` sections.
- **Deferred JSONB Loading:** `ReportSummary` list endpoint does not load `report_json` — eliminates memory bloat on dashboard.

---

## In Progress

- **Gemini API Key Rotation:** Free-tier quota (20 req/day) rotation across multiple keys in `ai_service.py` (tracking: see ROADMAP Phase 4).
- **PostgreSQL Search Cache:** `search_caches` table for deduplicating Tavily/DDG calls by query hash.

---

## Known Issues

- `google.genai` SDK produces static linting warnings locally (mypy/Pylance); runtime behavior is correct.
- Rate limiting remains PostgreSQL-backed; under sustained parallel load this could produce transaction contention (acceptable at current scale — see ROADMAP risk matrix).
- Error dumps written to `/tmp/pivotly_errors/` are not auto-rotated; disk monitoring required.

---

## Next Milestones

- **Phase 4 — Search Caching:** Implement `search_caches` table and integrate cache hit/miss logic into `SearchService`.
- **Phase 4 — Deferred Column Loading:** Apply SQLAlchemy `defer(Report.report_json)` in `ReportRepository.get_by_user_id`.
- **Phase 4 — Public Share Links:** Add `share_token` UUID to `reports` table; create public `/reports/share/{token}` route.
- **Phase 4 — Multi-Key Gemini Rotation:** List-based key rotation in `AIService` to bypass free-tier quota limits.
