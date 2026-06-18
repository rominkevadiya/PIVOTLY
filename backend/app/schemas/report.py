"""Schemas for persisted and AI-generated reports."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Rating = Literal["High", "Medium", "Low"]
RecommendationDecision = Literal["Build", "Pivot", "Research Further", "Avoid"]


class OverviewSection(BaseModel):
    """Report overview section."""

    idea_summary: str = Field(..., min_length=1)
    one_line_pitch: str = Field(..., min_length=1)


class IndustrySection(BaseModel):
    """Industry classification section."""

    primary_industry: str = Field(..., min_length=1)
    sub_industry: str = Field(..., min_length=1)
    industry_context: str = Field(..., min_length=1)


class TargetAudienceSection(BaseModel):
    """Target audience section."""

    primary_segment: str = Field(..., min_length=1)
    secondary_segment: str = Field(..., min_length=1)
    audience_insight: str = Field(..., min_length=1)


class CompetitorItem(BaseModel):
    """Competitor entry."""

    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    strength: str = Field(..., min_length=1)
    threat_level: Rating


class MarketPotentialSection(BaseModel):
    """Market potential section."""

    rating: Rating
    rationale: str = Field(..., min_length=1)
    estimated_market_context: str = Field(..., min_length=1)
    tam: str | None = Field(default=None, description="Total Addressable Market (TAM) estimate")
    sam: str | None = Field(default=None, description="Serviceable Addressable Market (SAM) estimate")
    som: str | None = Field(default=None, description="Serviceable Obtainable Market (SOM) estimate")


class FailureRiskItem(BaseModel):
    """Failure risk entry."""

    risk: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    severity: Rating


class OpportunityGapItem(BaseModel):
    """Opportunity gap entry."""

    gap: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)


class ImprovementSuggestionItem(BaseModel):
    """Improvement suggestion entry."""

    suggestion: str = Field(..., min_length=1)
    rationale: str = Field(..., min_length=1)


class RecommendationSection(BaseModel):
    """Final recommendation section."""

    decision: RecommendationDecision
    rationale: str = Field(..., min_length=1)
    confidence: Rating


class ScoreCategory(BaseModel):
    """A scored category with reasoning."""

    score: int = Field(..., ge=1, le=10, description="Score from 1 to 10")
    reasoning: str = Field(..., min_length=1)


class ScoringRubricSection(BaseModel):
    """Idea scoring rubric."""

    market_size: ScoreCategory
    competitive_advantage: ScoreCategory
    technical_feasibility: ScoreCategory
    monetization_potential: ScoreCategory
    founder_fit: ScoreCategory
    overall_score: int = Field(..., ge=1, le=100, description="Overall score out of 100")


class ReferenceItem(BaseModel):
    """Reference link or source cited for analysis."""

    name: str = Field(..., min_length=1)
    url: str = Field(..., min_length=1)


# ── Enrichment sections ────────────────────────────────────────────────────────

class SwotSection(BaseModel):
    """Explicit AI-generated SWOT analysis."""

    strengths: list[str] = Field(..., min_length=2, max_length=5)
    weaknesses: list[str] = Field(..., min_length=2, max_length=5)
    opportunities: list[str] = Field(..., min_length=2, max_length=5)
    threats: list[str] = Field(..., min_length=2, max_length=5)


class GoToMarketPhase(BaseModel):
    """A single phase in the go-to-market plan."""

    phase: str = Field(..., min_length=1, description="e.g. 'Phase 1 – Launch'")
    duration: str = Field(..., min_length=1, description="e.g. 'Months 1-3'")
    actions: list[str] = Field(..., min_length=1, max_length=5)
    channel: str = Field(..., min_length=1, description="Primary channel, e.g. 'Product Hunt'")


class GoToMarketSection(BaseModel):
    """Go-to-market strategy broken into phases."""

    strategy_summary: str = Field(..., min_length=1)
    phases: list[GoToMarketPhase] = Field(..., min_length=2, max_length=4)


class NextStepItem(BaseModel):
    """A concrete, actionable next step."""

    priority: int = Field(..., ge=1, le=5, description="Priority rank 1 (highest) to 5")
    action: str = Field(..., min_length=1)
    rationale: str = Field(..., min_length=1)
    timeframe: str = Field(..., min_length=1, description="e.g. 'Week 1', 'Month 1-2'")


class UnitEconomicsSection(BaseModel):
    """Key unit economics estimates."""

    estimated_cac: str | None = Field(default=None, description="Customer Acquisition Cost, e.g. '$50'")
    estimated_ltv: str | None = Field(default=None, description="Lifetime Value, e.g. '$400'")
    ltv_cac_ratio: str | None = Field(default=None, description="LTV/CAC ratio, e.g. '8x'")
    payback_period: str | None = Field(default=None, description="e.g. '4 months'")
    revenue_model: str = Field(..., min_length=1, description="e.g. 'SaaS subscription, freemium'")
    pricing_notes: str = Field(..., min_length=1)


# ── Core report model ──────────────────────────────────────────────────────────

class VentureReport(BaseModel):
    """Strict report schema expected from Gemini."""

    model_config = ConfigDict(extra="forbid")

    overview: OverviewSection
    industry: IndustrySection
    target_audience: TargetAudienceSection
    competitors: list[CompetitorItem] = Field(..., min_length=3, max_length=5)
    market_potential: MarketPotentialSection
    failure_risks: list[FailureRiskItem] = Field(..., min_length=3, max_length=5)
    opportunity_gaps: list[OpportunityGapItem] = Field(..., min_length=2, max_length=3)
    improvement_suggestions: list[ImprovementSuggestionItem] = Field(..., min_length=3, max_length=3)
    recommendation: RecommendationSection
    scoring_rubric: ScoringRubricSection | None = None
    references: list[ReferenceItem] = Field(default_factory=list)
    # Optional enrichment — backward-compatible with existing stored reports
    swot: SwotSection | None = None
    go_to_market: GoToMarketSection | None = None
    next_steps: list[NextStepItem] | None = Field(default=None, max_length=5)
    unit_economics: UnitEconomicsSection | None = None


class ReportResponse(BaseModel):
    """API response for a stored report."""

    id: UUID
    idea_text: str
    report_json: VentureReport
    industry: str
    market_potential: str
    recommendation: str
    created_at: datetime


class ReportSummary(BaseModel):
    """Lightweight report summary for history list."""

    id: UUID
    idea_snippet: str
    industry: str
    market_potential: str
    recommendation: str
    overall_score: int | None = None
    created_at: datetime
