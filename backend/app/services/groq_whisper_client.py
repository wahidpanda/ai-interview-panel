"""
Speech-to-text via Groq's free hosted Whisper API. This replaces the
browser's built-in SpeechRecognition, which only works reliably in
Chrome/Edge, depends on Google's cloud speech service being reachable,
and has been the single flakiest part of the voice pipeline (mid-sentence
cutoffs, mishearing, dropped answers). Whisper is far more accurate, and
Groq's free tier (2,000 requests/day, 7,200 audio-seconds/hour) is
generous enough for real interview use - no card required.
"""
import httpx
from ..config import settings

GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


class WhisperError(RuntimeError):
    pass


async def transcribe(audio_bytes: bytes, filename: str = "recording.webm") -> str:
    if not settings.groq_api_key:
        raise WhisperError(
            "GROQ_API_KEY is not set. Voice input needs a free Groq key - "
            "get one at https://console.groq.com/keys and add it to backend/.env"
        )

    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    files = {"file": (filename, audio_bytes, "audio/webm")}
    data = {
        "model": settings.groq_whisper_model,
        "language": "en",
        "response_format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(GROQ_TRANSCRIBE_URL, headers=headers, files=files, data=data)
    except httpx.HTTPError as e:
        raise WhisperError(f"Could not reach Groq: {e}") from e

    if resp.status_code != 200:
        raise WhisperError(f"Groq transcription error {resp.status_code}: {resp.text[:300]}")

    try:
        result = resp.json()
    except ValueError as e:
        raise WhisperError(f"Unexpected response from Groq: {resp.text[:300]}") from e

    return (result.get("text") or "").strip()
