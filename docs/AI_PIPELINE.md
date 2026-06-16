# AI Pipeline Architecture: Venture Intelligence Platform

## AI Pipeline Overview

The Pivotly application features a streamlined, single-pass Artificial Intelligence pipeline designed to evaluate raw startup ideas and output highly structured, multi-dimensional venture reports. It relies on a "RAG-lite" (Retrieval-Augmented Generation) approach using live web search to ground the AI's knowledge, rigorous prompt engineering, and strict Pydantic validation to ensure the generated output can be reliably rendered by the frontend.

## End-to-End Flow

```text
+-------------------+       +-----------------------+
|  User Submission  |       |   SearchService       |
| (Idea, Region,    |------>| (DuckDuckGo Search)   |
|  Budget)          |       | Fetches live context  |
+-------------------+       +-----------+-----------+
                                        |
+---------------------------------------v---------------------------------------+
|                              Prompt Builder                                   |
| Injects: User Idea + Search Context + Formatting Instructions + JSON Template |
+---------------------------------------+---------------------------------------+
                                        |
+---------------------------------------v---------------------------------------+
|                                AIService                                      |
| Call: google-genai SDK (model set via GEMINI_MODEL env var)                   |
| Config: temp=0.4, response_mime_type="application/json"                       |
+---------------------------------------+---------------------------------------+
                                        |
+---------------------------------------v---------------------------------------+
|                               json_parser.py                                  |
| Extracts substring between '{' and '}' to bypass markdown formatting.         |
+---------------------------------------+---------------------------------------+
                                        |
+---------------------------------------v---------------------------------------+
|                              Pydantic Validation                              |
| Validates raw dictionary against VentureReport schema.                        |
+---------------------------------------+---------------------------------------+
                                        | (Success)
+---------------------------------------v---------------------------------------+
|                           Database Persistence                                |
| Saves JSONB payload to PostgreSQL.                                            |
+---------------------------------------+---------------------------------------+
```

## Input Processing

When a user submits an analysis request, the backend receives the `idea_text`, `region`, and `budget_range`.
Before the AI is invoked, the `ReportService` calls the `SearchService` (`search_competitors`). The system executes a synchronous DuckDuckGo search (via the `ddgs` library) using the query: `"competitors for startup idea: {idea_text}"`. The top 5 results are compiled into a markdown-formatted string containing site titles, URLs, and snippets. This context string serves as the "live web grounding" for the LLM, reducing hallucinated competitor analysis.

## Prompt Engineering Strategy

The prompt is constructed centrally in `app/utils/prompt_builder.py`. The strategy involves:

1.  **Persona Assignment:** "You are an expert startup analyst and venture capital researcher."
2.  **Instruction Framing:** Explicitly telling the model to "Be realistic, critical, and data-aware. Do not be overly optimistic."
3.  **Context Injection:** The live web search results, target region, and budget are injected as explicit context blocks. The current UTC date is also injected so the LLM has temporal awareness.
4.  **Task Breakdown:** A numbered list of 11 specific analytical tasks (e.g., "Assess market potential...", "Identify 3 to 5 major failure risks...", "Extract 2 to 5 specific search reference links").
5.  **Strict Schema Definition:** The prompt provides an exact, deeply nested JSON template that the LLM must mirror, including the new `references` array. It strictly defines enum values required by the system (e.g., `"threat_level": "High|Medium|Low"`).

## Gemini Integration

The AI interaction is handled by the `AIService` class using the official `google-genai` Python SDK.
*   **Model:** Configured via the `GEMINI_MODEL` environment variable. The code default in `config.py` is `gemini-1.5-flash`; the provided `.env.example` sets it to `gemini-2.5-flash`. This allows switching between model tiers without code changes.
*   **Parameters:** 
    *   `temperature=0.4`: Set low to favor analytical consistency and adherence to instructions over creative variation.
    *   `max_output_tokens=4000`: Set high enough to accommodate the extensive JSON report payload.
    *   `response_mime_type="application/json"`: A hint to the Gemini API to attempt to format the output as JSON.

