"""Modulate Velma voice analysis. Stub when API key missing.

This implementation now uses the Velma-2 STT **Streaming** API so we can
get real-time(ish) transcripts and emotion/accent signals from a single
recorded answer. We still send a pre-recorded blob from the browser, but
we feed it to the WebSocket endpoint in chunks, following Modulate's
streaming quickstart guide.
"""
import logging
import os
from collections import Counter
from models.session import ModulateResult


logger = logging.getLogger(__name__)

MODULATE_STREAMING_URL = "wss://modulate-developer-apis.com/api/velma-2-stt-streaming"


def _get_modulate_api_key() -> str | None:
    # Read env at call-time so load_dotenv timing never surprises us.
    key = os.getenv("MODULATE_API_KEY")
    return key.strip() if key and key.strip() else None


def _level_from_confidence(conf: float) -> str:
    if conf >= 0.7:
        return "high"
    if conf >= 0.4:
        return "medium"
    return "low"


def _scores_from_emotions(emotions: list[str]) -> tuple[float, float]:
    """
    Map utterance-level emotion labels to (stress_score, confidence_score) in [0,1].
    Modulate returns categorical emotions (e.g. "Stressed", "Confident") when enabled.
    """
    if not emotions:
        return 0.35, 0.6

    counts = Counter(e.strip() for e in emotions if isinstance(e, str) and e.strip())
    total = sum(counts.values()) or 1

    stress_labels = {
        "Stressed", "Anxious", "Afraid", "Concerned", "Angry", "Frustrated",
        "Ashamed", "Sad", "Tired", "Disgusted", "Disappointed", "Confused",
    }
    confident_labels = {
        "Confident", "Proud", "Excited", "Hopeful", "Interested", "Calm",
        "Happy", "Amused", "Relieved", "Affectionate",
    }

    stress_mass = sum(counts.get(lbl, 0) for lbl in stress_labels) / total
    conf_mass = sum(counts.get(lbl, 0) for lbl in confident_labels) / total

    # Keep a reasonable floor/ceiling so downstream UI remains stable.
    stress_score = max(0.05, min(0.95, 0.2 + 0.9 * stress_mass))
    confidence_score = max(0.05, min(0.95, 0.3 + 0.9 * conf_mass))
    return stress_score, confidence_score


