"""
Thin wrapper around chat-completion APIs, using free-tier models so no
paid API key is required. Tries OpenRouter's free model chain first, then
falls back to Groq (a completely separate free account/quota system) if
OpenRouter's entire account-wide daily free-tier cap gets exhausted -
that failure mode takes down EVERY OpenRouter model at once, no matter
which one is configured, so a same-provider fallback can't help with it.
"""
import asyncio
import json
import re
import httpx
from ..config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Individual free models get rate-limited by their upstream provider fairly
# often and unpredictably - happens to different models at different times.
# Rather than retrying the SAME model repeatedly and hoping, fall through
# this chain: your configured model first, then a few other solid free
# options, then OpenRouter's own auto-router as a last resort (it actively
# avoids whatever's currently overloaded). This list will go stale as
# OpenRouter's free catalog changes - "openrouter/free" at the end is the
# resilient catch-all that adapts on its own regardless.
FALLBACK_MODELS = [
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter/free",
]


class OpenRouterError(RuntimeError):
    pass


def _model_chain() -> list[str]:
    primary = settings.openrouter_model
    chain = [primary] + [m for m in FALLBACK_MODELS if m != primary]
    return chain


def _parse_retry_after(resp: httpx.Response, default: float = 4.0) -> float:
    """Providers tell us how long to wait, either in the Retry-After
    header or inside the error body's metadata - use whichever is present."""
    header_val = resp.headers.get("retry-after")
    if header_val:
        try:
            return max(float(header_val), 1.0)
        except ValueError:
            pass
    try:
        meta = resp.json().get("error", {}).get("metadata", {})
        if "retry_after_seconds" in meta:
            return max(float(meta["retry_after_seconds"]), 1.0)
    except Exception:
        pass
    return default


def _extract_content(data: dict) -> str:
    content = data["choices"][0]["message"]["content"]
    # Some providers return content as a list of blocks (e.g.
    # [{"type": "text", "text": "..."}]) instead of a plain string.
    # Normalize either shape to plain text.
    if isinstance(content, list):
        content = "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )
    elif content is None:
        content = ""
    return content


async def _try_openrouter(client: httpx.AsyncClient, messages: list, temperature: float, max_tokens: int) -> tuple[str | None, list[str]]:
    """Returns (content, errors). content is None if every model in the chain failed."""
    if not settings.openrouter_api_key:
        return None, ["OpenRouter: no OPENROUTER_API_KEY configured"]

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Interview Panel",
    }
    errors: list[str] = []

    for model in _model_chain():
        payload = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}

        resp = None
        # One quick retry per model (rate limits are often momentary), then
        # move on to the next model rather than stalling on one that's down.
        for attempt in range(2):
            resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            if resp.status_code == 429 and attempt == 0:
                await asyncio.sleep(min(_parse_retry_after(resp), 6))
                continue
            break

        if resp.status_code == 200:
            try:
                return _extract_content(resp.json()), errors
            except (KeyError, IndexError):
                errors.append(f"{model}: unexpected response shape")
                continue

        errors.append(f"{model}: {resp.status_code} {resp.text[:150]}")

    return None, errors


async def _try_groq(client: httpx.AsyncClient, messages: list, temperature: float, max_tokens: int) -> tuple[str | None, list[str]]:
    if not settings.groq_api_key:
        return None, []

    headers = {"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"}
    payload = {"model": settings.groq_model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}

    resp = None
    for attempt in range(2):
        resp = await client.post(GROQ_URL, headers=headers, json=payload)
        if resp.status_code == 429 and attempt == 0:
            await asyncio.sleep(min(_parse_retry_after(resp), 6))
            continue
        break

    if resp.status_code == 200:
        try:
            return _extract_content(resp.json()), []
        except (KeyError, IndexError):
            return None, [f"Groq ({settings.groq_model}): unexpected response shape"]

    return None, [f"Groq ({settings.groq_model}): {resp.status_code} {resp.text[:150]}"]


async def chat(messages: list[dict], temperature: float = 0.6, max_tokens: int = 800) -> str:
    if not settings.openrouter_api_key and not settings.groq_api_key:
        raise OpenRouterError(
            "No LLM provider is configured. Copy backend/.env.example to backend/.env "
            "and add a free OPENROUTER_API_KEY from https://openrouter.ai/keys "
            "(optionally also GROQ_API_KEY from https://console.groq.com/keys as a backup)."
        )

    all_errors: list[str] = []

    async with httpx.AsyncClient(timeout=60) as client:
        content, errors = await _try_openrouter(client, messages, temperature, max_tokens)
        all_errors += errors
        if content is not None:
            return content

        content, errors = await _try_groq(client, messages, temperature, max_tokens)
        all_errors += errors
        if content is not None:
            return content

    hint = "" if settings.groq_api_key else " Add a free GROQ_API_KEY in .env as a backup provider - console.groq.com/keys."
    raise OpenRouterError(
        "All configured LLM providers are currently unavailable or rate-limited."
        f"{hint} Tried: {' | '.join(all_errors)}"
    )


def extract_json(text) -> dict:
    """
    Models sometimes wrap JSON in markdown fences or add stray text.
    Pull out the first {...} block and parse it, with a safe fallback.
    """
    if not isinstance(text, str):
        text = "" if text is None else str(text)

    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = fence_match.group(1) if fence_match else None

    if not candidate:
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        candidate = brace_match.group(0) if brace_match else None

    if not candidate:
        return {"reply": text.strip(), "stage_complete": False}

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return {"reply": text.strip(), "stage_complete": False}
