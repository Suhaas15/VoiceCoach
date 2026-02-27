"""Research endpoints: Yutori Browsing company brief."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import yutori

router = APIRouter(prefix="/research", tags=["research"])


class CompanyBriefRequest(BaseModel):
    role: str
    company: str
    session_id: str | None = None


@router.post("/company-brief")
async def post_company_brief(body: CompanyBriefRequest):
    """
    Run Yutori Browsing to get company/role expectations. Optionally attach to session.
    Returns expectations, hints, source_urls. If session_id provided, stores summary in session for orchestrator.
    """
    brief = await yutori.run_company_brief_browsing(body.role, body.company)
    summary_parts = []
    if brief["expectations"]:
        summary_parts.append("Company/role expectations: " + "; ".join(brief["expectations"][:3]))
    if brief["hints"]:
        summary_parts.append("Hints for candidates: " + "; ".join(brief["hints"][:3]))
    summary = " ".join(summary_parts) if summary_parts else None

    if body.session_id and summary:
        from routers.session import sessions
        if body.session_id in sessions:
            state = sessions[body.session_id]
            state.company_brief = summary
            sessions[body.session_id] = state

    return brief
