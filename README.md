# VoiceCoach

**An AI interview coach that listens, watches, and adapts—in real time.**

You pick a role and company, answer out loud (with or without video). VoiceCoach transcribes your answer, reads your voice for stress and confidence, extracts skills and metrics from what you said, and—when you’re on camera—gives feedback on your setup. The coach then chooses the next question and tone by itself: no “easy mode” switch, no fixed script. It uses your voice, the job description, live web data, and a graph of everything you’ve said to keep the conversation relevant and challenging.

---

## What it does

- **Voice** — Every answer is sent to [Modulate](https://www.modulate.ai/): you get a transcript plus stress, confidence, and pacing. The coach’s tone (supportive / neutral / challenging) follows how you sound.
- **Vision** — Turn the camera on and a frame is analyzed by [Reka](https://www.reka.ai/) for interview-style feedback: posture, lighting, background. Shown as “Visual Impression” under each answer.
- **Skills** — [Pioneer](https://pioneer.dev/)’s fine-tuned NER pulls entities from your transcript (skills, frameworks, metrics, impact). They show up in a competency map and steer which topics we ask about next.
- **Live web** — [Yutori](https://yutori.ai/) builds a company brief from careers pages and runs fact-check on your claims when you open the session report.
- **Memory** — [Neo4j](https://neo4j.com/) stores every answer, entity, and coach decision. We query it to pick the next question (e.g. by under-covered topics) and to explain why we asked what we asked.

So: **Modulate** for voice, **Reka** for visual feedback, **Yutori** for the web and fact-check, **Pioneer/Fastino** for skill extraction, **Neo4j** for memory. One flow, five integrations.

---

## Quick start

**Requirements:** Node.js, Python 3.12 (recommended for Reka), npm.

```bash
git clone <this-repo>
cd VoiceCoach
./run.sh
```

Then open **http://localhost:5173**. The script creates a venv, installs backend and frontend deps, starts the FastAPI backend on port 8000 and the Vite frontend on 5173.

**Environment:** Create `backend/.env` with the variables below (or copy from an existing env). The app runs with stubs when a key is missing (e.g. no Reka → no Visual Impression; no Modulate → demo transcript).

| Variable | Purpose |
|----------|---------|
| `MODULATE_API_KEY` | Speech-to-text + voice signals (stress, confidence) |
| `REKA_API_KEY` | Visual feedback on posture/lighting/background |
| `YUTORI_API_KEY` | Company brief (Browsing), scout, fact-check at report time |
| `PIONEER_API_KEY` | Fine-tuned NER for skills/entities (competency map) |
| `FASTINO_API_KEY` | Optional; user/profile ingest |
| `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` | Session and answer memory, decision trace |

---

## Flow in 30 seconds

1. **Setup** — You enter role, company, optional job description. We start a session and (in the background) Yutori Browsing fetches a company brief; a Yutori scout can run for live tips.
2. **First question** — Generated from role/company/JD. You record your answer (audio, or audio+video).
3. **After each answer** — Modulate returns transcript + voice metrics; Pioneer extracts entities; Reka (if video) returns Visual Impression. We store the answer and entities in Neo4j, then the orchestrator picks the next question from JD, company brief, or under-covered entities. You see the next question, feedback, competency map, voice bars, and (if on camera) visual feedback.
4. **Report** — When you end the session, we build a report from Neo4j and run Yutori fact-check on claims from all answers. You see strengths, focus areas, and how many claims were verified.

---

## Project layout

```
VoiceCoach/
├── backend/           # FastAPI app
│   ├── main.py        # App entry, routes
│   ├── routers/      # session, feedback, health
│   ├── services/     # modulate, yutori, fastino, orchestrator, memory, vision (Reka)
│   └── models/       # Pydantic models
├── frontend/          # React + TypeScript + Vite + Tailwind
├── docs/              # UNDERSTAND.md, VIDEO_SUBMISSION_SCRIPT.md, etc.
└── run.sh             # One-command run (venv + backend + frontend)
```

---

## Docs

- **[docs/UNDERSTAND.md](docs/UNDERSTAND.md)** — How the app works and what each sponsor does (for demos and judges).
- **[docs/VIDEO_SUBMISSION_SCRIPT.md](docs/VIDEO_SUBMISSION_SCRIPT.md)** — Flow-wise script for a video submission, with “what each sponsor is doing” at every step.

---

## License

See repository license file.
