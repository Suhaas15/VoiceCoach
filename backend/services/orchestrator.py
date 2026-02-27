"""Orchestrator: synthesize signals using Fastino, Yutori, and Modulate (OpenAI removed)."""
import asyncio
import re
import random
from models.session import (
    ModulateResult,
    FactCheckResult,
    OrchestratorResponse,
    Difficulty,
    Level,
    Tone,
)
from services import claims, memory, yutori


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

# Keywords that suggest a line is a requirement or responsibility (for JD parsing).
_JD_TOPIC_KEYWORDS = (
    "experience", "ability", "lead", "manage", "design", "communication",
    "team", "required", "preferred", "responsibility", "skill", "cross-functional",
    "stakeholder", "impact", "deliver", "ownership", "collaborat",
)


def _jd_topics(job_description: str) -> list[str]:
    """
    Extract requirement/topic phrases from job description (rule-based, no LLM).
    Returns up to 8 short phrases suitable for turning into interview questions.
    """
    if not job_description or len(job_description.strip()) < 20:
        return []
    jd = job_description.strip()
    # Split on newlines and common list separators
    raw = re.split(r"\n|\r|\.\s+(?=[A-Z])", jd)
    seen: set[str] = set()
    out: list[str] = []
    for line in raw:
        # Normalize: strip, remove leading bullets/digits
        line = re.sub(r"^[\s\-*•\d.)]+", "", line).strip()
        if len(line) < 10 or len(line) > 150:
            continue
        line_lower = line.lower()
        # Prefer lines that look like requirements
        if any(kw in line_lower for kw in _JD_TOPIC_KEYWORDS) or "?" not in line:
            key = line_lower[:50]
            if key not in seen:
                seen.add(key)
                out.append(line)
                if len(out) >= 8:
                    break
    # If we got no keyword matches, take first few sentences or lines as fallback
    if not out and jd:
        for part in re.split(r"\n|\.\s+", jd)[:5]:
            part = part.strip()
            if 15 <= len(part) <= 120 and part not in seen:
                seen.add(part.lower()[:50])
                out.append(part)
                if len(out) >= 5:
                    break
    return out


def _next_jd_question(session_state: dict, jd_topics: list[str], level: str, difficulty: str) -> str | None:
    """
    Pick an unused JD topic and return a question string, or None if all used.
    Uses level for seniority wording and optionally difficulty for phrase variant.
    """
    if not jd_topics:
        return None
    questions_asked = session_state.get("questions_asked") or []
    for topic in jd_topics:
        # Consider topic "used" if any asked question already contains this topic (or its leading phrase)
        sig = topic[:35].lower().strip()
        if not sig:
            continue
        if any(sig in (q or "").lower() for q in questions_asked):
            continue
        break
    else:
        return None
    level_lower = (level or "mid").lower()
    difficulty_lower = (difficulty or "medium").lower()
    # Truncate topic for the question if too long
    x = topic[:80].strip() + ("…" if len(topic) > 80 else "")
    if level_lower in ("senior", "staff", "principal"):
        q = f"For a senior role, the job description emphasizes {x}. How have you demonstrated this at scale?"
    elif level_lower in ("junior", "entry"):
        q = f"The role calls for {x}. Can you tell us about a time you showed this, even early in your experience?"
    else:
        q = f"The job description mentions {x}. Can you share an example from your experience?"
    if difficulty_lower.startswith("easy"):
        q = "Give one concrete example. " + q
    elif difficulty_lower.startswith("hard"):
        q = "Walk me through a complex situation where this was critical. " + q
    return q


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

    # 3. Determine next question: JD (if present) > company brief > entity coverage > fallback
    next_question = "Can you share another example of your work in this area?"
    jd_q: str | None = None
    jd_text = (session_state.get("job_description") or "").strip()
    if len(jd_text) > 60:
        topics = _jd_topics(jd_text)
        jd_q = _next_jd_question(
            session_state,
            topics,
            session_state.get("level") or "mid",
            session_state.get("difficulty") or "medium",
        )
    if jd_q:
        next_question = jd_q
    elif company_brief:
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
            # Fallback: make the question contextual using what they just answered or role/company.
            role = (session_state.get("role") or "").strip() or "this role"
            company = (session_state.get("company") or "").strip() or "this company"
            prev = (current_question or "").strip()
            if prev and len(prev) > 10:
                # Shorten to a topic phrase (first sentence or first ~50 chars)
                topic = prev.split(".")[0].strip() if "." in prev else prev[:60].strip()
                if topic.endswith("?"):
                    topic = topic[:-1].strip()
                if len(topic) > 8:
                    next_question = (
                        f"You just spoke about {topic}. "
                        "Can you share a specific example from your experience that relates to that—how did you handle it?"
                    )
                else:
                    next_question = (
                        f"For a {role} position at {company}, "
                        "can you share a specific example from your experience and how you handled it?"
                    )
            else:
                next_question = (
                    f"For the {role} role at {company}, "
                    "can you share a specific example from your experience where you faced a challenge and how you approached it?"
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
    Run Yutori fact-check on all session answers here (deferred from per-answer).
    """
    question_count = session_state.get("question_count", 0)
    role = (session_state.get("role") or "").strip() or "this role"
    company = (session_state.get("company") or "").strip() or "the company"

    # Human-readable summary for this session (not raw Neo4j context)
    overall_trend = f"Session complete. You answered {question_count} question(s) in this session. Your voice metrics suggest steady delivery."

    # Fact-check at report time: get session transcripts, extract claims, verify in parallel (capped at 20s)
    fact_check_summary: str | None = None
    disputed_claims: list[str] = []
    transcripts = await memory.get_session_transcripts(session_id)
    claims_to_check = []
    for t in transcripts:
        c = (claims.extract_claim_simple(t) or "").strip()
        if c and len(c) >= 10:
            claims_to_check.append(c)
    # Dedupe by claim text to avoid redundant API calls
    claims_to_check = list(dict.fromkeys(claims_to_check))
    if claims_to_check:
        try:
            results = await asyncio.wait_for(
                asyncio.gather(
                    *[yutori.verify_claim(c) for c in claims_to_check],
                    return_exceptions=True,
                ),
                timeout=20.0,
            )
            verified = 0
            for i, r in enumerate(results):
                if isinstance(r, Exception):
                    disputed_claims.append((claims_to_check[i] or "")[:80] + ("…" if len(claims_to_check[i] or "") > 80 else ""))
                    continue
                if getattr(r, "correct", True):
                    verified += 1
                else:
                    line = (getattr(r, "summary", None) or getattr(r, "actual_value", None) or (claims_to_check[i] or "")[:80])
                    if line and "[Stub]" not in str(line):
                        disputed_claims.append(line[:200])
            total = len(claims_to_check)
            fact_check_summary = f"{verified} of {total} claims verified."
            if disputed_claims:
                fact_check_summary += " Some claims need verification or a source."
        except asyncio.TimeoutError:
            fact_check_summary = "Fact-check timed out (Yutori Research took too long); partial results only."
    else:
        fact_check_summary = "No verifiable claims in this session." if transcripts else None

    strengths = ["Confident delivery"] if question_count > 2 else ["Clear transcript"]
    focus_areas = ["Metric quantification"]
    suggested_next_steps = [
        f"Review Yutori research on {company} culture.",
        "Practice pacing with Modulate signals.",
    ]

    return {
        "session_id": session_id,
        "overall_trend": overall_trend,
        "strengths": strengths,
        "focus_areas": focus_areas,
        "suggested_next_steps": suggested_next_steps,
        "fact_check_summary": fact_check_summary,
        "disputed_claims": disputed_claims,
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
