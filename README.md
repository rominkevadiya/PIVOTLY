# Venture Intelligence Platform

## Overview

Venture Intelligence Platform is an AI-powered startup idea analysis tool for founders, students, hackathon teams, and builders who want structured validation before investing time in a product.

Most early-stage idea validation is fragmented across search, intuition, notes, and generic AI chats. This project turns a raw startup idea into a consistent venture report that evaluates industry, target audience, competitors, market potential, failure risks, opportunity gaps, improvements, and a final recommendation.

Unlike a generic AI wrapper, the platform uses a purpose-built prompt, strict JSON output, backend validation, report persistence, and a dedicated report UI. The current version focuses on the first working vertical slice: submit an idea, generate a Gemini-powered report, store it in PostgreSQL, and view it by report URL.

## Features

### Currently Implemented

- Startup idea submission form with validation and character counter
- Gemini 2.5 Flash venture analysis pipeline
- Strict JSON report generation and Pydantic response validation
- PostgreSQL persistence with SQLAlchemy and JSONB
- Alembic migration for the `reports` table
- Report retrieval by UUID
- Clean React report viewing page with section cards
- Recommendation badge for `Build`, `Pivot`, `Research Further`, and `Avoid`
- Environment-based backend and frontend configuration
- Global backend exception handling

### Planned Future Features

- Authentication and user accounts
- Analysis history and dashboard
- Rate limiting for AI usage control
- Competitor intelligence with external data sources
- Market intelligence modules
- MCP integrations
- AWS deployment
- PDF export and sharing workflows

## Architecture Overview

### Frontend Architecture

The frontend is a React, Vite, TypeScript, and Tailwind CSS single-page application. It contains only the pages needed for the current vertical slice:

- Home page introduces the product and links to analysis.
- Analyze page accepts a startup idea and calls the backend.
- Report page fetches and renders a persisted structured report.

API calls live in `frontend/src/services/api.ts`, TypeScript contracts live in `frontend/src/types/report.ts`, and reusable UI components live in `frontend/src/components`.

### Backend Architecture

The backend is a FastAPI application organized around clean boundaries:

- API routes validate HTTP input and shape HTTP output.
- Services orchestrate business logic and AI report generation.
- Repositories isolate database access.
- Models define SQLAlchemy persistence objects.
- Schemas define Pydantic validation contracts.
- Core modules handle configuration, logging, database sessions, and exception handling.

The backend exposes only two product endpoints in the current phase:

- `POST /api/v1/analyze`
- `GET /api/v1/reports/{id}`

### Database Architecture

PostgreSQL stores generated reports in one table: `reports`.

The full structured report is stored as JSONB so the report format can evolve over time. Frequently useful summary fields are promoted into scalar columns:

- `industry`
- `market_potential`
- `recommendation`

This keeps the current schema simple while supporting future filtering, history, and dashboards.

### AI Analysis Pipeline

The AI pipeline is intentionally a single-call Gemini flow:

1. FastAPI validates the submitted idea.
2. `prompt_builder.py` creates a strict venture analysis prompt.
3. `AIService` calls Gemini 2.5 Flash with JSON response instructions.
4. The raw response is parsed as JSON.
5. Pydantic validates the report structure.
6. The report is persisted in PostgreSQL.
7. The API returns the created report ID.

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
| `VITE_API_BASE_URL` | Yes | Frontend | Base URL for backend API requests. |

`SECRET_KEY` is intentionally not required in the current implementation because authentication is not implemented yet. It will become required when user accounts and JWT sessions are added.

## API Documentation

### POST `/api/v1/analyze`

Generates a venture analysis report for a startup idea and stores it in PostgreSQL.

Request body:

```json
{
  "idea_text": "An AI assistant that helps first-time founders validate startup ideas before building."
}
```

Success response `201 Created`:

```json
{
  "report_id": "4d6a1d2b-7257-4356-9065-3bb9d50ce832",
  "status": "success"
}
```

Error responses:

| Status | Meaning |
|---:|---|
| `422` | Request validation failed. `idea_text` must be 10 to 1000 characters. |
| `502` | Gemini failed or returned malformed report JSON. |
| `500` | Unexpected server error. |

### GET `/api/v1/reports/{id}`

Retrieves a persisted report by UUID.

Success response `200 OK`:

```json
{
  "id": "4d6a1d2b-7257-4356-9065-3bb9d50ce832",
  "idea_text": "An AI assistant that helps first-time founders validate startup ideas before building.",
  "industry": "Startup Software",
  "market_potential": "Medium",
  "recommendation": "Research Further",
  "created_at": "2026-06-15T10:00:00Z",
  "report_json": {
    "overview": {
      "idea_summary": "string",
      "one_line_pitch": "string"
    },
    "industry": {
      "primary_industry": "string",
      "sub_industry": "string",
      "industry_context": "string"
    },
    "target_audience": {
      "primary_segment": "string",
      "secondary_segment": "string",
      "audience_insight": "string"
    },
    "competitors": [],
    "market_potential": {
      "rating": "Medium",
      "rationale": "string",
      "estimated_market_context": "string"
    },
    "failure_risks": [],
    "opportunity_gaps": [],
    "improvement_suggestions": [],
    "recommendation": {
      "decision": "Research Further",
      "rationale": "string",
      "confidence": "Medium"
    }
  }
}
```

Error responses:

| Status | Meaning |
|---:|---|
| `404` | Report not found. |
| `422` | Invalid UUID path parameter. |
| `500` | Unexpected server error. |

## Database Design

### `reports`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary key | Public report identifier. |
| `idea_text` | TEXT | Not null | Raw startup idea submitted by the user. |
| `report_json` | JSONB | Not null | Full validated venture report. |
| `industry` | VARCHAR(255) | Not null | Promoted industry field for future filtering. |
| `market_potential` | VARCHAR(50) | Not null | Promoted rating field. |
| `recommendation` | VARCHAR(50) | Not null | Promoted final decision. |
| `created_at` | TIMESTAMP WITH TIME ZONE | Not null | Report creation timestamp. |

There are no relationships in the current version because users, authentication, dashboards, and analysis history are intentionally out of scope.

## AI Pipeline

### Prompt Builder

`backend/app/utils/prompt_builder.py` constructs a venture-specific prompt based on the architecture blueprint. It instructs Gemini to act as a critical startup analyst and return only strict JSON.

### Gemini Call

`backend/app/services/ai_service.py` calls Gemini 2.5 Flash using the configured model and API key. The call requests `application/json` output with a low temperature for stable structure.

### Response Validation

The raw Gemini response is parsed by `json_parser.py` and validated against the `VentureReport` Pydantic schema. Invalid JSON, missing fields, incorrect enum values, or malformed sections are rejected before database persistence.

### Report Generation

After validation, `ReportService` extracts promoted fields from the structured report and stores both the full JSONB payload and summary fields in PostgreSQL.

## Future Roadmap

### Phase 2

- Authentication
- User accounts
- Report ownership

### Phase 3

- Dashboard
- Analysis history
- Rate limiting

### Phase 4

- MCP integrations
- Competitor intelligence
- Market intelligence

### Phase 5

- AWS deployment
- Production observability
- Managed PostgreSQL

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
