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
import httpx
from ..config import settings

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


async def run_code(language: str, code: str, stdin: str = "") -> dict:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            language_id = await _resolve_language_id(client, language)
            if language_id is None:
                return {"error": f"Language '{language}' isn't available on the code execution service right now."}

            payload = {"source_code": code, "language_id": language_id, "stdin": stdin}
            resp = await client.post(
                f"{settings.judge0_url}/submissions",
                params={"wait": "true", "base64_encoded": "false"},
                json=payload,
            )
    except httpx.HTTPError as e:
        return {"error": f"Could not reach the code execution service: {e}"}

    if resp.status_code not in (200, 201):
        return {"error": f"Code execution error {resp.status_code}: {resp.text[:300]}"}

    data = resp.json()
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