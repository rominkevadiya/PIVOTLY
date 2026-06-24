# Pivotly Documentation Index

This folder is the **source of truth** for all engineering documentation on the Pivotly Venture Intelligence Platform. Everything here is actively maintained and reflects the current production architecture.

---

## Core Documentation

| Document | Purpose |
|---|---|
| [AI_PIPELINE.md](AI_PIPELINE.md) | Multi-agent DAG architecture, EvidenceLedger, skills system, deterministic scoring engine, fault tolerance |
| [API.md](API.md) | REST API reference: all endpoints, request/response schemas, status lifecycle |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System overview, directory structure, BackgroundTasks architecture, module breakdown |
| [DATABASE.md](DATABASE.md) | PostgreSQL schema, ERD, JSONB payload structure (`VentureReportV2`), `schema_version` support |
| [DEPLOYMENT.md](DEPLOYMENT.md) | AWS EC2/RDS infrastructure, environment variables, deployment workflow |
| [ROADMAP.md](ROADMAP.md) | Zero-AWS-Cost strategy, Phase 4 backlog, risk matrix, cost analysis |
| [CHANGELOG.md](CHANGELOG.md) | Semantic version history of all major platform changes |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Current version, production status, known issues, next milestones |
| [SYSTEM_DESIGN_CASE_STUDY.md](SYSTEM_DESIGN_CASE_STUDY.md) | Engineering decisions, tradeoffs, scalability considerations (case study format) |

---

## Subdirectory Explanations

### `archive/`
Contains **superseded planning documents** from V1 and V2 design phases. These are read-only historical references — do not edit or reactivate them.

```
archive/
├── PHASE1_IMPLEMENTATION_DESIGN.md   # V1 design spec (superseded)
├── PHASE1_TEST_PLAN.md               # V1 test plan (superseded)
├── V2_DATABASE_CHANGES.md            # V2 DB migration planning
├── V2_GAP_ANALYSIS.md                # Pre-V2 gap analysis
├── V2_IMPLEMENTATION_PLAN.md         # V2 implementation blueprint
├── V2_ROADMAP.md                     # Early V2 roadmap draft
└── merged/                           # Pre-merge V2 sub-documents
```

### `audits/`
Contains **point-in-time audit reports** generated during major phases. These capture verified state at a specific moment and are never edited after the fact.

```
audits/
├── PHASE2_AUDIT_REPORT.md       # End-of-Phase-2 production audit
├── PHASE2_COST_AUDIT.md         # Phase 2 token & cost analysis
├── PHASE2_REFACTOR_REPORT.md    # Skills-based architecture refactor audit
└── V2_ARCHITECTURE_AUDIT.md     # Pre-Phase-3 architecture audit
```

### `decisions/`
Contains **Architecture Decision Records (ADRs)** — permanent records of significant architectural choices.

```
decisions/
└── 001-blueprint.md   # Zero-AWS-Cost blueprint ADR
```

---

## Recommended Reading Order for New Contributors

1. **Start here:** [ARCHITECTURE.md](ARCHITECTURE.md) — understand the system at a high level
2. **Understand the AI:** [AI_PIPELINE.md](AI_PIPELINE.md) — the multi-agent DAG and EvidenceLedger
3. **Understand the data:** [DATABASE.md](DATABASE.md) — schema, report lifecycle, JSONB structure
4. **Understand the API:** [API.md](API.md) — all endpoints including `/status` polling
5. **Understand the deployment:** [DEPLOYMENT.md](DEPLOYMENT.md) — infrastructure and env vars
6. **Check current state:** [PROJECT_STATUS.md](PROJECT_STATUS.md) — what is done and what is next
7. **Understand the vision:** [ROADMAP.md](ROADMAP.md) — Phase 4 backlog and risk matrix

---

*Last updated: 2026-06-25*
