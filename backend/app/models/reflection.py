"""Shared data contract: ReflectionItem and ReflectionPortrait (Master Prompt §22–33).

Every important reflection preserves its reason and evidence so the
product stays explainable. The student can later agree / disagree / add
context, which updates the portrait.
"""

from typing import Literal
from pydantic import BaseModel, Field


class ReflectionItem(BaseModel):
    """A single calibrated reflection claim about the student, with justification & evidence."""

    signal: str = Field(default="GEN1", description="The underlying reflection signal code, e.g. PS2")
    label: str = Field(default="General", description="Human-friendly label, e.g. Troubleshooting")
    area: str | None = Field(default=None, description="Legacy area label")
    reason: str | None = Field(default=None, description="Legacy reason string")
    evidence: list[str] = Field(default_factory=list, description="Legacy evidence list")
    competency: str = Field(
        default="technicalFundamentals",
        description="Mapped radar competency (technicalFundamentals, programming, prototyping, systemsThinking, communication, learningAgility)",
    )
    classification: str = Field(
        default="developing_picture",
        description="supported_strength | possible_hidden_strength | worth_validating | developing_picture | still_taking_shape"
    )
    student_self_view: str | None = Field(default=None, description="high | low | moderate | none")
    experience_strength: float | None = Field(default=None, description="0.0 - 1.0 numeric strength")
    state_confidence: float = Field(default=0.0, description="0.0 - 1.0 confidence score")
    reason_code: str = Field(default="general", description="Rule reason code, e.g. low_self_view_high_experience")
    explanation: str = Field(default="", description="Mentor-style explainable justification")
    supporting_sources: list[str] = Field(default_factory=list, description="Question response source codes, e.g. ['Q14:D', 'Q15:D']")
    contradicting_sources: list[str] = Field(default_factory=list)
    user_feedback: Literal["agreed", "disagreed", "context-added", "none"] = Field(default="none")
    user_context_note: str | None = Field(default=None, description="Optional student note added on feedback")


class ReflectionPortrait(BaseModel):
    """The 5-category explainable growth portrait generated from reflection calibration."""

    cycle_number: int = Field(default=1, description="Current reflection cycle number (1 = Baseline, 2 = Milestone, etc.)")
    previous_scores: dict[str, int] | None = Field(default=None, description="Prior cycle radar competency scores for baseline comparison")
    score_deltas: dict[str, int] | None = Field(default=None, description="Longitudinal delta (+/-) competency score changes since prior cycle")
    evolution_summary: str | None = Field(default=None, description="Comparative AI synthesis highlighting recent growth across cycles")
    supported_strengths: list[ReflectionItem] = Field(default_factory=list)
    possible_hidden_strengths: list[ReflectionItem] = Field(default_factory=list)
    areas_to_validate: list[ReflectionItem] = Field(default_factory=list)
    developing_picture: list[ReflectionItem] = Field(default_factory=list)
    still_taking_shape: list[ReflectionItem] = Field(default_factory=list)
    summary_narration: str | None = Field(default=None, description="Warm mentor summary of the overall portrait")

    # Legacy fields for backward compatibility with existing tests & skeleton code
    possible_overlooked_strengths: list[ReflectionItem] = Field(default_factory=list)
    development_areas: list[ReflectionItem] = Field(default_factory=list)
    insufficient_information: list[str] = Field(default_factory=list)
