# VoiceCoach — Verification checklist (stub and with keys)

Use this before demo day to confirm everything works. **Stub mode** = no API keys (or empty in `.env`). **With keys** = real Modulate, Yutori, Fastino keys set in `backend/.env`.

---

## Backend (stub mode)

Run backend: `cd backend && uvicorn main:app --host 127.0.0.1 --port 8000`. Then run:

```bash
cd backend && python3 scripts/check_stub_routes.py
```

Expected: all lines show `OK`. The script hits:

| Endpoint | Method | Stub test |
|----------|--------|-----------|
| `/` | GET | 200, JSON with app name |
| `/health` | GET | 200, status ok |
| `/session/start` | POST | 200, session_id, first_question |
| `/session/{id}/status` | GET | 200, question_count, current_question |
| `/session/{id}/scout-updates` | GET | 200, updates array (empty without key) |
| `/session/answer` | POST | 200, form + audio file → next_question, transcript |
| `/session/demo-answer` | POST | 200, form session_id → full AnswerResponse |
| `/research/company-brief` | POST | 200, expectations, hints, source_urls |
| `/session/{id}/feedback` | GET | 200, overall_trend, strengths, focus_areas |
| `/session/{id}/end` | POST | 200, feedback report |
| `/user/{id}/profile` | GET | 200, summary, weak_areas, strong_areas |
| `/user/{id}/profile/snapshot` | GET | 200, skill_clusters, sample_snippets |
| `/user/{id}/trigger-finetuning` | POST | 200, status, platform |
| `/session/bad-id/status` | GET | 404 |

---

## Frontend (stub mode)

1. Start app: from repo root run `./run.sh` (or backend in one terminal, `cd frontend && npm run dev` in another).
2. Open http://localhost:5173.
3. **Start session:** Pick role/company, start → first question appears, ARIA message updates.
4. **Company brief:** Request company insights (role + company) → expectations/hints/sources (empty in stub).
5. **Demo answer:** Click demo answer → feedback, next question, Modulate block, voice tip, pacing score, competency map (stub entities), fact check.
6. **Real answer:** Click mic, record a few seconds, stop → same as demo (stub transcript and scores).
7. **Scout updates:** Yutori Scout panel shows empty or stub message.
8. **End session:** End session → report modal with overall_trend, strengths, focus_areas.
9. **Session report:** Before ending, open report (if UI has it) → same report shape.
10. **Profile:** Open Profile (Fastino) → summary, weak/strong areas, snippets (stub text when no key).

No uncaught errors in console; all sections render (empty or stub is OK).

---

## With keys (demo day)

1. Set `MODULATE_API_KEY`, `YUTORI_API_KEY`, `FASTINO_API_KEY` in `backend/.env`.
2. Run `./run.sh`, open http://localhost:5173.
3. Start session → record a real answer (or use demo) → confirm Modulate metrics, Yutori fact-check (if claim long enough), and GLiNER entities look real.
4. Request company brief → expectations/hints/source_urls may be non-empty.
5. Scout updates may show items if Yutori returns them.

---

## Run path

- **run.sh:** Installs backend (pip) and frontend (npm), starts backend on 8000 then frontend on 5173. Backend killed on Ctrl+C.
- **Proxy:** Frontend requests to `/api/*` go to `http://127.0.0.1:8000/*` (prefix stripped).
- **Env:** `backend/.env.example` has only Modulate, Yutori, Fastino (no OpenAI). Copy to `.env` and add keys when ready.

---

## Ready for demo

**Stub:** All backend stub checks pass; frontend flow runs without errors.  
**With keys:** Add `MODULATE_API_KEY`, `YUTORI_API_KEY`, `FASTINO_API_KEY` to `backend/.env` and run `./run.sh`; open http://localhost:5173.

**Summary:** Everything is in place except API keys. Tomorrow: add keys to `backend/.env`, run `./run.sh`, open http://localhost:5173, and test.
