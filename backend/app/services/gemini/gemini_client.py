import logging
import time
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.services.gemini.key_manager import KeyManager, NoAvailableGeminiKey
from app.services.gemini.metrics import global_metrics
from app.core.config import Settings

logger = logging.getLogger(__name__)

class GeminiScheduler:
    """A lightweight scheduler that orchestrates requests using available keys from KeyManager."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.key_manager = KeyManager.get_instance()
        
    async def schedule(self, prompt: str, schema_class, agent_name: str) -> str:
        """Executes a request by finding an available key and handling retries/429s."""
        max_attempts = 5
        attempt = 0
        
        mode = self.key_manager.current_execution_mode().value
        
        while attempt < max_attempts:
            attempt += 1
            
            # Non-blocking acquire. Will raise NoAvailableGeminiKey if none available,
            # which bubbles up to ReportService to trigger WAITING_FOR_API state.
            key = self.key_manager.try_acquire_key()
            identifier = self.key_manager.get_identifier(key)
            
            client = genai.Client(
                api_key=key, 
                http_options={'timeout': self.settings.gemini_timeout_seconds}
            )
            start_time = time.time()
            cooldown_triggered = False
            result_status = "FAILED"
            
            try:
                response = await self._execute_with_retry(client, prompt, schema_class)
                latency = time.time() - start_time
                self.key_manager.release_key(key, latency=latency, success=True)
                
                try:
                    if response.candidates:
                        candidate = response.candidates[0]
                        if getattr(candidate, "finish_reason", None) not in ("STOP", None, "stop"):
                            logger.warning(f"Gemini generation stopped with reason: {candidate.finish_reason}")
                except Exception:
                    pass
                    
                if not response.text:
                    raise ValueError("Gemini returned an empty response.")
                    
                result_status = "SUCCESS"
                
                logger.info(f"Mode:\n{mode}\n\nAgent:\n{agent_name}\n\nKey:\n{identifier}\n\nLatency:\n{latency:.2f} sec\n\nRetries:\n{attempt-1}\n\nStatus:\n{result_status}")
                return response.text
                
            except APIError as e:
                latency = time.time() - start_time
                if e.code == 429: # Rate limit
                    global_metrics.log_cooldown()
                    self.key_manager.mark_rate_limited(key, cooldown_seconds=60)
                    cooldown_triggered = True
                    logger.info(f"Mode:\n{mode}\n\nAgent:\n{agent_name}\n\nKey:\n{identifier}\n\nLatency:\n{latency:.2f} sec\n\nRetries:\n{attempt-1}\n\nCooldown Triggered:\nTrue\n\nStatus:\nRATE_LIMITED")
                    # Loop again to get a different key
                    continue
                else:
                    self.key_manager.release_key(key, latency=latency, success=False)
                    logger.error(f"Mode:\n{mode}\n\nAgent:\n{agent_name}\n\nKey:\n{identifier}\n\nLatency:\n{latency:.2f} sec\n\nStatus:\n{result_status}")
                    raise
            except Exception as e:
                latency = time.time() - start_time
                self.key_manager.release_key(key, latency=latency, success=False)
                if attempt >= max_attempts:
                    logger.error(f"Mode:\n{mode}\n\nAgent:\n{agent_name}\n\nKey:\n{identifier}\n\nLatency:\n{latency:.2f} sec\n\nStatus:\n{result_status}")
                    raise
                global_metrics.log_retry()
                continue
                
        raise Exception("Max attempts reached trying to schedule content generation.")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True
    )
    async def _execute_with_retry(self, client, prompt: str, schema_class):
        """Execute the actual API call with exponential backoff retries for transient errors."""
        return await client.aio.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=32768,
                response_mime_type="application/json",
                response_schema=schema_class,
            ),
        )
