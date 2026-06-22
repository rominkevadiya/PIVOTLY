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
    "executive_summary": "An AI platform targeting indie hackers...",
    "market_intelligence": {
      "market_size_estimate": "$5B",
      "growth_rate_estimate": "20% YoY",
      "target_audience": ["Indie Hackers", "Solopreneurs"],
      "identified_competitors": ["ValidatorX"],
      "regulatory_concerns": [],
      "evidence_list": []
    },
    "competitor_intelligence": {
      "competitors": [],
      "market_concentration": "Fragmented",
      "evidence_list": []
    },
    "moat_analysis": {
      "moat_type": "Network Effects",
      "defensibility_explanation": "Users contribute validation data.",
      "copy_difficulty": "Medium",
      "network_effects_present": true,
      "data_advantage_present": true,
      "evidence_list": []
    },
    "opportunity_gaps": ["No direct GitHub integration"],
    "failure_analysis": {
      "top_failure_reasons": ["AI commoditization"],
      "critical_assumptions": ["Hackers will pay for validation"],
      "largest_unknowns": ["Willingness to pay"],
      "execution_risks": ["Building the scraper"]
    },
    "why_this_could_win": ["Speed to market"],
    "why_this_could_fail": ["Free alternatives"],
    "what_must_be_true": ["Hackers pay $20/mo"],
    "scorecard": {
      "market_score": 8,
      "competition_score": 5,
      "feasibility_score": 9,
      "monetization_score": 6,
      "moat_score": 4,
      "execution_risk_score": 6,
      "overall_score": 72,
      "scoring_rationale": {}
    },
    "action_plan": {
      "go_to_market_phases": ["Launch on ProductHunt"],
      "unit_economics_cac": "$5",
      "unit_economics_ltv": "$100",
      "unit_economics_payback": "1 month",
      "next_steps": ["Build MVP"],
      "founder_recommendation": "Focus on distribution first."
    },
    "recommendation": "Build",
    "recommendation_rationale": "Clear problem with a high willingness to try solutions."
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
