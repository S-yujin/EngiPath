"""Shared data contract: OccupationProfile (handoff §11).

The internal representation produced by merging the raw O*NET datasets.
Do not invent fields or scores that do not exist in the actual downloaded
O*NET files.
"""

from pydantic import BaseModel, Field


class OccupationProfile(BaseModel):
    onetsoc_code: str
    title: str
    description: str = ""

    essential_skills: list[dict] = Field(default_factory=list)
    software_skills: list[dict] = Field(default_factory=list)
    knowledge: list[dict] = Field(default_factory=list)
    career_interests: dict = Field(default_factory=dict)
