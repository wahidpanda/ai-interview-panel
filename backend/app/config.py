import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend/ root regardless of where uvicorn is launched from
BACKEND_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_ROOT / ".env")

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
HR_POLICY_DIR = DATA_DIR / "hr_policies"
JOB_DESC_DIR = DATA_DIR / "job_descriptions"
CV_DIR = DATA_DIR / "candidate_cvs"
STORAGE_DIR = BACKEND_ROOT / "storage"

for d in (HR_POLICY_DIR, JOB_DESC_DIR, CV_DIR, STORAGE_DIR):
    d.mkdir(parents=True, exist_ok=True)


class Settings:
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_model: str = os.getenv("OPENROUTER_MODEL", "openrouter/free")

    # Optional secondary provider. OpenRouter's free tier shares one
    # account-wide daily cap across ALL free models - if that's exhausted,
    # every OpenRouter model fails at once regardless of which one you pick.
    # Groq is a completely separate account/quota system (free, no card),
    # so it survives that failure mode entirely. Leave blank to skip it.
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_whisper_model: str = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")
    judge0_url: str = os.getenv("JUDGE0_URL", "https://ce.judge0.com")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
