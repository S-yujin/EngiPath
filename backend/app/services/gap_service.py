"""Gap service (handoff §16, §23).

Responsible for loading the student profile, loading the target
occupation, running a DETERMINISTIC comparison, classifying evidence,
and calling the LLM only for the explanation.

Important: no evidence is not automatically proof that the student lacks
the capability — that is why the `unknown` bucket exists.
"""

import logging

from app.i18n_outputs import out
from app.llm.client import generate_structured
from app.llm.prompts import GAP_EXPLANATION_SYSTEM
from app.llm.schemas import GapExplanation
from app.models.gap import GapAnalysis, GapItem
from app.models.occupation import OccupationProfile
from app.models.student import StudentProfile
from app.repositories.occupation_repository import occupation_repository
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    return text.strip().lower()


class GapService:
    def __init__(self, profile_service: ProfileService | None = None):
        self.profile_service = profile_service or ProfileService()

    def compare(
        self, student_id: str, onetsoc_code: str
    ) -> tuple[GapAnalysis, OccupationProfile, StudentProfile] | None:
        """Deterministic comparison between profile and occupation.

        Returns (analysis, occupation, profile) or None when the student or
        occupation does not exist.
        """
        profile = self.profile_service.get_profile(student_id)
        occupation = occupation_repository.get(onetsoc_code)
        if profile is None or occupation is None:
            return None

        analysis = self._build_comparison(profile, occupation)
        return analysis, occupation, profile

    def _build_comparison(
        self, profile: StudentProfile, occupation: OccupationProfile
    ) -> GapAnalysis:
        student_skills = {_normalize(s) for s in profile.skills}
        exp_text = _experience_text(profile)
        analysis = GapAnalysis(target_role=occupation.title, target_role_id=occupation.onetsoc_code)

        # Essential skills
        for skill in occupation.essential_skills:
            name = str(skill.get("name", "")).strip()
            if not name:
                continue
            analysis.confirmed.append(
                GapItem(
                    area=name,
                    status="confirmed",
                    student_evidence=_evidence_for(profile, name),
                    reason=(
                        out("gap_essential", skill=name, role=occupation.title)
                    ),
                )
            )

        # Software/tools
        for tool in occupation.software_skills:
            name = str(tool.get("name", "")).strip()
            if not name:
                continue
            if _normalize(name) in student_skills or _normalize(name) in exp_text:
                analysis.confirmed.append(
                    GapItem(
                        area=name,
                        status="confirmed",
                        student_evidence=_evidence_for(profile, name),
                        reason=out("gap_tool_confirmed", tool=name, role=occupation.title),
                    )
                )
            else:
                analysis.unknown.append(
                    GapItem(
                        area=name,
                        status="unknown",
                        student_evidence=[],
                        reason=out("gap_tool_unknown", tool=name),
                    )
                )

        # Knowledge areas
        for knowledge in occupation.knowledge:
            name = str(knowledge.get("name", "")).strip()
            if not name:
                continue
            if _normalize(name) in student_skills or _normalize(name) in exp_text:
                analysis.confirmed.append(
                    GapItem(
                        area=name,
                        status="confirmed",
                        student_evidence=_evidence_for(profile, name),
                        reason=out("gap_knowledge_confirmed", name=name),
                    )
                )
            else:
                analysis.development_areas.append(
                    GapItem(
                        area=name,
                        status="development_area",
                        student_evidence=[],
                        reason=out("gap_knowledge_develop", name=name, role=occupation.title),
                    )
                )

        # Unknowns the student explicitly flagged.
        for unknown in profile.unknown_areas:
            analysis.unknown.append(
                GapItem(
                    area=unknown,
                    status="unknown",
                    student_evidence=[],
                    reason=out("gap_uncertain"),
                )
            )

        return analysis

    async def explain(self, analysis: GapAnalysis, profile: StudentProfile) -> list[str]:
        """LLM explanation of the deterministic comparison (fallback-safe)."""
        explanation = await generate_structured(
            GAP_EXPLANATION_SYSTEM,
            (
                f"Target occupation: {analysis.target_role}\n\n"
                f"Confirmed:\n{analysis.confirmed.model_dump()}\n\n"
                f"Partial:\n{analysis.partial.model_dump()}\n\n"
                f"Development areas:\n{analysis.development_areas.model_dump()}\n\n"
                f"Unknown:\n{analysis.unknown.model_dump()}"
            ),
            GapExplanation,
        )
        if explanation is not None:
            return explanation.notes
        return _fallback_notes(analysis)


def _experience_text(profile: StudentProfile) -> str:
    parts = []
    for exp in profile.experiences:
        parts.append(
            " ".join(
                [exp.description or "", *exp.tools_used, *exp.learned, *exp.contributions]
            )
        )
    return " ".join(parts).lower()


def _evidence_for(profile: StudentProfile, name: str) -> list[str]:
    """Pull evidence strings from the profile that mention the area."""
    evidence = []
    name_lower = _normalize(name)
    for exp in profile.experiences:
        blob = " ".join(
            [exp.title or "", exp.description or "", *exp.tools_used, *exp.learned]
        )
        if name_lower in blob.lower():
            evidence.append(exp.title or blob[:120])
    for skill in profile.skills:
        if _normalize(skill) == name_lower:
            evidence.append(skill)
    return evidence[:3]


def _fallback_notes(analysis: GapAnalysis) -> list[str]:
    notes = []
    if analysis.confirmed:
        notes.append(
            out("gap_note_confirmed", count=len(analysis.confirmed), role=analysis.target_role)
        )
    if analysis.development_areas:
        notes.append(
            out("gap_note_develop", count=len(analysis.development_areas))
        )
    if analysis.unknown:
        notes.append(
            out("gap_note_unknown", count=len(analysis.unknown))
        )
    return notes or [out("gap_note_empty", role=analysis.target_role)]
