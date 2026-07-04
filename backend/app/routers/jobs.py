from fastapi import APIRouter
from ..config import JOB_DESC_DIR

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _parse_title(text: str, fallback_id: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("# "):
            return line[2:].split("—")[0].strip()
    return fallback_id.replace("_", " ").title()


@router.get("")
def list_jobs():
    """Lists every job description file in app/data/job_descriptions/.
    Drop your own .md/.txt files there and they show up automatically."""
    jobs = []
    for path in sorted(JOB_DESC_DIR.glob("*.md")) + sorted(JOB_DESC_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        job_id = path.stem
        jobs.append({"id": job_id, "title": _parse_title(text, job_id)})
    return {"jobs": jobs}


@router.get("/{job_id}")
def get_job(job_id: str):
    for ext in (".md", ".txt"):
        path = JOB_DESC_DIR / f"{job_id}{ext}"
        if path.exists():
            return {"id": job_id, "text": path.read_text(encoding="utf-8", errors="ignore")}
    return {"id": job_id, "text": ""}
