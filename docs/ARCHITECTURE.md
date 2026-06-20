# Architecture Overview: Venture Intelligence Platform

## System Overview

The Venture Intelligence Platform is built on a modern, decoupled client-server architecture. The system comprises a React-based Single Page Application (SPA) frontend and a Python FastAPI backend. The frontend handles user interactions, session state via Context API, and visualizes complex data payloads. The backend serves as a RESTful API, managing authentication, database persistence via PostgreSQL (using SQLAlchemy ORM), business logic orchestration, and integrations with external AI models (Gemini) and search tools (DuckDuckGo).

## High Level Architecture Diagram

```text
+---------------------+        +-----------------------+
|    Client Browser   |        |     External APIs     |
|  (React/TypeScript) |        |                       |
|                     |        |  +-----------------+  |
|  +---------------+  |        |  | Gemini (gemini-2.5-flash  |  |
|  | AuthContext   |  |        |  +-----------------+  |
|  +---------------+  |        |                       |
|  +---------------+  |        |  +-----------------+  |
|  | Pages / UI    |  |<------>|  | DuckDuckGo Web  |  |
|  +---------------+  |        |  +-----------------+  |
|  +---------------+  |        +-----------------------+
|  | API Client    |  |                   ^
|  +---------------+  |                   |
+----------^----------+                   |
           | HTTP / REST (JWT Auth)       |
+----------v----------+                   |
|   FastAPI Backend   |                   |
|                     |                   |
|  +---------------+  |                   |
|  |  API Routers  |  |                   |
|  +---------------+  |                   |
|  +---------------+  |                   |
|  |   Services    |<---------------------+
|  | (AI, Auth,    |  |
|  |  Report, etc) |  |
|  +---------------+  |
|  +---------------+  |
|  | Repositories  |  |
|  +---------------+  |
+----------^----------+
           | SQLAlchemy / psycopg
+----------v----------+
|  PostgreSQL DB      |
|  +---------------+  |
|  | users         |  |
|  | reports       |  |
|  | rate_limits   |  |
|  +---------------+  |
+---------------------+
```

## Directory Structure

```text
Pivotly/
├── frontend/                   # React Single Page Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React Context (Auth)
│   │   ├── pages/              # Route views
│   │   ├── routes/             # App routing configuration
│   │   ├── services/           # HTTP API client
│   │   └── types/              # TypeScript interfaces
│   └── package.json            # Frontend dependencies
└── backend/                    # FastAPI Server
    ├── alembic/                # Database migrations
    ├── app/
    │   ├── api/v1/endpoints/   # API route controllers
    │   ├── core/               # Configuration & dependencies
    │   ├── models/             # SQLAlchemy ORM models
    │   ├── repositories/       # Database access layer
    │   ├── schemas/            # Pydantic validation schemas
    │   ├── services/           # Core business logic
    │   ├── utils/              # Helper functions
    │   └── mcp_server.py       # Model Context Protocol integration
    ├── requirements.txt        # Python dependencies
    └── .env.example            # Environment variable template
```

## Frontend Architecture

The frontend is a strictly typed React application scaffolded with Vite and styled using Tailwind CSS.

*   **Pages:** The application is divided into top-level views: `HomePage`, `LoginPage`, `RegisterPage`, `DashboardPage`, `AnalyzePage`, and `ReportPage`.
*   **Components:** Logic and styling are encapsulated in reusable components like `AppLayout`, `Button`, `ErrorMessage`, `LoadingState`, `TextAreaField`, `SelectField`, `ReportSectionCard`, and `ProtectedRoute`.
*   **State Management:** 
    *   **Global State:** Handled by `AuthContext.tsx`, which manages the user session (`user`, `isAuthenticated`), orchestrates login/logout API calls, and syncs the JWT with `localStorage`.
    *   **Local State:** Page-specific data (e.g., form inputs, fetched report data, pagination) is managed locally using React hooks (`useState`, `useEffect`).
*   **API Communication:** Encapsulated within `services/api.ts`. A custom `request` wrapper automatically injects the JWT authorization header from `localStorage` into all `fetch` calls.

## Backend Architecture

The backend is built with FastAPI, strictly adhering to an n-tier architecture pattern.

*   **Route Handlers:** Located in `app/api/v1/endpoints/`. They handle HTTP request/response lifecycles, dependency injection (`get_db`, `get_current_user`), and HTTP-level error mapping. Modules include `auth.py`, `analyze.py`, `reports.py`, and `users.py`.
*   **Two-Tier Rate Limiting:**
    *   **Tier 1 (IP-based, `slowapi`):** Configured at application startup in `main.py`, limits all incoming requests to **60 requests per minute per IP address**.
    *   **Tier 2 (User-based, DB):** Implemented in `RateLimitRepository`, limits each authenticated user to **5 idea analyses per calendar day**, enforced via PostgreSQL atomic upserts.
