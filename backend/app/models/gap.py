"""Shared data contract: GapAnalysis (handoff §23).

The deterministic comparison between a student profile and a target
occupation, classified into four buckets. The LLM only writes the
explanations; the classifications come from code.
"""

from pydantic import BaseModel, Field


class GapItem(BaseModel):
    area: str
    status: str  # confirmed | partial | development_area | unknown
    student_evidence: list[str] = Field(default_factory=list)
    reason: str = ""


class GapAnalysis(BaseModel):
    target_role: str = ""
    target_role_id: str | None = None

    confirmed: list[GapItem] = Field(default_factory=list)
    partial: list[GapItem] = Field(default_factory=list)
    development_areas: list[GapItem] = Field(default_factory=list)
    unknown: list[GapItem] = Field(default_factory=list)
