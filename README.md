# Venture Intelligence Platform

## Overview

Venture Intelligence Platform is an AI-powered startup idea analysis tool for founders, students, hackathon teams, and builders who want structured validation before investing time in a product.

Most early-stage idea validation is fragmented across search, intuition, notes, and generic AI chats. This project turns a raw startup idea into a consistent venture report that evaluates industry, target audience, competitors, market potential, failure risks, opportunity gaps, improvements, and a final recommendation.

Unlike a generic AI wrapper, the platform uses a purpose-built prompt, strict JSON output, backend validation, report persistence, and a dedicated report UI. The current version focuses on the first working vertical slice: submit an idea, generate a Gemini-powered report, store it in PostgreSQL, and view it by report URL.

## Features

### Currently Implemented (V1)

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
- MCP server endpoints for local/report tooling experiments

### Planned Future Features

- Advanced market intelligence dashboard modules
- Production-safe MCP authentication and per-user authorization
- Public report sharing workflows and team collaboration space
- Multi-language translation support for generated reports

## Current Status

This repository is a working full-stack V1, but it should be treated as an MVP codebase rather than production-hardened software.

Known items to address before public production use:

- MCP endpoints are mounted by the backend and can query reports outside the normal REST authorization flow. Disable them or add authentication and owner scoping before exposing `/api/v1/mcp/*`.
- `SECRET_KEY` must be set explicitly in every non-local environment. The backend currently has a development fallback.
- Daily analysis rate limiting is database-backed, but the check and increment are not fully atomic under concurrent requests.
- Frontend build passes, but the lint script needs an ESLint 9 flat config.
- Backend bytecode compilation passes, but there is no installed pytest-based test suite yet.
- Deployment scripts start `gunicorn`; add it to backend dependencies or change the service command before using the scripts on a clean host.

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
- JWT authentication
- SlowAPI request limiting
- MCP server package

### AI

- Gemini 2.5 Flash
- Tavily Search API, with DuckDuckGo/DDGS fallback

## Project Structure

```text
backend/
├── alembic/
│   ├── versions/
│   │   ├── 202606150001_create_reports_table.py
│   │   ├── 202606160001_create_users_add_user_id.py
│   │   └── 8dcd4fc7679f_create_rate_limits_table.py
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── analyze.py
│   │       │   ├── auth.py
│   │       │   ├── reports.py
│   │       │   └── users.py
│   │       ├── dependencies.py
│   │       └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   ├── models/
│   │   ├── rate_limit.py
│   │   ├── report.py
│   │   └── user.py
│   ├── repositories/
│   │   ├── rate_limit_repository.py
│   │   ├── report_repository.py
│   │   └── user_repository.py
│   ├── schemas/
│   │   ├── analyze.py
│   │   ├── auth.py
│   │   └── report.py
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── auth_service.py
│   │   ├── report_service.py
│   │   └── search_service.py
│   ├── utils/
│   │   ├── prompt_builder.py
│   │   └── security.py
│   ├── main.py
│   └── mcp_server.py
├── alembic.ini
├── requirements.txt
└── .env.example

frontend/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   │   ├── AnalyzePage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ReportPage.tsx
│   ├── routes/
│   │   └── AppRouter.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── dashboard.ts
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

At minimum, set `DATABASE_URL`, `GEMINI_API_KEY`, and `SECRET_KEY`.

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
TAVILY_API_KEY=optional-tavily-api-key
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ENVIRONMENT=development
LOG_LEVEL=INFO
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
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
| `TAVILY_API_KEY` | No | Backend | Optional Tavily key for search enrichment. DDGS is used as fallback when Tavily is unavailable. |
| `ALLOWED_ORIGINS` | Yes | Backend | Comma-separated CORS origins for frontend access. |
| `ENVIRONMENT` | No | Backend | Runtime environment, usually `development` or `production`. |
| `LOG_LEVEL` | No | Backend | Python logging level. |
| `SECRET_KEY` | Yes | Backend | Random secret key used for signing JWT authentication tokens. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Backend | JWT access token lifetime in minutes. Defaults to `1440`. |
| `VITE_API_BASE_URL` | Yes | Frontend | Base URL for backend API requests. |

## Verification

Current verified checks:

```bash
cd backend
source .venv/bin/activate
python -m compileall -q app
```

```bash
cd frontend
npm run build
```

Current known check gaps:

- `npm run lint` requires an ESLint 9 `eslint.config.js` file before it can run successfully.
- `python -m pytest` requires adding pytest and real test modules; the current backend dependencies do not install pytest.

## Security Notes

- REST report routes are authenticated and owner-scoped.
- MCP routes are currently mounted under `/api/v1/mcp` and should not be publicly exposed until they enforce authentication and report ownership.
- Use a unique, high-entropy `SECRET_KEY` outside local development.
- JWTs are stored by the frontend in `localStorage`; keep frontend dependencies and rendering paths conservative to reduce XSS risk.
- Keep `.env`, database files, virtual environments, logs, and `node_modules` out of version control.

## Deployment Notes

The included deployment scripts target a single-host Ubuntu/Nginx/systemd setup and build the frontend with:

```bash
VITE_API_BASE_URL=/api/v1
```

Before using the scripts on a clean server:

- Add `gunicorn` to `backend/requirements.txt` or change the systemd `ExecStart` command to use an installed ASGI server.
- Ensure `backend/.env` contains `DATABASE_URL`, `GEMINI_API_KEY`, `SECRET_KEY`, `ALLOWED_ORIGINS`, and any optional search keys.
- Run `alembic upgrade head` against the intended PostgreSQL database.
- Disable or protect `/api/v1/mcp/*` unless MCP is intentionally part of the deployment.

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
- MCP server endpoints for local/report tooling experiments (Implemented, not production-safe yet)
- Advanced competitor intelligence modules (Planned)

### Phase 5: Deployment (Partially Completed)
- AWS deployment (EC2)
- Production observability and logging (systemd/journald)
- Managed PostgreSQL (AWS RDS)
- Harden deployment dependencies and MCP exposure before public production use

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
python -m compileall -q app
```

```bash
cd frontend
npm run build
```

When lint and tests are configured, pull requests should also run:

```bash
cd frontend
npm run lint
```

```bash
cd backend
source .venv/bin/activate
python -m pytest
```

## License

MIT License.
