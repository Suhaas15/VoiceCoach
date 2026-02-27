"""Neo4j-backed memory/profile store (hackathon demo friendly).

Fastino is used for GLiNER/Pioneer in this repo; Neo4j stores longitudinal user/session data.
If Neo4j env vars are missing, this module runs in stub mode (no-op writes, empty reads).
"""

from __future__ import annotations

import logging
import os
from collections import Counter
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


def _env(name: str) -> str | None:
    v = os.getenv(name)
    return v.strip() if v and v.strip() else None


def _neo4j_enabled() -> bool:
    enabled = bool(_env("NEO4J_URI") and _env("NEO4J_USERNAME") and _env("NEO4J_PASSWORD"))
    if not enabled:
        # This will run often, so keep it to info-level only.
        logger.info("Neo4j stub: required env vars missing; memory/profile features will use stub responses.")
    return enabled


def is_neo4j_configured() -> bool:
    """Public check for UI: whether Neo4j is configured so the context graph can be persisted and shown."""
    return _neo4j_enabled()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


_driver = None


def _get_driver():
    global _driver
    if _driver is not None:
        return _driver
    if not _neo4j_enabled():
        return None
    try:
        from neo4j import AsyncGraphDatabase

        _driver = AsyncGraphDatabase.driver(
            _env("NEO4J_URI"),
            auth=(_env("NEO4J_USERNAME"), _env("NEO4J_PASSWORD")),
        )
        return _driver
    except Exception:
        logger.exception("Neo4j driver init failed; falling back to stub mode.")
        return None


async def _ensure_schema() -> None:
    """Best-effort constraints; safe to call repeatedly."""
    driver = _get_driver()
    if driver is None:
        return
    db = _env("NEO4J_DATABASE")
    try:
        async with driver.session(database=db) as session:
            # Neo4j editions vary; constraints may fail harmlessly.
            await session.run("CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE")
            await session.run("CREATE CONSTRAINT session_id IF NOT EXISTS FOR (s:Session) REQUIRE s.session_id IS UNIQUE")
            await session.run("CREATE CONSTRAINT answer_id IF NOT EXISTS FOR (a:Answer) REQUIRE a.answer_id IS UNIQUE")
            await session.run(
                "CREATE CONSTRAINT decision_id IF NOT EXISTS FOR (d:Decision) REQUIRE d.decision_id IS UNIQUE"
            )
            await session.run(
                "CREATE CONSTRAINT entity_key IF NOT EXISTS FOR (e:Entity) REQUIRE (e.label, e.text) IS UNIQUE"
            )
            # Pre-create relationship types we use so Neo4j doesn't warn
            # about unknown types on first queries.
            await session.run(
                """
                MERGE (a:__SchemaDummy {id: 1})
                MERGE (b:__SchemaDummy {id: 2})
                MERGE (a)-[:MENTIONS]->(b)
                MERGE (a)-[:HAS_SESSION]->(b)
                MERGE (a)-[:HAS_ANSWER]->(b)
                MERGE (a)-[:HAS_DECISION]->(b)
                MERGE (a)-[:LED_TO]->(b)
                MERGE (a)-[:PRECEDENT_FOR]->(b)
                """
            )
    except Exception:
        logger.exception("Neo4j constraints creation failed (non-fatal)")


async def register_user(user_id: str, metadata: dict[str, Any]) -> bool:
    """Upsert user node with basic metadata."""
    if not _neo4j_enabled():
        return True
    await _ensure_schema()
    driver = _get_driver()
    if driver is None:
        return True
    db = _env("NEO4J_DATABASE")
    try:
        async with driver.session(database=db) as session:
            await session.run(
                """
                MERGE (u:User {user_id: $user_id})
                SET u.updated_at = $now,
                    u.role = coalesce($role, u.role),
                    u.company = coalesce($company, u.company),
                    u.level = coalesce($level, u.level),
                    u.difficulty = coalesce($difficulty, u.difficulty)
                """,
                user_id=user_id,
                now=_now_iso(),
                role=metadata.get("role"),
                company=metadata.get("target_company") or metadata.get("company"),
                level=str(metadata.get("level")) if metadata.get("level") is not None else None,
                difficulty=str(metadata.get("difficulty")) if metadata.get("difficulty") is not None else None,
            )
        return True
    except Exception:
        logger.exception("Neo4j register_user failed")
        return True


