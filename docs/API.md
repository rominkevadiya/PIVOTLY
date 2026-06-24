# Backend API Reference: Venture Intelligence Platform

This document outlines the REST API endpoints available in the backend service. All endpoints are prefixed with `/api/v1`.

---

## Authentication Endpoints

### POST `/api/v1/auth/register`

**Description:** Creates a new user account.

**Authentication Required:** No

**Request Example:**
```json
{
  "email": "founder@example.com",
  "password": "securepassword123",
  "full_name": "Jane Doe"
}
```

**Response Example:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "founder@example.com",
  "full_name": "Jane Doe",
  "created_at": "2026-06-16T12:00:00Z"
}
```

**Error Responses:**
*   `409 Conflict`: Email already registered.
*   `422 Unprocessable Entity`: Validation error (e.g., password too short).

**Validation Rules:**
*   `email`: Must be a valid email format.
*   `password`: Minimum 8 characters, maximum 128 characters.
*   `full_name`: Minimum 1 character, maximum 255 characters.
*   Extra fields are strictly forbidden.

---

### POST `/api/v1/auth/login`

**Description:** Authenticates a user and returns a JSON Web Token (JWT).

**Authentication Required:** No

**Request Example:**
```json
{
  "email": "founder@example.com",
  "password": "securepassword123"
}
```

**Response Example:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "expires_in": 86400
}
```
> **Note:** `expires_in` is in seconds. The default configured in `config.py` is `ACCESS_TOKEN_EXPIRE_MINUTES=1440` (24 hours = 86400 seconds). This value can be overridden via the `ACCESS_TOKEN_EXPIRE_MINUTES` environment variable.

**Error Responses:**
*   `401 Unauthorized`: Invalid credentials.
*   `403 Forbidden`: Account is deactivated.
*   `422 Unprocessable Entity`: Validation error.

**Validation Rules:**
*   `email`: Must be a valid email format.
*   `password`: Minimum 1 character.
*   Extra fields are strictly forbidden.

---

### GET `/api/v1/auth/me`

**Description:** Returns the profile of the currently authenticated user.

**Authentication Required:** Yes (Bearer Token)

**Request Example:**
*Requires `Authorization: Bearer <token>` header.*

