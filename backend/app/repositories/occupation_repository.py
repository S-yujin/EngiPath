"""Occupation store access (handoff §14–15).

Loads the preprocessed O*NET file (`occupations.jsonl`) into memory once,
then serves exact lookups and simple keyword search. Vector search is a
future option — this interface stays the same either way.
"""

import json
import logging
from pathlib import Path

from app.config import settings
from app.models.occupation import OccupationProfile

logger = logging.getLogger(__name__)

# Data files
ONET_DATA_FILENAME = "occupations.jsonl"

# Hard-coded fallback: at least 6 aspirational career cards are required by
# FR1 even before preprocessing has been run. These are curated from O*NET.
ASPIRATIONAL_CARDS = [
    {
        "onetsoc_code": "15-1252.00",
        "title": "Software Developers",
        "description": "Research, design, and develop computer and network software.",
    },
    {
        "onetsoc_code": "17-2071.00",
        "title": "Electrical Engineers",
        "description": "Design, develop, test, and supervise electrical equipment.",
    },
    {
        "onetsoc_code": "15-2051.01",
        "title": "Data Scientists",
        "description": "Analyze and interpret complex data to help organizations decide.",
    },
    {
        "onetsoc_code": "15-1212.00",
        "title": "Information Security Analysts",
        "description": "Plan and carry out security measures to protect information systems.",
    },
    {
        "onetsoc_code": "15-1221.00",
        "title": "Computer and Information Research Scientists",
        "description": "Invent and design new approaches to computing technology.",
    },
    {
        "onetsoc_code": "17-3026.00",
        "title": "Electro-Mechanical and Mechatronics Technologists",
        "description": "Operate and test unmanned, automated, robotic, or electromechanical systems.",
    },
]


class OccupationRepository:
    """In-memory occupation store backed by the preprocessed JSONL file."""

    def __init__(self, path: str | None = None):
        self._path = Path(path or settings.ONET_DATA_PATH)
        self._occupations: dict[str, OccupationProfile] = {}
        self._loaded = False
        self._skill_freq_cache: dict[str, int] | None = None

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        if not self._path.exists():
            logger.warning(
                "Processed O*NET file not found at %s. Run `python scripts/"
                "preprocess_onet.py`. Occupation search will be empty until then.",
                self._path,
            )
            return
        with self._path.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    occ = OccupationProfile.model_validate(data)
                    self._occupations[occ.onetsoc_code] = occ
                except Exception as exc:  # noqa: BLE001 - one bad line must not kill load
                    logger.warning("Skipping malformed occupation line: %s", exc)

    def count(self) -> int:
        self._ensure_loaded()
        return len(self._occupations)

    def get(self, onetsoc_code: str) -> OccupationProfile | None:
        self._ensure_loaded()
        return self._occupations.get(onetsoc_code)

    def search(self, query: str, limit: int = 10) -> list[OccupationProfile]:
        """Simple keyword search over title, description and skill names."""
        self._ensure_loaded()
        query = query.strip().lower()
        if not query:
            return []
        matches: list[tuple[int, OccupationProfile]] = []
        for occ in self._occupations.values():
            haystack = f"{occ.title} {occ.description}".lower()
            score = 0
            if query in occ.title.lower():
                score += 5
            if query in occ.description.lower():
                score += 3
            for skill in occ.essential_skills:
                if query in str(skill.get("name", "")).lower():
                    score += 2
            if score > 0:
                matches.append((score, occ))
        matches.sort(key=lambda item: item[0], reverse=True)
        return [occ for _, occ in matches[:limit]]

    def list_all(self, limit: int = 20) -> list[OccupationProfile]:
        self._ensure_loaded()
        return list(self._occupations.values())[:limit]

    def skill_frequency(self) -> dict[str, int]:
        """How many occupations mention each (lowercased) skill/tool/knowledge
        name. Used for rarity-weighted matching — a rare skill (e.g. ROS) is a
        much stronger alignment signal than a ubiquitous one (e.g. Python).
        """
        self._ensure_loaded()
        if self._skill_freq_cache is not None:
            return self._skill_freq_cache
        freq: dict[str, int] = {}
        for occ in self._occupations.values():
            seen = set()
            for bucket in (
                occ.essential_skills,
                occ.software_skills,
                occ.knowledge,
            ):
                for item in bucket:
                    name = str(item.get("name", "")).strip().lower()
                    if name and name not in seen:
                        seen.add(name)
                        freq[name] = freq.get(name, 0) + 1
        self._skill_freq_cache = freq
        return freq

    def career_cards(self) -> list[dict]:
        """Return at least 6 aspirational career cards (FR1)."""
        self._ensure_loaded()
        if self.count() == 0:
            return ASPIRATIONAL_CARDS
        cards = []
        for code in [c["onetsoc_code"] for c in ASPIRATIONAL_CARDS]:
            occ = self._occupations.get(code)
            if occ:
                cards.append(
                    {"onetsoc_code": occ.onetsoc_code, "title": occ.title, "description": occ.description}
                )
        # Top up to 6 from the general list if curation did not cover all.
        if len(cards) < 6:
            seen = {c["onetsoc_code"] for c in cards}
            for occ in self._occupations.values():
                if occ.onetsoc_code in seen:
                    continue
                cards.append(
                    {"onetsoc_code": occ.onetsoc_code, "title": occ.title, "description": occ.description}
                )
                seen.add(occ.onetsoc_code)
                if len(cards) >= 6:
                    break
        return cards


# Module-level singleton so all routes/services share one in-memory store.
occupation_repository = OccupationRepository()
