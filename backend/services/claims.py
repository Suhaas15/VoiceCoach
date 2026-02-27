"""Shared claim extraction for transcripts (used by session router and report-time fact-check)."""


def extract_claim_simple(transcript: str) -> str:
    """Simple claim extraction: first sentence or first 150 chars. Can be replaced with LLM."""
    t = (transcript or "").strip()
    if not t:
        return ""
    for sep in ".!?":
        if sep in t:
            return t.split(sep)[0].strip() + sep
    return t[:150] if len(t) > 150 else t
