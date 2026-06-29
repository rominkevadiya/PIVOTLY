# Pivotly — Venture Intelligence Platform

> AI-powered startup idea analysis. Submit an idea, get a structured multi-agent venture report in seconds.

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://postgresql.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5--flash-orange)](https://ai.google.dev)

---

## What Is Pivotly?

Pivotly transforms a raw startup idea into a structured venture intelligence report by running it through a **5-agent AI pipeline** grounded in live web data. Each agent is a specialist: a market researcher, a competitive analyst, a contrarian investor, a defensibility expert, and an execution strategist.

The result is a scored, evidence-backed report — not a generic AI summary.

---

## Architecture at a Glance

```
POST /api/v1/analyze
        │
        ▼  (returns {report_id, status: "PENDING"} immediately)
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI BackgroundTask                      │
│                                                             │
│  SearchService (Tavily → DDG fallback)                      │
│        │                                                    │
│        ▼                                                    │
│  Research Agent  ──►  EvidenceLedger                        │
│                              │                              │
│              ┌───────────────┼───────────────┐             │
│              ▼               ▼               ▼             │
│        Competitor       Contrarian          Moat           │
│           Agent            Agent            Agent          │
│              │               │               │             │
│              └───────────────┴───────────────┘             │
│                              │                              │
│                       Action Agent                          │
│                              │                              │
│                     ScoringService (deterministic)          │
│                              │                              │
│                    VentureReportV2  ──►  PostgreSQL         │
└─────────────────────────────────────────────────────────────┘

Frontend polls GET /api/v1/reports/{id}/status → COMPLETED → renders report
```

---

## Key Features

### V2 Multi-Agent Pipeline (Current)
- **5-agent DAG** — Research, Competitor, Contrarian, Moat, Action agents run sequentially via `BackgroundTasks`
- **EvidenceLedger** — typed context object passed between agents; replaces raw search string injection (~10× token reduction per downstream agent)
- **Skills Architecture** — agent prompts stored as external `.md` files in `backend/app/skills/`; no prompt logic in Python
- **Deterministic Scoring** — `ScoringService` produces a `ScoringRubric` from agent outputs using a pure Python math engine (no LLM scores)
- **Partial Failure Recovery** — each agent section can independently fail with a `SectionError`; remaining agents continue
- **`ReportValidationFactory`** — routes stored JSON to the correct Pydantic validator based on `schema_version`

### BackgroundTasks Orchestration
- `POST /api/v1/analyze` returns `{report_id, status: "PENDING"}` immediately (no browser timeout risk)
- Status lifecycle: `PENDING → SCRAPING → GENERATING → COMPLETED | FAILED`
- Frontend polls `GET /api/v1/reports/{id}/status` until `COMPLETED`

### Platform Foundation
- JWT authentication (register, login, 24-hour tokens)
- Two-tier rate limiting: IP-based (`slowapi`, 60 req/min) + user-based (5 analyses/day, DB-backed)
- Live web grounding via Tavily Search API (DuckDuckGo fallback)
- Full V1/V2 backward compatibility — old reports render with the V1 view; new reports with the V2 dashboard
- React SPA: tabbed report view, PDF export, analysis history dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| **Backend** | FastAPI, Python 3.11+, Uvicorn, Gunicorn |
| **Database** | PostgreSQL 15 (AWS RDS), SQLAlchemy ORM, Alembic migrations |
| **AI** | Gemini 2.5 Flash (`google-genai` SDK) |
| **Search** | Tavily Search API → DuckDuckGo (`ddgs`) fallback |
| **Auth** | JWT (python-jose), bcrypt password hashing |
| **Rate Limiting** | SlowAPI (IP) + PostgreSQL atomic upserts (user) |
| **Infrastructure** | AWS EC2 (`t3.micro`), AWS RDS, Nginx, systemd |

---

## Project Structure

