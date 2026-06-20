# AI Pipeline Architecture: Venture Intelligence Platform

## AI Pipeline Overview

The Pivotly application features a production-grade, single-pass Artificial Intelligence pipeline designed to evaluate raw startup ideas and output highly structured, multi-dimensional venture reports. It relies on a "RAG-lite" (Retrieval-Augmented Generation) approach using live web search to ground the AI's knowledge, native API structured outputs, and automatic validation/repair hooks to guarantee reliability and format consistency.

## End-to-End Flow

```text
+-------------------+       +-------------------------------+
|  User Submission  |       |       SearchService           |
| (Idea, Region,    |------>| (Tavily with DDGS Fallback)   |
|  Budget)          |       | Fetches live market context   |
+-------------------+       +---------------+---------------+
                                            |
+-------------------------------------------v-----------------------------------+
|                                 Prompt Builder                                |
| Injects: User Idea + Search Context + Formatting Instructions                 |
+-------------------------------------------+-----------------------------------+
|                                           |
|                                           v
+-------------------------------------------------------------------------------+
|                                  AIService                                    |
| - Unified google-genai async SDK (model: gemini-2.5-flash)                    |
| - Tenacity Retry Wrapper (3 attempts, exponential backoff: 2s to 10s)         |
| - Configuration: temp=0.4, max_output_tokens=32768                            |
| - Strict Native Constraint: response_schema=VentureReport                     |
+-------------------------------------------+-----------------------------------+
                                            |
+-------------------------------------------v-----------------------------------+
|                            Pydantic Validation Layer                          |
| - Natively validates API JSON against VentureReport Pydantic schema           |
+-------------------------------------------+-----------------------------------+
                                            |
                  +-------------------------+-------------------------+
                  | (Success)                                         | (Validation Error)
                  v                                                   v
+-----------------------------------+               +-----------------------------------+
|        Postgres Persistence       |               |        Auto-Repair Engine         |
| Saves report payload to JSONB.    |               | Coerces array lengths/attributes  |
+-----------------------------------+               | to fit schema constraints.        |
                                                    +-----------------+-----------------+
                                                                      |
                                                            +---------+---------+
                                                            | (Success)         | (Failure)
                                                            v                   v
                                                    +---------------+   +---------------+
                                                    | Save Report   |   | Trace ID Log  |
                                                    | to Database   |   | Dump to /tmp  |
                                                    +---------------+   +---------------+
```

## Input Processing

When a user submits an analysis request, the backend receives the `idea_text`, `region`, and `budget_range`.
Before the AI is invoked, the `ReportService` calls the `SearchService` (`search_competitors`). The system executes search queries concurrently:
1. **Primary**: Queries the **Tavily Search API** (specifically designed for AI agents) to get live, relevant competitor and market context.
2. **Fallback**: If the Tavily API fails or has no key configured, the system automatically falls back to DuckDuckGo Search (`ddgs`) using an asynchronous executor thread (`asyncio.to_thread`) to ensure high availability.

The gathered results (titles, URLs, and snippets) are compiled into a markdown-formatted context string. This serves as the "live web grounding" for the LLM, reducing hallucinated competitor analysis.

## Prompt Engineering Strategy

The prompt is constructed centrally in `app/utils/prompt_builder.py`. The strategy involves:

1. **Persona Assignment:** "You are an expert startup analyst and venture capital researcher."
2. **Instruction Framing:** Explicitly telling the model to "Be realistic, critical, and data-aware. Do not be overly optimistic."
3. **Context Injection:** The live web search results, target region, and budget are injected as explicit context blocks. The current UTC date is also injected so the LLM has temporal awareness.
4. **Task Breakdown:** A numbered list of explicit analytical tasks covering core viability, SWOT, go-to-market strategy, unit economics, action plans, and extracting search reference links.
5. **Strict Schema Definition:** The prompt aligns with the fields and enums (e.g., `"threat_level": "High|Medium|Low"`) required by the system, ensuring semantic alignment with the Pydantic schema.

## Gemini Integration

The AI interaction is handled by the `AIService` class using the official `google-genai` Python SDK.
* **Model:** Configured via the `GEMINI_MODEL` environment variable. The code default in `config.py` is `gemini-1.5-flash`; the production environment sets it to `gemini-2.5-flash`.
* **Parameters:** 
  * `temperature=0.4`: Set low to favor analytical consistency and adherence to instructions over creative variation.
  * `max_output_tokens=32768`: Configured high to provide sufficient token budget for both the model's internal thinking/reasoning steps and the final detailed JSON payload.
  * `response_mime_type="application/json"`: Informs the model to generate a valid JSON string.
  * `response_schema=VentureReport`: Leverages Gemini's Native Structured Outputs. The Pydantic model is supplied directly to the API, forcing structural compliance at the token-generation level.
* **Monkey-Patching google-genai SDK**: To circumvent an issue in the SDK's schema transformer that crashed with `KeyError: 'type'` when processing nullable references and nested objects, custom wrappers for `handle_null_fields` and `process_schema` are applied at application startup to strip forbidden OpenAPI attributes and resolve `$ref` pointers.
* **Resiliency Wrapper**: The API calls are wrapped with a `tenacity` retry decorator, configured for **3 attempts** with **exponential backoff** (starting at 2s, capped at 10s) for transient network or API errors.

## Response Handling

1. **Schema Validation**: The API response is parsed and validated using `VentureReport.model_validate_json()`.
2. **Auto-Repair Engine**: If validation fails due to minor schema discrepancies (e.g., Gemini returns list lengths outside the strictly defined Pydantic bounds), the backend catches the `ValidationError` and triggers a fallback sanitization loop. This loop:
   * Coerces array lengths (e.g., truncating lists of competitors, failure risks, next steps, and SWOT categories to their bounds or padding them with formatted placeholders).
   * Verifies nested object schemas like `investor_verdict` and `go_to_market`.
   * Re-evaluates the repaired object via `VentureReport.model_validate()`.
3. **Trace-ID Diagnostic Logging**: If validation fails completely after auto-repair, the backend generates a unique UUID `TraceID`. It logs the exception, dumps the raw AI response and prompt to `/tmp/pivotly_errors/` for debugging, and returns an `AIServiceError` with the TraceID.

## Report Persistence

If validation succeeds (initially or after auto-repair), the structured JSON is serialized (`report.model_dump(mode="json")`) and saved in a PostgreSQL `JSONB` column inside the `reports` table. Key attributes (like primary industry, rating, and recommendation) are extracted and stored in indexed relational columns to speed up dashboard listings.

## Cost & Rate Optimization

1. **Model Choice**: Utilizing `gemini-2.5-flash` keeps generation costs low while maintaining high analytical reasoning capabilities.
2. **Two-Tier Rate Limiting**:
   * **IP-level (Tier 1)**: Configured slowapi to restrict global clients to 60 requests per minute.
   * **User-level (Tier 2)**: DB-backed tracking that limits users to 5 analysis runs per day via database atomic upserts.

## Current Limitations & Future Upgrades

1. **Long-Lived HTTP Lifecycle**: The entire pipeline (Search -> LLM -> Parse -> DB) executes during a single HTTP request lifecycle. The client connection stays open for 20-30 seconds. A future improvement should migrate this to an asynchronous background task queue (e.g., Celery + Redis) and use WebSockets or polling for frontend updates.
2. **Database-Backed Rate Limiting**: Enforcing rate limits via database transactions scales poorly under heavy concurrent traffic. Migrating rate limiting to an in-memory database like Redis is recommended.
