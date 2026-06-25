"""Schemas for persisted and AI-generated reports."""

from datetime import datetime
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Rating = Literal["High", "Medium", "Low"]
RecommendationDecision = Literal["Build", "Pivot", "Research Further", "Avoid"]

class ReportStatus(str, Enum):
    PENDING = "PENDING"
    SCRAPING = "SCRAPING"
    WAITING_FOR_API = "WAITING_FOR_API"
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class OverviewSection(BaseModel):
    """Report overview section."""

    idea_summary: str = Field(..., min_length=1)
    one_line_pitch: str = Field(..., min_length=1)


class IndustrySection(BaseModel):
    """Industry classification section."""

    primary_industry: str = Field(..., min_length=1)
    sub_industry: str = Field(..., min_length=1)
    industry_context: str = Field(..., min_length=1)
    confidence_score: int = Field(..., ge=1, le=100)


class TargetAudienceSection(BaseModel):
    """Target audience section."""

    primary_segment: str = Field(..., min_length=1)
    secondary_segment: str = Field(..., min_length=1)
    audience_insight: str = Field(..., min_length=1)
    confidence_score: int | None = Field(default=None, ge=1, le=100)


class CompetitorItem(BaseModel):
    """Simplified competitor entry."""

    name: str = Field(..., min_length=1)
    website: str | None = Field(default=None, description="URL of the competitor website")
    competitor_type: Literal["Direct", "Indirect", "Substitute"] = Field(..., description="Classification of competitive threat")
    description: str = Field(..., min_length=1)
    threat_level: Rating


class MarketPotentialSection(BaseModel):
    """Market potential section."""

    rating: Rating
    rationale: str = Field(..., min_length=1)
    estimated_market_context: str = Field(..., min_length=1)
    tam: str | None = Field(default=None, description="Total Addressable Market (TAM) estimate")
    sam: str | None = Field(default=None, description="Serviceable Addressable Market (SAM) estimate")
    som: str | None = Field(default=None, description="Serviceable Obtainable Market (SOM) estimate")
    evidence: str = Field(..., description="A direct quote or data point proving the market size.")
    source_url: str | None = Field(default=None, description="URL source for the evidence")
    confidence_score: int = Field(..., ge=1, le=100)


class FailureRiskItem(BaseModel):
    """Failure risk entry."""

    title: str = Field(..., min_length=1)
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
    evidence: str = Field(..., description="Evidence supporting this recommendation.")
    confidence: Rating
    confidence_score: int = Field(..., ge=1, le=100)


class ScoringRubricSection(BaseModel):
    """Idea scoring rubric."""

    market_size_score: int = Field(..., ge=1, le=10, description="Score from 1 to 10")
    competitive_advantage_score: int = Field(..., ge=1, le=10, description="Score from 1 to 10")
    technical_feasibility_score: int = Field(..., ge=1, le=10, description="Score from 1 to 10")
    monetization_potential_score: int = Field(..., ge=1, le=10, description="Score from 1 to 10")
    founder_fit_score: int = Field(..., ge=1, le=10, description="Score from 1 to 10")
    overall_score: int = Field(..., ge=1, le=100, description="Overall score out of 100")
    overall_rationale: str = Field(..., min_length=1, description="Global rationale for these scores")


class SwotSection(BaseModel):
    """Explicit AI-generated SWOT analysis."""

    strengths: list[str] = Field(..., min_length=1, max_length=3)
    weaknesses: list[str] = Field(..., min_length=1, max_length=3)
    opportunities: list[str] = Field(..., min_length=1, max_length=3)
    threats: list[str] = Field(..., min_length=1, max_length=3)


class GoToMarketSection(BaseModel):
    """Go-to-market strategy broken into marketing phases."""

    strategy_summary: str = Field(..., min_length=1)
    phases: list[str] = Field(..., min_length=1, max_length=4, description="E.g. ['Phase 1: Product Hunt Launch - Actions...', 'Phase 2: Growth...']")


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


class InvestorVerdictSection(BaseModel):
    """Investor verdict and reasoning."""

    would_invest: bool
    investment_confidence: int = Field(..., ge=1, le=100)
    investment_reasoning: str = Field(..., min_length=1)
    expected_concerns: list[str] = Field(..., min_length=1, max_length=3, description="What an investor will grill you on")
    potential_strengths: list[str] = Field(..., min_length=1, max_length=3, description="What an investor loves about this")