async def ingest_answer(
    *,
    user_id: str,
    session_id: str,
    role: str,
    company: str,
    question_number: int,
    question: str,
    transcript: str,
    duration_seconds: int,
    stress: float | None,
    confidence: float | None,
    yutori_correct: bool | None,
    extracted_entities: list[dict] | None = None,
) -> None:
    """Persist answer + entities for later retrieval/summaries."""
    if not _neo4j_enabled():
        return
    await _ensure_schema()
    driver = _get_driver()
    if driver is None:
        return
    db = _env("NEO4J_DATABASE")
    try:
        answer_id = f"{session_id}:q{question_number}"
        entities = extracted_entities or []
        async with driver.session(database=db) as session:
            await session.run(
                """
                MERGE (u:User {user_id: $user_id})
                SET u.updated_at = $now
                MERGE (s:Session {session_id: $session_id})
                SET s.user_id = $user_id,
                    s.role = $role,
                    s.company = $company,
                    s.updated_at = $now
                MERGE (u)-[:HAS_SESSION]->(s)
                MERGE (a:Answer {answer_id: $answer_id})
                SET a.session_id = $session_id,
                    a.question_number = $question_number,
                    a.question = $question,
                    a.transcript = $transcript,
                    a.duration_seconds = $duration_seconds,
                    a.stress = $stress,
                    a.confidence = $confidence,
                    a.yutori_correct = $yutori_correct,
                    a.created_at = coalesce(a.created_at, $now),
                    a.updated_at = $now
                MERGE (s)-[:HAS_ANSWER]->(a)
                WITH a
                UNWIND $entities AS ent
                WITH a, ent
                WHERE ent IS NOT NULL AND ent.text IS NOT NULL AND ent.label IS NOT NULL
                MERGE (e:Entity {label: ent.label, text: ent.text})
                MERGE (a)-[:MENTIONS]->(e)
                """,
                user_id=user_id,
                session_id=session_id,
                role=role,
                company=company,
                answer_id=answer_id,
                question_number=question_number,
                question=question[:400],
                transcript=(transcript or "")[:4000],
                duration_seconds=int(duration_seconds or 0),
                stress=float(stress) if stress is not None else None,
                confidence=float(confidence) if confidence is not None else None,
                yutori_correct=bool(yutori_correct) if yutori_correct is not None else None,
                entities=[{"label": e.get("label"), "text": e.get("text")} for e in entities if isinstance(e, dict)],
                now=_now_iso(),
            )
    except Exception:
        logger.exception("Neo4j ingest_answer failed.")


