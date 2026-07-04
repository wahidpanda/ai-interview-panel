from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from .. import storage
from ..config import JOB_DESC_DIR, CV_DIR
from ..services.cv_parser import extract_text
from ..agents import hr_agent, technical_agent, teamlead_agent, decision_agent

router = APIRouter(prefix="/api/interview", tags=["interview"])

STAGE_ORDER = ["hr", "technical", "coding", "teamlead", "completed"]

AGENT_DISPLAY = {
    "hr": f"{hr_agent.AGENT_NAME} ({hr_agent.AGENT_ROLE})",
    "technical": f"{technical_agent.AGENT_NAME} ({technical_agent.AGENT_ROLE})",
    "teamlead": f"{teamlead_agent.AGENT_NAME} ({teamlead_agent.AGENT_ROLE})",
}

STAGE_LABEL = {
    "hr": "HR Round",
    "technical": "Technical Round",
    "coding": "Coding Round",
    "teamlead": "Final Round",
}


def _read_jd(job_description_id: str) -> str:
    for ext in (".md", ".txt"):
        path = JOB_DESC_DIR / f"{job_description_id}{ext}"
        if path.exists():
            return path.read_text(encoding="utf-8", errors="ignore")
    raise HTTPException(404, f"Job description '{job_description_id}' not found")


def _read_hr_policy() -> str:
    from ..config import HR_POLICY_DIR
    texts = []
    for path in sorted(HR_POLICY_DIR.glob("*.md")) + sorted(HR_POLICY_DIR.glob("*.txt")):
        texts.append(path.read_text(encoding="utf-8", errors="ignore"))
    return "\n\n".join(texts) if texts else "Be professional, respectful, and fair."


@router.post("/start")
async def start_interview(
    candidate_name: str = Form(...),
    job_description_id: str = Form(...),
    cv_file: UploadFile | None = File(None),
):
    jd_text = _read_jd(job_description_id)
    hr_policy_text = _read_hr_policy()

    if cv_file is not None:
        raw = await cv_file.read()
        cv_text = extract_text(cv_file.filename, raw)
        # persist a copy so it's visible under data/candidate_cvs/ for later reference
        safe_name = candidate_name.replace(" ", "_").lower()
        (CV_DIR / f"{safe_name}_{cv_file.filename}").write_bytes(raw)
    else:
        cv_text = "(No CV uploaded — evaluate based on interview answers only.)"

    session = storage.new_session(candidate_name, job_description_id, jd_text, cv_text)

    result = await hr_agent.take_turn(candidate_name, jd_text, hr_policy_text, [], None)
    session["chat"]["hr"].append({"role": "agent", "speaker": AGENT_DISPLAY["hr"], "text": result["reply"], "options": result.get("options", [])})
    storage.save(session)

    return {
        "session_id": session["session_id"],
        "stage": session["stage"],
        "stage_label": STAGE_LABEL["hr"],
        "message": {"speaker": AGENT_DISPLAY["hr"], "text": result["reply"], "options": result.get("options", [])},
    }


@router.get("/state/{session_id}")
def get_state(session_id: str):
    session = storage.load(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


async def _advance_to_next_chat_stage(session: dict, next_stage: str) -> dict | None:
    """Generates the opening question for technical/teamlead stages."""
    if next_stage == "technical":
        result = await technical_agent.take_turn(
            session["candidate_name"], session["jd_text"], session["cv_text"], [], None
        )
    elif next_stage == "teamlead":
        coding = session["coding"]
        coding_summary = (
            f"Score: {coding.get('score', 'N/A')}/10. " if coding.get("score") is not None else "Not available. "
        )
        result = await teamlead_agent.take_turn(
            session["candidate_name"], session["jd_text"], session["cv_text"], coding_summary, [], None
        )
    else:
        return None

    message = {"speaker": AGENT_DISPLAY[next_stage], "text": result["reply"], "options": result.get("options", [])}
    session["chat"][next_stage].append({"role": "agent", **message})
    return message


@router.post("/message")
async def send_message(session_id: str = Form(...), message: str = Form(...)):
    session = storage.load(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    stage = session["stage"]
    if stage not in ("hr", "technical", "teamlead"):
        raise HTTPException(400, f"No chat agent active for stage '{stage}'")

    history = session["chat"][stage]
    history.append({"role": "candidate", "speaker": session["candidate_name"], "text": message})

    if stage == "hr":
        result = await hr_agent.take_turn(
            session["candidate_name"], session["jd_text"], _read_hr_policy(), history[:-1], message
        )
    elif stage == "technical":
        result = await technical_agent.take_turn(
            session["candidate_name"], session["jd_text"], session["cv_text"], history[:-1], message
        )
    else:  # teamlead
        coding = session["coding"]
        coding_summary = f"Score: {coding.get('score', 'N/A')}/10."
        result = await teamlead_agent.take_turn(
            session["candidate_name"], session["jd_text"], session["cv_text"], coding_summary, history[:-1], message
        )

    history.append({"role": "agent", "speaker": AGENT_DISPLAY[stage], "text": result["reply"], "options": result.get("options", [])})

    response_payload = {
        "stage": stage,
        "message": {"speaker": AGENT_DISPLAY[stage], "text": result["reply"], "options": result.get("options", [])},
        "stage_complete": result["stage_complete"],
        "next_stage": None,
        "next_message": None,
    }

    if result["stage_complete"] and result["score"]:
        session["scores"].append({
            "stage": stage,
            "label": STAGE_LABEL[stage],
            "score": result["score"]["score"],
            "summary": result["score"]["summary"],
            "strengths": result["score"]["strengths"],
            "concerns": result["score"]["concerns"],
        })
        next_stage = STAGE_ORDER[STAGE_ORDER.index(stage) + 1]
        session["stage"] = next_stage
        response_payload["next_stage"] = next_stage

        if next_stage in ("technical", "teamlead"):
            next_message = await _advance_to_next_chat_stage(session, next_stage)
            response_payload["next_message"] = next_message

    storage.save(session)
    return response_payload


@router.post("/finalize")
async def finalize(session_id: str = Form(...)):
    session = storage.load(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    scores_by_stage = {s["stage"]: s["score"] for s in session["scores"]}
    overall = decision_agent.compute_weighted_score(scores_by_stage)
    verdict = decision_agent.compute_verdict(overall)

    from ..routers.jobs import _parse_title
    jd_title = _parse_title(session["jd_text"], session["job_description_id"])

    summary = await decision_agent.generate_summary(
        session["candidate_name"], jd_title, session["scores"], overall, verdict
    )

    final_result = {
        "candidate_name": session["candidate_name"],
        "job_title": jd_title,
        "overall_score": overall,
        "verdict": verdict,
        "summary": summary,
        "stage_scores": session["scores"],
    }
    session["final_result"] = final_result
    session["stage"] = "completed"
    storage.save(session)
    return final_result


@router.get("/result/{session_id}")
def get_result(session_id: str):
    session = storage.load(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if not session.get("final_result"):
        raise HTTPException(400, "Interview not finalized yet")
    return session["final_result"]
