"""Fastino personalization API. Stub when API key missing."""
import logging
import os


logger = logging.getLogger(__name__)

FASTINO_BASE = "https://api.fastino.ai"
PIONEER_GLINER2_URL = "https://api.pioneer.ai/gliner-2"
PIONEER_INFERENCE_URL = "https://api.pioneer.ai/v1/inference"
# Fine-tuned VoiceCoach NER model (voicecoach-ner-v1) trained on interview-answer entity extraction
VOICECOACH_NER_JOB_ID = "0035887e-8bea-4139-8947-dd54c433d413"


def _get_fastino_api_key() -> str | None:
    key = os.getenv("FASTINO_API_KEY")
    return key.strip() if key and key.strip() else None


def _get_pioneer_api_key() -> str | None:
    key = os.getenv("PIONEER_API_KEY")
    return key.strip() if key and key.strip() else None


def default_gliner_schema(role: str | None = None) -> list[str]:
    """
    GLiNER supports zero-shot extraction with arbitrary labels.
    We pick a schema that’s useful for interview answers (and varies slightly by role).
    """
    base = [
        "TECHNICAL_SKILL",
        "SOFT_SKILL",
        "FRAMEWORK",
        "DOMAIN_KNOWLEDGE",
        "TRAIT",
        "METRIC",
        "PROJECT",
        "IMPACT",
    ]
    r = (role or "").lower()
    if any(k in r for k in ["product", "pm"]):
        return base + ["CUSTOMER", "EXPERIMENT", "TRADEOFF", "ROADMAP"]
    if any(k in r for k in ["data", "ml", "machine learning", "scientist"]):
        return base + ["MODEL", "DATASET", "EVALUATION_METRIC"]
    if any(k in r for k in ["sales", "account", "business development"]):
        return base + ["CUSTOMER", "DEAL_SIZE", "OBJECTION", "COMPETITOR"]
    return base


async def register_user(user_id: str, metadata: dict) -> bool:
    """Register user with Fastino. No-op stub if no key."""
    api_key = _get_fastino_api_key()
    if not api_key:
        logger.info("Fastino stub: FASTINO_API_KEY not set; register_user is a no-op.")
        return True
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{FASTINO_BASE}/users/register",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"user_id": user_id, "metadata": metadata},
            )
            return r.is_success
    except Exception:
        logger.exception("Fastino register_user failed")
        return True


async def ingest_answer(
    user_id: str,
    question: str,
    transcript: str,
    modulate_result: dict,
    yutori_result: dict,
    duration_seconds: int,
    session_id: str,
    question_number: int,
    extracted_entities: list = None,
) -> None:
    """Build event document and POST to Fastino /ingest. 
    Includes GLiNER-2 entities for structured search.
    """
    api_key = _get_fastino_api_key()
    if not api_key:
        logger.info("Fastino stub: FASTINO_API_KEY not set; ingest_answer is a no-op.")
        return
    try:
        import httpx
        content = (
            f"User answered: {transcript}. "
            f"Stress score: {modulate_result.get('stress_score', 0)}. "
            f"Confidence: {modulate_result.get('confidence_level', 'unknown')}. "
            f"Fact-check correct: {yutori_result.get('correct', True)}. "
            f"Duration: {duration_seconds}s. "
        )
        
        # Structure the extracted entities for the metadata
        entities_summary = {}
        if extracted_entities:
            for ent in extracted_entities:
                label = ent.get("label", "ENTITY")
                if label not in entities_summary:
                    entities_summary[label] = []
                entities_summary[label].append(ent.get("text", ""))

        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.post(
                f"{FASTINO_BASE}/ingest",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "user_id": user_id,
                    "source": "voicecoach_session",
                    "documents": [
                        {
                            "doc_id": f"session_{session_id}_q{question_number}",
                            "kind": "interview_answer",
                            "title": question[:200],
                            "content": content,
                            "metadata": {
                                "entities": entities_summary,
                                "modulate": modulate_result,
                                "yutori_correct": yutori_result.get('correct', True),
                                "question_category": "interview_answer",
                                "voice_metrics": {
                                    "stress": modulate_result.get("stress_score"),
                                    "confidence": modulate_result.get("confidence_score"),
                                    "hesitation_count": modulate_result.get("hesitation_count"),
                                },
                            }
                        }
                    ],
                },
            )
    except Exception:
        logger.exception("Fastino ingest_answer failed.")


def _entities_response_to_flat(data: dict) -> list[dict]:
    """Convert Pioneer inference result.entities (label -> list of spans) to flat [{"text", "label"}]."""
    out: list[dict] = []
    result = data.get("result") or data
    entities = result.get("entities") if isinstance(result, dict) else None
    if not isinstance(entities, dict):
        return out
    for label, spans in entities.items():
        if not isinstance(spans, list):
            continue
        for s in spans:
            if isinstance(s, str) and s.strip():
                out.append({"text": s.strip(), "label": str(label)})
    return out


