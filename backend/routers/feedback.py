"""Feedback and user profile routes.

Pioneer/GLiNER is used for extraction; Neo4j is used for memory/profile in this repo.
"""
from fastapi import APIRouter, HTTPException
from models.user import UserProfile, SessionFeedbackReport
from services import orchestrator, memory

router = APIRouter(tags=["feedback"])


@router.get("/user/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """Get user profile from Fastino: summary, weak/strong areas, sample snippets."""
    summary_ctx = await memory.get_user_context(
        user_id,
        "Summarize this learner's interview performance and topic mastery. Mention weak and strong areas.",
    )
    rag_snippets = await memory.get_rag_context(
        user_id,
        [{"role": "user", "content": "Show the most representative past answers and topics."}],
    )
    weak_areas: list[str] = []
    strong_areas: list[str] = []
    recent_topics: list[str] = []
    summary: str | None = summary_ctx.strip() or None
    if summary_ctx:
        try:
            extracted = await orchestrator.extract_profile_topics(summary_ctx)
            weak_areas = extracted.get("weak_areas", [])
            strong_areas = extracted.get("strong_areas", [])
            recent_topics = extracted.get("recent_topics", [])
        except Exception:
            pass
    return UserProfile(
        user_id=user_id,
        summary=summary,
        weak_areas=weak_areas,
        strong_areas=strong_areas,
        baseline_stress=None,
        recent_topics=recent_topics,
        sample_snippets=rag_snippets[:5],
    )


@router.get("/user/{user_id}/profile/snapshot")
async def get_profile_snapshot(user_id: str):
    """Structured Fastino profile snapshot for hackathon: summary, skill_clusters, recurring_topics, sample_snippets."""
    return await memory.get_profile_snapshot(user_id)


@router.post("/user/{user_id}/trigger-finetuning")
async def trigger_finetuning(user_id: str):
    """Trigger or simulate Pioneer fine-tuning for this user (Fastino hackathon track)."""
    from services import fastino
    return await fastino.trigger_pioneer_finetuning(user_id, "")


@router.get("/session/{session_id}/feedback", response_model=SessionFeedbackReport)
async def get_session_feedback(session_id: str):
    """Get post-session feedback summary from Fastino + optional LLM synthesis."""
    from routers.session import sessions
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    state = sessions[session_id]
    user_id = state.user_id

    fastino_ctx = await memory.get_user_context(
        user_id,
        "Summarize this learner's interview performance: strengths, weak topics, and stress/confidence patterns.",
    )
    rag_snippets = await memory.get_rag_context(
        user_id,
        [{"role": "user", "content": "Session summary and key takeaways from past answers."}],
    )

    report = await orchestrator.generate_session_report(
        session_id=session_id,
        user_id=user_id,
        fastino_context=fastino_ctx,
        rag_snippets=rag_snippets,
        session_state=state.model_dump(),
    )
    return SessionFeedbackReport(**report)
