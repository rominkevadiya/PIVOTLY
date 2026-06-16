"""FastAPI-based MCP Server module."""

import json
import uuid
from fastapi import APIRouter, Request
from mcp.server.fastmcp import FastMCP
from mcp.server.sse import SseServerTransport

from app.core.database import SessionLocal
from app.models.report import Report
from app.schemas.report import VentureReport

mcp_server = FastMCP("Pivotly MCP Server")

@mcp_server.tool()
def list_reports(limit: int = 10) -> str:
    """List the most recent venture reports.
    
    Args:
        limit: The maximum number of reports to list.
    """
    with SessionLocal() as db:
        reports = db.query(Report).order_by(Report.created_at.desc()).limit(limit).all()
        result = []
        for r in reports:
            result.append({
                "id": str(r.id),
                "idea_snippet": r.idea_text[:100] + "..." if len(r.idea_text) > 100 else r.idea_text,
                "industry": r.industry,
                "market_potential": r.market_potential,
                "recommendation": r.recommendation,
                "created_at": r.created_at.isoformat()
            })
        return json.dumps(result, indent=2)

@mcp_server.tool()
def search_reports(query: str, limit: int = 5) -> str:
    """Search for reports containing a query string in the idea description or industry.
    
    Args:
        query: The search query string.
        limit: The maximum number of search results to return.
    """
    with SessionLocal() as db:
        reports = (
            db.query(Report)
            .filter(
                (Report.idea_text.ilike(f"%{query}%")) |
                (Report.industry.ilike(f"%{query}%"))
            )
            .order_by(Report.created_at.desc())
            .limit(limit)
            .all()
        )
        result = []
        for r in reports:
            result.append({
                "id": str(r.id),
                "idea_snippet": r.idea_text[:100] + "..." if len(r.idea_text) > 100 else r.idea_text,
                "industry": r.industry,
                "market_potential": r.market_potential,
                "recommendation": r.recommendation,
                "created_at": r.created_at.isoformat()
            })
        return json.dumps(result, indent=2)

@mcp_server.tool()
def get_report(report_id: str) -> str:
    """Get the full detail of a venture report by its ID.
    
    Args:
        report_id: The UUID string of the report.
    """
    try:
        rep_uuid = uuid.UUID(report_id)
    except ValueError:
        return f"Error: Invalid UUID format '{report_id}'."

    with SessionLocal() as db:
        report = db.query(Report).filter(Report.id == rep_uuid).first()
        if not report:
            return f"Error: Report with ID '{report_id}' not found."
        
        return json.dumps({
            "id": str(report.id),
            "idea_text": report.idea_text,
            "industry": report.industry,
            "market_potential": report.market_potential,
            "recommendation": report.recommendation,
            "report_json": report.report_json,
            "created_at": report.created_at.isoformat()
        }, indent=2)

@mcp_server.tool()
def validate_report(report_data_json: str) -> str:
    """Validate a JSON string representing a venture report against the Pivotly schema.
    
    Args:
        report_data_json: The raw JSON string of a venture report.
    """
    try:
        data = json.loads(report_data_json)
        VentureReport.model_validate(data)
        return "Success: The report JSON is valid according to the VentureReport schema."
    except json.JSONDecodeError as e:
        return f"Validation Failed: Invalid JSON syntax. Error: {str(e)}"
    except Exception as e:
        return f"Validation Failed: Does not match schema. Error: {str(e)}"

# Setup SseServerTransport
mcp_sse = SseServerTransport("/api/v1/mcp/messages")
mcp_router = APIRouter()

@mcp_router.get("/sse")
async def handle_sse(request: Request):
    async with mcp_sse.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        await mcp_server._mcp_server.run(
            streams[0],
            streams[1],
            mcp_server._mcp_server.create_initialization_options(),
        )
