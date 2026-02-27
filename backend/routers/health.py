"""Sponsor / infra status endpoints for quick live-vs-stub checks."""
import os
from fastapi import APIRouter
from services import memory


router = APIRouter(prefix="/sponsors", tags=["sponsors"])


@router.get("/status")
async def sponsor_status():
  """
  Report whether each sponsor integration is configured for live mode
  (env vars present) or currently running in stub/demo mode.
  """
  modulate_live = bool(os.getenv("MODULATE_API_KEY", "").strip())
  yutori_live = bool(os.getenv("YUTORI_API_KEY", "").strip())
  fastino_live = bool(os.getenv("FASTINO_API_KEY", "").strip())
  pioneer_live = bool(os.getenv("PIONEER_API_KEY", "").strip())
  neo4j_live = bool(
    os.getenv("NEO4J_URI", "").strip()
    and os.getenv("NEO4J_USERNAME", "").strip()
    and os.getenv("NEO4J_PASSWORD", "").strip()
  )

  return {
    "modulate": {"live": modulate_live},
    "yutori": {"live": yutori_live},
    "fastino": {"live": fastino_live, "pioneer_live": pioneer_live},
    "neo4j": {"live": neo4j_live},
  }

