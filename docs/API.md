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
  "status": "success"
}
```

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
  "created_at": "2026-06-16T12:05:00Z",
  "report_json": {
    "overview": {
      "idea_summary": "AI platform for idea validation...",
      "one_line_pitch": "Validate before you code."
    },
    "industry": {
      "primary_industry": "Software as a Service (SaaS)",
      "sub_industry": "Developer Tools",
      "industry_context": "The indie hacker movement is growing..."
    },
    "target_audience": {
      "primary_segment": "Indie Hackers",
      "secondary_segment": "First-time founders",
      "audience_insight": "Highly price-sensitive but value time."
    },
    "competitors": [
      {
        "name": "Validation Startup X",
        "description": "Manual validation service.",
        "strength": "Human touch.",
        "threat_level": "Medium"
      }
    ],
    "market_potential": {
      "rating": "High",
      "rationale": "High volume of new startups annually.",
      "estimated_market_context": "Growing TAM in SaaS tooling.",
      "tam": "$5B",
      "sam": "$500M",
      "som": "$10M"
    },
    "failure_risks": [
      {
        "risk": "AI commoditization",
        "description": "Anyone can build a wrapper.",
        "severity": "High"
      }
    ],
    "opportunity_gaps": [
      {
        "gap": "Integration with existing codebases",
        "description": "Validating directly from repo descriptions."
      }
    ],
    "improvement_suggestions": [
      {
        "suggestion": "Add live search",
        "rationale": "Keeps competitive analysis fresh."
      }
    ],
    "recommendation": {
      "decision": "Build",
      "rationale": "Clear problem with a high willingness to try solutions.",
      "confidence": "Medium"
    },
    "scoring_rubric": {
      "market_size": { "score": 8, "reasoning": "Large TAM." },
      "competitive_advantage": { "score": 5, "reasoning": "Low barrier to entry." },
      "technical_feasibility": { "score": 9, "reasoning": "Standard API wrappers." },
      "monetization_potential": { "score": 6, "reasoning": "Hard to charge indie hackers." },
      "founder_fit": { "score": 8, "reasoning": "Assuming founder is a dev." },
      "overall_score": 72
    },
    "references": [
      {
        "name": "Validation Startup X",
        "url": "https://example.com/startup-x"
      }
    ]
  }
}
```

**Error Responses:**
*   `401 Unauthorized`: Invalid token.
*   `403 Forbidden`: Access denied (user does not own this report).
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
