"""Career service (handoff §16, §22).

Responsible for career-card data, occupation retrieval, candidate career
search, basic alignment calculation, and career explanation context.

Alignment is an explainable, deterministic comparison — NOT an ML model.
Internal signals: essential-skill overlap, software/tool overlap,
knowledge overlap, career-interest alignment, relevant experience.
"""

import logging
import math
from typing import Any

from app.i18n_outputs import out
from app.llm.client import generate_structured
from app.llm.prompts import CAREER_ALIGNMENT_SYSTEM, CAREER_CARDS_SYSTEM
from app.llm.schemas import CareerAlignmentExplanation, CareerCardsDraft
from app.models.occupation import OccupationProfile
from app.models.student import StudentProfile
from app.repositories.occupation_repository import occupation_repository

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    return text.strip().lower()


def _occupation_vocabulary(occupation: OccupationProfile) -> set[str]:
    """All requirement names for an occupation (skills + tools + knowledge)."""
    names = set()
    for bucket in (
        occupation.essential_skills,
        occupation.software_skills,
        occupation.knowledge,
    ):
        for item in bucket:
            name = _normalize(str(item.get("name", "")))
            if name:
                names.add(name)
    return names


_STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with",
    "at", "by", "as", "is", "are", "was", "were", "be", "been", "being",
    "that", "this", "these", "those", "it", "its", "from", "into", "using",
    "use", "used", "their", "they", "them", "we", "our", "your", "you", "i",
    "my", "me", "have", "has", "had", "do", "does", "did", "not", "no", "so",
    "such", "can", "could", "will", "would", "should", "may", "might", "about",
    "also", "more", "most", "some", "any", "all", "each", "both", "other",
    "etc", "e.g", "i.e", "including", "during", "through", "work", "worked",
    "working", "project", "projects", "course", "class", "built", "build",
    "made", "make", "one", "two", "well", "very", "really",
}


MAJOR_SYNONYMS: dict[str, list[str]] = {
    "mechanical": ["mechanical", "mechanics", "robotics", "automotive", "thermal", "cad", "manufacturing", "machinery", "mechatronics", "propulsion", "hvac", "fluid"],
    "electrical": ["electrical", "electronic", "electronics", "circuit", "microcontroller", "embedded", "semiconductor", "power", "hardware", "photonics", "signal", "telecommunications"],
    "computer": ["computer", "software", "programming", "data", "algorithm", "developer", "information", "cloud", "security", "ai", "machine learning", "database", "network"],
    "biomedical": ["biomedical", "medical", "biology", "biomechanical", "prosthetic", "bioengineering", "healthcare", "clinical", "biomaterial", "bionics"],
    "aerospace": ["aerospace", "aeronautical", "propulsion", "flight", "space", "aircraft", "rocket", "orbital", "cfd", "aerodynamic", "avionics"],
    "civil": ["civil", "structural", "environmental", "infrastructure", "construction", "water", "transportation", "urban", "geotechnical", "surveying"],
    "chemical": ["chemical", "chemistry", "process", "polymer", "biomolecular", "materials", "refining", "reaction", "biochemical", "petroleum"],
    "industrial": ["industrial", "systems", "supply chain", "logistics", "operations", "quality", "manufacturing", "optimization", "ergonomics", "production"],
    "materials": ["materials", "metallurgy", "nanotechnology", "polymer", "semiconductor", "composites", "crystallography", "ceramics"],
}


def _experience_text(profile: StudentProfile) -> str:
    parts = []
    for exp in profile.experiences:
        parts.append(
            " ".join(
                [
                    exp.title or "",
                    exp.description or "",
                    *exp.tools_used,
                    *exp.learned,
                    *exp.contributions,
                ]
            )
        )
    return " ".join(parts).lower()


def _student_text(profile: StudentProfile) -> str:
    parts = [
        profile.major or "",
        profile.intro or "",
        " ".join(profile.skills),
        " ".join(profile.interests),
        _experience_text(profile),
    ]
    return " ".join(parts).lower()


def _significant_words(text: str) -> set[str]:
    words = set()
    for token in text.lower().split():
        token = token.strip(".,;:!?()[]{}\"'`")
        if len(token) >= 3 and token not in _STOPWORDS:
            words.add(token)
    return words


