"""Gemini integration and AI report validation."""

import logging
import os
import tempfile
import uuid

from pydantic import ValidationError
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from app.core.config import Settings
from app.core.exceptions import AIServiceError
from app.schemas.report import VentureReport
from app.utils.prompt_builder import build_analysis_prompt

logger = logging.getLogger(__name__)


class AIService:
    """Service responsible for generating venture reports with Gemini."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client = None

    async def generate_report(
        self, 
        idea_text: str, 
        search_context: str = "",
        region: str | None = None,
        budget_range: str | None = None
    ) -> VentureReport:
        """Generate and validate a structured venture analysis report."""
        prompt = build_analysis_prompt(idea_text, search_context, region, budget_range)
        raw_response = await self._call_gemini(prompt)
        return self._parse_and_validate(raw_response, prompt)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True
    )
    async def _execute_with_retry(self, prompt: str):
        """Execute the actual API call with exponential backoff retries for transient errors."""
        from google.genai import types
        return await self.client.aio.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=8192,
                response_mime_type="application/json",
                response_schema=VentureReport,
            ),
        )

    async def _call_gemini(self, prompt: str) -> str:
        """Call Gemini and return the raw response text."""
        try:
            from google import genai

            if self.client is None:
                self.client = genai.Client(api_key=self.settings.gemini_api_key)

            response = await self._execute_with_retry(prompt)
        except Exception as exc:
            logger.exception("Gemini request failed after retries.")
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

    def _parse_and_validate(self, raw_response: str, prompt: str) -> VentureReport:
        """Parse raw Gemini output and validate it against the report schema."""
        try:
            return VentureReport.model_validate_json(raw_response)
        except ValidationError as exc:
            trace_id = str(uuid.uuid4())
            logger.error(f"[TraceID: {trace_id}] Invalid Gemini response validation error: {exc}")
            
            try:
                debug_dir = os.path.join(tempfile.gettempdir(), "pivotly_errors")
                os.makedirs(debug_dir, exist_ok=True)
                
                raw_path = os.path.join(debug_dir, f"{trace_id}_raw.json")
                with open(raw_path, "w") as f:
                    f.write(raw_response)
                
                prompt_path = os.path.join(debug_dir, f"{trace_id}_prompt.txt")
                with open(prompt_path, "w") as f:
                    f.write(prompt)
                    
                logger.error(f"[TraceID: {trace_id}] Debug files written to: {debug_dir}")
            except Exception as e:
                logger.error(f"[TraceID: {trace_id}] Failed to write debug files: {e}")
                
            raise AIServiceError(f"Gemini returned malformed report JSON. TraceID: {trace_id}") from exc

