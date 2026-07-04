from fastapi import APIRouter, Form, HTTPException
from .. import storage
from ..services import code_exec_client
from ..services.coding_problems import pick_problem_for_role, get_problem
from ..agents import teamlead_agent

router = APIRouter(prefix="/api/coding", tags=["coding"])


@router.post("/start")
def start_coding(session_id: str = Form(...)):
    session = storage.load(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session["stage"] != "coding":
        raise HTTPException(400, f"Session is not in the coding stage (currently '{session['stage']}')")

    problem = pick_problem_for_role(session["jd_text"])
    session["coding"]["problem"] = problem["id"]
    storage.save(session)

    return {
        "id": problem["id"],
        "title": problem["title"],
        "difficulty": problem["difficulty"],
        "prompt": problem["prompt"],
        "starter_code": problem["starter_code"],
        "test_case_preview": problem["tests"][0],  # show one example, keep the rest hidden
        "total_tests": len(problem["tests"]),
    }


@router.post("/execute")
async def execute_code(
    session_id: str = Form(...),
    language: str = Form(...),
    code: str = Form(...),
    stdin: str = Form(""),
):
    session = storage.load(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    result = await code_exec_client.run_code(language, code, stdin)
    session["coding"]["attempts"].append({"language": language, "manual_run": True})
    storage.save(session)
    return result


@router.post("/submit")
async def submit_code(
    session_id: str = Form(...),
    language: str = Form(...),
    code: str = Form(...),
    tab_switches: int = Form(0),
    fullscreen_exits: int = Form(0),
):
    session = storage.load(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    problem_id = session["coding"].get("problem")
    problem = get_problem(problem_id) if problem_id else None
    if not problem:
        raise HTTPException(400, "No coding problem started for this session")

    test_results = []
    passed = 0
    for test in problem["tests"]:
        run = await code_exec_client.run_code(language, code, test["stdin"])
        actual = (run.get("stdout") or "").strip()
        expected = test["expected"].strip()
        ok = actual == expected
        passed += int(ok)
        test_results.append({
            "stdin": test["stdin"],
            "expected": expected,
            "actual": actual,
            "passed": ok,
            "stderr": run.get("stderr", ""),
        })

    total = len(problem["tests"])
    pass_rate = passed / total if total else 0
    score = round(pass_rate * 10, 1)

    integrity_notes = []
    if tab_switches > 3:
        integrity_notes.append(f"left the tab {tab_switches} times")
    if fullscreen_exits > 0:
        integrity_notes.append(f"exited fullscreen {fullscreen_exits} time{'s' if fullscreen_exits > 1 else ''}")

    concerns = [] if passed == total else [f"Failed {total - passed}/{total} test cases"]
    if integrity_notes:
        concerns.append("Integrity flag: " + ", ".join(integrity_notes))

    session["coding"]["final_code"] = code
    session["coding"]["final_language"] = language
    session["coding"]["score"] = score
    session["coding"]["test_results"] = test_results
    session["coding"]["tab_switches"] = tab_switches
    session["coding"]["fullscreen_exits"] = fullscreen_exits
    session["scores"].append({
        "stage": "coding",
        "label": "Coding Round",
        "score": score,
        "summary": f"Passed {passed}/{total} test cases for '{problem['title']}'."
                   + (f" {', '.join(integrity_notes).capitalize()}." if integrity_notes else ""),
        "strengths": [f"Passed {passed}/{total} test cases"] if passed else [],
        "concerns": concerns,
    })

    # advance to final (team lead) stage and generate its opening question
    session["stage"] = "teamlead"
    coding_summary = f"Score: {score}/10 — passed {passed}/{total} test cases."
    tl_result = await teamlead_agent.take_turn(
        session["candidate_name"], session["jd_text"], session["cv_text"], coding_summary, [], None
    )
    from .interview import AGENT_DISPLAY
    session["chat"]["teamlead"].append({"role": "agent", "speaker": AGENT_DISPLAY["teamlead"], "text": tl_result["reply"]})

    storage.save(session)

    return {
        "passed": passed,
        "total": total,
        "score": score,
        "test_results": test_results,
        "next_stage": "teamlead",
        "next_message": {"speaker": AGENT_DISPLAY["teamlead"], "text": tl_result["reply"]},
    }