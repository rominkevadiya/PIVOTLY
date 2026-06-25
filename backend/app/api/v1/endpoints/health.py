from fastapi import APIRouter
from app.services.gemini.key_manager import KeyManager

router = APIRouter()

@router.get("/health")
async def health_check():
    """Returns application health and Gemini Key Management metrics."""
    return {
        "status": "ok",
        "gemini_manager": KeyManager.get_instance().get_health_summary()
    }

@router.get("/health/metrics")
async def get_metrics():
    """Returns detailed per-key metrics."""
    return {
        "metrics": KeyManager.get_instance().get_metrics()
    }
