"""
Thin wrapper around the ElevenLabs Text-to-Speech API.
Free-tier accounts get full API access with a monthly character quota
(no credit card required) - see https://elevenlabs.io/pricing/api.
If no key is set, or the quota is exhausted, callers should fall back to
the browser's free built-in speech synthesis (handled on the frontend).
"""
import httpx
from ..config import settings

TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

# Well-known ElevenLabs premade voice IDs, picked for distinct panel personas.
# These are available on the free tier. If one is ever retired on their end,
# swap in a fresh voice_id from https://elevenlabs.io/app/voice-library.
VOICE_MAP = {
    "hr": "21m00Tcm4TlvDq8ikWAM",        # Rachel - warm, professional female voice -> Kylie Jenner (HR)
    "technical": "EXAVITQu4vr4xnSDxMaL",  # Bella - crisp, focused female voice -> Lisa Chen (PM)
    "teamlead": "ErXwobaYiN019PkySvjV",   # Antoni - calm, confident male voice -> Mark Rodriguez (Team Lead)
    "decision": "pNInz6obpgDQGcFmaJgB",   # Adam - neutral male voice, used for narrated summaries if ever needed
}


class ElevenLabsError(RuntimeError):
    pass


async def text_to_speech(text: str, stage: str) -> bytes:
    if not settings.elevenlabs_api_key:
        raise ElevenLabsError("ELEVENLABS_API_KEY is not set.")

    voice_id = VOICE_MAP.get(stage, VOICE_MAP["hr"])
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": settings.elevenlabs_model,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(TTS_URL.format(voice_id=voice_id), headers=headers, json=payload)
        except httpx.HTTPError as e:
            raise ElevenLabsError(f"Could not reach ElevenLabs: {e}") from e

    if resp.status_code != 200:
        raise ElevenLabsError(f"ElevenLabs API error {resp.status_code}: {resp.text[:300]}")

    return resp.content
