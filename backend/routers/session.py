"""Session routes: start session, submit answer, end session, get status."""
import logging
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models.session import (
    SessionStart,
    SessionStartResponse,
    AnswerResponse,
    ModulateResult,
    FactCheckResult,
    Tone,
)
from models.user import SessionState, SessionEndResponse, SessionFeedbackReport
from services import claims, modulate, yutori, fastino, orchestrator, memory, vision

logger = logging.getLogger(__name__)

# user_id -> scout_id so we reuse one scout per user
_user_scout_ids: dict[str, str] = {}

router = APIRouter(prefix="/session", tags=["session"])

# In-memory session store (replace with DB for production)
sessions: dict[str, SessionState] = {}


@router.post("/start", response_model=SessionStartResponse)
async def start_session(body: SessionStart):
    """Start a new interview session. Registers/query Fastino, returns first question."""
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    await memory.register_user(
        body.user_id,
        {
            "role": body.role,
            "target_company": body.company,
            "difficulty": body.difficulty,
            "level": body.level,
        },
    )
    fastino_ctx = await memory.get_user_context(
        body.user_id,
        "What topics has this user not covered yet? What is their baseline stress?",
    )
    scout_id: str | None = _user_scout_ids.get(body.user_id)
    if scout_id is None:
        scout_id = await yutori.create_scout(body.role, body.company)
        if scout_id:
            _user_scout_ids[body.user_id] = scout_id
    logger.info(
        "start_session: user_id=%s role=%s company=%s session_id=%s scout_id=%s",
        body.user_id,
        body.role,
        body.company,
        session_id,
        scout_id,
    )

    first_q = await orchestrator.generate_first_question(
        role=body.role,
        company=body.company,
        level=body.level,
        difficulty=body.difficulty,
        job_description=body.job_description,
    )

    state = SessionState(
        session_id=session_id,
        user_id=body.user_id,
        role=body.role,
        company=body.company,
        difficulty=body.difficulty,
        level=body.level,
        job_description=body.job_description,
        question_count=1,
        current_question=first_q,
        topics_covered=[],
        questions_asked=[first_q],
        yutori_scout_id=scout_id,
    )
    sessions[session_id] = state

    # Kick off Yutori Browsing in the background so that by the time
    # we ask the 2nd question, company expectations are available
    # to the orchestrator via `company_brief`.
    try:
        import asyncio

        async def _prime_company_brief() -> None:
            brief = await yutori.run_company_brief_browsing(body.role, body.company)
            summary_parts: list[str] = []
            if brief.get("expectations"):
                summary_parts.append("Company/role expectations: " + "; ".join(brief["expectations"][:3]))
            if brief.get("hints"):
                summary_parts.append("Hints for candidates: " + "; ".join(brief["hints"][:3]))
            summary = " ".join(summary_parts) if summary_parts else None
            if not summary:
                return
            # Attach to in-memory session state if it still exists.
            if session_id in sessions:
                s = sessions[session_id]
                s.company_brief = summary
                sessions[session_id] = s

        asyncio.create_task(_prime_company_brief())
    except Exception:
        # Background priming failure should never break session start.
        pass
    return SessionStartResponse(
        session_id=session_id,
        first_question=first_q,
        question_number=1,
        topics_covered=[],
        difficulty=body.difficulty,
    )


@router.post("/{session_id}/end", response_model=SessionEndResponse)
async def end_session(session_id: str):
    """End a session: mark as ended and return final feedback report."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    state = sessions[session_id]
    state.ended = True
    sessions[session_id] = state

    fastino_ctx = await memory.get_user_context(
        state.user_id,
        "Summarize this learner's interview performance: strengths, weak topics, and stress/confidence patterns.",
    )
    rag_snippets = await memory.get_rag_context(
        state.user_id,
        [{"role": "user", "content": "Session summary and key takeaways from past answers."}],
    )
    report = await orchestrator.generate_session_report(
        session_id=session_id,
        user_id=state.user_id,
        fastino_context=fastino_ctx,
        rag_snippets=rag_snippets,
        session_state=state.model_dump(),
    )
    return SessionEndResponse(
        session_id=session_id,
        questions_asked=state.question_count,
        feedback=SessionFeedbackReport(**report),
    )


@router.get("/{session_id}/status")
async def get_session_status(session_id: str):
    """Get current session status."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    state = sessions[session_id]
    return {
        "session_id": session_id,
        "question_count": state.question_count,
        "current_question": state.current_question,
        "topics_covered": state.topics_covered,
    }


