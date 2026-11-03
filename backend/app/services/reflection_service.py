"""Reflection service (handoff §16, §24).

Responsible for storing question/answer, calling the Reflection LLM,
deciding/generating the next question, and generating the Reflection
Portrait.

Questionnaire flow (MVP):
    5 core questions + 2–4 adaptive follow-ups, then portrait.
    Core themes: experience, personal contribution, tools/methods,
    challenge/problem-solving, enjoyment/interests.
"""

import json
from datetime import datetime, timezone

from app.config import settings
from app.db.database import get_connection
from app.i18n_outputs import out
from app.llm.client import generate_structured
from app.llm.prompts import PORTRAIT_SYSTEM, REFLECTION_ANALYSIS_SYSTEM
from app.llm.schemas import PortraitDraft, ReflectionAnalysis
from app.models.experience import Experience
from app.models.reflection import ReflectionItem, ReflectionPortrait
from app.models.student import StudentProfile
from app.repositories.student_repository import StudentRepository
from app.services.profile_service import ProfileService

CORE_QUESTIONS = [
    "Tell me about a meaningful project or experience you have worked on.",
    "What part of that experience did you personally contribute the most to?",
    "What tools, methods, or technologies did you use?",
    "Describe a challenge or problem you faced and how you approached it.",
    "What did you enjoy most about it — and what did you find difficult?",
]


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class ReflectionService:
    def __init__(self, profile_service: ProfileService | None = None):
        self.profile_service = profile_service or ProfileService()
        self.student_repository = StudentRepository()

    # -- Storage -------------------------------------------------------------

    def store_answer(self, student_id: str, question: str, answer: str) -> None:
        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO reflections (student_id, question, answer, created_at) "
                "VALUES (?, ?, ?, ?)",
                (student_id, question, answer, _utcnow()),
            )
            conn.commit()
        finally:
            conn.close()

    def count_answers(self, student_id: str) -> int:
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT COUNT(*) AS n FROM reflections WHERE student_id = ?",
                (student_id,),
            ).fetchone()
            return int(row["n"]) if row else 0
        finally:
            conn.close()

    # -- LLM-backed steps ----------------------------------------------------

    async def analyze_answer(
        self, student_id: str, question: str, answer: str
    ) -> ReflectionAnalysis:
        """Store the answer, ask the LLM to extract structured information,
        apply the updates to the profile, and decide the next question.
        Falls back to a deterministic analysis when the LLM is unavailable.
        """
        self.store_answer(student_id, question, answer)
        profile = self.profile_service.get_or_404(student_id)

        analysis = await generate_structured(
            REFLECTION_ANALYSIS_SYSTEM,
            _reflection_user_prompt(profile, question, answer),
            ReflectionAnalysis,
        )
        if analysis is None:
            analysis = _fallback_analysis(answer)

        updates = _analysis_to_updates(analysis)
        self.profile_service.apply_profile_updates(student_id, updates)
        return analysis

    async def generate_portrait(self, student_id: str) -> ReflectionPortrait:
        """Generate (or regenerate) the Reflection Portrait for a student."""
        profile = self.profile_service.get_or_404(student_id)
        draft = await generate_structured(
            PORTRAIT_SYSTEM,
            _portrait_user_prompt(profile),
            PortraitDraft,
        )
        if draft is not None:
            return _draft_to_portrait(draft)
        return _fallback_portrait(profile)

    # -- Next question ------------------------------------------------------

    def next_question(
        self, student_id: str, llm_next_question: str | None = None
    ) -> str | None:
        """Decide the next question (handoff §24).

        Flow: advance through the 5 core questions first; once those are
        done, use LLM-suggested follow-ups while within the follow-up
        budget. Return None when the questionnaire is complete.
        """
        answered = self.count_answers(student_id)
        if answered < len(CORE_QUESTIONS):
            return out(f"reflection_core_{answered}")
        if (
            llm_next_question
            and answered < len(CORE_QUESTIONS) + settings.MAX_FOLLOW_UP_QUESTIONS
        ):
            return llm_next_question
        return None


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------

def _reflection_user_prompt(
    profile: StudentProfile, question: str, answer: str
) -> str:
    return (
        f"Student background: major={profile.major}, year={profile.year}, "
        f"intro={profile.intro or 'n/a'}.\n\n"
        f"Question: {question}\n\nAnswer: {answer}\n\n"
        "Extract the structured reflection data."
    )


def _portrait_user_prompt(profile: StudentProfile) -> str:
    return f"Student profile:\n{json.dumps(profile.model_dump(), ensure_ascii=False, indent=2)}"


# ---------------------------------------------------------------------------
# Conversion + fallbacks (deterministic behaviour when LLM is unavailable)
# ---------------------------------------------------------------------------

def _analysis_to_updates(analysis: ReflectionAnalysis) -> dict:
    experiences = []
    for exp in analysis.new_experiences:
        try:
            experiences.append(Experience.model_validate(exp))
        except Exception:  # noqa: BLE001
            continue
    return {
        "skills": analysis.skills_observed,
        "experiences": experiences,
        "interests": analysis.interests,
        "strengths": analysis.possible_strengths,
        "development_areas": analysis.development_areas,
        "unknown_areas": analysis.unknowns,
    }


def _draft_to_portrait(draft: PortraitDraft) -> ReflectionPortrait:
    return ReflectionPortrait(**draft.model_dump())


def _fallback_analysis(answer: str) -> ReflectionAnalysis:
    """Deterministic extraction when the LLM is not configured.

    Picks up common tool/skill keywords. `next_question` stays empty so
    the questionnaire simply advances through the core questions and then
    completes (the LLM is what normally generates adaptive follow-ups).
    """
    import re

    known_skills = [
        "python", "c++", "c", "java", "javascript", "typescript", "react",
        "node", "sql", "git", "docker", "kubernetes", "tensorflow", "pytorch",
        "opencv", "ros", "arduino", "raspberry pi", "matlab", "solidworks",
        "autocad", "excel", "linux", "html", "css", "mongodb", "postgresql",
    ]
    lower = answer.lower()
    found = [s for s in known_skills if s in lower]
    evidence = answer.strip()[:140]
    return ReflectionAnalysis(
        skills_observed=found,
        new_experiences=[
            {"type": "personal_project", "title": None, "description": answer.strip()[:300]}
        ]
        if len(answer.strip()) > 10
        else [],
        possible_strengths=[
            ReflectionItem(
                area=out("reflection_area"),
                reason=out("reflection_reason"),
                evidence=[evidence] if evidence else [],
            )
        ]
        if len(answer.strip()) > 10
        else [],
        interests=[],
        unknowns=[],
        next_question="",
    )


def _fallback_portrait(profile: StudentProfile) -> ReflectionPortrait:
    """Deterministic portrait derived directly from profile signals."""
    return ReflectionPortrait(
        supported_strengths=[
            item for item in profile.strengths if item.evidence
        ],
        possible_overlooked_strengths=[
            item for item in profile.strengths if not item.evidence
        ],
        areas_to_validate=profile.unknown_areas
        and [
            ReflectionItem(
                area=u,
                reason=out("reflection_unverified"),
                evidence=[],
            )
            for u in profile.unknown_areas[:5]
        ]
        or [],
        development_areas=profile.development_areas,
        insufficient_information=profile.unknown_areas,
    )
