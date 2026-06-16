"""Helpers for extracting JSON from AI responses."""

import json
import re
from typing import Any


def parse_json_object(raw_text: str) -> dict[str, Any]:
    """Parse a JSON object, tolerating fenced JSON blocks from model output."""
    cleaned = raw_text.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, flags=re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("AI response must be a JSON object.")
    return parsed
