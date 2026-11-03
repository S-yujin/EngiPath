"""Shared data contract: Experience (handoff §8).

Represents one thing the student has done — a project, internship,
competition, club, etc. The `type` field is one of:

    academic_project | personal_project | internship | employment
    volunteering | club | competition | research | course | other
"""

from pydantic import BaseModel, Field


class Experience(BaseModel):
    type: str
    title: str | None = None
    description: str | None = None

    contributions: list[str] = Field(default_factory=list)
    tools_used: list[str] = Field(default_factory=list)

    enjoyed: list[str] = Field(default_factory=list)
    struggled_with: list[str] = Field(default_factory=list)
    learned: list[str] = Field(default_factory=list)
