from fastapi import APIRouter, Depends
from app.services.gemini.key_manager import KeyManager
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/health")
async def health_check():
    """Returns application health and Gemini Key Management metrics."""
    return {
        "status": "ok",
        "gemini_manager": KeyManager.get_instance().get_health_summary()
    }

@router.get("/health/metrics")
async def get_metrics(current_user: User = Depends(get_current_user)):
    """Returns detailed per-key metrics."""
    return {
        "metrics": KeyManager.get_instance().get_metrics()
    }
