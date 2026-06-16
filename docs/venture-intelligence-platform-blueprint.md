# Venture Intelligence Platform
## Complete Software Architecture & Product Blueprint — Version 1

---

# Section 1: Product Definition

## Core Problem Being Solved

Most first-time founders and student entrepreneurs make a critical mistake: they fall in love with their idea before validating it. They spend months building a product only to discover the market is too small, the competition is already dominant, or the target audience doesn't actually have the problem they assumed.

Traditional approaches to idea validation are fragmented. A founder might Google competitors manually, read a few Reddit threads, look at some Crunchbase data, and talk to two friends — then make a gut-level decision. This process is inconsistent, time-consuming, and heavily biased by confirmation bias.

The Venture Intelligence Platform solves this by giving any founder or student a **structured, AI-augmented analysis of their startup idea in minutes**, not weeks. It functions as a decision-support tool, not a hype machine. It produces a report that forces the user to confront both the opportunity and the risk, then gives a clear, reasoned recommendation.

---

## Target Users

**Primary Users:**
- Undergraduate and graduate students in entrepreneurship, business, and engineering programs
- First-time founders evaluating ideas before committing resources
- Hackathon participants who need rapid idea validation
- Bootcamp graduates looking to build a product portfolio

**Secondary Users:**
- Solo developers with a side project idea
- Non-technical founders before hiring a development team
- Incubator and accelerator applicants preparing their pitch

---

## User Pain Points

| Pain Point | Description |
|---|---|
| Cognitive bias | Founders evaluate their own ideas with bias, missing obvious flaws |
| Fragmented research | Competitor and market research requires 5–10 different tools |
| Time cost | Manual idea validation takes days or weeks |
| No structured framework | There is no standard checklist for evaluating a startup idea |
| Fear of the unknown | Founders don't know what they don't know about their industry |
| Vague output | Tools like ChatGPT give prose summaries, not structured decisions |

---

## Why the Product Is Useful

- Provides a **consistent, structured evaluation framework** every time
- Surfaces **competitive landscape** the user may not have considered
- Identifies **market risks** before money and time are spent
- Gives a **clear recommendation** (Build / Pivot / Research Further / Avoid) instead of vague paragraphs
- Creates a **shareable report** founders can use in team discussions or investor conversations
- Acts as a **forcing function** to think critically about the idea

---

## Competitive Advantages

| Advantage | Explanation |
|---|---|
| Structured output | Unlike ChatGPT, the output follows a standardized, actionable report format |
| Purpose-built | Designed specifically for startup idea evaluation, not general Q&A |
| History and comparison | Users can revisit past analyses and track how ideas evolved |
| Decision clarity | Produces a final recommendation with supporting rationale |
| Accessible | No startup experience required to interpret the output |

---

# Section 2: Version 1 Scope

## Features Included in V1

**Authentication**
- User registration with email and password
- User login and logout
- JWT-based session management
- Password hashing with bcrypt

**Idea Submission**
- A single text input where the user describes their startup idea (up to 1,000 characters)
- Optional fields: target country/region, budget range
- Submission triggers the analysis pipeline

**AI Analysis Pipeline**
- Industry classification
- Target audience identification
- Competitor analysis (AI-reasoned, no live web scraping in V1)
- Market potential assessment (High / Medium / Low)
- Failure risk analysis with risk categories and severity levels
- Opportunity gap discovery
- Improvement suggestions
- Final recommendation with rationale

**Results Dashboard**
- Displays the completed analysis report in a clean, readable layout
- Sections are collapsible for readability
- Report includes a visual recommendation badge (Build / Pivot / Research Further / Avoid)

**Analysis History**
- Logged-in users can view all past analyses
- Each entry shows: idea summary, date, final recommendation
- Clicking an entry opens the full report

**Basic Rate Limiting**
- Limit free users to 5 analyses per 24 hours
- Prevents Gemini API cost abuse

---

## Features Excluded from V1

- Social sharing of reports
- PDF export of reports
- Comparison of two ideas side by side
- Real-time web scraping for live competitor data
- User subscription / payment system
- Team collaboration features
- Email verification flow
- Admin dashboard
- Public idea gallery or community features
- Multi-language support
- Mobile app

---

## MVP Boundaries

V1 is complete when:
1. A user can register, log in, and log out
2. A user can submit a startup idea and receive a structured analysis report
3. The report covers all 9 sections (Overview through Recommendation)
4. A user can view their analysis history
5. The system enforces rate limits
6. The application runs reliably in a local development environment

---

## Future Expansion Possibilities (Post-V1)

- **V2:** Live competitor scraping using web search APIs (e.g., SerpAPI)
- **V2:** PDF report export
- **V2:** Idea scoring rubric with numerical scores per category
- **V3:** Side-by-side idea comparison
- **V3:** Saved competitor watchlists
- **V4:** Investor match suggestions based on idea category
- **V4:** Community upvotes on promising ideas
- **V5:** Integration with Crunchbase or PitchBook APIs for real market data

---

# Section 3: User Flow

## Complete User Journey

### Flow 1: New User Registration

```
Landing Page
└── User clicks "Get Started" or "Sign Up"
    └── Registration Page
        ├── Fields: Full Name, Email, Password, Confirm Password
        ├── Client-side validation (email format, password strength)
        └── POST /auth/register
            ├── [Success] → Redirect to Dashboard (empty state)
            └── [Error] → Display inline error (e.g., "Email already registered")
```

