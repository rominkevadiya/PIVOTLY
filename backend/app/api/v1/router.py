"""API v1 router composition."""

from fastapi import APIRouter

from app.api.v1.endpoints import analyze, reports

api_router = APIRouter()
api_router.include_router(analyze.router, tags=["analysis"])
api_router.include_router(reports.router, tags=["reports"])