*   **OpenAPI Docs:** Swagger UI (`/docs`) and ReDoc (`/redoc`) are available **only in `development` environment** (disabled in production via `docs_url=None`).
*   **Services:** The orchestration layer containing business logic (`app/services/`). 
    *   `AuthService`: Handles password hashing, verification, and JWT creation.
    *   `ReportService`: Orchestrates the rate limit checks, web search, AI generation, and database persistence.
    *   `AIService`: Wraps the Gemini API integration.
    *   `SearchService`: Wraps the DuckDuckGo search integration.
*   **Repositories:** The data access layer (`app/repositories/`). Classes like `ReportRepository`, `UserRepository`, and `RateLimitRepository` abstract SQLAlchemy database queries away from the services.
*   **Schemas:** Pydantic models (`app/schemas/`) used for strict request payload validation and response formatting.

## Database Architecture

For complete details on the PostgreSQL schema, `JSONB` columns, tables (`users`, `reports`, `rate_limits`), and relationships, see [Database Design](DATABASE.md).

## AI Analysis Architecture

For complete details on context gathering (`ddgs`), prompt construction, Gemini integration, and the rigorous JSON extraction process, see the [AI Pipeline documentation](AI_PIPELINE.md).

## Deployment Architecture

The platform is deployed in a production-ready AWS environment using a decoupled, multi-node architecture:

*   **Application Server (AWS EC2)**:
    *   **Reverse Proxy**: Nginx handles incoming HTTP traffic and serves the compiled React/Vite static assets directly from the filesystem. It also acts as a reverse proxy forwarding `/api` requests to the backend.
    *   **WSGI/ASGI Server**: Gunicorn orchestrates Uvicorn workers to serve the FastAPI application, utilizing multiple workers to handle concurrent connections.
    *   **Process Management**: `systemd` manages the Gunicorn daemon (`pivotly.service`), ensuring the backend runs in the background, writes logs to `journald`, and automatically restarts on failure.
*   **Database Server (AWS RDS)**: 
    *   Managed PostgreSQL database hosted on AWS Relational Database Service (RDS).
    *   Provides automated backups, scaling, and high availability. The database is securely accessed via the backend in a VPC using SSL encryption (`sslmode=require`).

## Request Lifecycle (Example: Analyze Idea)

1.  **Client:** POSTs to `/api/v1/analyze` with `{"idea_text": "...", "region": "...", "budget_range": "..."}` and a Bearer JWT.
2.  **Router (`analyze.py`):** Intercepts the request. FastAPI validates the payload against `AnalyzeRequest` and the JWT against `get_current_user`.
3.  **Service Orchestration (`ReportService`):**
    *   Checks `RateLimitRepository` to ensure the user hasn't exceeded 5 requests today.
    *   Calls `search_competitors()` to asynchronously scrape DuckDuckGo for context.
    *   Calls `AIService.generate_report()`.
4.  **AI Layer:** Constructs the prompt, calls Gemini, parses the JSON string, and returns a validated Pydantic `VentureReport` object.
5.  **Persistence:** `ReportService` serializes the Pydantic object and calls `ReportRepository.create()` to save it to Postgres (saving the payload in the `JSONB` column).
6.  **Rate Limit Update:** Calls `RateLimitRepository.increment()` to update the daily usage count via atomic upsert.
7.  **Response:** The router returns the new `report_id` to the frontend, which then navigates to the detailed report view.

## Module Breakdown

### Backend Modules
*   **`api`**: Defines all REST endpoints, routing logic, and HTTP schema documentation.
*   **`core`**: Contains environment configurations (`settings`), database session factories, dependency injection (`get_current_user`), and global exception handlers.
*   **`models`**: SQLAlchemy table definitions defining the relational database schema.
*   **`repositories`**: Data access objects abstracting SQL queries and transactions.
*   **`schemas`**: Pydantic models for request/response serialization and validation.
*   **`services`**: Pure business logic orchestrators.
*   **`utils`**: Helpers for JSON parsing, JWT token management, and prompt construction.
*   **`mcp_server.py`**: Model Context Protocol implementation allowing external LLMs to interact with Pivotly's data.

### Frontend Modules
*   **`components`**: Reusable view functions (buttons, inputs, layout wrappers, cards).
*   **`context`**: React Context providers (authentication state management).
*   **`pages`**: Top-level route components assembling various UI pieces.
*   **`routes`**: React Router DOM configurations mapping URLs to pages.
*   **`services`**: Network request wrappers managing `fetch` calls and API interactions.

## Current Limitations & Future Improvements

1.  **Long-Lived HTTP Requests:** The `analyze_idea` workflow executes the web scrape and the Gemini API call within a single HTTP request lifecycle. While we successfully offload these network calls to async threads (preventing FastAPI event loop starvation), the client still must hold an open connection for 20-30 seconds. A future improvement should implement WebSockets or a polling architecture (e.g., Celery/Redis).
2.  **Database-Backed Rate Limiting:** Rate limiting relies entirely on database queries. Under high load, this puts transaction pressure on PostgreSQL compared to a fast, in-memory store like Redis.
3.  **Gemini Free-Tier Quota:** The system uses a free-tier API key limited to 20 requests per day. Adding backend rotation across multiple API keys will allow the system to scale without hitting 429 quota exhaustion.
