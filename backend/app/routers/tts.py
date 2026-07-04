import logging
from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import Response
from ..config import settings
from ..services.huggingface_tts_client import text_to_speech as hf_text_to_speech, HuggingFaceTTSError
from ..services.elevenlabs_client import text_to_speech as el_text_to_speech, ElevenLabsError

logger = logging.getLogger("ai_interview_panel")
router = APIRouter(prefix="/api/tts", tags=["tts"])


@router.post("")
async def speak(stage: str = Form(...), text: str = Form(...)):
    """
    Returns audio for the given agent stage's voice.
    Tries Hugging Face's free Inference API first, then an optional
    ElevenLabs key if configured. If both are unavailable or fail, returns
    502 - the frontend then falls back to the browser's built-in voice.
    """
    text = text[:2000]  # stay well under provider per-request limits

    if settings.huggingface_api_key:
        try:
            audio_bytes, content_type = await hf_text_to_speech(text)
            return Response(content=audio_bytes, media_type=content_type)
        except HuggingFaceTTSError as e:
            logger.warning("Hugging Face TTS failed, trying next provider: %s", e)
        except Exception as e:  # belt-and-suspenders: never let TTS crash the request
            logger.warning("Unexpected Hugging Face TTS error: %s", e)

    if settings.elevenlabs_api_key:
        try:
            audio_bytes = await el_text_to_speech(text, stage)
            return Response(content=audio_bytes, media_type="audio/mpeg")
        except ElevenLabsError as e:
            logger.warning("ElevenLabs TTS failed: %s", e)
        except Exception as e:
            logger.warning("Unexpected ElevenLabs TTS error: %s", e)

    raise HTTPException(
        502,
        "No working TTS provider configured (set HUGGINGFACE_API_KEY in .env for free voices). "
        "The frontend will fall back to the browser's built-in voice.",
    )
