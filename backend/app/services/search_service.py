import logging
from ddgs import DDGS
from app.core.config import get_settings

logger = logging.getLogger(__name__)

async def search_competitors(idea_text: str) -> str:
    """
    Search the web for competitors and market context using DuckDuckGo Search.
    Returns a formatted string listing titles, URLs, and snippets of results.
    """
    try:
        query = f"competitors for startup idea: {idea_text}"
        
        # Use DDGS for search (runs synchronously but wrapped in async function)
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=5):
                results.append(r)

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
        logger.error(f"Failed to query web search: {e}", exc_info=True)
        return "Live search failed to execute due to connection issue."