DISCIPLINE_STOPWORDS = {
    "engineering", "engineer", "engineers", "science", "sciences",
    "technology", "technologies", "studies", "and", "&", "of", "in", "major", "degree"
}


def _major_signal(major: str | None, occupation: OccupationProfile) -> float:
    if not major:
        return 0.0
    major_norm = _normalize(major)
    occ_title = _normalize(occupation.title)
    occ_desc = _normalize(occupation.description)
    occ_knowledge = " ".join(_normalize(str(k.get("name", ""))) for k in occupation.knowledge)

    # Extract distinct domain words from major (ignoring generic words like 'engineering')
    raw_major_words = _significant_words(major_norm)
    major_domain_words = {w for w in raw_major_words if w not in DISCIPLINE_STOPWORDS}

    title_words = _significant_words(occ_title)

    # 1. Exact or partial specific domain word match in occupation title
    if major_domain_words:
        direct_title_overlap = len(major_domain_words & title_words) / len(major_domain_words)
        if direct_title_overlap > 0:
            return min(1.0, 0.7 + 0.3 * direct_title_overlap)

    # 2. Synonyms / related domain keywords
    keywords = set(major_domain_words)
    for key, syns in MAJOR_SYNONYMS.items():
        if key in major_norm:
            keywords.update(syns)

    # Check specific keyword hits in title
    title_hits = sum(1 for kw in keywords if kw in occ_title)
    if title_hits > 0:
        return min(0.9, 0.5 + 0.15 * title_hits)

    # Check in description & knowledge
    desc_hits = sum(1 for kw in keywords if kw in occ_desc)
    knowledge_hits = sum(1 for kw in keywords if kw in occ_knowledge)
    total_hits = desc_hits + knowledge_hits
    if total_hits > 0:
        return min(0.65, 0.12 * total_hits)

    return 0.0


def _text_overlap(profile: StudentProfile, occupation: OccupationProfile) -> float:
    """Free-text overlap between what the student said and what the
    occupation is about.
    """
    student_words = _significant_words(_student_text(profile))
    if not student_words:
        return 0.0
    occ_words = _significant_words(f"{occupation.title} {occupation.description}")
    if not occ_words:
        return 0.0
    hits = len(student_words & occ_words)
    return min(hits / 4.0, 1.0)


