"""Baseline / "Start Comparison" service.

When the student clicks "Start Comparison" on the MVP screen, this service
asks the LLM to score the student on the six radar-chart competencies
based on their Minimum Viable Profile. Falls back to a deterministic
estimate when the LLM is unavailable.
"""

import logging

from app.llm.client import generate_structured
from app.llm.prompts import BASELINE_SYSTEM
from app.llm.schemas import CompetencyBaselineDraft
from app.models.student import StudentProfile
from app.questionnaire.bridge import project_signals_to_competencies
from app.repositories.questionnaire_repository import QuestionnaireRepository
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)


# Major presets (front-end values) → baseline scores. Keeps the deterministic
# fallback close to the values the frontend would show anyway.
_MAJOR_PRESETS = {
    "mechanical": {"technicalFundamentals": 62, "programming": 35, "prototyping": 70, "systemsThinking": 60, "communication": 50, "learningAgility": 60},
    "computer":   {"technicalFundamentals": 55, "programming": 70, "prototyping": 50, "systemsThinking": 60, "communication": 50, "learningAgility": 65},
    "electrical": {"technicalFundamentals": 60, "programming": 55, "prototyping": 55, "systemsThinking": 65, "communication": 50, "learningAgility": 60},
    "biomedical": {"technicalFundamentals": 55, "programming": 45, "prototyping": 55, "systemsThinking": 55, "communication": 55, "learningAgility": 60},
    "aerospace":  {"technicalFundamentals": 65, "programming": 50, "prototyping": 60, "systemsThinking": 65, "communication": 50, "learningAgility": 55},
    "civil":      {"technicalFundamentals": 60, "programming": 30, "prototyping": 65, "systemsThinking": 55, "communication": 55, "learningAgility": 55},
}


def _default_scores() -> dict:
    return {
        "technicalFundamentals": 50,
        "programming": 40,
        "prototyping": 45,
        "systemsThinking": 50,
        "communication": 50,
        "learningAgility": 60,
    }


def _fallback_baseline(profile: StudentProfile) -> dict:
    """Deterministic baseline when the LLM is unavailable or invalid.

    Uses the major preset (if recognized) + a year factor and a small bump
    for each skill/experience the student named.
    """
    scores = dict(_default_scores())
    major = (profile.major or "").lower()
    for key, preset in _MAJOR_PRESETS.items():
        if key in major:
            scores.update(preset)
            break

    # Year 1 → 0.85, Year 4 → 1.10
    year = max(1, min(4, profile.year or 1))
    factor = 0.85 + (year - 1) * 0.085
    for k in list(scores.keys()):
        scores[k] = int(round(min(95, max(20, scores[k] * factor))))

    # Each named skill or experience gives a small bump to programming /
    # prototyping / systems thinking — evidence the student has built things.
    evidence_count = len(profile.skills) + len(profile.experiences)
    if evidence_count >= 6:
        scores["programming"] = min(95, scores["programming"] + 8)
        scores["prototyping"] = min(95, scores["prototyping"] + 6)
    elif evidence_count >= 3:
        scores["programming"] = min(95, scores["programming"] + 4)
        scores["prototyping"] = min(95, scores["prototyping"] + 3)

    # Free-text about teamwork / leadership hints at communication.
    intro = (profile.intro or "").lower()
    for kw in ("team", "lead", "present", "communicat", "mentor", "club"):
        if kw in intro:
            scores["communication"] = min(95, scores["communication"] + 5)
            break

    return scores


class BaselineService:
    def __init__(
        self,
        profile_service: ProfileService | None = None,
        questionnaire_repo: QuestionnaireRepository | None = None,
    ):
        self.profile_service = profile_service or ProfileService()
        self.questionnaire_repo = questionnaire_repo or QuestionnaireRepository()

    async def generate(self, student_id: str) -> dict:
        """Return a competency baseline dict for the radar chart.

        Prioritizes questionnaire signal state if available, otherwise falls
        back to profile heuristics and/or LLM baseline.
        """
        profile = self.profile_service.get_or_404(student_id)
        session_state = self.questionnaire_repo.get_session(student_id)

        if session_state and session_state.get("questionnaire_state", {}).get("current_question_count", 0) > 0:
            fallback = project_signals_to_competencies(session_state, profile)
        else:
            fallback = _fallback_baseline(profile)

        draft = await generate_structured(
            BASELINE_SYSTEM,
            _baseline_user_prompt(profile),
            CompetencyBaselineDraft,
        )
        if draft is None:
            return fallback

        # Merge the LLM output with fallback (LLM only overwrites fields it
        # returned; we clamp + validate).
        result = dict(fallback)
        for key in (
            "technicalFundamentals",
            "programming",
            "prototyping",
            "systemsThinking",
            "communication",
            "learningAgility",
        ):
            value = getattr(draft, key, None)
            if isinstance(value, int) and 0 <= value <= 100:
                result[key] = value
        return result


def _baseline_user_prompt(profile: StudentProfile) -> str:
    import json as _json

    return (
        f"Student profile:\n{_json.dumps(profile.model_dump(), ensure_ascii=False, indent=2)}\n\n"
        f"Generate the 6-dimension competency baseline as JSON. "
        f"Calibrate scores to year and the evidence they actually provided."
    )
