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


# Apply monkey patch to fix google-genai SDK handle_null_fields bug with nullable refs
try:
    import google.genai._transformers as transformers
    
    def patched_handle_null_fields(schema: dict):
        if schema.get('type', None) == 'null':
            schema['nullable'] = True
            schema.pop('type', None)
        elif 'anyOf' in schema:
            items_to_remove = []
            for item in schema['anyOf']:
                if 'type' in item and item['type'] == 'null':
                    schema['nullable'] = True
                    items_to_remove.append(item)
            for item in items_to_remove:
                schema['anyOf'].remove(item)
                
            if len(schema['anyOf']) == 1:
                first_item = schema.pop('anyOf')[0]
                schema.update(first_item)

    def patched_process_schema(schema: dict, client=None, defs=None):
        from enum import Enum
        # Remove fields that google.genai.types.Schema does not allow/forbids or cause too many states
        schema.pop('additionalProperties', None)
        schema.pop('default', None)
        schema.pop('minimum', None)
        schema.pop('maximum', None)
        schema.pop('minItems', None)
        schema.pop('min_items', None)
        schema.pop('maxItems', None)
        schema.pop('max_items', None)
        schema.pop('minLength', None)
        schema.pop('min_length', None)
        schema.pop('maxLength', None)
        schema.pop('max_length', None)
        if client and not client.vertexai:
            schema.pop('title', None)

        if defs is None:
            defs = schema.pop('$defs', {})
            for _, sub_schema in defs.items():
                patched_process_schema(sub_schema, client, defs)

        # 1. Process null fields (simplifies anyOf)
        patched_handle_null_fields(schema)

        # 2. Resolve direct $ref if present
        ref_key = schema.get('$ref', None)
        if ref_key is not None:
            ref_name = ref_key.split('defs/')[-1]
            if ref_name in defs:
                ref_schema = defs[ref_name]
                patched_process_schema(ref_schema, client, defs)
                schema.pop('$ref')
                schema.update({k: v for k, v in ref_schema.items() if k != '$defs'})

        # 3. Handle anyOf (if any left)
        any_of = schema.get('anyOf', None)
        if any_of is not None:
            if not client.vertexai:
                raise ValueError('AnyOf is not supported in the response schema for the Gemini API.')
            for sub_schema in any_of:
                ref_key = sub_schema.get('$ref', None)
                if ref_key is None:
                    patched_process_schema(sub_schema, client, defs)
                else:
                    ref = defs[ref_key.split('defs/')[-1]]
                    any_of.append(ref)
            schema['anyOf'] = [item for item in any_of if '$ref' not in item]
            return

        schema_type = schema.get('type', None)
        if schema_type is None:
            return
            
        if isinstance(schema_type, Enum):
            schema_type = schema_type.value
        schema_type = schema_type.upper()

        if schema_type == 'OBJECT':
            properties = schema.get('properties', None)
            if properties is None:
                return
            for name, sub_schema in properties.items():
                ref_key = sub_schema.get('$ref', None)
                if ref_key is None:
                    patched_process_schema(sub_schema, client, defs)
                else:
                    ref = defs[ref_key.split('defs/')[-1]]
                    patched_process_schema(ref, client, defs)
                    properties[name] = ref
        elif schema_type == 'ARRAY':
            sub_schema = schema.get('items', None)
            if sub_schema is None:
                return
            ref_key = sub_schema.get('$ref', None)
            if ref_key is None:
                patched_process_schema(sub_schema, client, defs)
            else:
                ref = defs[ref_key.split('defs/')[-1]]
                patched_process_schema(ref, client, defs)
                schema['items'] = ref

    transformers.handle_null_fields = patched_handle_null_fields
    transformers.process_schema = patched_process_schema
except Exception as e:
    logger.warning(f"Could not patch google.genai._transformers: {e}")


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
            logger.info(f"Initial Pydantic validation failed: {exc}. Attempting auto-repair...")
            try:
                import json
                import copy
                
                data = json.loads(raw_response)
                
                def sanitize_list(lst: list, min_val: int | None, max_val: int | None, default_factory):
                    if not isinstance(lst, list):
                        return lst
                    if max_val is not None and len(lst) > max_val:
                        lst = lst[:max_val]
                    if min_val is not None and len(lst) < min_val:
                        while len(lst) < min_val:
                            if lst:
                                lst.append(copy.deepcopy(lst[-1]))
                            else:
                                lst.append(default_factory())
                    return lst

                # Coerce fields to match VentureReport Pydantic constraints
                if 'competitors' in data:
                    data['competitors'] = sanitize_list(data['competitors'], 3, 5, lambda: {"name": "Placeholder", "category": "SaaS", "competitor_type": "Direct", "description": "Placeholder", "strength": "Placeholder", "threat_level": "Low", "reason_for_inclusion": "Placeholder", "evidence": "Placeholder", "confidence_score": 50})
                if 'failure_risks' in data:
                    data['failure_risks'] = sanitize_list(data['failure_risks'], 3, 5, lambda: {"risk": "Placeholder", "description": "Placeholder", "severity": "Low", "evidence": "Placeholder", "confidence_score": 50})
                if 'opportunity_gaps' in data:
                    data['opportunity_gaps'] = sanitize_list(data['opportunity_gaps'], 2, 3, lambda: {"gap": "Placeholder", "description": "Placeholder"})
                if 'improvement_suggestions' in data:
                    data['improvement_suggestions'] = sanitize_list(data['improvement_suggestions'], 3, 3, lambda: {"suggestion": "Placeholder", "rationale": "Placeholder"})
                
                if isinstance(data.get('contrarian_analysis'), dict):
                    ca = data['contrarian_analysis']
                    for k in ['counterarguments', 'alternative_interpretations', 'recommendation_risks']:
                        if k in ca:
                            ca[k] = sanitize_list(ca[k], 2, None, lambda: "Placeholder")
                            
                if isinstance(data.get('investor_verdict'), dict):
                    iv = data['investor_verdict']
                    for k in ['expected_concerns', 'potential_strengths']:
                        if k in iv:
                            iv[k] = sanitize_list(iv[k], 2, None, lambda: "Placeholder")

                if isinstance(data.get('swot'), dict):
                    sw = data['swot']
                    for k in ['strengths', 'weaknesses', 'opportunities', 'threats']:
                        if k in sw:
                            sw[k] = sanitize_list(sw[k], 2, 5, lambda: "Placeholder")

                if isinstance(data.get('go_to_market'), dict):
                    gtm = data['go_to_market']
                    if 'phases' in gtm:
                        gtm['phases'] = sanitize_list(gtm['phases'], 2, 4, lambda: {"phase": "Phase", "duration": "1 month", "actions": ["Action"], "channel": "Direct"})
                        for p in gtm['phases']:
                            if isinstance(p, dict) and 'actions' in p:
                                p['actions'] = sanitize_list(p['actions'], 1, 5, lambda: "Action")

                if 'next_steps' in data and data['next_steps'] is not None:
                    data['next_steps'] = sanitize_list(data['next_steps'], None, 5, lambda: {"priority": 1, "action": "Action", "rationale": "Rationale", "timeframe": "Week 1"})

                validated = VentureReport.model_validate(data)
                logger.info("Auto-repair and validation succeeded!")
                return validated
            except Exception as repair_exc:
                logger.error(f"Failed to auto-repair JSON: {repair_exc}")

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

