"""Helpers for extracting JSON from AI responses."""

import json
import re
from typing import Any


def parse_json_object(raw_text: str) -> dict[str, Any]:
    """Parse a JSON object, tolerating fenced JSON blocks and surrounding conversational text."""
    cleaned = raw_text.strip()
    
    # Extract substring between first '{' and last '}'
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        cleaned = cleaned[start_idx:end_idx + 1]

    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("AI response must be a JSON object.")
    return parsed
