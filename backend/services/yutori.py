"""Yutori Research API for fact verification. Stub when API key missing."""
import logging
import os
import re
from models.session import FactCheckResult


logger = logging.getLogger(__name__)

YUTORI_API_KEY = os.getenv("YUTORI_API_KEY")
YUTORI_BASE = "https://api.yutori.com/v1"


def _yutori_headers() -> dict:
    """Yutori API uses X-API-Key header per docs."""
    return {
        "X-API-Key": YUTORI_API_KEY or "",
        "Content-Type": "application/json",
    }


async def verify_claim(claim: str) -> FactCheckResult:
    """
    Create Research task, poll until complete (with timeout), return result.
    Returns claim, correct, actual_value, source_url.
    Stub when YUTORI_API_KEY is not set or claim is too short.
    """
    if not YUTORI_API_KEY:
        logger.warning("Yutori stub: YUTORI_API_KEY is not set; returning stub FactCheckResult.")
        return _stub_fact_check(claim)
    if not claim or len(claim.strip()) < 10:
        logger.info("Yutori stub: claim too short for verify_claim; returning stub FactCheckResult.")
        return _stub_fact_check(claim)

    try:
        import httpx
        async with httpx.AsyncClient(timeout=60.0) as client:
            query = (
                "Fact-check the claim below using reliable sources. "
                "Return EXACTLY this format (4 lines):\n"
                "CORRECT: <true|false>\n"
                "ACTUAL_VALUE: <short actual value or 'unknown'>\n"
                "SOURCE: <best URL>\n"
                "SUMMARY: <one short sentence>\n\n"
                f"CLAIM: {claim.strip()}"
            )
            create_resp = await client.post(
                f"{YUTORI_BASE}/research/tasks",
                headers=_yutori_headers(),
                json={"query": query},
            )
            create_resp.raise_for_status()
            task_data = create_resp.json()
            task_id = task_data.get("task_id")
            if not task_id:
                return _stub_fact_check(claim)

            import asyncio
            for _ in range(30):
                await asyncio.sleep(2)
                status_resp = await client.get(
                    f"{YUTORI_BASE}/research/tasks/{task_id}",
                    headers={"X-API-Key": YUTORI_API_KEY},
                )
                status_resp.raise_for_status()
                status_data = status_resp.json()
                status = status_data.get("status")
                if status == "succeeded":
                    result = status_data.get("result")
                    summary = result if isinstance(result, str) else ""
                    correct, actual_value, source_url, one_liner = _parse_factcheck_block(summary)
                    if not source_url:
                        updates = status_data.get("updates") or []
                        for upd in updates:
                            citations = upd.get("citations") or []
                            if citations:
                                source_url = citations[0].get("url")
                                break
                    return FactCheckResult(
                        claim=claim,
                        correct=correct,
                        actual_value=actual_value,
                        source_url=source_url,
                        summary=one_liner or (summary[:280] if summary else None),
                    )
                if status == "failed":
                    return _stub_fact_check(claim)

            return _stub_fact_check(claim)
    except Exception:
        logger.exception("Yutori verify_claim failed; falling back to stub result.")
        return _stub_fact_check(claim)


def _parse_factcheck_block(text: str) -> tuple[bool, str | None, str | None, str | None]:
    """
    Parse the structured 4-line response we request from Yutori Research.
    Returns: (correct, actual_value, source_url, summary_one_liner)
    """
    if not text:
        return True, None, None, None

    def _grab(key: str) -> str | None:
        m = re.search(rf"^{re.escape(key)}\s*:\s*(.+)$", text, flags=re.IGNORECASE | re.MULTILINE)
        return m.group(1).strip() if m else None

    correct_raw = _grab("CORRECT")
    actual_raw = _grab("ACTUAL_VALUE")
    source_raw = _grab("SOURCE")
    summary_raw = _grab("SUMMARY")

    correct = True
    if correct_raw:
        if correct_raw.lower().startswith("f"):
            correct = False
        elif correct_raw.lower().startswith("t"):
            correct = True
        elif "incorrect" in correct_raw.lower() or "false" in correct_raw.lower():
            correct = False

    actual_value = None
    if actual_raw and actual_raw.lower() not in {"unknown", "n/a", "none"}:
        actual_value = actual_raw[:200]

    source_url = source_raw if source_raw and source_raw.startswith("http") else None
    one_liner = summary_raw[:280] if summary_raw else None
    return correct, actual_value, source_url, one_liner


def _stub_fact_check(claim: str | None) -> FactCheckResult:
    return FactCheckResult(
        claim=claim or "(no claim extracted)",
        correct=True,
        actual_value=None,
        summary="[Stub] Enable Yutori API key for real fact-checking.",
    )


# --- Yutori Scouting API ---

async def create_scout(role: str, company: str) -> str | None:
    """
    Create a Yutori Scout to track interview-related content for role at company.
    Returns scout_id or None if no key or creation fails.
    """
    if not YUTORI_API_KEY:
        logger.info("Yutori Scout stub: YUTORI_API_KEY not set; skipping create_scout.")
        return None
    query = (
        f"Track new interview-related articles, leadership principles, and role expectations "
        f"for {role} at {company}. Alert on relevant interview tips and company culture insights."
    )
    try:
        import httpx
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(
                f"{YUTORI_BASE}/scouts",
                headers=_yutori_headers(),
                json={"query": query},
            )
            if not r.is_success:
                logger.warning(
                    "Yutori create_scout failed: status=%s body_snippet=%s",
                    r.status_code,
                    (r.text or "")[:200],
                )
                return None
            data = r.json()
            scout_id = data.get("scout_id") or data.get("id")
            if not scout_id:
                logger.warning(
                    "Yutori create_scout: response missing scout_id/id. Raw keys: %s",
                    list(data.keys()) if isinstance(data, dict) else type(data),
                )
                return None
            logger.info("Yutori create_scout succeeded for role=%s company=%s scout_id=%s", role, company, scout_id)
            return scout_id
    except Exception:
        logger.exception("Yutori create_scout failed.")
        return None