## Response Handling

Even with `response_mime_type` set, LLMs frequently wrap JSON output in markdown fences (e.g., ` ```json ... ``` `) or include conversational preamble.
1.  **String Parsing:** The `json_parser.py` module takes the raw string, finds the first occurrence of `{` and the last occurrence of `}`, and extracts the substring. This effectively strips out any markdown or conversational text. The substring is then parsed using Python's native `json.loads`.
2.  **Schema Validation:** The parsed dictionary is passed to `VentureReport.model_validate()`. Pydantic enforces rigorous type checking, enum matching, and array bounds (e.g., requiring exactly 3 to 5 failure risks).

## Report Generation

If the Pydantic validation succeeds, the pipeline is complete. The structured JSON is serialized into a standard Python dictionary (`report.model_dump(mode="json")`) and passed back to the `ReportService`. This service saves the dictionary directly into a `JSONB` column in PostgreSQL, alongside extracted top-level metadata (like the primary industry and final recommendation) for easier dashboard querying.

## Cost Optimization

The current codebase implements several explicit optimization strategies:
1.  **Model Choice:** Using a cost-efficient Gemini Flash-tier model (configurable via `GEMINI_MODEL`) rather than Pro models keeps token costs low while maintaining sufficient analytical reasoning.
2.  **Free RAG Stack:** Instead of using paid search APIs (like Tavily or SerpApi), the app uses the open-source `ddgs` library to scrape DuckDuckGo for live context.
3.  **Usage Limits:** Hard rate limits (5 analyses per user per day) are enforced at the database level to prevent runaway API costs or abuse.
*Note: The codebase currently does not implement any caching layer (e.g., Redis) for identical queries.*

## Failure Handling

The pipeline contains multiple layers of failure handling:
*   **Search Failure:** If the `ddgs` search throws an exception (due to rate limits or connection errors), the `SearchService` catches the exception, logs it, and returns a generic string ("Live search failed..."). The pipeline *continues* and prompts the AI to generate a report without live context, prioritizing uptime over perfect data.
*   **Gemini API Failure:** API connection issues or unexpected model behaviors are caught and wrapped in a custom `AIServiceError` which triggers a generic `502 Bad Gateway` response to the frontend.
*   **Validation Failure:** If `json.loads` fails or Pydantic validation fails, the `AIService` catches the error, logs a warning, and attempts to write the malformed raw string to a local file (`malformed_gemini.json`) for developer debugging. It then raises an `AIServiceError`.

## Current Limitations

1.  **Synchronous HTTP Lifecycle:** The entire pipeline (Search -> LLM -> Parse -> DB) runs sequentially during a single HTTP request lifecycle. If Gemini is slow, the HTTP request might timeout on the client side.
2.  **Fragile Parsing:** Relying on `{` and `}` string index parsing is a fragile heuristic that can break if the LLM decides to output multiple JSON blocks or includes curly braces in conversational text before the main object.
3.  **No Automatic Retries:** If the Pydantic validation fails due to a slight LLM hallucination (e.g., outputting "Moderate" instead of "Medium"), the system immediately fails the user request instead of asking the LLM to correct its output.

## Future Enhancements

Based on the actual implementation, the following architectural upgrades are recommended:
1.  **Implement Structured Outputs API:** Upgrade the `google-genai` SDK usage to leverage native structured outputs (`response_schema`). Passing the Pydantic schema directly to the Gemini API configuration guarantees structural compliance and completely eliminates the need for the manual `json_parser.py` module.
2.  **Add Retry Logic:** Implement a library like `tenacity` around the `generate_report` function to automatically retry the Gemini call (up to 2 times) if validation fails.
3.  **Asynchronous Queuing:** Move the `AIService` invocation to a background worker (e.g., Celery or FastAPI BackgroundTasks) and use polling or Server-Sent Events (SSE) to update the frontend, preventing HTTP timeouts.