### Flow 2: Returning User Login

```
Landing Page
└── User clicks "Login"
    └── Login Page
        ├── Fields: Email, Password
        └── POST /auth/login
            ├── [Success] → Receive JWT → Store in memory / httpOnly cookie
            │              → Redirect to Dashboard
            └── [Error] → Display "Invalid credentials"
```

### Flow 3: Submitting a Startup Idea (Core Flow)

```
Dashboard
└── User clicks "Analyze New Idea"
    └── Idea Submission Page
        ├── Textarea: "Describe your startup idea..." (max 1,000 chars)
        ├── Optional: Target Region dropdown
        ├── Optional: Budget Range dropdown
        ├── Character counter displayed live
        └── User clicks "Analyze Idea"
            └── POST /ideas
                ├── Frontend shows loading state:
                │   ├── Spinner with status messages:
                │   │   "Identifying your industry..."
                │   │   "Researching the market..."
                │   │   "Evaluating risks..."
                │   │   "Generating your report..."
                │   └── Estimated wait: 10–20 seconds
                └── [Success] → Redirect to /reports/{report_id}
                    └── Report Page displays full structured analysis
                [Error: rate limit] → Toast: "You've reached your daily limit (5 analyses)"
                [Error: server] → Toast: "Something went wrong. Please try again."
```

### Flow 4: Viewing a Report

```
Report Page (/reports/{id})
├── Header: Idea Title (truncated) + Date + Recommendation Badge
├── Section: Idea Overview
├── Section: Industry
├── Section: Target Audience
├── Section: Competitors
├── Section: Market Potential
├── Section: Failure Risks
├── Section: Opportunity Gaps
├── Section: Improvement Suggestions
└── Section: Final Recommendation + Rationale
    └── Buttons:
        ├── "Analyze Another Idea" → Idea Submission Page
        └── "Back to Dashboard" → Dashboard
```

### Flow 5: Viewing Analysis History

```
Dashboard
└── "My Analyses" section
    └── List of past analyses (most recent first)
        ├── Each card shows:
        │   ├── Idea snippet (first 80 chars)
        │   ├── Date submitted
        │   ├── Industry tag
        │   └── Recommendation badge (color-coded)
        └── Click card → /reports/{id} (full report)
```

### Flow 6: Logout

```
Any Page (Navbar)
└── User clicks "Logout"
    └── POST /auth/logout (or client clears JWT)
        └── Redirect to Landing Page
```

---