async def get_scout_updates(scout_id: str, limit: int = 5) -> list[dict]:
    """
    Get recent updates from a Scout. Returns list of { title, url, summary }.
    """
    if not YUTORI_API_KEY or not scout_id:
        if not YUTORI_API_KEY:
            logger.info("Yutori Scout stub: YUTORI_API_KEY not set; returning canned updates for demo.")
        return _stub_scout_updates(limit)
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                f"{YUTORI_BASE}/scouts/{scout_id}/updates",
                headers={"X-API-Key": YUTORI_API_KEY},
            )
            if not r.is_success:
                return _stub_scout_updates(limit)
            data = r.json()
            updates = data.get("updates", data) if isinstance(data, dict) else (data if isinstance(data, list) else [])
            out = []
            for u in updates[:limit]:
                if isinstance(u, dict):
                    out.append({
                        "title": u.get("title", u.get("summary", ""))[:120] or "Update",
                        "url": u.get("url", u.get("source_url", "")),
                        "summary": (u.get("summary", u.get("content", "")) or "")[:200],
                    })
            if not out:
                return _stub_scout_updates(limit)
            return out
    except Exception:
        logger.exception("Yutori get_scout_updates failed.")
        return _stub_scout_updates(limit)


def _stub_scout_updates(limit: int = 5) -> list[dict]:
    """
    Demo-friendly canned updates so the Scout panel is never empty on stage.
    """
    base: list[dict] = [
        {
            "title": "Meta data engineering interview tips",
            "url": "https://www.metacareers.com",
            "summary": "Focus on SQL, data modeling, and communication in cross-functional settings.",
        },
        {
            "title": "Behavioral questions to expect",
            "url": "https://www.google.com/search?q=behavioral+interview+questions",
            "summary": "Prepare STAR stories around conflict, leadership, estimation, and impact.",
        },
        {
            "title": "Company culture & leadership principles",
            "url": "https://www.google.com/search?q=Meta+company+culture",
            "summary": "Read about Meta's culture and leadership expectations before your round.",
        },
    ]
    return base[: max(1, min(limit, len(base)))]


# --- Yutori Browsing API (company brief) ---

async def run_company_brief_browsing(role: str, company: str) -> dict:
    """
    Run a Browsing task to get company/role expectations. Polls until succeeded.
    Returns { expectations: list[str], hints: list[str], source_urls: list[str] }.
    """
    if not YUTORI_API_KEY:
        logger.info("Yutori Browsing stub: YUTORI_API_KEY not set; returning empty brief.")
        return {"expectations": [], "hints": [], "source_urls": []}
    task_desc = (
        f"Open the careers or jobs page for {company}. "
        f"Find a relevant job posting for a role like {role}. "
        f"Summarize the top 3 expectations and 3 hints for candidates. "
        f"Return a short summary as plain text with bullet points."
    )
    start_url = f"https://www.google.com/search?q={company.replace(' ', '+')}+careers"
    try:
        import httpx
        import asyncio
        async with httpx.AsyncClient(timeout=90.0) as client:
            create_resp = await client.post(
                f"{YUTORI_BASE}/browsing/tasks",
                headers=_yutori_headers(),
                json={"task": task_desc, "start_url": start_url, "max_steps": 40},
            )
            if not create_resp.is_success:
                return {"expectations": [], "hints": [], "source_urls": []}
            data = create_resp.json()
            task_id = data.get("task_id")
            if not task_id:
                return {"expectations": [], "hints": [], "source_urls": []}
            for _ in range(45):
                await asyncio.sleep(2)
                status_resp = await client.get(
                    f"{YUTORI_BASE}/browsing/tasks/{task_id}",
                    headers={"X-API-Key": YUTORI_API_KEY},
                )
                if not status_resp.is_success:
                    continue
                status_data = status_resp.json()
                status = status_data.get("status")
                if status == "succeeded":
                    result = status_data.get("result") or ""
                    expectations: list[str] = []
                    hints: list[str] = []
                    bullet_lines: list[str] = []
                    for raw in (result or "").split("\n"):
                        line = raw.strip()
                        if not line:
                            continue
                        # Strip simple HTML tags Yutori may emit
                        line = re.sub(r"<[^>]+>", "", line)
                        if not line or line.lower().startswith("sources"):
                            continue
                        # Skip markdown headings like "## Final Summary"
                        if line.lstrip().startswith("#"):
                            continue
                        if line.startswith("-"):
                            line = line[1:].strip()
                        if not line:
                            continue
                        bullet_lines.append(line[:200])
                        if "expectation" in line.lower() or "require" in line.lower():
                            expectations.append(line[:200])
                        else:
                            hints.append(line[:200])

                    # Fallback: if our keyword-based split found nothing,
                    # still surface Yutori's text by treating the first
                    # few bullet lines as expectations and the rest as hints.
                    if not expectations and not hints and bullet_lines:
                        expectations = bullet_lines[:3]
                        hints = bullet_lines[3:8]

                    return {
                        "expectations": expectations[:5],
                        "hints": hints[:5],
                        "source_urls": [start_url],
                    }
                if status == "failed":
                    return {"expectations": [], "hints": [], "source_urls": []}
            return {"expectations": [], "hints": [], "source_urls": []}
    except Exception:
        logger.exception("Yutori run_company_brief_browsing failed.")
        return {"expectations": [], "hints": [], "source_urls": []}