def compute_alignment_score(
    profile: StudentProfile, occupation: OccupationProfile
) -> dict[str, Any]:
    """Deterministic alignment signals → category + reasons."""
    student_skills = {_normalize(s) for s in profile.skills}
    occ_vocab = _occupation_vocabulary(occupation)
    exp_text = _experience_text(profile)

    # Major alignment signal
    major_signal = _major_signal(profile.major, occupation)

    # Rarity weighting: a rare skill match (e.g. ROS) is a much stronger
    # alignment signal than a ubiquitous one (e.g. Python), which appears in
    # hundreds of occupations. Weights are log(1 + N/df) — larger for rare.
    freq = occupation_repository.skill_frequency()
    total_occ = max(occupation_repository.count(), 1)

    def rarity(skill: str) -> float:
        df = freq.get(skill, 0)
        return 1.0 + math.log(max(total_occ, 1) / max(df, 1))

    # Which occupation requirements does the student's profile cover?
    matched = student_skills & occ_vocab if occ_vocab else set()
    if student_skills:
        student_weight_total = sum(rarity(s) for s in student_skills)
        matched_weight = sum(rarity(s) for s in matched)
        student_relevance = matched_weight / student_weight_total if student_weight_total else 0.0
    else:
        student_relevance = 0.0

    # Tool signal: how many of the occupation's software/tools does the
    # student's profile or experience mention? Rarity-weighted.
    occ_tool_names = {
        _normalize(item.get("name", "")) for item in occupation.software_skills
    }
    tool_matches = set()
    for tool in occ_tool_names:
        if tool in student_skills or (tool and tool in exp_text):
            tool_matches.add(tool)
    if tool_matches:
        tool_weight = sum(rarity(t) for t in tool_matches)
        tool_coverage = min(tool_weight / 3.0, 1.0)
    else:
        tool_coverage = 0.0

    # Interest alignment: how many RIASEC interests or direct keywords match
    interest_alignment = 0.0
    if profile.interests and occupation.career_interests:
        occ_top = sorted(
            occupation.career_interests.items(), key=lambda kv: kv[1], reverse=True
        )[:3]
        occ_interest_names = {_normalize(k) for k, _ in occ_top}
        student_interest_names = {_normalize(i) for i in profile.interests}
        interest_alignment = len(occ_interest_names & student_interest_names) / 3.0
    elif profile.interests:
        interest_words = set()
        for it in profile.interests:
            interest_words |= _significant_words(it)
        if interest_words:
            occ_words = _significant_words(f"{occupation.title} {occupation.description}")
            interest_alignment = min(1.0, len(interest_words & occ_words) / 2.0)

    # Experience signal: how many occupation tools appear in experiences.
    experience_signal = 0.0
    if occ_tool_names and exp_text:
        hits = sum(1 for tool in occ_tool_names if tool and tool in exp_text)
        experience_signal = min(1.0, hits / 3.0)

    # Text overlap: the student's own words vs. what the occupation is about.
    text_overlap = _text_overlap(profile, occupation)

    # University Engineering / STEM target role bias:
    # Strongly prefer Engineering (17-), Computing (15-), Sciences (19-), and Tech Management (11-9041)
    soc = occupation.onetsoc_code
    stem_bias = 0.0
    if soc.startswith("17-") or soc.startswith("15-"):
        stem_bias = 0.15
    elif soc.startswith("19-") or soc.startswith("11-9041") or soc.startswith("11-3021"):
        stem_bias = 0.10
    elif soc.startswith(("47-", "49-", "51-", "53-", "31-", "33-", "35-", "37-", "39-", "41-", "43-")):
        # Trades / manual labor / clerical penalty for university engineering students
        stem_bias = -0.35

    score = (
        0.35 * major_signal
        + 0.25 * student_relevance
        + 0.15 * tool_coverage
        + 0.15 * text_overlap
        + 0.10 * interest_alignment
        + stem_bias
    )

    if score >= 0.55:
        alignment = "High"
    elif score >= 0.35:
        alignment = "Good"
    elif score >= 0.20:
        alignment = "Moderate"
    else:
        alignment = "Low"

    return {
        "alignment": alignment,
        "score": round(score, 3),
        "signals": {
            "major_signal": round(major_signal, 3),
            "student_relevance": round(student_relevance, 3),
            "tool_coverage": round(tool_coverage, 3),
            "text_overlap": round(text_overlap, 3),
            "interest_alignment": round(interest_alignment, 3),
            "experience_signal": round(experience_signal, 3),
        },
        "matched_skills": sorted(matched),
    }


def _fallback_reasons(
    profile: StudentProfile, occupation: OccupationProfile, alignment: str
) -> list[str]:
    reasons = []
    if profile.major:
        reasons.append(
            out("career_major", major=profile.major)
        )
    student_skills = {_normalize(s) for s in profile.skills}
    occ_vocab = _occupation_vocabulary(occupation)
    matched = student_skills & occ_vocab if occ_vocab else set()
    if matched:
        reasons.append(
            out("career_skill", role=occupation.title, skills=", ".join(sorted(matched)))
        )
    if profile.experiences:
        reasons.append(
            out("career_experience", count=len(profile.experiences))
        )
    if not reasons:
        reasons.append(
            out("career_uncertain")
        )
    return reasons


