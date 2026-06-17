import asyncio
import logging

from ddgs import DDGS

logger = logging.getLogger(__name__)


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
        query = f"competitors for startup idea: {idea_text}"

        # Run the blocking DDGS sync call off the event loop
        results = await asyncio.to_thread(_run_ddgs_search, query)

        if not results:
            return "No live competitors found via web search."

        formatted_lines = []
        for res in results:
            title = res.get("title", "Unknown Site")
            link = res.get("href", "#")
            snippet = res.get("body", "")
            formatted_lines.append(f"- **{title}** ({link}): {snippet}")

        return "\n".join(formatted_lines)
    except Exception as e:
        logger.error("Failed to query web search: %s", e, exc_info=True)
        return "Live search failed to execute due to connection issue."
