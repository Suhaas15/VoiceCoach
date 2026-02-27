# Hackathon Judging Criteria → VoiceCoach Mapping

**Event:** Autonomous Agents Hackathon (Feb 27, 2026)  
**Sponsor tracks:** Modulate, Yutori, Fastino (all three integrated).

Judging: 20% each — Autonomy, Idea, Technical Implementation, Tool Use, Presentation.

---

## Autonomy (20%)

| What judges look for | How VoiceCoach delivers |
|---------------------|--------------------------|
| Agent acts on real-time data without manual intervention | **Modulate:** Every answer is analyzed (stress, confidence, hesitations); orchestrator auto-adjusts tone and difficulty. High stress → supportive + easier; high confidence + low stress → challenging + harder. No human in the loop. |
| | **Yutori:** Scout runs continuously for role/company; company brief shapes next questions; fact-check runs per answer. Research and Browsing tasks are async and polled automatically. |
| | **Fastino:** Each answer is ingested and GLiNER entities extracted; profile/query and RAG chunks drive feedback and next-question choice. Coach “remembers” and adapts. |
| | **Neo4j (Context Graph):** We store each interview answer as an event and also store a first-class **Decision trace** node capturing *why* the coach chose the next question, tone, and difficulty. Decisions are linked to the answer they were based on and chained as precedents over time (event clock vs state clock). |

---

## Idea (20%)

| Angle | Pitch line |
|-------|------------|
| Self-evolving interview coach | "VoiceCoach uses Modulate for voice intelligence, Yutori for live web and fact-checking, and Fastino for memory and GLiNER competency extraction. The coach adapts difficulty and tone in real time and personalizes questions from company briefs and your history." |
| Real-world value | Interview prep with real-time voice feedback, factual grounding (Yutori), and long-term skill tracking (Fastino) is directly applicable to job seekers and L&D. |

---

## Technical Implementation (20%)

| Area | Implementation |
|------|----------------|
| **Modulate** | Velma-2 STT **Batch API** (`POST https://modulate-developer-apis.com/api/velma-2-stt-batch`) with `X-API-Key` + `upload_file` (audio/webm). We enable `emotion_signal` + `accent_signal` and map utterance-level signals into `ModulateResult` (derived stress/confidence), with stub fallback when key missing. |
| **Yutori** | Research: task create → poll (2s) until succeeded/failed; citations extracted. Scouting: create_scout per user, get_scout_updates. Browsing: task with structured task_desc, parse expectations/hints; source_urls returned. |
| **Neo4j** | Stores longitudinal **memory** and a **context graph**: `(:User)-[:HAS_SESSION]->(:Session)-[:HAS_ANSWER]->(:Answer)-[:MENTIONS]->(:Entity)` plus `(:Answer)-[:LED_TO]->(:Decision)` and `(:Decision)-[:PRECEDENT_FOR]->(:Decision)` for decision tracing. |
| **Fastino** | **GLiNER-2** zero-shot extraction (dynamic `schema` labels) to extract structured spans like skills, metrics, impact, projects, etc. (Pioneer endpoint). |
| **Pioneer** | Demo-facing “Trigger Pioneer Optimization” action to show the fine-tuning workflow (Pioneer is purpose-built for GLiNER). For hackathon demos we treat this as a queued optimization step and surface an estimated F1 gain. |
| **Orchestration** | Single orchestrator synthesizes all three: tone/difficulty from Modulate, feedback from Fastino, next question from company_brief or RAG. Autonomy logic: stress streak → supportive; confidence streak → escalate. |

---

## Tool Use (20%)

| Sponsor | Endpoints / flows used |
|---------|------------------------|
| **Modulate** | Velma-2 STT Batch (`POST /api/velma-2-stt-batch`) — transcription + diarization + emotion/accent signals (optional PII/PHI tagging supported). |
| **Yutori** | Research: `POST /research/tasks`, `GET /research/tasks/{id}`. Scouting: `POST /scouts`, `GET /scouts/{id}/updates`. Browsing: `POST /browsing/tasks`, `GET /browsing/tasks/{id}`. |
| **Fastino** | `POST /users/register`, `POST /ingest`, `POST /personalization/profile/query`, `POST /chunks`; GLiNER-2 extraction (zero-shot `schema` labels) for structured competencies. Pioneer fine-tuning is presented as the model-optimization layer for GLiNER. |

At least 3 sponsor tools are used in depth across the answer flow and session lifecycle.

---

## Presentation (20%)

- **3-minute demo:** Problem (30–45s) → Live flow: start session, optional company brief, record answer, show Modulate metrics + feedback + next question + GLiNER entities (90s) → Architecture and sponsor roles (30–45s).
- **Runbook:** See `docs/DEMO_RUNBOOK.md` for env setup, commands, and talking points.
