# VoiceCoach — Video Submission Script

Flow-wise script for a video submission. Each section describes what happens in the app and **what each sponsor is doing** at that moment.

---

## 1. Intro (5–10 seconds)

**Say:**  
"VoiceCoach is an AI interview coach that practices with you in real time. You pick a role and company, answer out loud, and the app transcribes your answer, analyzes your voice, extracts skills from what you said, and gives visual feedback on your setup—all using our sponsor stack: Modulate, Yutori, Pioneer/Fastino, Neo4j, and Reka for vision."

---

## 2. Setup — Choosing Role and Company (10–15 seconds)

**What happens:**  
User opens the app, lands on the setup screen, and enters role (e.g. "Software Engineer"), company (e.g. "Acme Corp"), optional job description, and difficulty/level. They tap "Start session."

**What each sponsor is doing:**

| Sponsor | What it's doing |
|--------|------------------|
| **Neo4j** | (Ready.) Will store the new session and all answers/decisions once the session starts. |
| **Yutori** | When the session starts, we create a **scout** for this role and company (live web tips). In the background we kick off **Browsing** to hit the company’s careers/job pages and build a **company brief** (expectations, hints) for choosing follow-up questions later. |
| **Modulate** | (Idle.) Will process each answer’s audio once the user starts recording. |
| **Pioneer / Fastino** | (Idle.) Will run the fine-tuned NER on each answer transcript once answers are submitted. |
| **Reka** | (Idle.) When the user records with video, we send a frame to Reka Vision for interview-style visual feedback (posture, lighting, background). |

**Say:**  
"On setup we choose role and company. Behind the scenes, Yutori starts a scout for live tips and runs Browsing to pull company expectations from the web. Neo4j is our memory layer—it will store every answer and every coach decision for this session."

---

## 3. Session Start — First Question (5–10 seconds)

**What happens:**  
Backend creates a session ID, registers the user in memory, and returns the **first question**. The first question is generated from the role and company (and optional job description). The UI switches to the interview phase and shows the question; the user can read it and then record.

**What each sponsor is doing:**

| Sponsor | What it's doing |
|--------|------------------|
| **Yutori** | Scout is created (or reused) for this user/role/company. Browsing task is running in the background; when it finishes, we attach a **company brief** (expectations, hints) to the session so the orchestrator can use it for the 2nd, 3rd, … questions. |
| **Neo4j** | User/session are registered; we’ll create Answer and Decision nodes as the user submits answers. |
| **Modulate** | (Idle until first answer is submitted.) |
| **Pioneer / Fastino** | (Idle until first answer is submitted.) |
| **Reka** | (Idle until user submits an answer with a video frame.) |

**Say:**  
"The first question is generated from the role and company. Yutori’s Browsing is filling in a company brief in the background so we can tailor the next questions to that company’s expectations."

---

## 4. Answer Cycle — Record → Submit (30–60 seconds per answer)

**What happens:**  
User records an answer (video optional). When they stop, the frontend sends the **audio** (and optionally a **video frame**) to the backend. The backend runs the full pipeline and returns the next question, feedback, voice metrics, and competency entities.

**What each sponsor is doing (in order):**

| Step | Sponsor | What it's doing |
|------|---------|------------------|
| 1 | **Modulate** | Receives the **audio**. Returns **transcript**, **stress score**, **confidence score**, and pacing/hesitation signals. We use these to show stress/confidence bars and a voice pacing score, and to choose the coach’s **tone** (supportive / neutral / challenging) and a short **voice tip**. |
| 2 | **Pioneer / Fastino** | Receives the **transcript** (from Modulate). Runs the **fine-tuned NER model** (voicecoach-ner-v1) to extract entities: skills, frameworks, metrics, impact, etc. These are returned to the frontend for the **competency map** and sent to Neo4j for memory. |
| 3 | **Neo4j** | We **ingest** the answer: create an **Answer** node (transcript, stress, confidence, question, duration) and link **Entity** nodes (from Pioneer). Later we also create a **Decision** node (tone, next question, feedback, and reason—e.g. "from company brief" or "from entity coverage"). |
| 4 | **Orchestrator** | (Not a sponsor—our logic.) Uses **Modulate** for tone; uses **job description**, **Yutori company brief**, and **Neo4j** (entity coverage, history) to pick the **next question** and feedback. |
| 5 | **Yutori** | During the session, **no per-answer fact-check**. The company brief (from Browsing) is used by the orchestrator when choosing the next question. Fact-check runs **only at report time** (see below). |
| 6 | **Reka** | If a **video frame** was sent with the answer, we call **Reka Vision** on that frame. Reka returns image-grounded feedback on posture, lighting, and background for an interview setting. We show this as **Visual Impression** in the UI (positive and constructive, based on what it actually sees). |

