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


class ReportResponse(BaseModel):
    """API response for a stored report."""

    id: UUID
    idea_text: str
    report_json: VentureReport
    industry: str
    market_potential: str
    recommendation: str
    created_at: datetime
