"""Shared data contract: ActionPlan (handoff §25).

The planning service enforces:
    - maximum 3 short-term actions
    - 4–8 week horizon per action
    - 1–2 year long-term vision
"""

from pydantic import BaseModel, Field, model_validator


class MinimumRequirement(BaseModel):
    """Todo-list item: short checkable label + optional concrete steps."""

    label: str
    detail: str = ""

    @model_validator(mode="before")
    @classmethod
    def _accept_legacy_str(cls, data):
        # Plans saved before the label/detail split stored plain strings.
        if isinstance(data, str):
            return {"label": data}
        return data


class ShortTermAction(BaseModel):
    title: str
    why: str = ""
    what_to_do: str = ""
    duration: str = "4-8 weeks"
    suggested_evidence: str = ""
    reflection_prompt: str = ""
    minimum_requirements: list[MinimumRequirement] = Field(default_factory=list)


class LongTermMilestone(BaseModel):
    timeframe: str  # e.g. "6 months", "12-18 months"
    title: str
    description: str = ""
    minimum_requirements: list[MinimumRequirement] = Field(default_factory=list)


class LongTermVision(BaseModel):
    timeframe: str = "1-2 years"
    description: str = ""
    milestones: list[LongTermMilestone] = Field(default_factory=list)


class ActionPlan(BaseModel):
    cycle_number: int = Field(default=1, description="Current reflection cycle iteration")
    accomplished_actions: list[dict] = Field(
        default_factory=list,
        description="Historical actions completed across previous reflection cycles"
    )
    short_term_actions: list[ShortTermAction] = Field(default_factory=list)
    long_term_vision: LongTermVision = Field(default_factory=LongTermVision)

    def has_valid_action_count(self) -> bool:
        """Hard constraint: never more than 3 short-term actions."""
        return len(self.short_term_actions) <= 3
