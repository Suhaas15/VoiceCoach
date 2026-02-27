import asyncio
import logging
import os

logger = logging.getLogger(__name__)

# Lazy-loaded Reka client (avoids import at startup; reka-api is incompatible with Python 3.14+)
_client: object | None = None
_client_failed = False
_client_failure_reason: str | None = None

REKA_MODEL = os.getenv("REKA_MODEL", "reka-core")
VISION_TIMEOUT_SECONDS = 20.0


def _get_client():
    """Lazy-load Reka client so backend can start even when reka-api fails (e.g. Python 3.14)."""
    global _client, _client_failed, _client_failure_reason
    if _client_failed:
        return None
    if _client is not None:
        return _client
    try:
        from reka.client import AsyncReka
        _api_key = os.getenv("REKA_API_KEY")
        _client = AsyncReka(api_key=_api_key) if _api_key else AsyncReka()
        return _client
    except Exception as e:
        _client_failure_reason = str(e)
        logger.warning("Reka client could not be initialized: %s", e)
        _client_failed = True
        return None


def _vision_disabled_message() -> str:
    """Return a user-facing message when Reka Vision is unavailable."""
    if _client_failure_reason and (
        "unable to infer type" in _client_failure_reason
        or "audio_url" in _client_failure_reason
        or "pydantic" in _client_failure_reason.lower()
    ):
        return (
            "Reka Vision is not supported on this Python version. "
            "Run the backend with Python 3.11 or 3.12 (reka-api does not support 3.14+ yet)."
        )
    if not os.getenv("REKA_API_KEY"):
        return "Reka Vision integration disabled (set REKA_API_KEY in backend/.env)."
    return "Reka Vision unavailable (see backend logs)."


async def analyze_interview_frame(base64_image: str) -> str:
    """Send an image frame to the Reka API for visual feedback."""
    client = _get_client()
    if not client:
        return _vision_disabled_message()

    # Prompt forces image-grounded feedback and explicit faults for interview video frames.
    user_prompt = (
        "Describe only what you see in this image; do not use generic phrases. "
        "This image is a single frame from an interview video. "
        "Give brief visual feedback for the candidate:\n\n"
        "1. Positive: In 1–2 sentences, say what looks good based only on what you see "
        "(e.g. posture, gaze at camera, lighting, background). Be specific to this frame.\n\n"
        "2. Constructive: If you see any issues (harsh shadows, uneven or dim lighting, "
        "cluttered or unprofessional background, slouching, looking away from camera), "
        "call them out in 1–2 sentences. If there are no significant issues, say so briefly.\n\n"
        "Base every remark on what is actually visible in this image."
    )
    try:
        # Media before text per Reka docs for best results
        response = await asyncio.wait_for(
            client.chat.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": f"data:image/jpeg;base64,{base64_image}",
                            },
                            {"type": "text", "text": user_prompt},
                        ],
                    },
                ],
                model=REKA_MODEL,
            ),
            timeout=VISION_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.warning("Reka Vision API call timed out after %s s", VISION_TIMEOUT_SECONDS)
        return "Vision analysis timed out."
    except Exception as e:
        status = getattr(e, "status_code", None)
        if status == 401:
            logger.warning("Reka API key invalid or missing (401)")
            return "Invalid Reka API key."
        if status == 429:
            logger.warning("Reka rate limit (429)")
            return "Vision service busy. Try again shortly."
        logger.error("Error calling Reka Vision API: %s", e)
        return "Could not analyze vision frame."

    if not response.responses or not response.responses[0]:
        logger.warning("Reka returned empty responses")
        return "No feedback generated."
    msg = response.responses[0].message
    content = getattr(msg, "content", None)
    if content is None or not isinstance(content, str):
        return "No feedback generated."
    return content.strip() or "No feedback generated."
