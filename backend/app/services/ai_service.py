"""Gemini integration and AI report validation."""

import logging

from pydantic import ValidationError

from app.core.config import Settings
from app.core.exceptions import AIServiceError
from app.schemas.report import VentureReport
from app.utils.json_parser import parse_json_object
from app.utils.prompt_builder import build_analysis_prompt

logger = logging.getLogger(__name__)


class AIService:
    """Service responsible for generating venture reports with Gemini."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client = None

    def generate_report(self, idea_text: str, search_context: str = "") -> VentureReport:
        """Generate and validate a structured venture analysis report."""
        prompt = build_analysis_prompt(idea_text, search_context)
        raw_response = self._call_gemini(prompt)
        return self._parse_and_validate(raw_response)

    def _call_gemini(self, prompt: str) -> str:
        """Call Gemini and return the raw response text."""
        try:
            from google import genai
            from google.genai import types

            if self.client is None:
                self.client = genai.Client(api_key=self.settings.gemini_api_key)

            response = self.client.models.generate_content(
                model=self.settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.4,
                    max_output_tokens=4000,
                    response_mime_type="application/json",
                ),
            )
        except Exception as exc:
            logger.exception("Gemini request failed.")
            raise AIServiceError("Gemini request failed.") from exc

        try:
            if response.candidates:
                candidate = response.candidates[0]
                logger.info(f"Gemini finish reason: {candidate.finish_reason}")
                if getattr(candidate, "finish_reason", None) not in ("STOP", None, "stop"):
                    logger.warning(f"Gemini generation stopped with reason: {candidate.finish_reason}")
        except Exception as e:
            logger.warning(f"Could not read candidate metadata: {e}")

        if not response.text:
            logger.error("Gemini returned an empty response.")
            raise AIServiceError("Gemini returned an empty response.")
        return response.text

    def _parse_and_validate(self, raw_response: str) -> VentureReport:
        """Parse raw Gemini output and validate it against the report schema."""
        try:
            parsed = parse_json_object(raw_response)
            return VentureReport.model_validate(parsed)
        except (ValueError, ValidationError) as exc:
            logger.warning("Invalid Gemini response: %s", exc)
            logger.warning("Malformed Gemini payload: %s", raw_response)
            try:
                with open("/home/meetpatel/ROMIN/personal_project/Pivotly/backend/malformed_gemini.json", "w") as f:
                    f.write(raw_response)
            except Exception:
                pass
            raise AIServiceError("Gemini returned malformed report JSON.") from exc