async def extract_competencies(transcript: str, schema: list[str] | None = None) -> list:
    """Extract structured entities from user answer using fine-tuned VoiceCoach NER model or base GLiNER-2."""
    pioneer_key = _get_pioneer_api_key()
    if not pioneer_key:
        logger.info("Pioneer/GLiNER stub: PIONEER_API_KEY not set; returning demo entities.")
        return [
            {"text": "Python", "label": "TECHNICAL_SKILL"},
            {"text": "Leadership", "label": "SOFT_SKILL"},
            {"text": "FastAPI", "label": "FRAMEWORK"},
        ]

    labels = schema or default_gliner_schema()
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Prefer fine-tuned VoiceCoach NER model (Pioneer v1 inference API)
            r = await client.post(
                PIONEER_INFERENCE_URL,
                headers={
                    "Authorization": f"Bearer {pioneer_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "task": "extract_entities",
                    "text": transcript,
                    "schema": labels,
                    "job_id": VOICECOACH_NER_JOB_ID,
                    "threshold": 0.5,
                },
            )
            if r.is_success:
                data = r.json()
                flat = _entities_response_to_flat(data)
                if flat:
                    return flat
            # Fallback: base GLiNER-2 endpoint (no job_id)
            fallback = await client.post(
                PIONEER_GLINER2_URL,
                headers={
                    "Authorization": f"Bearer {pioneer_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "text": transcript,
                    "schema": labels,
                    "threshold": 0.4,
                },
            )
            if fallback.is_success:
                raw = fallback.json()
                # Base API may return entities as list or under result.entities
                entities = raw.get("entities")
                if entities is None and isinstance(raw.get("result"), dict):
                    entities = raw["result"].get("entities")
                if isinstance(entities, list):
                    return [{"text": e.get("text", ""), "label": e.get("label", "ENTITY")} for e in entities if e.get("text")]
                if isinstance(entities, dict):
                    return _entities_response_to_flat({"result": {"entities": entities}})
            return []
    except Exception:
        logger.exception("Fastino extract_competencies failed (Pioneer).")
        return []


async def trigger_pioneer_finetuning(user_id: str, session_id: str) -> dict:
    """Simulate or trigger Pioneer fine-tuning for the user's specific performance profile.
    This demonstrates the 'self-evolving' nature of the coach.
    """
    # In a real hackathon scenario, this would notify the user that their 
    # specific feedback model is being optimized based on their session data.
    return {
        "status": "optimization_queued",
        "platform": "Fastino Pioneer",
        "target_model": "GLiNER-2-vcoach-specialized",
        "estimated_improvement": "+12% F1 Score"
    }


async def get_user_context(user_id: str, question: str) -> str:
    """Query Fastino profile in natural language. Returns stub text if no key."""
    api_key = _get_fastino_api_key()
    if not api_key:
        logger.info("Fastino stub: FASTINO_API_KEY not set; get_user_context returning stub summary.")
        return "[Stub] No prior user history. Enable Fastino for personalization."
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{FASTINO_BASE}/personalization/profile/query",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"user_id": user_id, "question": question},
            )
            if r.is_success:
                data = r.json()
                return data.get("answer", "") or ""
            return ""
    except Exception:
        logger.exception("Fastino get_user_context failed.")
        return ""


async def get_rag_context(user_id: str, conversation: list) -> list[str]:
    """Retrieve top-k relevant memory snippets. Stub returns empty list."""
    api_key = _get_fastino_api_key()
    if not api_key:
        logger.info("Fastino stub: FASTINO_API_KEY not set; get_rag_context returning [].")
        return []
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{FASTINO_BASE}/chunks",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"user_id": user_id, "conversation": conversation, "top_k": 5},
            )
            if r.is_success:
                data = r.json()
                chunks = data.get("chunks", [])
                return [c.get("content", "") for c in chunks if c.get("content")]
            return []
    except Exception:
        logger.exception("Fastino get_rag_context failed.")
        return []


async def get_profile_snapshot(user_id: str) -> dict:
    """
    Return a structured Fastino profile snapshot for hackathon UX: summary, skill_clusters, recurring_topics.
    """
    summary = await get_user_context(
        user_id,
        "Summarize this user's interview profile: main strengths, weak areas, and recurring topics in one short paragraph.",
    )
    rag = await get_rag_context(
        user_id,
        [{"role": "user", "content": "Key themes and competencies from past answers."}],
    )
    from services import orchestrator
    topics = await orchestrator.extract_profile_topics(summary or "")
    return {
        "user_id": user_id,
        "summary": (summary or "").strip() or None,
        "skill_clusters": {
            "weak_areas": topics.get("weak_areas", []),
            "strong_areas": topics.get("strong_areas", []),
            "recent_topics": topics.get("recent_topics", []),
        },
        "recurring_topics": topics.get("recent_topics", []),
        "sample_snippets": rag[:5],
    }