# ── Core report model ──────────────────────────────────────────────────────────

class VentureReportV1(BaseModel):
    """Simplified report schema expected from Gemini."""

    model_config = ConfigDict(extra="allow")  # Allows backward compatibility with extra fields in stored reports

    overview: OverviewSection
    industry: IndustrySection
    target_audience: TargetAudienceSection
    competitors: list[CompetitorItem] = Field(..., min_length=1, max_length=5)
    market_potential: MarketPotentialSection
    failure_risks: list[FailureRiskItem] = Field(..., min_length=3, max_length=5)
    opportunity_gaps: list[OpportunityGapItem] = Field(..., min_length=2, max_length=3)
    improvement_suggestions: list[ImprovementSuggestionItem] = Field(..., min_length=1, max_length=5)
    recommendation: RecommendationSection
    scoring_rubric: ScoringRubricSection | None = None
    # Enrichment sections — backward-compatible with existing stored reports
    swot: SwotSection | None = None
    go_to_market: GoToMarketSection | None = None
    next_steps: list[NextStepItem] | None = Field(default=None, max_length=5)
    unit_economics: UnitEconomicsSection | None = None
    investor_verdict: InvestorVerdictSection | None = None


class Evidence(BaseModel):
    """Citation or proof for an analysis point."""
    claim: str = Field(..., description="The specific claim being made")
    source_url: str | None = Field(default=None, description="URL source if available")
    reliability: Rating = Field(..., description="High/Medium/Low based on the source quality")


class ResearchContext(BaseModel):
    """Processed output from Tavily."""
    market_overview: str
    target_demographics: list[str]
    market_size_indicators: list[Evidence]
    key_trends: list[str]


class V2CompetitorItem(BaseModel):
    name: str
    website: str | None = None
    copy_risk: Rating
    threat_level: Rating
    differentiator_weakness: str
    evidence_list: list[Evidence]


class CompetitorAnalysis(BaseModel):
    competitors: list[V2CompetitorItem]
    market_saturation: Rating
    summary: str


class MoatAnalysis(BaseModel):
    network_effects: str | None = None
    switching_costs: str | None = None
    brand_power: str | None = None
    overall_defensibility: Rating
    evidence_list: list[Evidence]


class ContrarianAnalysis(BaseModel):
    critical_assumptions: list[str]
    why_it_might_fail: list[str]
    hidden_risks: list[str]
    evidence_list: list[Evidence]


class SectionError(BaseModel):
    """Fallback schema for an agent section that failed to generate."""
    status: Literal["UNAVAILABLE"] = "UNAVAILABLE"
    error: str


class ActionPlan(BaseModel):
    """Actionable execution steps derived from the analysis."""
    go_to_market_phases: list[str] = Field(..., min_length=1, max_length=4)
    unit_economics_cac: str | None = None
    unit_economics_ltv: str | None = None
    unit_economics_payback: str | None = None
    next_steps: list[NextStepItem] = Field(..., min_length=1, max_length=5)
    founder_recommendation: str = Field(..., description="Actionable advice for the founder")


class VentureReportV2(BaseModel):
    """V2 Venture Intelligence Engine Output"""
    model_config = ConfigDict(extra="allow")

    idea_summary: str
    research_context: ResearchContext | SectionError | None = None
    competitor_analysis: CompetitorAnalysis | SectionError | None = None
    moat_analysis: MoatAnalysis | SectionError | None = None
    contrarian_analysis: ContrarianAnalysis | SectionError | None = None
    action_plan: ActionPlan | SectionError | None = None
    scoring_rubric: ScoringRubricSection | SectionError | None = None
    recommendation: RecommendationSection | SectionError | None = None


class ReportResponse(BaseModel):
    """API response for a stored report."""

    id: UUID
    status: ReportStatus
    schema_version: int = 1
    error_message: str | None = None
    idea_text: str
    report_json: VentureReportV1 | VentureReportV2 | None = None
    industry: str | None = None
    market_potential: str | None = None
    recommendation: str | None = None
    created_at: datetime


class ReportSummary(BaseModel):
    """Lightweight report summary for history list."""

    id: UUID
    status: ReportStatus
    schema_version: int = 1
    error_message: str | None = None
    idea_snippet: str
    industry: str | None = None
    market_potential: str | None = None
    recommendation: str | None = None
    overall_score: int | None = None
    created_at: datetime