**Response Example:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "founder@example.com",
  "full_name": "Jane Doe",
  "created_at": "2026-06-16T12:00:00Z"
}
```

**Error Responses:**
*   `401 Unauthorized`: Invalid or expired token.

---

## Analysis Endpoints

### POST `/api/v1/analyze`

**Description:** Analyzes a startup idea using AI (Gemini) augmented with live web search, and persists the generated report.

**Authentication Required:** Yes (Bearer Token)

**Request Example:**
```json
{
  "idea_text": "An AI platform that helps indie hackers validate their startup ideas before building.",
  "region": "North America",
  "budget_range": "Bootstrapped (< $10k)"
}
```

**Response Example:**
```json
{
  "report_id": "987fcdeb-51a2-43d7-9012-345678901234",
  "status": "PENDING"
}
```

> **Note:** The response returns immediately with `status: PENDING`. The AI pipeline runs in a background task. Poll `GET /api/v1/reports/{report_id}/status` to track progress through: `PENDING → SCRAPING → GENERATING → COMPLETED | FAILED`.

**Error Responses:**
*   `401 Unauthorized`: Invalid token.
*   `422 Unprocessable Entity`: Idea text too short/long.
*   `429 Too Many Requests`: Daily analysis limit reached.
*   `502 Bad Gateway`: AI analysis failed (Gemini error).

**Validation Rules:**
*   `idea_text`: String, minimum 10 characters, maximum 1000 characters. Automatically stripped of leading/trailing whitespace.
*   `region` (Optional): String, maximum 100 characters.
*   `budget_range` (Optional): String, maximum 50 characters.
*   Extra fields are strictly forbidden.

---

## Report Endpoints

### GET `/api/v1/reports`

**Description:** Retrieves a paginated list of report summaries owned by the authenticated user.

**Authentication Required:** Yes (Bearer Token)

**Query Parameters:**
*   `page` (Optional): Integer, default `1`.
*   `limit` (Optional): Integer, default `10`.

**Request Example:**
`GET /api/v1/reports?page=1&limit=10`

**Response Example:**
```json
[
  {
    "id": "987fcdeb-51a2-43d7-9012-345678901234",
    "idea_snippet": "An AI platform that helps indie hackers validate their...",
    "industry": "Software as a Service (SaaS)",
    "market_potential": "High",
    "recommendation": "Build",
    "schema_version": 2,
    "created_at": "2026-06-16T12:05:00Z"
  }
]
```

**Error Responses:**
*   `401 Unauthorized`: Invalid token.

---

### GET `/api/v1/reports/{report_id}`

**Description:** Retrieves the full, detailed JSON of a specific persisted venture analysis report.

**Authentication Required:** Yes (Bearer Token)

**Path Parameters:**
*   `report_id`: UUID of the report.

**Request Example:**
`GET /api/v1/reports/987fcdeb-51a2-43d7-9012-345678901234`

**Response Example:**
```json
{
  "id": "987fcdeb-51a2-43d7-9012-345678901234",
  "idea_text": "An AI platform that helps indie hackers validate their startup ideas before building.",
  "industry": "Software as a Service (SaaS)",
  "market_potential": "High",
  "recommendation": "Build",
  "schema_version": 2,
  "created_at": "2026-06-16T12:05:00Z",
  "report_json": {
    "idea_summary": "An AI platform that helps indie hackers validate their startup ideas before building.",
    "research_context": {
      "market_overview": "The no-code/low-code validation tooling market is growing rapidly...",
      "target_demographics": ["Indie Hackers", "Solopreneurs", "Early-stage founders"],
      "market_size_indicators": [
        { "claim": "$5B total addressable market for dev tooling", "source_url": "https://example.com", "reliability": "Medium" }
      ],
      "key_trends": ["AI-assisted product validation", "Creator economy growth"]
    },
    "competitor_analysis": {
      "competitors": [
        {
          "name": "Lean Canvas AI",
          "website": "https://leancanvas.ai",
          "threat_level": "Medium",
          "copy_risk": "Low",
          "differentiator_weakness": "Lacks live competitor intelligence",
          "evidence_list": []
        }
      ],
      "market_saturation": "Medium",
      "summary": "The space is fragmented with no dominant player."
    },
    "moat_analysis": {
      "network_effects": "Weak — users do not directly benefit from other users",
      "switching_costs": "Medium — historical report data creates mild lock-in",
      "brand_power": null,
      "overall_defensibility": "Medium",
      "evidence_list": []
    },
    "contrarian_analysis": {
      "critical_assumptions": ["Founders will pay for validation before building"],
      "why_it_might_fail": ["AI commoditization makes this trivially replicable"],
      "hidden_risks": ["Free ChatGPT prompts offer 80% of value for $0"],
      "evidence_list": []
    },
    "action_plan": {
      "go_to_market_phases": ["Launch on Indie Hackers forum", "ProductHunt launch week 4"],
      "unit_economics_cac": "$8",
      "unit_economics_ltv": "$96",
      "unit_economics_payback": "1 month",
      "next_steps": [
        { "priority": 1, "action": "Build MVP", "rationale": "Validate demand with a basic version", "timeframe": "4 weeks" }
      ],
      "founder_recommendation": "Focus on distribution first. Ship the smallest useful version."
    },
    "scoring_rubric": {
      "market_size_score": 6,
      "competitive_advantage_score": 6,
      "technical_feasibility_score": 7,
      "monetization_potential_score": 6,
      "founder_fit_score": 5,
      "overall_score": 62,
      "overall_rationale": "The idea scored 62/100. Market Size: 6/10. Defensibility: 6/10. Feasibility: 7/10. Monetization: 6/10."
    },
    "recommendation": {
      "decision": "Research Further",
      "confidence": "Medium",
      "confidence_score": 62,
      "evidence": "Deterministic scoring pipeline returned 62/100.",
      "rationale": "Promising market but high replication risk requires deeper validation."
    }
  }
}
```

> **Note:** Each agent section (`research_context`, `competitor_analysis`, etc.) can independently return a `SectionError` object if that agent fails:
> ```json
> { "status": "UNAVAILABLE", "error": "Gemini request failed." }
> ```
> The `scoring_rubric` and `recommendation` fields are always present (deterministic — no Gemini call required).

**Error Responses:**
*   `401 Unauthorized`: Invalid token.
*   `403 Forbidden`: Access denied (user does not own this report).
*   `404 Not Found`: Report does not exist.


---

### GET `/api/v1/reports/{report_id}/status`

**Description:** Lightweight polling endpoint. Returns the current processing status of a report without loading the full `report_json` payload.

**Authentication Required:** Yes (Bearer Token)

**Path Parameters:**
*   `report_id`: UUID of the report.

**Request Example:**
`GET /api/v1/reports/987fcdeb-51a2-43d7-9012-345678901234/status`

**Response Example (in progress):**
```json
{
  "report_id": "987fcdeb-51a2-43d7-9012-345678901234",
  "status": "GENERATING",
  "error_message": null
}
```

**Response Example (completed):**
```json
{
  "report_id": "987fcdeb-51a2-43d7-9012-345678901234",
  "status": "COMPLETED",
  "error_message": null
}
```

**Response Example (failed):**
```json
{
  "report_id": "987fcdeb-51a2-43d7-9012-345678901234",
  "status": "FAILED",
  "error_message": "Gemini API quota exhausted."
}
```

**Status Lifecycle:**

| Status | Meaning |
|---|---|
| `PENDING` | Report created; background task not yet started |
| `SCRAPING` | Fetching live competitor data via Tavily/DDG |
| `GENERATING` | AI agents running; scoring in progress |
| `COMPLETED` | Full `VentureReportV2` saved; use `GET /reports/{id}` |
| `FAILED` | Pipeline failed; see `error_message` |

**Error Responses:**
*   `401 Unauthorized`: Invalid token.
*   `403 Forbidden`: Access denied.
*   `404 Not Found`: Report does not exist.

---

## User Statistics Endpoints

### GET `/api/v1/users/me/stats`

**Description:** Returns usage statistics for the currently authenticated user, primarily for displaying rate limit usage on the dashboard.

**Authentication Required:** Yes (Bearer Token)

**Request Example:**
`GET /api/v1/users/me/stats`

**Response Example:**
```json
{
  "total_analyses": 12,
  "analyses_today": 2,
  "daily_limit": 5,
  "analyses_remaining_today": 3
}
```

**Error Responses:**
*   `401 Unauthorized`: Invalid token.