@router.get("/{session_id}/scout-updates")
async def get_scout_updates(session_id: str):
    """Get recent Yutori Scout updates for this session (role/company)."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    state = sessions[session_id]
    scout_id = getattr(state, "yutori_scout_id", None) or state.model_dump().get("yutori_scout_id")
    logger.info(
        "get_scout_updates: session_id=%s user_id=%s scout_id=%s",
        session_id,
        state.user_id,
        scout_id,
    )
    role = getattr(state, "role", None) or state.model_dump().get("role")
    company = getattr(state, "company", None) or state.model_dump().get("company")
    # If scout_id is missing, fall back to demo-friendly stub updates and signal status for frontend
    if not scout_id:
        updates = await yutori.get_scout_updates("", limit=3, role=role, company=company)
        return {"updates": updates, "scout_status": "no_scout"}
    updates = await yutori.get_scout_updates(scout_id, limit=3, role=role, company=company)
    return {"updates": updates, "scout_status": "live"}


@router.get("/{session_id}/graph")
async def get_session_graph(session_id: str):
    """Return Neo4j session subgraph (nodes and edges) for the current session. Shows context graph is working."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    data = await memory.get_session_graph(session_id)
    data["neo4j_configured"] = memory.is_neo4j_configured()
    node_count = len(data.get("nodes") or [])
    logger.info("get_session_graph: session_id=%s nodes=%s neo4j_configured=%s", session_id, node_count, data.get("neo4j_configured"))
    return data


def _deferred_fact_check(claim: str) -> FactCheckResult:
    """Stub used when fact-check is deferred to session report (avoids per-answer Yutori call)."""
    return FactCheckResult(
        claim=claim or "",
        correct=True,
        summary="Fact-check in session report.",
        actual_value=None,
        source_url=None,
    )


@router.post("/demo-answer", response_model=AnswerResponse)
async def demo_answer(session_id: str = Form(...)):
    """
    Return a canned answer response for demo mode (no audio).
    Use when "Demo answer" is clicked so judges see full UX without speaking.
    Also ingests to Neo4j so the context graph is populated for the graph panel.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    state = sessions[session_id]
    q_num = state.question_count
    next_q = "You mentioned your approach — what specific outcome did you achieve, and how did you measure it?"
    stub_modulate = ModulateResult(
        transcript="In my role at Stripe I led a cross-functional initiative without direct authority by aligning on the why first, then using data to shift conversations from opinion to evidence.",
        stress_score=0.28,
        confidence_level="high",
        confidence_score=0.82,
        hesitation_count=1,
    )
    stub_fact = _deferred_fact_check("Stripe role")
    await memory.ingest_answer(
        user_id=state.user_id,
        session_id=session_id,
        role=state.role,
        company=state.company,
        question_number=q_num,
        question=state.current_question,
        transcript=stub_modulate.transcript,
        duration_seconds=45,
        stress=stub_modulate.stress_score,
        confidence=stub_modulate.confidence_score,
        yutori_correct=stub_fact.correct,
        extracted_entities=[],
    )
    await memory.ingest_decision(
        user_id=state.user_id,
        session_id=session_id,
        question_number=q_num,
        tone=str(Tone.SUPPORTIVE),
        difficulty_delta=0,
        next_question=next_q,
        feedback_note="Solid structure. Consider quantifying the impact — what measurably changed?",
        reasoning=None,
        stress=stub_modulate.stress_score,
        confidence=stub_modulate.confidence_score,
        yutori_correct=stub_fact.correct,
    )
    state.question_count += 1
    state.current_question = next_q
    state.questions_asked.append(next_q)
    sessions[session_id] = state
    history = getattr(state, "modulate_history", None) or state.model_dump().get("modulate_history", [])
    if not isinstance(history, list):
        history = []
    history = history + [{"stress_score": 0.28, "confidence_score": 0.82}]
    state.modulate_history = history[-10:]
    sessions[session_id] = state
    voice_tip, pacing_score = modulate.voice_coaching_tip_and_pacing(stub_modulate, duration_seconds=45)
    return AnswerResponse(
        next_question=next_q,
        feedback_note="Solid structure. Consider quantifying the impact — what measurably changed?",
        tone=Tone.SUPPORTIVE,
        question_number=state.question_count,
        modulate_summary=stub_modulate,
        fact_check=stub_fact,
        transcript=stub_modulate.transcript,
        overall_score=82,
        fact_accuracy_pct=100.0,
        modulate_trend=state.modulate_history[-5:],
        voice_coaching_tip=voice_tip,
        voice_pacing_score=pacing_score,
        metrics_source="stub",
    )


# Max base64 payload size (e.g. ~6 MB decoded image) to avoid DoS / Reka limits
VISION_MAX_BASE64_BYTES = 8 * 1024 * 1024


@router.post("/{session_id}/vision-analyze")
async def analyze_vision(session_id: str, image_base64: str = Form(...)):
    """Analyze a single video frame for environment/posture via Reka Vision API."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # Strip data URI prefix if present
    if "base64," in image_base64:
        image_base64 = image_base64.split("base64,")[1]
    image_base64 = (image_base64 or "").strip()
    if not image_base64:
        raise HTTPException(status_code=400, detail="No image data")
    if len(image_base64) > VISION_MAX_BASE64_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image payload too large",
        )

    feedback = await vision.analyze_interview_frame(image_base64)
    return {"feedback": feedback}


