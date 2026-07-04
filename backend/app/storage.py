"""
Lightweight file-based session store.
No database setup needed - each interview session is a JSON file on disk.
Good enough for local / small-scale use. Swap for Postgres/Mongo later if needed.
"""
import json
import uuid
import threading
from datetime import datetime, timezone
from .config import STORAGE_DIR

_lock = threading.Lock()


def _path(session_id: str):
    return STORAGE_DIR / f"{session_id}.json"


def new_session(candidate_name: str, job_description_id: str, jd_text: str, cv_text: str) -> dict:
    session_id = uuid.uuid4().hex[:12]
    session = {
        "session_id": session_id,
        "candidate_name": candidate_name,
        "job_description_id": job_description_id,
        "jd_text": jd_text,
        "cv_text": cv_text,
        "stage": "hr",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "chat": {"hr": [], "technical": [], "teamlead": []},
        "coding": {"problem": None, "attempts": [], "final_code": None, "final_language": None},
        "scores": [],  # list[StageScore-like dict]
        "final_result": None,
    }
    save(session)
    return session


def save(session: dict):
    with _lock:
        with open(_path(session["session_id"]), "w") as f:
            json.dump(session, f, indent=2)


def load(session_id: str) -> dict | None:
    p = _path(session_id)
    if not p.exists():
        return None
    with open(p) as f:
        return json.load(f)
