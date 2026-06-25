# Simple rate limiter state to track 429 cooldowns per key
# Extracted logic here so KeyManager can use it

class RateLimiter:
    def __init__(self, cooldown_seconds: int = 60):
        self.cooldown_seconds = cooldown_seconds
