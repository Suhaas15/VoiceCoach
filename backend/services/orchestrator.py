"""Orchestrator: synthesize signals using Fastino, Yutori, and Modulate (OpenAI removed)."""
import random
from models.session import (
    ModulateResult,
    FactCheckResult,
    OrchestratorResponse,
    Difficulty,
    Level,
    Tone,
)
from services import memory


# First question is always this; rest of the session is dynamic (company brief, RAG, etc.).
DEFAULT_FIRST_QUESTION = "Walk me through your background and why you're interested in this role."

# Optional openers for reference / JD path only.
FIRST_QUESTION_OPENERS: list[str] = [
    "Tell me about yourself and what role you're preparing for.",
    DEFAULT_FIRST_QUESTION,
    "Why are you interested in this position and this company?",
    "Give me a brief overview of your experience and what brings you here today.",
    "How would you describe your background in a few sentences?",
    "What attracted you to this role?",
]

# Optional personalized openers when role and company are present (use {role}, {company}).
PERSONALIZED_OPENER_TEMPLATES: list[str] = [
    "Why are you interested in the {role} position at {company}?",
    "Tell me about yourself and why you're a fit for {role} at {company}.",
]

# JD-aware first question when user pastes a long job description.
JD_FIRST_QUESTION_TEMPLATE = "Based on the {role} requirements for {company}, walk me through your relevant experience."

# When JD is long, use JD line this fraction of the time; otherwise use default.
JD_FIRST_QUESTION_PROB = 0.5


async def generate_first_question(
    role: str,
    company: str,
    level: Level = Level.MID,
    difficulty: Difficulty = Difficulty.MEDIUM,
    job_description: str = "",
) -> str:
    """
    Returns the first question. Always "Walk me through your background and why you're interested in this role."
    When a long JD is pasted, we sometimes use the JD-based question instead. Rest of session is dynamic.
    """
    has_long_jd = bool(job_description.strip()) and len(job_description) > 100

    if has_long_jd and random.random() < JD_FIRST_QUESTION_PROB:
        return JD_FIRST_QUESTION_TEMPLATE.format(role=role, company=company)

    return DEFAULT_FIRST_QUESTION


