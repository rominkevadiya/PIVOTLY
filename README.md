# Venture Intelligence Platform

## Overview

Venture Intelligence Platform is an AI-powered startup idea analysis tool for founders, students, hackathon teams, and builders who want structured validation before investing time in a product.

Most early-stage idea validation is fragmented across search, intuition, notes, and generic AI chats. This project turns a raw startup idea into a consistent venture report that evaluates industry, target audience, competitors, market potential, failure risks, opportunity gaps, improvements, and a final recommendation.

Unlike a generic AI wrapper, the platform uses a purpose-built prompt, strict JSON output, backend validation, report persistence, and a dedicated report UI. The current version focuses on the first working vertical slice: submit an idea, generate a Gemini-powered report, store it in PostgreSQL, and view it by report URL.

## Features

### Currently Implemented (V1 Complete)

- User registration, login, and bearer JWT-based authentication
- Analysis history dashboard displaying previous startup reports with pagination
- Daily submission rate limits (5 ideas per user per day) and user usage statistics endpoint
- Startup idea submission form with validation, character counter, and optional region/budget context
- Gemini 2.5 Flash venture analysis pipeline
- Strict JSON report generation and Pydantic response validation
- PostgreSQL persistence with SQLAlchemy and JSONB
- Alembic database migration structure
- Report retrieval by UUID (scoped to owner)
- Clean React report viewing page with SVG Radar chart and highly professional, minimalist A4-optimised PDF export
- Deeply enriched report generation (SWOT, Go-To-Market, Unit Economics, Prioritised Action Plan)
- Recommendation badge for `Build`, `Pivot`, `Research Further`, and `Avoid`
- Environment-based backend and frontend configuration
- Global backend exception handling

### Planned Future Features

- Advanced market intelligence dashboard modules
- Model Context Protocol (MCP) server integrations
- Public report sharing workflows and team collaboration space
- Multi-language translation support for generated reports

## Documentation

For deep technical details, please refer to the dedicated documentation files:
- [Architecture Overview](docs/ARCHITECTURE.md)
- [System Design Case Study](docs/SYSTEM_DESIGN_CASE_STUDY.md)
- [AI Pipeline](docs/AI_PIPELINE.md)
- [Database Design](docs/DATABASE.md)
- [API Reference](docs/API.md)

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend

- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- Pydantic

### AI

- Gemini 2.5 Flash

## Project Structure

```text
backend/
├── alembic/
│   ├── versions/
│   │   └── 202606150001_create_reports_table.py
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── analyze.py
│   │       │   └── reports.py
│   │       └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   ├── models/
│   │   └── report.py
│   ├── repositories/
│   │   └── report_repository.py
│   ├── schemas/
│   │   ├── analyze.py
│   │   └── report.py
│   ├── services/
│   │   ├── ai_service.py
│   │   └── report_service.py
│   ├── utils/
│   │   ├── json_parser.py
│   │   └── prompt_builder.py
│   └── main.py
├── tests/
├── alembic.ini
├── requirements.txt
└── .env.example

frontend/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   │   ├── AnalyzePage.tsx
│   │   ├── HomePage.tsx
│   │   └── ReportPage.tsx
│   ├── routes/
│   │   └── AppRouter.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── report.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Pivotly
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` with your local PostgreSQL database URL and Gemini API key.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

### 4. Environment Variables

Backend variables are defined in `backend/.env`:

```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/venture_intelligence
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_SECONDS=30
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ENVIRONMENT=development
LOG_LEVEL=INFO
```

Frontend variables are defined in `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 5. Database Migration

Create a PostgreSQL database named `venture_intelligence`, then run:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

### 6. Run Development Servers

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
```

Open the frontend at:

```text
http://localhost:5173
```

## Environment Variables

| Variable | Required | Used By | Description |
|---|---:|---|---|
| `DATABASE_URL` | Yes | Backend | SQLAlchemy connection string for PostgreSQL. |
| `GEMINI_API_KEY` | Yes | Backend | API key used to call Gemini. |
| `GEMINI_MODEL` | Yes | Backend | Gemini model name. Defaults to `gemini-2.5-flash`. |
| `GEMINI_TIMEOUT_SECONDS` | No | Backend | Reserved timeout configuration for Gemini calls. |
| `ALLOWED_ORIGINS` | Yes | Backend | Comma-separated CORS origins for frontend access. |
| `ENVIRONMENT` | No | Backend | Runtime environment, usually `development` or `production`. |
| `LOG_LEVEL` | No | Backend | Python logging level. |
| `SECRET_KEY` | Yes | Backend | Random secret key used for signing JWT authentication tokens. |
| `VITE_API_BASE_URL` | Yes | Frontend | Base URL for backend API requests. |


## Future Roadmap

### Phase 2: User Authentication (Completed)
- User registration and login
- JWT authentication and security
- Multi-user isolation

### Phase 3: Dashboard & Limits (Completed)
- Analysis history view and pagination
- Usage statistics
- Database-backed rate limiting

### Phase 4: Data Augmentation & Integrations (Partially Completed)
- Tavily Search API with DuckDuckGo fallback for competitor research (Completed)
- Idea scoring rubric and dynamic SVG charts (Completed)
- Professional A4 PDF export (Completed)
- MCP integrations & advanced competitor intelligence modules (Planned)

### Phase 5: Deployment (Completed)
- AWS deployment (EC2)
- Production observability and logging (systemd/journald)
- Managed PostgreSQL (AWS RDS)

## Screenshots

### Home Page

Screenshots will be added after the first visual QA pass.

### Analyze Page

Screenshots will be added after the first visual QA pass.

### Report Page

Screenshots will be added after the first visual QA pass.

## Contribution Guidelines

1. Fork the repository.
2. Create a feature branch.
3. Keep changes focused and aligned with the current product phase.
4. Run backend and frontend checks before opening a pull request.
5. Document meaningful architecture or API changes in this README.

Recommended checks:

```bash
cd backend
source .venv/bin/activate
python -m compileall app
```

```bash
cd frontend
npm run build
```

## License

MIT License.
