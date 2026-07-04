import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.groq_whisper_client import transcribe, WhisperError

logger = logging.getLogger("ai_interview_panel")
router = APIRouter(prefix="/api/speech", tags=["speech"])


@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Accepts a recorded audio clip (webm/wav/etc, whatever MediaRecorder in
    the browser produced) and returns its transcribed text via Groq's free
    Whisper API.
    """
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(400, "No audio data received")

    try:
        text = await transcribe(audio_bytes, audio.filename or "recording.webm")
    except WhisperError as e:
        logger.warning("Whisper transcription failed: %s", e)
        raise HTTPException(502, str(e))

    return {"text": text}