**Say:**  
"When you submit an answer, Modulate transcribes it and gives us stress and confidence—we use that to set the coach’s tone and show the voice bars. Pioneer’s fine-tuned model extracts skills and metrics from the transcript; those show up in the competency map and are stored in Neo4j. If you recorded with video, Reka Vision analyzes a frame and gives real visual feedback—posture, lighting, background—shown as Visual Impression. Neo4j saves the answer and the entities, and when we pick the next question we use the job description, Yutori’s company brief, or Neo4j’s entity coverage. Yutori’s fact-check is run once at the end, not after every answer."

---

## 5. After Each Answer — What the User Sees (10–15 seconds)

**What happens:**  
UI shows: next question, text feedback, stress/confidence bars, voice pacing score, voice tip, competency map (entities by type), and optionally Visual Impression (if vision was used).

**What each sponsor contributed:**

| Sponsor | What the user sees from it |
|--------|----------------------------|
| **Modulate** | Transcript (if shown), stress/confidence bars, voice pacing score, voice coaching tip. |
| **Pioneer / Fastino** | Competency map: entities (e.g. TECHNICAL_SKILL, METRIC, IMPACT) and counts. |
| **Neo4j** | (Indirect.) Next question and feedback were chosen using Neo4j’s stored answers and entity coverage. |
| **Yutori** | (Indirect.) Next question may have been chosen from the company brief. Scout tips in the Yutori panel (if visible). |
| **Reka** | **Visual Impression** (if video was used): image-based feedback on posture, lighting, and background from Reka Vision. |

**Say:**  
"Here you see Modulate’s voice metrics and our voice tip, Pioneer’s entities in the competency map, and the next question—which can come from the job description, Yutori’s company brief, or from evening out coverage of skills and impact in Neo4j. If you had video on, Reka’s Visual Impression gives feedback on how you look on camera."

---

## 6. End of Session — Report (20–30 seconds)

**What happens:**  
User ends the session. Frontend requests the **session report**. Backend aggregates from Neo4j, runs **Yutori fact-check** on claims extracted from all answers, and returns strengths, focus areas, suggested next steps, and fact-check summary.

**What each sponsor is doing:**

| Sponsor | What it's doing |
|--------|------------------|
| **Yutori** | **Fact-check:** We take claims from all answers in the session, run Yutori fact-check on them, and show "X of Y claims verified" and any disputed claims in the report. This is the only time we run fact-check (at report time). |
| **Neo4j** | We **query** the graph for this session: answers, entities, decisions. That feeds the report (strengths, focus areas, trend) and any narrative we generate. |
| **Pioneer / Fastino** | Entities and profile data in Neo4j came from Pioneer’s extractions; the report may reference competency coverage and weak/strong areas. |
| **Modulate** | Stress/confidence history stored in Neo4j can be summarized in the report (e.g. trend over the session). |
| **Reka** | (Not used at report time.) Visual feedback is per-answer only during the interview. |

**Say:**  
"When you end the session we build the report from Neo4j—your answers, entities, and the coach’s decisions. We then run Yutori fact-check on claims from all your answers and show how many were verified and what needs a source. So: Modulate for voice, Reka for visual feedback on each answer, Pioneer for skills and entities, Neo4j for memory and decisions, and Yutori for the live web—company brief and scout during the session, and fact-check in the report."

---

## 7. Closing (5–10 seconds)

**Say:**  
"That’s VoiceCoach: flow-wise, Modulate handles voice, Reka handles visual feedback on your interview setup, Yutori handles the live web and fact-check at report time, Pioneer and Fastino handle skill extraction and the competency map, and Neo4j is our memory so we can explain why we asked each question and show your progress. Thanks for watching."

---

## Quick Reference — Sponsor Roles in One Line Each

| Sponsor | One-line role in the flow |
|--------|---------------------------|
| **Modulate** | Every answer’s audio → transcript + stress/confidence + pacing; drives tone and voice UI. |
| **Reka** | When video is used: one frame per answer → Reka Vision → image-grounded feedback (posture, lighting, background) shown as Visual Impression. |
| **Yutori** | Scout + Browsing (company brief) during the session; fact-check on all claims at report time. |
| **Pioneer / Fastino** | Every transcript → fine-tuned NER → entities for competency map and Neo4j; drives next-question choice by entity coverage. |
| **Neo4j** | Stores every answer, entity, and coach decision; we query it for next-question choice and the session report. |
