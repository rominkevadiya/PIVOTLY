# Changelog

All notable changes to the Pivotly platform are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## v2.1.0 — Phase 3: BackgroundTasks & EvidenceLedger

### Added
- **BackgroundTasks Orchestration:** `POST /api/v1/analyze` now returns `{report_id, status: "PENDING"}` immediately. Generation runs in `FastAPI BackgroundTasks`.
- **Report Status Lifecycle:** Four-state status machine tracked in DB: `PENDING → SCRAPING → GENERATING → COMPLETED | FAILED`.
- **Status Polling Endpoint:** `GET /api/v1/reports/{id}/status` — lightweight status check for frontend polling.
- **`RecommendationSection` Schema:** Structured recommendation object with `decision`, `confidence`, `confidence_score`, `evidence`, and `rationale` fields.
- **`ReportValidationFactory`:** Routes stored report JSON to correct Pydantic validator based on `schema_version`.
- **`error_message` column:** Captured in the `reports` table when a background job fails.
- **Deferred JSONB Loading:** `ReportSummary` list endpoint excludes `report_json` to eliminate memory bloat.

### Changed
- `VentureReportV2` schema updated: top-level `recommendation` field is now a `RecommendationSection` object (not a bare string).
- Frontend tabbed dashboard renders `VentureReportV2` sections with status-aware loading states.

---

## v2.0.5 — Phase 2.5: Skills Architecture & EvidenceLedger

> Commits: `02ad14c` (skills), `96c46a7` (EvidenceLedger orchestration)

### Added
- **Skills Architecture:** Agent prompts migrated from inline Python strings to external Markdown skill files (`backend/app/skills/`): `research_skill.md`, `competitor_skill.md`, `moat_skill.md`, `contrarian_skill.md`, `action_skill.md`. Shared rules live in `skills/shared/schema_rules.md`, `citation_rules.md`, `anti_hallucination.md`.
- **`EvidenceLedger` Schema:** Typed context object (`backend/app/schemas/evidence_ledger.py`) with fields: `market_indicators`, `competitor_references`, `citations`, `risk_signals`, `trend_signals`, `available_source_urls`, `raw_search_context`. Replaces unstructured `search_context` string injection into downstream agents.
- **`AIService.build_evidence_ledger()`:** Static factory method converting `ResearchContext` → `EvidenceLedger`. Extracts URLs from raw search text, deduplicates, filters generic domains.
- **`EvidenceLedger.to_prompt_block()`:** Compact structured block renderer (~470 chars vs ~5,000-char raw search context — 10× compression).
- **DAG metrics logging:** `[dag]` log lines emitting `search_context_chars`, ledger `block_chars`, and `estimated_reduction_chars` per report.
- **`[prompt_metrics]` logging:** All prompt builders emit token-count estimates for production observability.

### Changed
- `build_competitor_prompt()`, `build_moat_prompt()`, `build_contrarian_prompt()` now accept `EvidenceLedger` instead of raw `search_context` strings.
- `generate_competitor_analysis()`, `generate_moat_analysis()`, `generate_contrarian_analysis()` in `AIService` updated to receive `EvidenceLedger`.
- `ReportService.process_report()` orchestration DAG updated: builds `EvidenceLedger` after Research Agent, passes it to all downstream agents. Graceful fallback to minimal ledger if Research fails.
- Estimated per-report token reduction: ~2,000–5,500 tokens across 3 agents.

---

## v2.0.0 — Phase 2: Multi-Agent DAG

### Added
- **Multi-Agent Pipeline:** Monolithic LLM prompt replaced with a 5-agent Directed Acyclic Graph (DAG): `ResearchService`, `CompetitorService`, `ContrarianService`, `MoatService`, `ActionService`.
- **Deterministic Scoring Engine (`ScoringService`):** Python math engine replaces LLM-generated scores. Categories: Market (20%), Competition (25%), Moat (35%), Execution Risk (20%). Produces `overall_score` (0–100).
- **`SectionError` Schema:** Each agent section can fail independently with `{"status": "UNAVAILABLE", "reason": "..."}` without corrupting the overall report.
- **`search_context` Web Grounding:** Tavily Search API (with DuckDuckGo fallback) fetches live competitor data before AI invocation. Eliminates URL hallucination.
- **`Evidence` Primitive:** Every agent claim must be backed by an `Evidence` object: `claim`, `source_url`, `quote`, `confidence`.
- **Auto-Repair Engine:** Validation handler coerces list lengths and attributes to fit Pydantic schema bounds on minor failures.

### Changed
- `VentureReportV2` Pydantic models refactored to a flattened, modular structure (one schema object per agent).
- Agent prompts enforce specific personas: Research (Objective Data Researcher), Competitor (Cutthroat Analyst), Contrarian (Skeptical Sequoia Partner), Moat (Defensibility Expert), Action (Serial Founder).

---

## v1.5.0 — Phase 1: V2 Data Foundation

### Added
- `schema_version` INTEGER column on `reports` table (default `1` for V1 compatibility).
- Alembic migration for `schema_version` column (`status`, `error_message` columns also added).
- `schema_version` validation routing in response serialization layer.

### Changed
- `reports` table: `user_id` is now nullable (future guest analysis support).
- Report response schemas updated to include `schema_version` in list and detail views.

---

## v1.0.0 — V1 Base Platform

### Added
- Monolithic single-prompt Gemini AI pipeline.
- PostgreSQL persistence: `users`, `reports`, `rate_limits` tables.
- JWT authentication with 24-hour access tokens.
- Two-tier rate limiting: IP-based (`slowapi`, 60 req/min) + user-based (5 analyses/day via DB upsert).
- React SPA with scrolling report view and A4-optimized PDF export.
- Initial REST API endpoints: `/auth/register`, `/auth/login`, `/auth/me`, `/analyze`, `/reports`, `/reports/{id}`, `/users/me/stats`.
- OpenAPI docs (Swagger/ReDoc) restricted to `development` environment.

---

*Documentation audited and restructured: 2026-06-24*
