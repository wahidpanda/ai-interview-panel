"""
Wrapper around the free public Judge0 CE code execution API
(https://ce.judge0.com) - no signup or API key required.

Replaces Piston: its public API went whitelist-only on Feb 15, 2026
("Please contact EngineerMan on Discord with use case justification").
Judge0 CE remains genuinely open (rate-limited, but no auth needed).

Language IDs are fetched dynamically from Judge0's /languages endpoint and
cached, rather than hardcoded - hardcoding IDs is exactly what broke the
Piston integration before (pinned versions that later stopped existing).
"""
import asyncio
import logging
import httpx
from ..config import settings

logger = logging.getLogger("ai_interview_panel")

# Substrings to match against Judge0's language names (which look like
# "Python (3.12.5)", "JavaScript (Node.js 18.15.0)", etc). We always pick
# the highest-ID match, which is normally the newest available version.
LANGUAGE_NAME_HINTS = {
    "python": ["python (3", "python3"],
    "javascript": ["javascript (node", "node.js"],
    "typescript": ["typescript"],
    "java": ["java ("],
    "c": ["c (gcc"],
    "cpp": ["c++ (gcc"],
    "csharp": ["c# (mono", "c# (.net"],
    "go": ["go ("],
    "php": ["php ("],
    "ruby": ["ruby ("],
    "rust": ["rust ("],
}

_language_cache: list[dict] | None = None
QUEUED_STATUS_IDS = (1, 2)  # 1 = In Queue, 2 = Processing


async def _get_languages(client: httpx.AsyncClient) -> list[dict]:
    global _language_cache
    if _language_cache is None:
        resp = await client.get(f"{settings.judge0_url}/languages")
        resp.raise_for_status()
        _language_cache = resp.json()  # [{"id": 71, "name": "Python (3.8.1)"}, ...]
    return _language_cache


async def _resolve_language_id(client: httpx.AsyncClient, language: str) -> int | None:
    languages = await _get_languages(client)
    hints = LANGUAGE_NAME_HINTS.get(language.lower(), [language.lower()])
    matches = [entry for entry in languages if any(h in entry["name"].lower() for h in hints)]
    if not matches:
        return None
    matches.sort(key=lambda e: e["id"], reverse=True)  # highest id ~= newest version
    return matches[0]["id"]


async def _submit(client: httpx.AsyncClient, language_id: int, code: str, stdin: str) -> dict:
    """Submits code and returns the final result dict, whether the public
    instance honors synchronous `wait=true` or forces async polling."""
    payload = {"source_code": code, "language_id": language_id, "stdin": stdin}
    resp = await client.post(
        f"{settings.judge0_url}/submissions",
        params={"wait": "true", "base64_encoded": "false"},
        json=payload,
    )
    resp.raise_for_status()
    data = resp.json()

    # Some public Judge0 deployments ignore `wait=true` under load and just
    # return a token instead of the finished result - detect that and fall
    # back to polling rather than treating it as a broken response.
    if "status" not in data and "token" in data:
        token = data["token"]
        for _ in range(20):  # ~20s max
            await asyncio.sleep(1)
            poll = await client.get(
                f"{settings.judge0_url}/submissions/{token}",
                params={"base64_encoded": "false"},
            )
            poll.raise_for_status()
            data = poll.json()
            if data.get("status", {}).get("id") not in QUEUED_STATUS_IDS:
                break

    return data


async def run_code(language: str, code: str, stdin: str = "") -> dict:
    """
    Always returns a dict - either the execution result, or {"error": ...}.
    Deliberately never raises: an unhandled exception here would surface to
    the frontend as an opaque network failure with no useful message, so
    every failure mode is caught and converted into a readable reason
    (also logged server-side for full detail).
    """
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            language_id = await _resolve_language_id(client, language)
            if language_id is None:
                return {"error": f"Language '{language}' isn't available on the code execution service right now."}

            data = await _submit(client, language_id, code, stdin)
    except httpx.HTTPStatusError as e:
        logger.warning("Judge0 HTTP error: %s | body: %s", e, e.response.text[:500])
        return {"error": f"Code execution service returned {e.response.status_code}. Check backend logs for details."}
    except httpx.HTTPError as e:
        logger.warning("Judge0 connection error: %s", e)
        return {"error": f"Could not reach the code execution service: {e}"}
    except Exception as e:  # belt-and-suspenders - never let this crash the request
        logger.exception("Unexpected error running code via Judge0")
        return {"error": f"Unexpected error running your code: {e}"}

    status = data.get("status", {})
    status_desc = status.get("description", "")

    compile_output = (data.get("compile_output") or "").strip()
    run_stderr = (data.get("stderr") or "").strip()
    combined_stderr = "\n".join(part for part in (compile_output, run_stderr) if part)

    # For anything other than a clean run, make sure the reason (timeout,
    # compile error, runtime error, etc) is visible rather than just blank.
    if status_desc and status_desc != "Accepted":
        combined_stderr = (combined_stderr + f"\n[{status_desc}]").strip()

    return {
        "stdout": data.get("stdout") or "",
        "stderr": combined_stderr,
        "exit_code": data.get("exit_code"),
        "signal": None,
    }