async def ingest_decision(
    *,
    user_id: str,
    session_id: str,
    question_number: int,
    tone: str,
    difficulty_delta: int,
    next_question: str,
    feedback_note: str,
    reasoning: str | None,
    stress: float | None,
    confidence: float | None,
    yutori_correct: bool | None,
) -> None:
    """
    Record a decision trace (the “why”) for a given answer/question_number.

    This is the core of a context graph: Decisions are first-class nodes, linked to
    the Answer they were based on and chained to prior decisions as precedents.
    """
    if not _neo4j_enabled():
        return
    await _ensure_schema()
    driver = _get_driver()
    if driver is None:
        return
    db = _env("NEO4J_DATABASE")
    try:
        answer_id = f"{session_id}:q{question_number}"
        decision_id = f"{answer_id}:decision"
        prev_decision_id = f"{session_id}:q{max(1, question_number - 1)}:decision"
        async with driver.session(database=db) as session:
            await session.run(
                """
                MERGE (u:User {user_id: $user_id})
                MERGE (s:Session {session_id: $session_id})
                MERGE (u)-[:HAS_SESSION]->(s)
                MERGE (a:Answer {answer_id: $answer_id})
                MERGE (d:Decision {decision_id: $decision_id})
                SET d.session_id = $session_id,
                    d.question_number = $question_number,
                    d.tone = $tone,
                    d.difficulty_delta = $difficulty_delta,
                    d.next_question = $next_question,
                    d.feedback_note = $feedback_note,
                    d.reasoning = $reasoning,
                    d.stress = $stress,
                    d.confidence = $confidence,
                    d.yutori_correct = $yutori_correct,
                    d.created_at = coalesce(d.created_at, $now),
                    d.updated_at = $now
                MERGE (s)-[:HAS_DECISION]->(d)
                MERGE (a)-[:LED_TO]->(d)
                WITH d
                OPTIONAL MATCH (prev:Decision {decision_id: $prev_decision_id})
                FOREACH (_ IN CASE WHEN prev IS NULL OR $question_number <= 1 THEN [] ELSE [1] END |
                  MERGE (prev)-[:PRECEDENT_FOR]->(d)
                )
                """,
                user_id=user_id,
                session_id=session_id,
                answer_id=answer_id,
                decision_id=decision_id,
                prev_decision_id=prev_decision_id,
                question_number=int(question_number),
                tone=(tone or "")[:40],
                difficulty_delta=int(difficulty_delta or 0),
                next_question=(next_question or "")[:500],
                feedback_note=(feedback_note or "")[:500],
                reasoning=(reasoning or "")[:800] or None,
                stress=float(stress) if stress is not None else None,
                confidence=float(confidence) if confidence is not None else None,
                yutori_correct=bool(yutori_correct) if yutori_correct is not None else None,
                now=_now_iso(),
            )
    except Exception:
        logger.exception("Neo4j ingest_decision failed.")


async def get_session_graph(session_id: str) -> dict[str, Any]:
    """Return session subgraph for UI: nodes (Session, Answer, Entity, Decision) and edges. Stub when Neo4j disabled."""
    empty = {"nodes": [], "edges": [], "session_id": session_id}
    if not _neo4j_enabled():
        return empty
    driver = _get_driver()
    if driver is None:
        return empty
    db = _env("NEO4J_DATABASE")
    try:
        async with driver.session(database=db) as session:
            # Session and answers
            res = await session.run(
                """
                MATCH (s:Session {session_id: $session_id})
                OPTIONAL MATCH (s)-[:HAS_ANSWER]->(a:Answer)
                WITH s, a ORDER BY a.question_number ASC
                OPTIONAL MATCH (a)-[:MENTIONS]->(e:Entity)
                WITH s, a, collect(DISTINCT e) AS entity_list
                OPTIONAL MATCH (a)-[:LED_TO]->(d:Decision)
                RETURN s.session_id AS sid, s.role AS role, s.company AS company,
                       a.answer_id AS aid, a.question_number AS qnum, a.transcript AS transcript,
                       entity_list,
                       d.decision_id AS did, d.next_question AS next_q
                """,
                session_id=session_id,
            )
            rows = await res.data()
        if not rows:
            return {"nodes": [], "edges": [], "session_id": session_id}

        nodes: list[dict[str, Any]] = []
        edges: list[dict[str, str]] = []
        seen_nodes: set[str] = set()
        seen_edges: set[tuple[str, str, str]] = set()

        def add_edge(source: str, target: str, typ: str) -> None:
            key = (source, target, typ)
            if key not in seen_edges:
                seen_edges.add(key)
                edges.append({"source": source, "target": target, "type": typ})

        for row in rows:
            sid = row.get("sid")
            if sid and sid not in seen_nodes:
                seen_nodes.add(sid)
                nodes.append({
                    "id": sid,
                    "type": "Session",
                    "label": "Session",
                    "role": row.get("role"),
                    "company": row.get("company"),
                })
            aid = row.get("aid")
            if aid and aid not in seen_nodes:
                seen_nodes.add(aid)
                transcript = (row.get("transcript") or "")[:80]
                if len((row.get("transcript") or "")) > 80:
                    transcript += "…"
                nodes.append({
                    "id": aid,
                    "type": "Answer",
                    "label": f"Answer Q{row.get('qnum', '?')}",
                    "question_number": row.get("qnum"),
                    "transcript_preview": transcript or "(no transcript)",
                })
                if sid:
                    add_edge(sid, aid, "HAS_ANSWER")
            for e in row.get("entity_list") or []:
                if e is None:
                    continue
                _get = getattr(e, "get", lambda _: None)
                lbl = _get("label") or "ENTITY"
                txt = _get("text") or ""
                eid = f"{lbl}:{txt}"[:80]
                if eid not in seen_nodes:
                    seen_nodes.add(eid)
                    nodes.append({"id": eid, "type": "Entity", "label": lbl, "text": txt})
                if aid:
                    add_edge(aid, eid, "MENTIONS")
            did = row.get("did")
            if did and did not in seen_nodes:
                seen_nodes.add(did)
                next_q = (row.get("next_q") or "")[:60]
                if len((row.get("next_q") or "")) > 60:
                    next_q += "…"
                nodes.append({
                    "id": did,
                    "type": "Decision",
                    "label": "Decision",
                    "next_question_preview": next_q or "(next question)",
                })
                if aid:
                    add_edge(aid, did, "LED_TO")
        return {"nodes": nodes, "edges": edges, "session_id": session_id}
    except Exception:
        logger.exception("Neo4j get_session_graph failed.")
        return empty


