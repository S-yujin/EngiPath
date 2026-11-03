"""LLM client (handoff §18).

All LLM calls pass through this module so the team can change providers /
models without rewriting every service.

`generate_structured` returns a Pydantic model validated from the LLM
output. If the LLM is not configured (no API key) or the response fails
validation, a `None` is returned — callers decide how to degrade (usually
to deterministic heuristics).
"""

import json
import logging
from typing import Type, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.config import settings
from app.llm.locale import localized_system_prompt

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

DEFAULT_TIMEOUT_SECONDS = 60.0


class LLMError(Exception):
    """Raised when the LLM provider fails or returns invalid output."""


def _is_configured() -> bool:
    return settings.LLM_ENABLED and bool(settings.LLM_API_KEY)


async def _chat_completion(
    system_prompt: str,
    user_prompt: str,
    response_format: dict | None = None,
) -> str:
    """Call an OpenAI-compatible chat completions endpoint."""
    if not _is_configured():
        raise LLMError("LLM not configured (missing LLM_API_KEY)")

    url = f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions" if settings.LLM_BASE_URL else "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": localized_system_prompt(system_prompt)},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
    }
    if response_format:
        payload["response_format"] = response_format

    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def chat_completion(
    system_prompt: str,
    messages: list[dict],
    temperature: float = 0.5,
    max_tokens: int | None = 300,
) -> str | None:
    """Free-form multi-turn chat completion.

    Used by the career-coach chatbot (unlike `generate_structured`, this
    returns plain conversational text, not validated JSON). Returns `None`
    when the LLM is unavailable so callers can degrade gracefully.
    """
    if not _is_configured():
        logger.warning("LLM not configured; chat_completion returning None")
        return None

    url = f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions" if settings.LLM_BASE_URL else "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict = {
        "model": settings.LLM_MODEL,
        "messages": [{"role": "system", "content": localized_system_prompt(system_prompt)}, *messages],
        "temperature": temperature,
    }
    if max_tokens:
        payload["max_tokens"] = max_tokens

    for attempt in range(max(1, settings.LLM_MAX_RETRIES + 1)):
        try:
            async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip() if content else None
        except Exception as exc:  # noqa: BLE001 - network/provider errors
            logger.warning("chat_completion failed (attempt %d): %s", attempt + 1, exc)
            if attempt >= settings.LLM_MAX_RETRIES:
                return None
    return None


def _extract_json(text: str) -> str:
    """Best-effort extraction of a JSON object from LLM output.

    LLMs sometimes wrap JSON in markdown fences or add prose. This strips
    fences and isolates the outermost JSON object.
    """
    text = text.strip()
    if text.startswith("```"):
        # Strip fenced code blocks.
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        return text[start : end + 1]
    return text


async def generate_structured(
    system_prompt: str,
    user_prompt: str,
    response_model: Type[T],
    max_retries: int | None = None,
) -> T | None:
    """Ask the LLM for structured output and validate it with Pydantic.

    Returns a validated instance of `response_model`, or `None` when the
    LLM is unavailable / output cannot be validated (after retries).
    """
    retries = max_retries if max_retries is not None else settings.LLM_MAX_RETRIES

    if not _is_configured():
        logger.warning("LLM not configured; returning None for %s", response_model.__name__)
        return None

    # Use `json_object` rather than `json_schema`: DeepSeek (and several other
    # OpenAI-compatible providers) reject the `json_schema` type with 400.
    # Note: prompts must mention "JSON" for `json_object` to be accepted.
    response_format = {"type": "json_object"}

    for attempt in range(retries + 1):
        try:
            raw = await _chat_completion(system_prompt, user_prompt, response_format)
            cleaned = _extract_json(raw)
            parsed = json.loads(cleaned)
            return response_model.model_validate(parsed)
        except (ValidationError, json.JSONDecodeError) as exc:
            logger.warning("LLM output failed validation (attempt %d): %s", attempt + 1, exc)
            if attempt >= retries:
                return None
        except Exception as exc:  # noqa: BLE001 - network/provider errors
            logger.warning("LLM call failed (attempt %d): %s", attempt + 1, exc)
            if attempt >= retries:
                return None
    return None