async def generate_next_question(
    current_question: str,
    transcript: str,
    modulate: ModulateResult,
    yutori: FactCheckResult,
    fastino_context: str,
    rag_snippets: list[str],
    session_state: dict,
    company_brief: str | None = None,
) -> OrchestratorResponse:
    """
    Synthesize all signals WITHOUT OpenAI.
    1. Tone/Difficulty: Derived directly from Modulate stress/confidence.
    2. Feedback: Generated via Fastino profile query/summary.
    3. Next Question: Pulled from Yutori company brief or state topics.
    """
    # 1. Map Modulate signals to Tone and Difficulty (with autonomy: use history for streaks)
    stress = modulate.stress_score
    conf = modulate.confidence_score
    history = session_state.get("modulate_history") or []
    recent = history[-3:] if len(history) >= 2 else []

    tone: Tone = Tone.NEUTRAL
    diff_delta = 0

    # User-chosen difficulty (easy / medium / hard) influences how quickly we move
    # the user up or down in difficulty, but Modulate signals still drive autonomy.
    difficulty_pref = str(session_state.get("difficulty") or "").lower()

    # Autonomy: if stress high for 2+ answers, auto-shift supportive; if confident for 2+, escalate
    high_stress_streak = sum(1 for p in recent if (p.get("stress_score") or 0) > 0.6) >= 2
    high_conf_streak = sum(1 for p in recent if (p.get("confidence_score") or 0) > 0.7 and (p.get("stress_score") or 1) < 0.4) >= 2
    if high_stress_streak:
        tone = Tone.SUPPORTIVE
        diff_delta = -1
    elif high_conf_streak:
        tone = Tone.CHALLENGING
        diff_delta = 1
    elif conf > 0.7 and stress < 0.4:
        tone = Tone.CHALLENGING
        diff_delta = 1
    elif stress > 0.6 or conf < 0.4:
        tone = Tone.SUPPORTIVE
        diff_delta = -1

    # Bias difficulty based on the user's starting preference:
    # - easy: lean more supportive, avoid jumping to harder unless clearly confident
    # - hard: avoid backing off too quickly unless clearly stressed
    if difficulty_pref.startswith("easy"):
        if diff_delta > 0 and not high_conf_streak:
            diff_delta = 0
        if tone == Tone.CHALLENGING and not high_conf_streak:
            tone = Tone.NEUTRAL
    elif difficulty_pref.startswith("hard"):
        if diff_delta < 0 and not high_stress_streak:
            diff_delta = 0
        if tone == Tone.SUPPORTIVE and not high_stress_streak:
            tone = Tone.NEUTRAL
    
    # 2. Generate feedback using Fastino Task-Specific Reasoning
    # We use the stored profile context as an 'evaluator' input (demo-friendly, no LLM required)
    eval_query = (
        f"Evaluating this answer: '{transcript}'. "
        f"The user had confidence={conf} and stress={stress}. "
        f"Provide a 1-sentence supportive coach feedback note."
    )
    feedback_note = await memory.get_user_context(session_state.get("user_id", "default"), eval_query)
    
    if not feedback_note or "[Stub]" in feedback_note:
        # Code-based fallback if Fastino key missing or returns stub
        if tone == Tone.CHALLENGING:
            feedback_note = "Your confidence is high. Let's push deeper into your metrics."
        elif tone == Tone.SUPPORTIVE:
            feedback_note = "I noticed some hesitation. Take a breath and focus on one specific example."
        else:
            feedback_note = "Good structure. Let's move to the next topic."

    # Yutori autonomy: when fact-check flagged the claim, add remediation hint
    if not yutori.correct and yutori.summary and "[Stub]" not in (yutori.summary or ""):
        feedback_note = feedback_note.rstrip() + " Yutori suggested verifying the claim or citing a source."

    # 3. Determine next question from Yutori research, Neo4j history, or fallbacks
    next_question = "Can you share another example of your work in this area?"
    
    if company_brief:
        # Simple extraction of a requirement/hint to turn into a question
        lines = company_brief.split(";")
        if lines:
            target = random.choice(lines).strip()
            # Clean up potential "Expectations: " prefix
            target = target.split(":")[-1].strip()
            next_question = f"Regarding {target}, how have you demonstrated this in your past roles?"
    else:
        # Use Neo4j entity coverage to nudge toward under-covered topics.
        user_id = session_state.get("user_id", "default")
        try:
            label_counts = await memory.get_entity_label_counts(user_id)
        except Exception:
            label_counts = {}

        if label_counts:
            core_labels = [
                "TECHNICAL_SKILL",
                "SOFT_SKILL",
                "FRAMEWORK",
                "IMPACT",
                "SYSTEM_DESIGN",
            ]
            candidates = [(lbl, int(label_counts.get(lbl, 0))) for lbl in core_labels]
            # Pick the label with the lowest count; if all zero, this becomes the first topic we probe.
            label, count = sorted(candidates, key=lambda x: x[1])[0]
            if count <= 1:
                human_label = label.replace("_", " ").lower()
                next_question = (
                    f"Let's focus on your {human_label}. "
                    f"Tell me about a recent example that best shows this strength."
                )
        if not company_brief and not label_counts and rag_snippets:
            # Fallback to simple RAG-aware prompt if we have no entity data yet.
            next_question = (
                "Thinking back to your past experience, how would you handle a similar challenge today?"
            )

    return OrchestratorResponse(
        next_question=next_question,
        difficulty_delta=diff_delta,
        tone=tone,
        feedback_note=feedback_note,
        reasoning="Sponsor-native synthesis (Modulate signals -> Tone; Fastino -> Feedback; Yutori -> Research Q)"
    )


async def generate_session_report(
    session_id: str,
    user_id: str,
    fastino_context: str,
    rag_snippets: list[str],
    session_state: dict,
) -> dict:
    """
    Synthesize report using Fastino's personalization capabilities.
    """
    # Use Fastino to summarize the performance
    summary = await memory.get_user_context(
        user_id, 
        "Generate a structured interview summary: 2 strengths and 2 focus areas."
    )
    
    if not summary or "[Stub]" in summary:
        summary = "Session complete. Your confidence trend was positive."

    return {
        "session_id": session_id,
        "overall_trend": summary,
        "strengths": ["Confident delivery" if session_state.get("question_count", 0) > 2 else "Clear transcript"],
        "focus_areas": ["Metric quantification"],
        "suggested_next_steps": ["Review Yutori research on company culture.", "Practice pacing with Modulate signals."],
    }


async def extract_profile_topics(fastino_context: str) -> dict:
    """
    Extract topics from context. Simplified for sponsor-native stack.
    """
    # In a pure sponsor stack, we rely on Fastino's structured retrieval
    # For now, we return a simple mapped structure
    return {
        "weak_areas": ["System Design"] if "design" in fastino_context.lower() else [],
        "strong_areas": ["Leadership"] if "lead" in fastino_context.lower() else [],
        "recent_topics": ["Introduction"],
    }
