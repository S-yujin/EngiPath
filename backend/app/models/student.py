"""Shared data contract: StudentProfile (handoff §7).

Note: `skills` does NOT mean verified proficiency — it only means the
skill/tool has appeared in the student's current profile.
"""

from pydantic import BaseModel, Field

from app.models.experience import Experience
from app.models.reflection import ReflectionItem


class StudentProfile(BaseModel):
    student_id: str
    major: str | None = None
    year: int | None = None
    intro: str | None = None

    skills: list[str] = Field(default_factory=list)
    experiences: list[Experience] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)

    strengths: list[ReflectionItem] = Field(default_factory=list)
    development_areas: list[ReflectionItem] = Field(default_factory=list)
    unknown_areas: list[str] = Field(default_factory=list)

    target_role_id: str | None = None
