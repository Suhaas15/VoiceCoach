#!/usr/bin/env python3
"""
Check all VoiceCoach backend routes in stub mode (no API keys).
Run from repo root or backend dir with backend already running on port 8000:
  cd backend && uvicorn main:app --host 127.0.0.1 --port 8000
  python scripts/check_stub_routes.py
"""
import sys
from pathlib import Path
from io import BytesIO

# Allow importing from backend
backend = Path(__file__).resolve().parent.parent
if str(backend) not in sys.path:
    sys.path.insert(0, str(backend))

import httpx

BASE = "http://127.0.0.1:8000"
USER_ID = "test-user-stub"
SESSION_ID = None


def ok(msg: str) -> None:
    print(f"  OK: {msg}")


def fail(msg: str) -> None:
    print(f"  FAIL: {msg}")
    raise AssertionError(msg)


def main() -> None:
    global SESSION_ID
    print("VoiceCoach stub route check (no API keys)")
    print("-" * 50)

    with httpx.Client(timeout=30.0, base_url=BASE) as client:

        # Root and health
        r = client.get("/")
        assert r.status_code == 200, r.text
        ok("GET /")
        r = client.get("/health")
        assert r.status_code == 200, r.text
        ok("GET /health")

        # Session start
        r = client.post(
            "/session/start",
            json={
                "user_id": USER_ID,
                "role": "Product Manager",
                "company": "Acme",
            },
        )
        assert r.status_code == 200, (r.status_code, r.text)
        data = r.json()
        assert "session_id" in data and "first_question" in data
        SESSION_ID = data["session_id"]
        ok(f"POST /session/start -> session_id={SESSION_ID}")

        # Session status
        r = client.get(f"/session/{SESSION_ID}/status")
        assert r.status_code == 200, r.text
        assert r.json().get("session_id") == SESSION_ID
        ok("GET /session/{id}/status")

        # Scout updates (no key -> empty list)
        r = client.get(f"/session/{SESSION_ID}/scout-updates")
        assert r.status_code == 200, r.text
        assert "updates" in r.json()
        ok("GET /session/{id}/scout-updates")

        # Real answer (minimal audio -> Modulate stub)
        r = client.post(
            "/session/answer",
            data={
                "session_id": SESSION_ID,
                "current_question": "Tell me about yourself.",
                "duration_seconds": "5",
            },
            files={"audio": ("audio.webm", BytesIO(b"\x00\x00"), "audio/webm")},
        )
        assert r.status_code == 200, (r.status_code, r.text)
        data = r.json()
        assert "next_question" in data and "transcript" in data
        ok("POST /session/answer (stub audio)")

        # Demo answer (use same session; count already incremented by answer)
        r = client.post(
            f"/session/demo-answer",
            data={"session_id": SESSION_ID},
        )
        assert r.status_code == 200, (r.status_code, r.text)
        data = r.json()
        assert "next_question" in data and "feedback_note" in data
        assert "voice_coaching_tip" in data and "voice_pacing_score" in data
        assert "modulate_trend" in data and "extracted_entities" in data
        ok("POST /session/demo-answer")

        # Company brief (no key -> empty expectations/hints)
        r = client.post(
            "/research/company-brief",
            json={"role": "PM", "company": "Acme", "session_id": SESSION_ID},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "expectations" in data and "hints" in data and "source_urls" in data
        ok("POST /research/company-brief")

        # Session feedback (same session)
        r = client.get(f"/session/{SESSION_ID}/feedback")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "overall_trend" in data and "strengths" in data
        ok("GET /session/{id}/feedback")

        # End session
        r = client.post(f"/session/{SESSION_ID}/end")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "feedback" in data and data["feedback"].get("session_id") == SESSION_ID
        ok("POST /session/{id}/end")

        # User profile
        r = client.get(f"/user/{USER_ID}/profile")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("user_id") == USER_ID
        assert "summary" in data and "weak_areas" in data
        ok("GET /user/{id}/profile")

        # Profile snapshot
        r = client.get(f"/user/{USER_ID}/profile/snapshot")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "user_id" in data and "skill_clusters" in data
        ok("GET /user/{id}/profile/snapshot")

        # Trigger finetuning
        r = client.post(f"/user/{USER_ID}/trigger-finetuning")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "status" in data and "platform" in data
        ok("POST /user/{id}/trigger-finetuning")

        # 404 cases
        r = client.get("/session/nonexistent-id/status")
        assert r.status_code == 404, r.status_code
        ok("GET /session/bad-id -> 404")

    print("-" * 50)
    print("All stub route checks passed.")


if __name__ == "__main__":
    main()