async def analyze_voice(audio_bytes: bytes, session_ctx: dict | None = None) -> ModulateResult:
    """
    Send audio to Modulate Velma-2 STT Streaming API.
    Returns transcript, derived stress/confidence, and raw metadata.
    Uses stub when MODULATE_API_KEY is not set or request fails.
    """
    api_key = _get_modulate_api_key()
    if not api_key:
        logger.warning("Modulate stub: MODULATE_API_KEY is not set; returning stub ModulateResult.")
        print("[Modulate] MODULATE_API_KEY missing; using stub result.")
        return _stub_result(audio_bytes)

    try:
        import asyncio
        import json
        import ssl
        import aiohttp

        try:
            import certifi  # type: ignore[import]
            ssl_context = ssl.create_default_context(cafile=certifi.where())
            ssl_mode = "certifi"
        except Exception:
            # Fallback to default SSL context if certifi is unavailable.
            ssl_context = ssl.create_default_context()
            ssl_mode = "default"

        payload_size = len(audio_bytes) if audio_bytes is not None else 0
        print(
            f"[Modulate] Streaming to Velma-2: url={MODULATE_STREAMING_URL}, "
            f"audio_bytes={payload_size}, ssl_mode={ssl_mode}"
        )
        logger.info(
            "Modulate analyze_voice (streaming): WS %s with audio_bytes=%d ssl_mode=%s",
            MODULATE_STREAMING_URL,
            payload_size,
            ssl_mode,
        )

        # Build WebSocket URL with query params as per docs.
        # Request English-only transcription; override via MODULATE_LANGUAGE (e.g. en) if API supports it.
        lang = (os.getenv("MODULATE_LANGUAGE") or "en").strip().lower() or "en"
        url = (
            f"{MODULATE_STREAMING_URL}"
            f"?api_key={api_key}"
            f"&speaker_diarization=true"
            f"&emotion_signal=true"
            f"&accent_signal=true"
            f"&pii_phi_tagging=false"
            f"&language={lang}"
        )

        CHUNK_SIZE = 8192
        seconds_per_chunk = CHUNK_SIZE / 4000.0  # from Modulate quickstart

        utterances: list[dict] = []
        done_duration_ms: int | None = None

        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.ws_connect(url) as ws:
                # Task to send audio bytes in the background
                async def send_audio() -> None:
                    nonlocal audio_bytes
                    sent = 0
                    mv = memoryview(audio_bytes or b"")
                    for offset in range(0, len(mv), CHUNK_SIZE):
                        chunk = mv[offset : offset + CHUNK_SIZE]
                        if not chunk:
                            break
                        await ws.send_bytes(chunk)
                        sent += len(chunk)
                        await asyncio.sleep(seconds_per_chunk)
                    # Signal end of audio
                    await ws.send_str("")
                    print(f"[Modulate] Streaming send complete: {sent} bytes")

                send_task = asyncio.create_task(send_audio())

                try:
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            data = json.loads(msg.data)
                            msg_type = data.get("type")
                            if msg_type == "utterance":
                                u = data.get("utterance") or {}
                                utterances.append(u)
                            elif msg_type == "done":
                                done_duration_ms = int(data.get("duration_ms") or 0)
                                break
                            elif msg_type == "error":
                                err = data.get("error") or "Unknown error"
                                logger.error("Modulate streaming error message: %s", err)
                                print(f"[Modulate] Streaming error from Velma-2: {err}")
                                raise RuntimeError(f"Modulate streaming error: {err}")
                        elif msg.type in (
                            aiohttp.WSMsgType.ERROR,
                            aiohttp.WSMsgType.CLOSE,
                            aiohttp.WSMsgType.CLOSED,
                        ):
                            logger.warning("Modulate streaming connection closed with type=%s", msg.type)
                            break
                finally:
                    if not send_task.done():
                        send_task.cancel()
                        try:
                            await send_task
                        except asyncio.CancelledError:
                            pass

        transcript = " ".join(
            str(u.get("text", "")).strip() for u in utterances if isinstance(u, dict) and u.get("text")
        ).strip()
        emotions = [
            str(u.get("emotion"))
            for u in utterances
            if isinstance(u, dict) and u.get("emotion") not in (None, "")
        ]
        speakers = {
            u.get("speaker")
            for u in utterances
            if isinstance(u, dict) and u.get("speaker") is not None
        }

        stress_score, confidence_score = _scores_from_emotions(emotions)

        logger.info(
            "Modulate streaming OK: utterances=%d speakers=%d duration_ms=%s",
            len(utterances),
            len(speakers),
            done_duration_ms,
        )
        print(
            "[Modulate] Streaming OK: "
            f"utterance_count={len(utterances)}, "
            f"speakers={len(speakers)}, "
            f"duration_ms={done_duration_ms}"
        )

        return ModulateResult(
            transcript=transcript or "[Modulate] (empty transcript)",
            stress_score=float(stress_score),
            confidence_level=_level_from_confidence(float(confidence_score)),
            confidence_score=float(confidence_score),
            hesitation_count=0,
            emotion={
                "model": "velma-2-stt-streaming",
                "duration_ms": done_duration_ms,
                "utterance_count": len(utterances),
                "speaker_count": len(speakers),
                "raw_utterances": utterances,
            },
            deception_score=None,
        )
    except Exception as exc:
        logger.exception("Modulate analyze_voice failed; falling back to stub result.")
        print(
            "[Modulate] analyze_voice exception; using stub result. "
            f"type={type(exc).__name__}, details={getattr(exc, 'args', '')}"
        )
        return _stub_result(audio_bytes)

def _stub_result(audio_bytes: bytes) -> ModulateResult:
    """Stub result when API key missing or request fails."""
    return ModulateResult(
        transcript="[Stub] User spoke for a short answer. Enable Modulate API for real analysis.",
        stress_score=0.35,
        confidence_level="medium",
        confidence_score=0.65,
        hesitation_count=2,
        emotion={"stress": 0.35, "confidence": 0.65, "frustration": 0.1},
        deception_score=0.15,
    )


def voice_coaching_tip_and_pacing(modulate_result: ModulateResult, duration_seconds: int = 30) -> tuple[str | None, float | None]:
    """
    Derive a short Modulate-focused coaching tip and a 0-100 voice pacing score
    from hesitations and stress for hackathon visibility.
    """
    stress = modulate_result.stress_score
    conf = modulate_result.confidence_score
    hes = modulate_result.hesitation_count
    # Pacing: penalize high stress and many hesitations; reward confidence
    stress_penalty = min(40, stress * 50)
    hes_penalty = min(30, hes * 8)
    conf_bonus = conf * 15
    pacing = max(0.0, min(100.0, 70.0 - stress_penalty - hes_penalty + conf_bonus))
    tip = None
    if stress > 0.6:
        tip = "Modulate: Stress is elevated. Take a breath and focus on one concrete example."
    elif conf > 0.7 and stress < 0.4:
        tip = "Modulate: Strong confidence. Try adding a specific metric or outcome to land the point."
    elif hes >= 3:
        tip = "Modulate: A few hesitations detected. Slowing down on key phrases can help clarity."
    else:
        tip = "Modulate: Steady delivery. Keep this pace for the next answer."
    return tip, round(pacing, 1)
