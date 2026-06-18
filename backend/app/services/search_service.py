import asyncio
import logging
import time

from ddgs import DDGS

logger = logging.getLogger(__name__)

# Simple in-memory cache for search results to avoid DDGS rate limits
_SEARCH_CACHE: dict[str, tuple[float, str]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour cache TTL


def _run_ddgs_search(query: str, max_results: int = 5) -> list[dict]:
    """Run a blocking DuckDuckGo search and return the raw result list."""
    with DDGS() as ddgs:
        return list(ddgs.text(query, max_results=max_results))


async def search_competitors(idea_text: str) -> str:
    """Search the web for competitors and market context using DuckDuckGo Search.

    Offloads the blocking DDGS call to a thread via asyncio.to_thread() so the
    FastAPI event loop is not stalled during the network I/O.

    Returns a formatted markdown string of titles, URLs, and snippets.
    """
    try:
        now = time.time()
        cache_key = idea_text.strip().lower()

        # Check cache first
        if cache_key in _SEARCH_CACHE:
            timestamp, cached_result = _SEARCH_CACHE[cache_key]
            if now - timestamp < CACHE_TTL_SECONDS:
                logger.info("Using cached web search results for idea.")
                return cached_result
            else:
                # Expired
                del _SEARCH_CACHE[cache_key]

        query = f"competitors for startup idea: {idea_text}"

        # Run the blocking DDGS sync call off the event loop
        results = await asyncio.wait_for(asyncio.to_thread(_run_ddgs_search, query), timeout=10.0)

        if not results:
            return "No live competitors found via web search."

        formatted_lines = []
        for res in results:
            title = res.get("title", "Unknown Site")
            link = res.get("href", "#")
            snippet = res.get("body", "")
            formatted_lines.append(f"- **{title}** ({link}): {snippet}")

        result_str = "\n".join(formatted_lines)
        _SEARCH_CACHE[cache_key] = (time.time(), result_str)
        return result_str
    except Exception as e:
        logger.error("Failed to query web search: %s", e, exc_info=True)
        return "Live search failed to execute due to connection issue."