# Section 4: System Architecture

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                           │
│                                                                 │
│   Browser → React SPA (Vite + React Router + Tailwind CSS)     │
│   Pages: Landing, Auth, Dashboard, Idea Submission, Report      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / REST (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
│                                                                 │
│   FastAPI Application (Python 3.11+)                            │
│   ├── Auth Router       /auth/*                                 │
│   ├── Ideas Router      /ideas/*                                │
│   ├── Reports Router    /reports/*                              │
│   └── Users Router      /users/*                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────┐    ┌────────────────────────────────────┐
│   DATABASE LAYER    │    │          AI LAYER                  │
│                     │    │                                    │
│   PostgreSQL        │    │   Analysis Orchestrator            │
│   ├── users         │    │   ├── Prompt Builder               │
│   ├── ideas         │    │   ├── Gemini 2.5 Flash API Client  │
│   └── reports       │    │   └── Response Parser              │
└─────────────────────┘    └────────────────────────────────────┘
```

## Layer Responsibilities

### Frontend (React SPA)
- Renders all UI: pages, forms, report display, history list
- Manages authentication state (stores JWT, handles token expiry)
- Sends API requests to FastAPI backend
- Handles loading states and error messages
- No business logic; it is purely a UI layer

### Backend (FastAPI)
- Enforces authentication on all protected routes
- Validates all incoming request data (using Pydantic models)
- Orchestrates the AI analysis pipeline
- Writes and reads all data from PostgreSQL
- Enforces rate limiting
- Is the sole caller of the Gemini API

### Database (PostgreSQL)
- Persists users, ideas, and generated reports
- Source of truth for all user data and analysis history
- Stores both the raw idea input and the structured report JSON

### AI Layer (Gemini 2.5 Flash)
- Receives a carefully constructed, structured prompt
- Performs all reasoning: classification, competitor identification, risk assessment, opportunity analysis
- Returns a structured JSON response
- Is called **once per idea submission** to minimize API costs

---

# Section 5: Backend Architecture

## Module Structure

```
backend/
├── main.py                    # FastAPI app entry point
├── config.py                  # Environment variables and settings
├── database.py                # SQLAlchemy engine and session setup
├── dependencies.py            # Shared dependency injection (get_db, get_current_user)
│
├── models/                    # SQLAlchemy ORM models
│   ├── user.py
│   ├── idea.py
│   └── report.py
│
├── schemas/                   # Pydantic request/response schemas
│   ├── auth.py
│   ├── idea.py
│   └── report.py
│
├── routers/                   # FastAPI route handlers
│   ├── auth.py
│   ├── ideas.py
│   ├── reports.py
│   └── users.py
│
├── services/                  # Business logic layer
│   ├── auth_service.py
│   ├── idea_service.py
│   ├── report_service.py
│   └── ai_service.py
│
└── utils/
    ├── security.py            # JWT creation/verification, password hashing
    ├── rate_limiter.py        # Rate limiting logic
    └── prompt_builder.py      # Gemini prompt construction
```

---

## Module Descriptions

### Authentication Module (`routers/auth.py` + `services/auth_service.py`)

**Responsibilities:**
- Handle user registration: validate input, hash password, create user record
- Handle user login: verify credentials, issue JWT access token
- Handle logout: instruct client to discard token (stateless)
- Provide a token verification dependency used by all protected routes

**Key functions:**
- `register_user(email, password, full_name)` — checks for duplicate email, hashes password, saves user
- `login_user(email, password)` — fetches user, verifies password hash, returns JWT
- `get_current_user(token)` — dependency function injected into all protected routes; decodes JWT and returns the user object

---

### Idea Module (`routers/ideas.py` + `services/idea_service.py`)

**Responsibilities:**
- Accept a startup idea submission from an authenticated user
- Enforce rate limiting before processing
- Persist the idea to the database
- Trigger the AI analysis pipeline
- Return the resulting report ID to the client

**Key functions:**
- `submit_idea(user_id, idea_text, region, budget)` — validates input, checks rate limit, saves idea, calls AI service, saves report, returns report_id
- `get_user_idea_history(user_id)` — returns paginated list of past ideas with report summaries

---

### Report Module (`routers/reports.py` + `services/report_service.py`)

**Responsibilities:**
- Retrieve a specific report by ID (only if owned by the requesting user)
- Format and return the full structured report JSON
- Return a list of report summaries for the dashboard history view

**Key functions:**
- `get_report_by_id(report_id, user_id)` — fetches full report JSON, enforces ownership check
- `get_report_summaries(user_id)` — returns lightweight list for the history UI

---

### AI Module (`services/ai_service.py` + `utils/prompt_builder.py`)

**Responsibilities:**
- This is the most important module
- Accepts a structured input (idea text, region, budget)
- Calls `prompt_builder.py` to construct the full Gemini prompt
- Makes one API call to Gemini 2.5 Flash
- Parses the response and validates it matches the expected schema
- Returns a fully structured report dictionary to the caller

**Key functions:**
- `build_analysis_prompt(idea_text, region, budget)` — constructs the prompt (detailed in Section 8)
- `call_gemini(prompt)` — makes the HTTP request to Gemini API
- `parse_gemini_response(raw_response)` — extracts and validates the JSON report structure
- `run_analysis(idea_text, region, budget)` — orchestrates the above three steps

---

### Users Module (`routers/users.py`)

**Responsibilities:**
- Return the current user's profile information
- (Future: update profile, change password)

---

# Section 6: Database Design

## Entity-Relationship Overview

```
users ──< ideas ──< reports
```

One user has many ideas. One idea has one report.

---

## Table: `users`

**Purpose:** Stores registered user accounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| full_name | VARCHAR(255) | NOT NULL | Display name |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt hash of password |
| is_active | BOOLEAN | NOT NULL, default TRUE | Account status flag |
| created_at | TIMESTAMP | NOT NULL, default NOW() | Account creation time |
| updated_at | TIMESTAMP | NOT NULL, default NOW() | Last update time |

**Why UUID for PK:** Avoids predictable sequential IDs in API URLs, better for security.

---

## Table: `ideas`

**Purpose:** Stores each startup idea submitted by a user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Unique idea identifier |
| user_id | UUID | FK → users.id, NOT NULL | Owner of the idea |
| idea_text | TEXT | NOT NULL | Raw idea submission text |
| region | VARCHAR(100) | NULLABLE | Optional target region |
| budget_range | VARCHAR(50) | NULLABLE | Optional budget range |
| status | VARCHAR(20) | NOT NULL, default 'pending' | pending / processing / completed / failed |
| created_at | TIMESTAMP | NOT NULL, default NOW() | Submission time |

**Status field values:**
- `pending` — idea saved, analysis not yet started
- `processing` — Gemini API call in progress
- `completed` — report successfully generated
- `failed` — analysis pipeline encountered an error

**Why separate from reports:** The idea and its report are conceptually distinct. An idea can exist without a report (e.g., if analysis fails). This also allows retrying failed analyses in the future.

---

## Table: `reports`

**Purpose:** Stores the full structured analysis report for each idea.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Unique report identifier |
| idea_id | UUID | FK → ideas.id, UNIQUE, NOT NULL | The idea this report belongs to |
| user_id | UUID | FK → users.id, NOT NULL | Redundant FK for fast user-based queries |
| industry | VARCHAR(255) | NOT NULL | Identified industry |
| target_audience | TEXT | NOT NULL | Identified target audience description |
| market_potential | VARCHAR(20) | NOT NULL | High / Medium / Low |
| recommendation | VARCHAR(30) | NOT NULL | Build / Pivot / Research Further / Avoid |
| report_json | JSONB | NOT NULL | Full structured report (all 9 sections) |
| gemini_model_used | VARCHAR(50) | NOT NULL | Records which Gemini model was used |
| created_at | TIMESTAMP | NOT NULL, default NOW() | Report generation time |

**Why JSONB for report_json:** The full report structure is complex and evolves over time. Storing it as JSONB in PostgreSQL allows the schema to evolve without database migrations for the inner report structure, while key fields like `industry`, `recommendation`, and `market_potential` are promoted to columns for fast filtering and history list rendering.

**Why redundant `user_id` on reports:** Allows `SELECT * FROM reports WHERE user_id = $1` without a JOIN to ideas. Acceptable denormalization for a project of this scale.

---

## Table: `rate_limits`

**Purpose:** Tracks API usage per user per day to enforce rate limiting.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | SERIAL | PK | Auto-increment ID |
| user_id | UUID | FK → users.id, NOT NULL | The user being tracked |
| action | VARCHAR(50) | NOT NULL | e.g., 'idea_submission' |
| window_date | DATE | NOT NULL | The calendar date of the window |
| count | INTEGER | NOT NULL, default 0 | Number of actions in this window |
| updated_at | TIMESTAMP | NOT NULL, default NOW() | Last increment time |

**Unique constraint:** `(user_id, action, window_date)` — one row per user per action per day.

**Logic:** On each idea submission, UPSERT into this table. If count ≥ 5, reject with 429. Otherwise, increment count.

---

## Relationships Summary

```
users.id ──< ideas.user_id       (one-to-many)
ideas.id ──── reports.idea_id    (one-to-one)
users.id ──< reports.user_id     (one-to-many, denormalized)
users.id ──< rate_limits.user_id (one-to-many)
```

---

# Section 7: API Design

## Base URL
`/api/v1`

All endpoints return `Content-Type: application/json`.
All protected endpoints require `Authorization: Bearer <token>` header.

---

## Authentication Endpoints

### POST `/auth/register`
**Purpose:** Create a new user account.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "full_name": "Jane Doe"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "jane@example.com",
  "full_name": "Jane Doe",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Error Responses:**
- `400` — Validation error (e.g., invalid email format)
- `409` — Email already registered

---

### POST `/auth/login`
**Purpose:** Authenticate a user and return a JWT.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

**Error Responses:**
- `401` — Invalid credentials

---

### GET `/auth/me`
**Purpose:** Get the currently authenticated user's profile.
**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "jane@example.com",
  "full_name": "Jane Doe",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

## Idea Endpoints

### POST `/ideas`
**Purpose:** Submit a new startup idea for analysis.
**Auth Required:** Yes

**Request Body:**
```json
{
  "idea_text": "AI-powered fitness coach for college students",
  "region": "United States",
  "budget_range": "$0 - $10,000"
}
```

**Response (202 Accepted → then 200 when complete):**

*Note: For V1, this is a synchronous endpoint. The frontend shows a loading spinner while the backend completes the full pipeline (10–20 seconds). The endpoint responds only after the report is generated.*

**Response (200 OK):**
```json
{
  "idea_id": "uuid",
  "report_id": "uuid",
  "message": "Analysis complete"
}
```

**Error Responses:**
- `400` — idea_text missing or exceeds 1,000 characters
- `429` — Daily rate limit reached
- `500` — AI analysis pipeline failed

---

### GET `/ideas`
**Purpose:** List all ideas submitted by the current user (history view).
**Auth Required:** Yes

**Query Parameters:**
- `page` (int, default 1)
- `limit` (int, default 10, max 50)

**Response (200 OK):**
```json
{
  "total": 12,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "idea_id": "uuid",
      "report_id": "uuid",
      "idea_snippet": "AI-powered fitness coach for college...",
      "industry": "Fitness Technology",
      "recommendation": "Build",
      "market_potential": "Medium",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/ideas/{idea_id}`
**Purpose:** Get details of a specific idea submission.
**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "id": "uuid",
  "idea_text": "AI-powered fitness coach for college students",
  "region": "United States",
  "budget_range": "$0 - $10,000",
  "status": "completed",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Error Responses:**
- `404` — Idea not found or does not belong to user

---

## Report Endpoints

### GET `/reports/{report_id}`
**Purpose:** Retrieve the full analysis report for an idea.
**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "report_id": "uuid",
  "idea_id": "uuid",
  "created_at": "2025-01-15T10:00:00Z",
  "report": {
    "overview": { ... },
    "industry": { ... },
    "target_audience": { ... },
    "competitors": { ... },
    "market_potential": { ... },
    "failure_risks": { ... },
    "opportunity_gaps": { ... },
    "improvement_suggestions": { ... },
    "recommendation": { ... }
  }
}
```

**Error Responses:**
- `403` — Report belongs to a different user
- `404` — Report not found

---

## User Endpoints

### GET `/users/me/stats`
**Purpose:** Return usage statistics for the current user.
**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "total_analyses": 12,
  "analyses_today": 2,
  "daily_limit": 5,
  "analyses_remaining_today": 3
}
```

---

# Section 8: AI Analysis Pipeline

## Pipeline Overview

The goal of this pipeline is to make **exactly one Gemini API call per idea submission**, passing all necessary context in a single, richly structured prompt, and receiving a complete structured JSON report in return.

```
User Submits Idea
      │
      ▼
┌─────────────────────────────┐
│  Step 1: Input Validation   │
│  - Length check             │
│  - Rate limit check         │
│  - Sanitize input           │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Step 2: Context Assembly   │
│  - Idea text                │
│  - Region                   │
│  - Budget range             │
│  - Current date             │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Step 3: Prompt Construction│
│  (prompt_builder.py)        │
│  - System instruction       │
│  - Structured task spec     │
│  - Output format definition │
│  - JSON schema enforcement  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Step 4: Gemini API Call    │
│  - Model: gemini-2.5-flash  │
│  - Temperature: 0.4         │
│  - Max tokens: 4000         │
│  - Response format: JSON    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Step 5: Response Parsing   │
│  - Extract JSON from text   │
│  - Validate against schema  │
│  - Handle parsing errors    │
│  - Retry once on failure    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Step 6: Persistence        │
│  - Save full JSON to DB     │
│  - Update idea status       │
│  - Return report_id         │
└─────────────────────────────┘
```

---

## Step-by-Step Explanation

### Step 1: Input Validation
Before any AI call is made, the backend validates:
- `idea_text` is present and between 10 and 1,000 characters
- User has not exceeded their daily rate limit (check `rate_limits` table)
- Input is stripped of leading/trailing whitespace

If validation fails, the pipeline exits immediately — no AI token is consumed.

---

### Step 2: Context Assembly
The `ai_service.py` constructs a context dictionary:
```python
context = {
    "idea_text": "AI-powered fitness coach for college students",
    "region": "United States",
    "budget_range": "$0 - $10,000",
    "analysis_date": "2025-01-15"
}
```

This is passed to the prompt builder.

---

### Step 3: Prompt Construction

The prompt is the most important engineering decision in the entire system. It is divided into three parts:

**Part A — System Instruction:**
Tells Gemini its role and constraints.
```
You are an expert startup analyst and venture capital researcher.
Your task is to evaluate the startup idea provided and return a structured JSON analysis.
You must be realistic, critical, and data-aware. Do not be overly optimistic.
Return ONLY valid JSON. Do not include explanations, markdown, or commentary outside the JSON.
```

**Part B — Task Specification:**
Provides the idea and context, and explicitly instructs Gemini on what to analyze.
```
Analyze the following startup idea:

IDEA: {idea_text}
REGION: {region}
BUDGET RANGE: {budget_range}
DATE: {analysis_date}

Perform the following analysis:
1. Identify the primary industry and sub-industry
2. Identify the primary and secondary target audience segments
3. Identify 3–5 real or plausible competitors (name, description, strength)
4. Assess market potential as High, Medium, or Low with a 2–3 sentence rationale
5. Identify 3–5 major failure risks with a severity level (High/Medium/Low)
6. Identify 2–3 opportunity gaps or underserved niches this idea could exploit
7. Suggest 3 specific improvements to strengthen the idea
8. Provide a final recommendation: Build / Pivot / Research Further / Avoid
9. Write a 2–3 sentence rationale for the recommendation

Be specific. Use real market knowledge. Be constructively critical.
```

**Part C — Output Schema Definition:**
Defines exactly the JSON structure Gemini must return.
```json
Return your analysis as a JSON object with this exact structure:
{
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
  "competitors": [
    {
      "name": "string",
      "description": "string",
      "strength": "string",
      "threat_level": "High|Medium|Low"
    }
  ],
  "market_potential": {
    "rating": "High|Medium|Low",
    "rationale": "string",
    "estimated_market_context": "string"
  },
  "failure_risks": [
    {
      "risk": "string",
      "description": "string",
      "severity": "High|Medium|Low"
    }
  ],
  "opportunity_gaps": [
    {
      "gap": "string",
      "description": "string"
    }
  ],
  "improvement_suggestions": [
    {
      "suggestion": "string",
      "rationale": "string"
    }
  ],
  "recommendation": {
    "decision": "Build|Pivot|Research Further|Avoid",
    "rationale": "string",
    "confidence": "High|Medium|Low"
  }
}
```

---

### Step 4: Gemini API Call
- Model: `gemini-2.5-flash` (cost-efficient, fast, strong reasoning)
- Temperature: `0.4` (low enough for structured, consistent output; not so low it becomes formulaic)
- Max output tokens: `4000` (sufficient for a full report)
- The prompt instructs JSON-only output, reducing post-processing complexity

---

### Step 5: Response Parsing
Gemini's response text is parsed with a try/except:
```
1. Attempt to parse the raw response as JSON directly
2. If that fails, strip markdown code fences (```json ... ```) and retry
3. If still invalid, log the raw response and mark idea status as 'failed'
4. Return a structured error to the caller
```

Parsed JSON is then validated against the expected schema (checking for required keys). Missing or malformed sections are flagged and either filled with defaults or trigger a failure response.

---

### Step 6: Persistence
On successful parsing:
1. Save the complete report JSON to `reports.report_json`
2. Promote key fields: `industry`, `recommendation`, `market_potential` to their own columns
3. Update `ideas.status` from `processing` → `completed`
4. Increment the `rate_limits` table for the user
5. Return the `report_id` to the router, which sends it to the frontend

---

# Section 9: Report Structure

## Report JSON Schema (Full Example)

Below is a complete example report for the idea: *"AI-powered fitness coach for college students"*

```json
{
  "overview": {
    "idea_summary": "A mobile application that uses AI to create personalized fitness and nutrition coaching plans tailored to the lifestyle, schedule, and budget constraints of college students.",
    "one_line_pitch": "Your personal AI fitness coach that actually gets college life."
  },

  "industry": {
    "primary_industry": "Fitness Technology (FitTech)",
    "sub_industry": "AI-Powered Health & Wellness Apps",
    "industry_context": "The global digital fitness market was valued at over $14 billion in 2023 and is growing rapidly, driven by mobile-first health habits and post-pandemic wellness awareness."
  },

  "target_audience": {
    "primary_segment": "Undergraduate college students aged 18–22 in the US",
    "secondary_segment": "Graduate students and young professionals aged 23–28 with similarly constrained schedules",
    "audience_insight": "College students face unique fitness barriers: irregular schedules, limited budgets, dorm room constraints, and cafeteria-dependent nutrition. Existing apps don't account for these specific lifestyle factors."
  },

  "competitors": [
    {
      "name": "MyFitnessPal",
      "description": "Leading nutrition and calorie tracking app with 200M+ users",
      "strength": "Massive food database, brand recognition, and freemium model",
      "threat_level": "High"
    },
    {
      "name": "Future",
      "description": "Personal trainer app pairing users with real human coaches via video",
      "strength": "Accountability and personalization at scale",
      "threat_level": "Medium"
    },
    {
      "name": "Freeletics",
      "description": "AI-driven bodyweight workout app requiring no gym equipment",
      "strength": "No-equipment workouts, strong European market presence",
      "threat_level": "Medium"
    },
    {
      "name": "Noom",
      "description": "Psychology-based weight loss coaching app",
      "strength": "Behavioral science approach, strong retention",
      "threat_level": "Low"
    }
  ],

  "market_potential": {
    "rating": "Medium",
    "rationale": "There are approximately 20 million college students in the US alone, representing a large addressable audience. However, college students have low disposable income, making monetization challenging. The fitness app market is saturated, requiring strong differentiation to capture attention.",
    "estimated_market_context": "If 1% of US college students paid $5/month, that is $12M ARR — achievable but requires strong viral/referral growth given marketing budget constraints."
  },

  "failure_risks": [
    {
      "risk": "Monetization Difficulty",
      "description": "College students are reluctant to pay for subscription apps and often cancel at month-end. Achieving sustainable revenue may require a freemium model with conversion optimization.",
      "severity": "High"
    },
    {
      "risk": "Market Saturation",
      "description": "The fitness app space is dominated by well-funded incumbents. Differentiating on AI alone is insufficient; the product needs a specific, defensible niche.",
      "severity": "High"
    },
    {
      "risk": "User Retention",
      "description": "Fitness apps industry-wide suffer from 70–80% churn within 30 days. Without strong habit loops and social features, retention will be a persistent challenge.",
      "severity": "High"
    },
    {
      "risk": "AI Accuracy",
      "description": "Fitness and nutrition advice that is inaccurate or generic undermines trust. Users expect personalization; a generic experience will be abandoned quickly.",
      "severity": "Medium"
    },
    {
      "risk": "Regulatory Concerns",
      "description": "Providing dietary or exercise advice could create liability exposure if advice leads to injury. Terms of service must clearly position the app as informational, not medical.",
      "severity": "Medium"
    }
  ],

  "opportunity_gaps": [
    {
      "gap": "Dormitory-aware fitness planning",
      "description": "No existing app generates workout routines specifically designed for dorm room environments (limited space, no equipment, shared spaces). This is a defensible niche with clear user empathy."
    },
    {
      "gap": "Campus dining integration",
      "description": "Many universities publish dining hall menus via APIs. An app that helps students build meal plans from their actual cafeteria options would be uniquely useful and technically differentiated."
    },
    {
      "gap": "Student budget optimization",
      "description": "No fitness app explicitly designs plans around $0–$50/month food budgets. Addressing this would create strong resonance with the core audience."
    }
  ],

  "improvement_suggestions": [
    {
      "suggestion": "Start with one specific university as a pilot",
      "rationale": "Launching on a single campus allows you to build a highly specific product, generate referral-driven growth, and create a compelling case study before expanding. This reduces initial marketing spend and enables rapid iteration."
    },
    {
      "suggestion": "Integrate with the university dining API",
      "rationale": "Dining hall integration is technically achievable (many universities publish menus) and is a unique differentiator no competitor currently offers. It creates a defensible moat and a powerful hook for the core audience."
    },
    {
      "suggestion": "Launch a social accountability layer first",
      "rationale": "Before building AI coaching, validate retention with a simple check-in and accountability partner feature. This is cheaper to build, easier to validate, and retention data will inform the AI personalization priorities."
    }
  ],

  "recommendation": {
    "decision": "Pivot",
    "rationale": "The core idea is sound but too broad to compete in a saturated market. Rather than building a general AI fitness coach, pivot to a hyper-specific product: an AI fitness and nutrition assistant built exclusively for students at specific universities, integrating with dining APIs and dorm room constraints. This specificity creates a defensible niche, stronger word-of-mouth potential, and a clearer user value proposition.",
    "confidence": "Medium"
  }
}
```

---

## Frontend Report Rendering

The report page maps each JSON section to a styled card component:

```
┌─────────────────────────────────────────────────┐
│  [PIVOT]  AI-Powered Fitness Coach              │
│  Fitness Technology · Jan 15, 2025              │
└─────────────────────────────────────────────────┘
│ OVERVIEW                                        │
│ Summary + One-line pitch                        │
├─────────────────────────────────────────────────┤
│ INDUSTRY                                        │
│ FitTech > AI Health Apps                        │
├─────────────────────────────────────────────────┤
│ TARGET AUDIENCE                                 │
│ Primary / Secondary / Insight                   │
├─────────────────────────────────────────────────┤
│ COMPETITORS  ████░░░░░░ 4 identified            │
│ MyFitnessPal [High] · Future [Medium] · ...     │
├─────────────────────────────────────────────────┤
│ MARKET POTENTIAL: MEDIUM                        │
│ Rationale + Context                             │
├─────────────────────────────────────────────────┤
│ FAILURE RISKS                                   │
│ 🔴 Monetization · 🔴 Saturation · 🔴 Retention │
├─────────────────────────────────────────────────┤
│ OPPORTUNITY GAPS                                │
│ Dorm-aware · Dining Integration · Budget        │
├─────────────────────────────────────────────────┤
│ IMPROVEMENT SUGGESTIONS                         │
│ 1. One university pilot  2. Dining API  3. ...  │
├─────────────────────────────────────────────────┤
│ ★ FINAL RECOMMENDATION: PIVOT                   │
│ Rationale text here...                          │
│ Confidence: Medium                              │
└─────────────────────────────────────────────────┘
```

**Recommendation badge colors:**
- `Build` → Green
- `Pivot` → Yellow/Amber
- `Research Further` → Blue
- `Avoid` → Red

---

# Section 10: Security Design

## Authentication

**Strategy:** JWT (JSON Web Token) with HS256 signing

- On login, server generates a JWT signed with a secret key stored in environment variables
- Token payload contains: `user_id`, `email`, `exp` (expiry), `iat` (issued at)
- Token expiry: 24 hours
- Token is returned in the login response body
- Frontend stores the token in memory (React context / state) or a secure httpOnly cookie — **not** localStorage to reduce XSS risk
- Every protected API request sends `Authorization: Bearer <token>` header
- FastAPI dependency `get_current_user` decodes and validates the token on every protected request

**Token Refresh:** Not implemented in V1. Users log in again after 24 hours.

---

## Password Storage

- Passwords are **never stored in plaintext**
- On registration: `bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))`
- On login: `bcrypt.checkpw(submitted_password.encode(), stored_hash)`
- bcrypt is intentionally slow, making brute-force attacks computationally expensive
- Salt rounds of 12 provide strong protection while remaining fast enough for a web request (~200ms)

---

## Authorization

- All idea and report routes are protected by the `get_current_user` dependency
- Every database query for ideas and reports includes a `WHERE user_id = current_user.id` clause
- A user cannot access another user's ideas or reports, even if they know the UUID
- This is enforced at the service layer, not just the route layer

---

## Rate Limiting

Two layers of rate limiting:

**Layer 1 — Application-Level (Database):**
- On each idea submission, check `rate_limits` table for user's usage today
- If count ≥ 5: return `HTTP 429 Too Many Requests` with message "Daily analysis limit reached"
- If count < 5: proceed with analysis, then increment count

**Layer 2 — Request-Level (FastAPI Middleware):**
- Use `slowapi` library (FastAPI-compatible rate limiter)
- Limit: 60 requests per minute per IP address for all endpoints
- Prevents automated scraping and brute-force login attempts

---

## API Security

| Practice | Implementation |
|---|---|
| HTTPS only | Enforced in deployment via NGINX or AWS ALB |
| CORS | Restrict origins to the specific frontend domain in production |
| Input validation | All request bodies validated with Pydantic models; extra fields rejected |
| SQL injection | Prevented entirely by SQLAlchemy ORM (parameterized queries) |
| Secret management | All secrets (JWT key, DB password, Gemini key) in environment variables |
| Error responses | Never expose stack traces or internal details in production responses |

---

## What Is NOT Implemented in V1 (Acceptable for Student Project)

- Email verification
- Multi-factor authentication
- OAuth (Google / GitHub login)
- Refresh token rotation
- CSRF protection (mitigated by using JWT in headers rather than cookies; if using cookies, add CSRF tokens)

---

# Section 11: Deployment Preparation

## Deployment Readiness Philosophy

The V1 codebase is designed to be environment-aware. The only things that change between local development and AWS production are configuration values — everything else stays the same.

---

## Environment Configuration

All sensitive values are loaded from environment variables via a `config.py` using `python-dotenv`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-jwt-secret-key
GEMINI_API_KEY=your-gemini-api-key
ENVIRONMENT=development|production
ALLOWED_ORIGINS=https://yourfrontend.com
```

In local development, these come from a `.env` file (never committed to git).
On AWS, these are stored in **AWS Systems Manager Parameter Store** or **AWS Secrets Manager** and injected as environment variables.

---

## AWS Deployment Architecture

```
Internet
    │
    ▼
Route 53 (DNS)
    │
    ▼
Application Load Balancer (ALB)
    │
    ├── /api/* → EC2 Instance (FastAPI via uvicorn/gunicorn)
    │
    └── /* → S3 + CloudFront (React SPA static hosting)
                │
                └── FastAPI talks to: AWS RDS PostgreSQL
```

---

## AWS RDS (PostgreSQL)

**What it replaces:** Local PostgreSQL database

**Setup steps (when ready to deploy):**
1. Create an RDS PostgreSQL 15 instance (t3.micro for free tier)
2. Enable Multi-AZ for resilience (optional for V1)
3. Configure security group to only allow inbound on port 5432 from the EC2 security group
4. Update `DATABASE_URL` environment variable on EC2 to point to the RDS endpoint
5. Run Alembic migrations against RDS: `alembic upgrade head`

**Why the code requires no changes:** SQLAlchemy uses the `DATABASE_URL` connection string. Swapping the URL is all that is needed.

---

## AWS S3 + CloudFront (React Frontend)

**What it replaces:** `npm run dev` local server

**Setup steps:**
1. Run `npm run build` in the React project — outputs static files to `/dist`
2. Create an S3 bucket with static website hosting enabled
3. Upload `/dist` contents to the bucket
4. Create a CloudFront distribution pointing to the S3 bucket
5. Configure CloudFront to redirect all paths to `index.html` (required for React Router)
6. Update the React app's API base URL to the production FastAPI URL before building

---

## AWS EC2 (FastAPI Backend)

**What it replaces:** `uvicorn main:app --reload` local server

**Setup steps:**
1. Launch an EC2 t3.micro instance with Ubuntu 22.04
2. Install Python 3.11, pip, and dependencies
3. Clone the repository and configure environment variables
4. Run FastAPI with gunicorn: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker`
5. Set up NGINX as a reverse proxy on port 80/443
6. Configure SSL with Let's Encrypt (Certbot) or use the ALB for SSL termination

**Alternative to EC2:** AWS Elastic Beanstalk for easier deployment (handles EC2, load balancing, and deployments with less configuration).

---

## Pre-Deployment Checklist

- [ ] `DEBUG = False` in production config
- [ ] `ALLOWED_ORIGINS` set to exact frontend domain (not `*`)
- [ ] Database migrations applied to RDS
- [ ] All secrets stored in environment variables (not in code)
- [ ] Gemini API key has budget alerts configured in Google Cloud Console
- [ ] Rate limiting tested end-to-end

---

# Section 12: Resume Value

## Skills This Project Demonstrates

### Backend Engineering
- Designed and built a production-structured FastAPI application with modular routing, service layer, and dependency injection
- Implemented JWT authentication with bcrypt password hashing from scratch
- Designed a normalized PostgreSQL schema with proper foreign keys and indexing
- Used SQLAlchemy ORM with Alembic migrations
- Built a rate limiting system using database-backed tracking

### AI Integration
- Designed and engineered structured prompts for a real LLM API (Gemini 2.5 Flash)
- Implemented a full AI analysis pipeline with input validation, prompt construction, API call, response parsing, and persistence
- Applied prompt engineering techniques: role specification, structured output schemas, temperature tuning
- Handled JSON response validation and error cases in AI outputs

### Frontend Engineering
- Built a multi-page React SPA with React Router
- Managed authentication state and protected routes
- Rendered complex structured JSON data as a rich, readable UI
- Built responsive UI with Tailwind CSS

### System Design
- Designed a complete REST API with proper HTTP methods, status codes, and error handling
- Made deliberate architectural decisions (e.g., JSONB for flexible report storage, rate limit table design)
- Built with AWS deployment readiness from day one

### Product Thinking
- Defined an MVP scope with clear in/out decisions
- Designed user flows with error states and edge cases
- Structured a decision-support tool rather than a simple chatbot wrapper

---

## What Recruiters Find Impressive

| What They See | Why It Matters |
|---|---|
| Full-stack ownership | Shows ability to own a feature end-to-end, not just one layer |
| AI integration (not a wrapper) | Shows you understand prompt engineering and pipeline design, not just API calls |
| Structured report output | Shows product thinking — you designed an output format with purpose |
| Deliberate scope decisions | Shows maturity: you knew what NOT to build and why |
| Security considerations | JWT, bcrypt, rate limiting — shows you think beyond the happy path |
| AWS deployment awareness | Suggests production readiness, not just local-demo quality |
| Database design | A normalized schema with proper relationships signals backend seriousness |

---

## How to Describe It on a Resume

### Project Title
**Venture Intelligence Platform** — AI-Powered Startup Idea Analysis Tool

### One-Line Description
> Built a full-stack decision-support platform that uses Gemini 2.5 Flash to evaluate startup ideas, generating structured 9-section analysis reports covering competitors, market potential, risks, and strategic recommendations.

### Bullet Points (Resume Format)
- Designed and built a full-stack web application using **React**, **FastAPI**, and **PostgreSQL** that provides AI-powered startup idea evaluation through a structured analysis pipeline
- Engineered a **single-call Gemini 2.5 Flash integration** using structured prompt design to generate 9-section reports (industry, competitors, risks, opportunities, and recommendations) in under 20 seconds
- Implemented **JWT authentication** with bcrypt password hashing and database-backed **rate limiting** (5 analyses/day per user) to manage API cost and access control
- Designed a normalized database schema with **JSONB report storage** and promoted scalar fields for efficient filtering and history queries
- Built the system with **AWS deployment readiness** from day one: environment-variable configuration, separation of concerns for RDS/S3/EC2 compatibility

### In a Technical Interview
Be ready to discuss:
1. Why you made one Gemini call instead of multiple (cost, latency, simplicity)
2. How you designed the prompt to produce structured JSON reliably
3. Why you used JSONB for the report and promoted certain columns
4. How rate limiting works at the database layer
5. What you would add in V2 (live competitor scraping, PDF export, real market data APIs)

---

## Technologies to List on Resume

`Python` · `FastAPI` · `React` · `PostgreSQL` · `SQLAlchemy` · `Alembic` · `Gemini API` · `JWT` · `REST APIs` · `Tailwind CSS` · `AWS (RDS, S3, EC2)` · `Prompt Engineering` · `Pydantic`

---

*Document Version: 1.0 | Architecture for Venture Intelligence Platform V1*
*Designed as a complete, buildable, resume-grade project for a developer with Python, FastAPI, and React experience.*
