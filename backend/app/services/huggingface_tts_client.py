"""
Thin wrapper around Hugging Face's free Serverless Inference API for
text-to-speech. Free with just a token (huggingface.co/settings/tokens,
no credit card) - unlike ElevenLabs, no paid plan is required to call a
model via the API. Rate-limited (a few hundred requests/hour) but plenty
for interview-scale usage.

Default model is facebook/mms-tts-eng - a single-speaker English model,
reliable and commonly hosted "warm" on the free tier. Swap
HUGGINGFACE_TTS_MODEL in .env for a different HF TTS model if you like.
"""
import asyncio
import httpx
from ..config import settings

HF_URL = "https://api-inference.huggingface.co/models/{model}"


class HuggingFaceTTSError(RuntimeError):
    pass


async def text_to_speech(text: str) -> tuple[bytes, str]:
    if not settings.huggingface_api_key:
        raise HuggingFaceTTSError("HUGGINGFACE_API_KEY is not set.")

    headers = {"Authorization": f"Bearer {settings.huggingface_api_key}"}
    url = HF_URL.format(model=settings.huggingface_tts_model)
    payload = {"inputs": text}

    try:
        async with httpx.AsyncClient(timeout=40) as client:
            resp = await client.post(url, headers=headers, json=payload)

            # Free serverless models can be "cold" - HF returns 503 with an
            # estimated_time while it spins the model up. Wait once and retry.
            if resp.status_code == 503:
                wait_s = 4
                try:
                    wait_s = min(resp.json().get("estimated_time", 4), 8)
                except Exception:
                    pass
                await asyncio.sleep(wait_s)
                resp = await client.post(url, headers=headers, json=payload)
    except httpx.HTTPError as e:
        raise HuggingFaceTTSError(f"Could not reach Hugging Face: {e}") from e

    if resp.status_code != 200:
        raise HuggingFaceTTSError(f"Hugging Face TTS error {resp.status_code}: {resp.text[:300]}")

    content_type = resp.headers.get("content-type", "")
    if "audio" not in content_type:
        # HF returned JSON (an error body) instead of audio bytes
        raise HuggingFaceTTSError(f"Unexpected response from Hugging Face: {resp.text[:300]}")

    return resp.content, content_type