```text
Pivotly/
├── backend/
│   ├── alembic/                    # Database migrations
│   │   └── versions/               # Migration scripts
│   ├── app/
│   │   ├── api/v1/endpoints/       # Route controllers
│   │   │   ├── analyze.py          # POST /analyze
│   │   │   ├── auth.py             # register, login, me
│   │   │   ├── reports.py          # report CRUD + status polling
│   │   │   └── users.py            # user stats
│   │   ├── core/                   # Config, DB session, deps, exceptions
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   ├── repositories/           # Data access layer
│   │   ├── schemas/
│   │   │   ├── report.py           # VentureReportV2, SectionError, all agent schemas
│   │   │   ├── evidence_ledger.py  # EvidenceLedger + to_prompt_block()
│   │   │   ├── analyze.py          # AnalyzeRequest, AnalyzeResponse
│   │   │   └── auth.py             # Auth request/response
│   │   ├── services/
│   │   │   ├── report_service.py   # BackgroundTasks orchestration DAG
│   │   │   ├── ai_service.py       # Gemini integration + EvidenceLedger builder
│   │   │   ├── scoring_service.py  # Deterministic scoring engine
│   │   │   ├── search_service.py   # Tavily + DDG fallback
│   │   │   ├── auth_service.py
│   │   │   └── report_validation_factory.py
│   │   ├── skills/                 # Agent prompt skill files (Markdown)
│   │   │   ├── research_skill.md
│   │   │   ├── competitor_skill.md
│   │   │   ├── moat_skill.md
│   │   │   ├── contrarian_skill.md
│   │   │   ├── action_skill.md
│   │   │   └── shared/             # Shared prompt rules
│   │   │       ├── schema_rules.md
│   │   │       ├── citation_rules.md
│   │   │       ├── evidence_rules.md
│   │   │       └── anti_hallucination.md
│   │   ├── utils/
│   │   │   ├── prompt_builder.py   # Prompt assembly (EvidenceLedger-aware)
│   │   │   ├── skill_loader.py     # Cached Markdown skill file loader
│   │   │   └── security.py
│   │   ├── main.py
│   │   └── mcp_server.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/report/
│       │   ├── ReportViewV1.tsx    # V1 legacy renderer
│       │   └── ReportViewV2.tsx    # V2 tabbed dashboard
│       ├── pages/                  # HomePage, AnalyzePage, DashboardPage, ReportPage
│       ├── services/api.ts         # Typed fetch wrapper
│       └── types/report.ts         # TypeScript interfaces for VentureReportV2
├── docs/                           # Engineering documentation (source of truth)
│   ├── README.md                   # Documentation index
│   ├── AI_PIPELINE.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── ROADMAP.md
│   ├── CHANGELOG.md
│   └── PROJECT_STATUS.md
└── README.md                       # This file
```

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15 (local instance or cloud)
- Gemini API key ([get one free](https://aistudio.google.com/app/apikey))
- Tavily API key — optional (DuckDuckGo used as fallback)

### 1. Clone

```bash
git clone https://github.com/rominkevadiya/PIVOTLY.git
cd PIVOTLY
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` — at minimum set these three:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/pivotly
GEMINI_API_KEY=your-gemini-api-key
SECRET_KEY=replace-with-a-long-random-secret
```

Full environment variable reference:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | SQLAlchemy connection string for PostgreSQL |
| `GEMINI_API_KEY` | ✅ | Gemini API key (free tier: ~20 req/day) |
| `SECRET_KEY` | ✅ | Random secret for JWT signing |
| `GEMINI_MODEL` | — | Model name (default: `gemini-2.5-flash`) |
| `TAVILY_API_KEY` | — | Tavily search key; DDG used as fallback if absent |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS origins (default: localhost:5173) |
| `ENVIRONMENT` | — | `development` or `production` (hides Swagger in prod) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | — | JWT lifetime in minutes (default: `1440`) |

### 3. Database Migration

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# .env already has: VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 5. Run Servers

**Backend** (terminal 1):
```bash
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger — dev only)
```

**Frontend** (terminal 2):
```bash
cd frontend && npm run dev
# → http://localhost:5173
```

---

## Report Status Lifecycle

After submitting an idea, the frontend polls the status endpoint until the report is ready:

```
PENDING     → Job created, background task queued
SCRAPING    → Fetching live web data (Tavily / DDG)
GENERATING  → AI agents running; scoring in progress
COMPLETED   → VentureReportV2 saved to DB
FAILED      → Pipeline error; see error_message field
```

---

## Production Deployment

Pivotly runs on a single AWS EC2 (`t3.micro`) + AWS RDS (PostgreSQL `db.t3.micro`) — no Redis, no Celery, no load balancer.

**Important limitation:** The Adaptive Gemini KeyManager is process-local. Deployments must run with a single worker (`workers=1` via Uvicorn/Gunicorn). Future scaling to multiple workers requires migrating the KeyManager state to a Redis-backed distributed store.

```bash
# On EC2
git pull origin main
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart pivotly
sudo journalctl -u pivotly -f
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full infrastructure details.

---

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/AI_PIPELINE.md`](docs/AI_PIPELINE.md) | Agent schemas, EvidenceLedger, skills system, scoring engine |
| [`docs/API.md`](docs/API.md) | All REST endpoints with request/response examples |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System overview, module breakdown, request lifecycle |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema, ERD, VentureReportV2 JSONB structure |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | AWS infrastructure, env vars, deployment workflow |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase 4 backlog, risk matrix, cost analysis |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Version history (v1.0.0 → v2.0.5 → v2.1.0) |
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | Current version, commits, known issues |

---

## Known Limitations

| Issue | Severity | Mitigation |
|-------|----------|-----------|
| Gemini free tier: ~20 req/day quota | 🔴 High | Enable GCP Pay-As-You-Go billing; or implement multi-key rotation (Phase 4) |
| Production 2 commits behind `main` | 🟡 Medium | Deploy `96c46a7` (EvidenceLedger) to EC2 |
| No test suite | 🟡 Medium | `backend/app/tests/test_scoring_service.py` exists; expand coverage |
| Error dumps in `/tmp/` not rotated | 🟢 Low | Add logrotate config for `/tmp/pivotly_errors/` |
| MCP endpoints unauthenticated | 🟡 Medium | Disable or scope `/api/v1/mcp/*` before public launch |

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| V1 Base Platform | ✅ Complete | Monolithic Gemini prompt, PostgreSQL, React report, PDF export |
| Phase 1 — V2 Data Foundation | ✅ Complete | `schema_version` column, Alembic migration, V1/V2 routing |
| Phase 2 — Multi-Agent DAG | ✅ Complete | 5-agent pipeline, SectionError, deterministic scoring |
| Phase 2.5 — Skills & EvidenceLedger | ✅ Complete | External skill files, EvidenceLedger context passing, 10× token reduction |
| Phase 3 — BackgroundTasks | ✅ Complete | Async orchestration, status polling, frontend V2 dashboard |
| Phase 4 — Optimizations | 🔲 Planned | Search cache (PostgreSQL), deferred JSONB loading, public share links, multi-key Gemini rotation |

---

## Security Notes

- Report routes are authenticated and owner-scoped
- MCP routes at `/api/v1/mcp/*` are currently unauthenticated — disable before public production use
- Use a unique, high-entropy `SECRET_KEY` in all non-local environments
- JWTs are stored in `localStorage`; keep frontend dependencies conservative to reduce XSS risk
- Never commit `.env`, virtual environments, or `node_modules`

---


## License

Copyright © 2026 by Romin Kevadiya. All rights reserved.

This repository is provided for viewing and evaluation purposes only.

You may **not** copy, modify, redistribute, sublicense, or use this software or any substantial portion of it without prior written permission from the copyright holder.

For licensing or commercial inquiries, please contact the repository owner.

Gmail: rominkevadiya@gmail.com 
