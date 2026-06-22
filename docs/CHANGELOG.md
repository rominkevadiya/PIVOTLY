# Changelog

All notable changes to the Pivotly platform will be documented in this file.

## [Unreleased] - Phase 3 (In Progress)
### Planned
- Parallel agent execution using `asyncio.gather`.
- FastAPI `BackgroundTasks` implementation.
- React tabbed dashboard overhaul.

## [2.0.0-alpha] - Phase 2 Completion
### Added
- Multi-agent AI Pipeline (`ResearchService`, `CompetitorService`, `ContrarianService`, `MoatService`, `ActionService`).
- `search_context` grounding to eliminate URL hallucination.
- Deterministic Math Engine (`ScoringService`) for grading startups.
- `SectionError` Pydantic models for graceful partial failure recovery.
### Changed
- Refactored `VentureReportV2` Pydantic models to a flattened, modular design.
- Prompts updated to enforce specific personas and direct URL citations.

## [1.5.0] - Phase 1 Completion
### Added
- `schema_version` column to PostgreSQL `reports` table.
- Alembic database migration for dual-schema support.
### Changed
- Refactored core Pydantic endpoints to validate based on `schema_version` (1 vs 2) to maintain V1 backward compatibility.

## [1.0.0] - V1 Base Platform
### Added
- Monolithic single-prompt AI pipeline.
- PostgreSQL user persistence and rate limiting.
- React-based scrolling report view and PDF exports.
- Initial API endpoints.

---

*Note: Documentation was audited and consolidated on 2026-06-22.*