async def get_session_transcripts(session_id: str) -> list[str]:
    """Return transcripts for all answers in this session, ordered by question_number. Used for report-time fact-check."""
    if not _neo4j_enabled():
        return []
    driver = _get_driver()
    if driver is None:
        return []
    db = _env("NEO4J_DATABASE")
    try:
        async with driver.session(database=db) as session:
            res = await session.run(
                """
                MATCH (s:Session {session_id: $session_id})-[:HAS_ANSWER]->(a:Answer)
                WHERE a.transcript IS NOT NULL AND a.transcript <> ""
                RETURN a.transcript AS transcript
                ORDER BY a.question_number ASC
                """,
                session_id=session_id,
            )
            rows = await res.data()
            return [r.get("transcript", "") for r in rows if r.get("transcript")]
    except Exception:
        logger.exception("Neo4j get_session_transcripts failed.")
        return []


async def get_rag_context(user_id: str, conversation: list, top_k: int = 5) -> list[str]:
    """Return last K answer transcripts (simple RAG substitute for demo)."""
    if not _neo4j_enabled():
        return []
    driver = _get_driver()
    if driver is None:
        return []
    db = _env("NEO4J_DATABASE")
    try:
        async with driver.session(database=db) as session:
            res = await session.run(
                """
                MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(:Session)-[:HAS_ANSWER]->(a:Answer)
                WHERE a.transcript IS NOT NULL AND a.transcript <> ""
                RETURN a.transcript AS transcript
                ORDER BY a.created_at DESC
                LIMIT $k
                """,
                user_id=user_id,
                k=int(top_k),
            )
            rows = await res.data()
            return [r.get("transcript", "") for r in rows if r.get("transcript")]
    except Exception:
        logger.exception("Neo4j get_rag_context failed.")
        return []


