"""Evidence Ledger schema for structured inter-agent context passing."""

from pydantic import BaseModel, Field
from app.schemas.report import Evidence


class EvidenceLedger(BaseModel):
    """Structured evidence collected by the Research Agent for consumption by downstream agents.
    
    This ledger provides a typed, validated alternative to passing raw search text between
    agents. In Phase 1, it is generated alongside the raw search context (not replacing it),
    to allow gradual migration toward fully structured inter-agent communication.
    
    Future phases will have Competitor, Moat, and Contrarian agents consume this ledger
    directly instead of re-parsing raw search strings.
    """
    
    # Market sizing evidence — directly feeds ScoringService.calculate_score()
    market_size_indicators: list[Evidence] = Field(
        default_factory=list,
        description="Evidence objects for market TAM/SAM/SOM figures."
    )
    
    # Named competitors surfaced by research — pre-seeds Competitor Agent
    known_competitor_references: list[str] = Field(
        default_factory=list,
        description="Competitor names or websites found in search results."
    )
    
    # Source URLs available in search data — used to validate citations downstream
    available_source_urls: list[str] = Field(
        default_factory=list,
        description="All URLs present in the raw search data, for citation validation."
    )
    
    # Risk signals surfaced during research — pre-seeds Contrarian Agent
    risk_signals: list[str] = Field(
        default_factory=list,
        description="Early risk signals or red flags found during research."
    )
    
    # Market trend summaries — available to all downstream agents
    trends: list[str] = Field(
        default_factory=list,
        description="Key market trends extracted during research."
    )
    
    # Raw search text preserved for backward compatibility during Phase 1 transition
    raw_search_context: str = Field(
        default="",
        description="Original raw search context string. Preserved for backward compatibility."
    )
