"""Evidence Ledger schema for structured inter-agent context passing.

Phase 2.5: EvidenceLedger is now populated by the Research Agent and threaded
through the orchestration DAG. Competitor, Moat, and Contrarian agents consume
this typed ledger instead of raw search context strings.

The raw_search_context field is preserved so the Action Agent (which only needs
scoring data, not search context) and any future fallback paths continue to work.
"""

from pydantic import BaseModel, Field
from app.schemas.report import Evidence


class EvidenceLedger(BaseModel):
    """Structured evidence collected by the Research Agent.

    Replaces the raw `research_context_json` string that was previously passed
    between agents. Provides typed, validated inter-agent context with no
    redundant full-search-context re-injection.

    Fields map directly to the six categories required by Phase 2.5:
      market_indicators, competitor_references, citations, risk_signals,
      trend_signals, available_source_urls.
    """

    # 1. Market sizing evidence — feeds ScoringService and Competitor Agent
    market_indicators: list[Evidence] = Field(
        default_factory=list,
        description="Evidence objects for market TAM/SAM/SOM figures.",
    )

    # 2. Named competitors surfaced by research — pre-seeds Competitor Agent
    competitor_references: list[str] = Field(
        default_factory=list,
        description="Competitor names or websites identified during research.",
    )

    # 3. Validated citations from the research phase — shared with all downstream agents
    citations: list[Evidence] = Field(
        default_factory=list,
        description="All Evidence objects produced during research, with claim + source_url.",
    )

    # 4. Risk signals — pre-seeds Contrarian Agent
    risk_signals: list[str] = Field(
        default_factory=list,
        description="Early risk signals or red flags found during research.",
    )

    # 5. Market trend signals — available to all downstream agents
    trend_signals: list[str] = Field(
        default_factory=list,
        description="Key market trends extracted during research.",
    )

    # 6. All URLs from search data — for citation validation by downstream agents
    available_source_urls: list[str] = Field(
        default_factory=list,
        description="All URLs present in the raw search data, for citation validation.",
    )

    # Preserved for backward compatibility and fallback (not injected into agent prompts)
    raw_search_context: str = Field(
        default="",
        description=(
            "Original raw search context string. "
            "Not injected into agent prompts in Phase 2.5+. "
            "Preserved for debugging and fallback paths."
        ),
    )

    def to_prompt_block(self) -> str:
        """Render the ledger as a compact, structured prompt section.

        Produces a token-efficient representation that downstream agents can
        consume instead of the full raw search context string.
        """
        lines: list[str] = ["## EVIDENCE LEDGER (from Research Agent)"]

        if self.market_indicators:
            lines.append("\n### Market Size Indicators")
            for ev in self.market_indicators:
                url_part = f" [source: {ev.source_url}]" if ev.source_url else ""
                lines.append(f"- [{ev.reliability}] {ev.claim}{url_part}")

        if self.competitor_references:
            lines.append("\n### Known Competitor References")
            for ref in self.competitor_references:
                lines.append(f"- {ref}")

        if self.trend_signals:
            lines.append("\n### Market Trend Signals")
            for trend in self.trend_signals:
                lines.append(f"- {trend}")

        if self.risk_signals:
            lines.append("\n### Risk Signals")
            for risk in self.risk_signals:
                lines.append(f"- {risk}")

        if self.available_source_urls:
            lines.append("\n### Available Source URLs (cite only from this list)")
            for url in self.available_source_urls:
                lines.append(f"- {url}")

        return "\n".join(lines)
