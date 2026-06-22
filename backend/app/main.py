"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    from app.core.database import SessionLocal
    from app.models.report import Report
    from app.schemas.report import ReportStatus
    import logging
    
    logger = logging.getLogger(__name__)
    db = SessionLocal()
    try:
        stuck_reports = db.query(Report).filter(
            Report.status.in_([ReportStatus.SCRAPING.value, ReportStatus.GENERATING.value])
        ).all()
        
        count = 0
        for report in stuck_reports:
            report.status = ReportStatus.FAILED.value
            report.error_message = "Server restarted during report generation. Please retry the analysis."
            count += 1
            
        if count > 0:
            db.commit()
            logger.info(f"Recovered {count} stuck reports after server restart.")
    except Exception as e:
        logger.error(f"Failed to recover stuck reports: {e}")
        db.rollback()
    finally:
        db.close()
        
    yield

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title=settings.project_name,
        version=settings.api_version,
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url="/redoc" if settings.environment == "development" else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    # Request-level rate limiting (Layer 2)
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # Mount Model Context Protocol (MCP) Server endpoints
    from app.mcp_server import mcp_router, mcp_sse
    app.include_router(mcp_router, prefix="/api/v1/mcp")
    app.mount("/api/v1/mcp/messages", mcp_sse.handle_post_message)

    return app


app = create_app()
