"""Request-scoped user interface language selection (independent of database keys)."""
from contextvars import ContextVar

LANGUAGE_NAMES = {
    "ko": "Korean", "en": "English", "zh": "Simplified Chinese",
    "es": "Spanish", "fr": "French", "de": "German",
}

current_language: ContextVar[str] = ContextVar("engipath_language", default="ko")


def normalize_language(value: str | None) -> str:
    """No preference -> Korean. Korean -> Korean. All other UI locales -> English."""
    if not value:
        return "ko"
    first = value.split(",", 1)[0].split(";", 1)[0]
    code = first.strip().split("-", 1)[0].lower()
    return "ko" if code == "ko" else "en"


def get_language() -> str:
    return current_language.get()


def localized_system_prompt(prompt: str) -> str:
    lang = LANGUAGE_NAMES.get(get_language(), "Korean")
    return (prompt + "\n\nIMPORTANT LANGUAGE REQUIREMENT:\n"
            f"Write every user-facing natural-language string in {lang}, "
            "including sentences inside JSON arrays/objects, hints, summary bullets, "
            "mentor narration, career reasons and plans. "
            "The selected UI language takes precedence over the input language. "
            "Keep all JSON keys, machine-readable identifiers, option IDs, "
            "question IDs, O*NET codes, statuses, alignment enum values and schema "
            "definitions unchanged. Return structurally valid JSON when requested. "
            "Do not invent evidence.")