@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: str = Form(...),
    current_question: str = Form(""),
    duration_seconds: int = Form(0),
    audio: UploadFile = File(...),
):
    """
    Submit audio answer. Runs Modulate -> Fastino ingest -> Orchestrator. Fact-check deferred to session report.
    Returns next question, feedback, and emotion summary.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    state = sessions[session_id]

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio data")
    # Basic safeguard: reject very large uploads (~8 MB+)
    if len(audio_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large")

    modulate_result = await modulate.analyze_voice(audio_bytes, {})
    transcript = modulate_result.transcript or "(no transcript)"

    claim = claims.extract_claim_simple(transcript)
    yutori_result = _deferred_fact_check(claim)

    schema = fastino.default_gliner_schema(getattr(state, "role", None))
    entities = await fastino.extract_competencies(transcript, schema=schema)

    await memory.ingest_answer(
        user_id=state.user_id,
        session_id=session_id,
        role=state.role,
        company=state.company,
        question_number=state.question_count,
        question=state.current_question,
        transcript=transcript,
        duration_seconds=duration_seconds or 30,
        stress=modulate_result.stress_score,
        confidence=modulate_result.confidence_score,
        yutori_correct=yutori_result.correct,
        extracted_entities=entities,
    )

    fastino_ctx = await memory.get_user_context(
        state.user_id,
        "What behavioral or technical topics has this user struggled with?",
    )
    rag_snippets = await memory.get_rag_context(
        state.user_id,
        [{"role": "user", "content": "Generate next interview question."}],
    )

    company_brief = getattr(state, "company_brief", None) or state.model_dump().get("company_brief")
    orch_response = await orchestrator.generate_next_question(
        current_question=state.current_question,
        transcript=transcript,
        modulate=modulate_result,
        yutori=yutori_result,
        fastino_context=fastino_ctx,
        rag_snippets=rag_snippets,
        session_state=state.model_dump(),
        company_brief=company_brief,
    )

    await memory.ingest_decision(
        user_id=state.user_id,
        session_id=session_id,
        question_number=state.question_count,
        tone=str(orch_response.tone),
        difficulty_delta=int(orch_response.difficulty_delta or 0),
        next_question=orch_response.next_question,
        feedback_note=orch_response.feedback_note,
        reasoning=getattr(orch_response, "reasoning", None),
        stress=modulate_result.stress_score,
        confidence=modulate_result.confidence_score,
        yutori_correct=yutori_result.correct,
    )

    state.question_count += 1
    state.current_question = orch_response.next_question
    state.questions_asked.append(orch_response.next_question)
    history = getattr(state, "modulate_history", None) or state.model_dump().get("modulate_history", [])
    if not isinstance(history, list):
        history = []
    history = history + [{"stress_score": modulate_result.stress_score, "confidence_score": modulate_result.confidence_score}]
    state.modulate_history = history[-10:]
    sessions[session_id] = state

    score = int(70 + modulate_result.confidence_score * 20) if modulate_result else 75
    fact_pct = 100.0 if yutori_result.correct else 85.0
    voice_tip, pacing_score = modulate.voice_coaching_tip_and_pacing(
        modulate_result, duration_seconds=duration_seconds or 30
    )

    return AnswerResponse(
        next_question=orch_response.next_question,
        feedback_note=orch_response.feedback_note,
        tone=orch_response.tone,
        question_number=state.question_count,
        modulate_summary=modulate_result,
        fact_check=yutori_result,
        transcript=transcript,
        overall_score=score,
        fact_accuracy_pct=fact_pct,
        modulate_trend=state.modulate_history[-5:],
        extracted_entities=entities,
        voice_coaching_tip=voice_tip,
        voice_pacing_score=pacing_score,
        metrics_source="modulate",
    )
