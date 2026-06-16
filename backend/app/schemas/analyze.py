"""Schemas for idea analysis endpoints."""

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AnalyzeRequest(BaseModel):
    """Request body for startup idea analysis."""

    model_config = ConfigDict(extra="forbid")

    idea_text: str = Field(..., min_length=10, max_length=1000)
    region: str | None = Field(default=None, max_length=100)
    budget_range: str | None = Field(default=None, max_length=50)

    @field_validator("idea_text")
    @classmethod
    def normalize_idea_text(cls, value: str) -> str:
        """Trim whitespace and reject blank submissions."""
        normalized = value.strip()
        if len(normalized) < 10:
            raise ValueError("Idea text must be at least 10 characters.")
        return normalized


class AnalyzeResponse(BaseModel):
    """Response returned after successful report generation."""

    report_id: str
    status: str = "success"