class CareerService:
    def career_cards(self) -> list[dict[str, Any]]:
        return occupation_repository.career_cards()

    def search(self, query: str, limit: int = 10) -> list[OccupationProfile]:
        return occupation_repository.search(query, limit=limit)

    def get_occupation(self, onetsoc_code: str) -> OccupationProfile | None:
        return occupation_repository.get(onetsoc_code)

    def recommend(self, profile: StudentProfile, limit: int = 5) -> list[dict[str, Any]]:
        """Small set of career directions with alignment levels (FR2)."""
        scored = []
        for occ in occupation_repository.list_all(limit=2000):
            result = compute_alignment_score(profile, occ)
            scored.append((result["score"], occ, result))
        scored.sort(key=lambda item: item[0], reverse=True)

        results = []
        for score, occ, result in scored[:limit]:
            reasons = _fallback_reasons(profile, occ, result["alignment"])
            results.append(
                {
                    "onetsoc_code": occ.onetsoc_code,
                    "title": occ.title,
                    "alignment": result["alignment"],
                    "reasons": reasons,
                    "uncertainties": profile.unknown_areas[:3],
                }
            )
        return results

    def _deterministic_shortlist(
        self, profile: StudentProfile, limit: int = 10
    ) -> list[dict[str, Any]]:
        """Top occupations for the student by deterministic scoring."""
        scored = []
        for occ in occupation_repository.list_all(limit=2000):
            result = compute_alignment_score(profile, occ)
            scored.append((result["score"], occ, result))
        scored.sort(key=lambda item: item[0], reverse=True)

        return [
            {
                "onetsoc_code": occ.onetsoc_code,
                "title": occ.title,
                "description": occ.description,
                "alignment": result["alignment"],
                "reasons": _fallback_reasons(profile, occ, result["alignment"]),
                "uncertainties": profile.unknown_areas[:3],
            }
            for _, occ, result in scored[:limit]
        ]

    async def curated_cards(
        self, profile: StudentProfile, limit: int = 6
    ) -> list[dict[str, Any]]:
        """Step 2: LLM-curated career cards (FR1, personalized).

        1. Build a deterministic shortlist (top ~10 real O*NET occupations).
        2. Send the profile + shortlist to the LLM, which ranks and explains
           the best 6 cards tied to the student's own evidence.
        3. If the LLM is unavailable or fails validation, return the
           deterministic shortlist (capped at `limit`) so the flow never
           breaks.

        Only occupations from the shortlist may appear in the output, so the
        LLM cannot invent roles.
        """
        shortlist = self._deterministic_shortlist(profile, limit=10)

        # Empty shortlist → no processed data. Fall back to static cards so
        # the flow is still testable.
        if not shortlist:
            return [
                {**card, "alignment": "Moderate", "reasons": [out("career_static")]}
                for card in occupation_repository.career_cards()
            ][:max(limit, 6)]

        draft = await generate_structured(
            CAREER_CARDS_SYSTEM,
            _curated_cards_user_prompt(profile, shortlist),
            CareerCardsDraft,
        )
        if draft is not None and draft.careers:
            # Validate that every returned card is from the shortlist.
            allowed_codes = {c["onetsoc_code"] for c in shortlist}
            cards = [
                c.model_dump()
                for c in draft.careers[: max(limit, 6)]
                if c.onetsoc_code in allowed_codes
            ]
            if cards:
                return cards

        # LLM unavailable / invalid → deterministic fallback.
        return shortlist[: max(limit, 6)]

    async def explain_alignment(
        self,
        profile: StudentProfile,
        occupation: OccupationProfile,
        deterministic: dict[str, Any],
    ) -> dict[str, Any]:
        """Enrich the deterministic alignment with an LLM explanation.

        Falls back to deterministic reasons when the LLM is unavailable.
        """
        explanation = await generate_structured(
            CAREER_ALIGNMENT_SYSTEM,
            (
                f"Student profile:\n{profile.model_dump()}\n\n"
                f"Occupation: {occupation.title} ({occupation.onetsoc_code})\n\n"
                f"Deterministic signals: {deterministic['signals']}\n"
                f"Internal score: {deterministic['score']} ({deterministic['alignment']})"
            ),
            CareerAlignmentExplanation,
        )
        if explanation is not None:
            return {
                "alignment": explanation.alignment,
                "reasons": explanation.reasons,
                "uncertainties": explanation.uncertainties,
            }
        return {
            "alignment": deterministic["alignment"],
            "reasons": _fallback_reasons(profile, occupation, deterministic["alignment"]),
            "uncertainties": profile.unknown_areas[:3],
        }


def _curated_cards_user_prompt(
    profile: StudentProfile, shortlist: list[dict[str, Any]]
) -> str:
    import json as _json

    return (
        f"Student profile:\n{_json.dumps(profile.model_dump(), ensure_ascii=False, indent=2)}\n\n"
        f"Candidate occupations (pick ONLY from these, max 6, ranked best-fit first):\n"
        f"{_json.dumps(shortlist, ensure_ascii=False, indent=2)}"
    )
