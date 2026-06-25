import time
import logging

logger = logging.getLogger(__name__)

class Metrics:
    """Tracks agent execution times, retries, and rate limits."""
    
    def __init__(self):
        self.agent_times = {}
        self.retries = 0
        self.cooldowns = 0

    def log_execution_time(self, agent_name: str, start_time: float, end_time: float):
        duration = end_time - start_time
        self.agent_times[agent_name] = duration
        logger.info(f"[Metrics] Agent '{agent_name}' executed in {duration:.2f}s")
        
    def log_retry(self):
        self.retries += 1
        logger.info(f"[Metrics] Request retried. Total retries: {self.retries}")
        
    def log_cooldown(self):
        self.cooldowns += 1
        logger.info(f"[Metrics] 429 Cooldown triggered. Total cooldowns: {self.cooldowns}")

# Global metrics instance for the session
global_metrics = Metrics()
