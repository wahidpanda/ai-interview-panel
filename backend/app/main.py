import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings
from .routers import jobs, interview, coding, tts
from .services.openrouter_client import OpenRouterError

logger = logging.getLogger("ai_interview_panel")

app = FastAPI(title="AI Interview Panel API", version="1.0.0")


@app.exception_handler(OpenRouterError)
async def openrouter_error_handler(request: Request, exc: OpenRouterError):
    logger.warning("OpenRouter error on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=502, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unexpected server error: {exc}"},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(interview.router)
app.include_router(coding.router)
app.include_router(tts.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "AI Interview Panel API"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "openrouter_configured": bool(settings.openrouter_api_key),
        "model": settings.openrouter_model,
        "huggingface_tts_configured": bool(settings.huggingface_api_key),
        "elevenlabs_configured": bool(settings.elevenlabs_api_key),
    }