#!/usr/bin/env python3
"""
Verify Yutori Scout API: create a scout and fetch updates.
Run from backend dir with YUTORI_API_KEY set (e.g. in .env):
  cd backend && python scripts/verify_yutori_scout.py
Use this to confirm the /scouts API returns scout_id and that billing is active.
"""
import asyncio
import os
import sys
from pathlib import Path

backend = Path(__file__).resolve().parent.parent
if str(backend) not in sys.path:
    sys.path.insert(0, str(backend))

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(backend / ".env")
except ImportError:
    pass


async def main() -> None:
    from services import yutori

    key = os.getenv("YUTORI_API_KEY", "").strip()
    if not key:
        print("YUTORI_API_KEY not set. Set it in backend/.env or the environment.")
        sys.exit(1)

    print("Creating scout for role=Software Engineer, company=Acme…")
    scout_id = await yutori.create_scout("Software Engineer", "Acme")
    if not scout_id:
        print("create_scout returned None. Check backend logs for status and response body.")
        sys.exit(1)
    print(f"  scout_id: {scout_id}")

    print("Fetching scout updates…")
    updates = await yutori.get_scout_updates(scout_id, limit=3)
    print(f"  updates: {len(updates)}")
    for i, u in enumerate(updates):
        print(f"    [{i+1}] {u.get('title', '')[:60]}…")
    print("Done. Yutori Scout API is working.")


if __name__ == "__main__":
    asyncio.run(main())
