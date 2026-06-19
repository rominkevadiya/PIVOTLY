import asyncio
import logging
import time

import httpx
from ddgs import DDGS

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Simple in-memory cache for search results to avoid DDGS rate limits
_SEARCH_CACHE: dict[str, tuple[float, str]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour cache TTL


async def _tavily_search(query: str, api_key: str, max_results: int = 5) -> list[dict]:
    """Execute a search against the Tavily API."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "search_depth": "advanced",
                "include_answer": False,
                "include_raw_content": False,
                "max_results": max_results,
            }
        )
        response.raise_for_status()
        data = response.json()
        results = []
        for res in data.get("results", []):
            results.append({
                "title": res.get("title", ""),
                "href": res.get("url", ""),
                "body": res.get("content", "")
            })
        return results


def _run_ddgs_search(query: str, max_results: int = 5) -> list[dict]:
    """Run a blocking DuckDuckGo search and return the raw result list."""
    with DDGS() as ddgs:
        return list(ddgs.text(query, max_results=max_results))


async def _execute_search(query: str, max_results: int = 4) -> str:
    """Try Tavily first, fallback to DDGS."""
    settings = get_settings()
    results = []
    
    if settings.tavily_api_key:
        try:
            results = await _tavily_search(query, settings.tavily_api_key, max_results)
        except Exception as e:
            logger.warning(f"Tavily search failed for query '{query}': {e}. Falling back to DDGS.")
    
    if not results:
        try:
            results = await asyncio.wait_for(asyncio.to_thread(_run_ddgs_search, query, max_results), timeout=10.0)
        except Exception as e:
            logger.error(f"DDGS fallback failed for query '{query}': {e}")
            return f"Search failed for: {query}"

    if not results:
        return f"No results found for: {query}"

    formatted_lines = [f"### Context for: {query}"]
    for res in results:
        title = res.get("title", "Unknown Site")
        link = res.get("href", "#")
        snippet = res.get("body", "")
        if len(snippet) > 300:
            snippet = snippet[:300] + "..."
        formatted_lines.append(f"- **{title}** ({link}): {snippet}")
    
    return "\n".join(formatted_lines)


async def search_venture_context(idea_text: str) -> str:
    """Search the web for multi-dimensional context on a venture idea."""
    now = time.time()
    cache_key = idea_text.strip().lower()

    if cache_key in _SEARCH_CACHE:
        timestamp, cached_result = _SEARCH_CACHE[cache_key]
        if now - timestamp < CACHE_TTL_SECONDS:
            logger.info("Using cached web search results for idea.")
            return cached_result
        else:
            del _SEARCH_CACHE[cache_key]

    # Execute multiple queries concurrently to build a comprehensive context picture
    queries = [
        f"{idea_text} competitors pricing features",
        f"{idea_text} market size TAM CAGR report",
        f"{idea_text} startup failures regulatory risks"
    ]
    
    results = await asyncio.gather(*[_execute_search(q) for q in queries])
    
    combined_result = "\n\n".join(results)
    _SEARCH_CACHE[cache_key] = (now, combined_result)
    return combined_result