async def get_user_context(user_id: str, question: str) -> str:
    """Return a short profile summary string derived from stored answers."""
    if not _neo4j_enabled():
        logger.info("Neo4j stub: _neo4j_enabled is False in get_user_context; returning stub string.")
        return "[Stub] No Neo4j configured. Set NEO4J_URI/USERNAME/PASSWORD for live memory."
    driver = _get_driver()
    if driver is None:
        return "[Stub] Neo4j unavailable."
    db = _env("NEO4J_DATABASE")
    try:
        async with driver.session(database=db) as session:
            res = await session.run(
                """
                MATCH (u:User {user_id: $user_id})
                OPTIONAL MATCH (u)-[:HAS_SESSION]->(:Session)-[:HAS_ANSWER]->(a:Answer)
                WITH u, collect(a) AS answers
                RETURN
                  size(answers) AS answer_count,
                  reduce(s = 0.0, x IN answers | s + coalesce(x.stress, 0.0)) AS stress_sum,
                  reduce(s = 0.0, x IN answers | s + coalesce(x.confidence, 0.0)) AS conf_sum
                """,
                user_id=user_id,
            )
            row = await res.single()
            if not row:
                return "No history yet. This is the first answer."
            n = int(row.get("answer_count") or 0)
            stress_avg = (float(row.get("stress_sum") or 0.0) / n) if n else None
            conf_avg = (float(row.get("conf_sum") or 0.0) / n) if n else None

            # Top entity labels for quick “coverage” style context.
            ent_res = await session.run(
                """
                MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(:Session)-[:HAS_ANSWER]->(:Answer)-[:MENTIONS]->(e:Entity)
                RETURN e.label AS label, count(*) AS c
                ORDER BY c DESC
                LIMIT 6
                """,
                user_id=user_id,
            )
            ent_rows = await ent_res.data()
            labels = [f"{r.get('label')}({r.get('c')})" for r in ent_rows if r.get("label")]

            parts = [f"Neo4j profile: {n} answers stored."]
            if stress_avg is not None:
                parts.append(f"Baseline stress≈{stress_avg:.2f}.")
            if conf_avg is not None:
                parts.append(f"Baseline confidence≈{conf_avg:.2f}.")
            if labels:
                parts.append("Top entities: " + ", ".join(labels) + ".")

            # If caller asked for something specific, we still return the same context
            # (router/orchestrator can add deterministic feedback on top).
            _ = question  # kept for signature compatibility
            return " ".join(parts)
    except Exception:
        logger.exception("Neo4j get_user_context failed.")
        return "[Stub] Neo4j query failed."


async def get_profile_snapshot(user_id: str) -> dict:
    """Structured snapshot used by the UI profile modal."""
    summary = await get_user_context(user_id, "profile snapshot")
    rag = await get_rag_context(user_id, [], top_k=5)

    # Derive weak/strong areas as simple heuristics over entity labels.
    strong_areas: list[str] = []
    weak_areas: list[str] = []
    recent_topics: list[str] = []
    if "Top entities:" in summary:
        tail = summary.split("Top entities:", 1)[-1]
        labels = [t.strip().strip(".") for t in tail.split(",") if t.strip()]
        # Present the most frequent ones as "strong" for a demo-friendly narrative.
        strong_areas = labels[:3]
        recent_topics = labels[:5]

    return {
        "user_id": user_id,
        "summary": summary.strip() or None,
        "weak_areas": weak_areas,
        "strong_areas": strong_areas,
        "baseline_stress": None,
        "recent_topics": recent_topics,
        "sample_snippets": rag[:5],
    }


async def get_entity_label_counts(user_id: str) -> dict[str, int]:
    """
    Return counts of Entity labels for this user from the Neo4j context graph.
    Used by the orchestrator to understand which topics/skills are under-covered.
    """
    if not _neo4j_enabled():
        return {}
    driver = _get_driver()
    if driver is None:
        return {}
    db = _env("NEO4J_DATABASE")
    try:
        async with driver.session(database=db) as session:
            res = await session.run(
                """
                MATCH (u:User {user_id: $user_id})-[:HAS_SESSION]->(:Session)-[:HAS_ANSWER]->(:Answer)-[:MENTIONS]->(e:Entity)
                RETURN e.label AS label, count(*) AS c
                ORDER BY c DESC
                """,
                user_id=user_id,
            )
            rows = await res.data()
        out: dict[str, int] = {}
        for row in rows:
            label = row.get("label")
            if not label:
                continue
            try:
                out[str(label)] = int(row.get("c") or 0)
            except Exception:
                continue
        return out
    except Exception:
        logger.exception("Neo4j get_entity_label_counts failed.")
        return {}

