import os
import asyncio
import logging
import time
from dotenv import load_dotenv
from app.services.gemini.execution_mode import ExecutionMode

logger = logging.getLogger(__name__)

class NoAvailableGeminiKey(Exception):
    """Raised when no Gemini keys are available (all in use, rate-limited, or disabled)."""
    pass

class KeyManager:
    _instance = None
    
    def __init__(self):
        self._keys = []
        self._key_status = {} 
        self._key_metrics = {}
        self._lock = asyncio.Lock()
        self._discover_keys()
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = KeyManager()
        return cls._instance
        
    def _mask_key(self, key: str) -> str:
        if not key:
            return "UNKNOWN"
        return key[:4] + "***" + key[-4:] if len(key) > 8 else "***"
        
    def _discover_keys(self):
        load_dotenv()
        found_keys = []
        
        if "GEMINI_API_KEY" in os.environ:
            found_keys.append(os.environ["GEMINI_API_KEY"])
            
        i = 1
        while True:
            key = os.environ.get(f"GEMINI_API_KEY_{i}")
            if key:
                if key not in found_keys:
                    found_keys.append(key)
                i += 1
            else:
                break
                
        deduped = []
        for k in found_keys:
            if k not in deduped:
                deduped.append(k)
                
        self._keys = deduped
        
        for i, key in enumerate(self._keys):
            self._key_status[key] = {"status": "available", "cooldown_until": 0}
            identifier = f"KEY_{i+1}"
            self._key_metrics[key] = {
                "requests": 0,
                "successes": 0,
                "failures": 0,
                "rate_limits": 0,
                "cooldowns": 0,
                "total_latency": 0.0,
                "avg_latency": 0.0,
                "last_used": None,
                "identifier": identifier,
                "masked": self._mask_key(key)
            }
            
        logger.info(f"Discovered {len(self._keys)} configured Gemini API keys.")
        logger.info(f"Detected Execution Mode: {self.current_execution_mode().value}")
        
    async def startup_validate(self):
        """Validate every configured key with a lightweight test request."""
        from google import genai
        from app.core.config import get_settings
        
        settings = get_settings()
        
        logger.info(f"Starting Gemini Keys Validation for model {settings.gemini_model}...")
        for key in self._keys:
            identifier = self._key_metrics[key]["identifier"]
            client = genai.Client(api_key=key)
            try:
                await client.aio.models.generate_content(
                    model=settings.gemini_model, 
                    contents="Ping"
                )
                self._key_status[key]["status"] = "available"
                logger.info(f"{identifier} ({self._key_metrics[key]['masked']}): Healthy")
            except Exception as e:
                error_str = str(e).lower()
                if "429" in error_str or "quota" in error_str:
                    self._key_status[key]["status"] = "rate_limited"
                    self._key_status[key]["cooldown_until"] = time.time() + 60
                    logger.warning(f"{identifier} ({self._key_metrics[key]['masked']}): Cooldown (Rate Limited during startup)")
                elif "403" in error_str or "401" in error_str or "invalid" in error_str:
                    self._key_status[key]["status"] = "invalid"
                    logger.error(f"{identifier} ({self._key_metrics[key]['masked']}): Invalid Authentication")
                else:
                    self._key_status[key]["status"] = "invalid"
                    logger.error(f"{identifier} ({self._key_metrics[key]['masked']}): Failed Validation - {e}")
                    
        logger.info(f"Startup Validation Complete. Execution Mode: {self.current_execution_mode().value}")
        
    def configured_key_count(self) -> int:
        return len(self._keys)
        
    def current_execution_mode(self) -> ExecutionMode:
        count = self.configured_key_count()
        if count <= 1:
            return ExecutionMode.ECONOMY
        elif count == 2:
            return ExecutionMode.BALANCED
        else:
            return ExecutionMode.PERFORMANCE
            
    def try_acquire_key(self) -> str:
        """Attempt to acquire a key immediately. Raises NoAvailableGeminiKey if none available."""
        now = time.time()
        for key in self._keys:
            status = self._key_status[key]
            if status["status"] == "rate_limited" and now > status["cooldown_until"]:
                status["status"] = "available"
                
        for key in self._keys:
            if self._key_status[key]["status"] == "available":
                self._key_status[key]["status"] = "in_use"
                self._key_metrics[key]["requests"] += 1
                self._key_metrics[key]["last_used"] = now
                return key
                
        raise NoAvailableGeminiKey("No available Gemini API keys. All keys are in use, rate-limited, or invalid.")
            
    def release_key(self, key: str, latency: float = 0.0, success: bool = True):
        if key in self._key_status and self._key_status[key]["status"] == "in_use":
            self._key_status[key]["status"] = "available"
        if key in self._key_metrics:
            if success:
                self._key_metrics[key]["successes"] += 1
            else:
                self._key_metrics[key]["failures"] += 1
                
            if latency > 0:
                self._key_metrics[key]["total_latency"] += latency
                reqs = self._key_metrics[key]["requests"]
                if reqs > 0:
                    self._key_metrics[key]["avg_latency"] = self._key_metrics[key]["total_latency"] / reqs
                
    def mark_rate_limited(self, key: str, cooldown_seconds: int = 60):
        if key in self._key_status:
            self._key_status[key]["status"] = "rate_limited"
            self._key_status[key]["cooldown_until"] = time.time() + cooldown_seconds
        if key in self._key_metrics:
            self._key_metrics[key]["rate_limits"] += 1
            self._key_metrics[key]["cooldowns"] += 1
            identifier = self._key_metrics[key]["identifier"]
            logger.warning(f"Key {identifier} rate limited (429). Cooldown for {cooldown_seconds}s.")

    def get_metrics(self) -> dict:
        """Return per-key metrics keyed by identifier (e.g. KEY_1), never by raw key value."""
        sanitized = {}
        for _raw_key, data in self._key_metrics.items():
            identifier = data.get("identifier", "KEY_UNKNOWN")
            sanitized[identifier] = {
                k: v for k, v in data.items() if k not in ("masked",)
            }
        return sanitized
        
    def get_health_summary(self) -> dict:
        healthy = 0
        unavailable = 0
        cooldowns = 0
        now = time.time()
        
        for key in self._keys:
            st = self._key_status[key]["status"]
            if st in ("available", "in_use"):
                healthy += 1
            elif st == "rate_limited":
                if now > self._key_status[key]["cooldown_until"]:
                    healthy += 1
                else:
                    unavailable += 1
                    cooldowns += 1
            else:
                unavailable += 1
                
        total_latency = sum(m["avg_latency"] for m in self._key_metrics.values())
        avg_latency = total_latency / len(self._keys) if self._keys else 0.0
        
        return {
            "Configured Keys": len(self._keys),
            "Healthy Keys": healthy,
            "Unavailable Keys": unavailable,
            "Execution Mode": self.current_execution_mode().value,
            "Current Cooldowns": cooldowns,
            "Average Latency": round(avg_latency, 2)
        }
