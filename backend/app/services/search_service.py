import logging
import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)

async def search_competitors(idea_text: str) -> str:
    """
    Search the web for competitors and market context using Tavily Search API.
    Returns a formatted string listing titles, URLs, and snippets of results.
    Falls back gracefully if the API key is missing or calls fail.
    """
    settings = get_settings()
    if not settings.tavily_api_key:
        logger.warning("TAVILY_API_KEY is not configured. Live competitor search will be skipped.")
        return "No live search results available (TAVILY_API_KEY missing)."

    url = "https://api.tavily.com/search"
    query = f"competitors for startup idea: {idea_text}"
    payload = {
        "api_key": settings.tavily_api_key,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "max_results": 5
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                if not results:
                    return "No live competitors found via web search."
                
                formatted_lines = []
                for res in results:
                    title = res.get("title", "Unknown Site")
                    link = res.get("url", "#")
                    snippet = res.get("content", "")
                    formatted_lines.append(f"- **{title}** ({link}): {snippet}")
                
                return "\n".join(formatted_lines)
            else:
                logger.error(f"Tavily search API error: {response.status_code} - {response.text}")
                return f"Live search unavailable (API status code: {response.status_code})."
    except Exception as e:
        logger.error(f"Failed to query Tavily search: {e}", exc_info=True)
        return "Live search failed to execute due to connection issue."
