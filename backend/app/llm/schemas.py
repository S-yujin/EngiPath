"""Structured LLM output schemas (handoff §19).

These describe what the LLM is allowed to return. Services validate the
LLM response against these before touching the profile/portrait. Avoid
passing uncontrolled prose between backend modules.
"""

from pydantic import BaseModel, Field

from app.models.reflection import ReflectionItem


class ReflectionAnalysis(BaseModel):
    """What the reflection LLM extracts from one student answer."""

    skills_observed: list[str] = Field(default_factory=list)
    new_experiences: list[dict] = Field(default_factory=list)
    possible_strengths: list[ReflectionItem] = Field(default_factory=list)
    development_areas: list[ReflectionItem] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    unknowns: list[str] = Field(default_factory=list)
    next_question: str = ""


class PortraitDraft(BaseModel):
    """Full Reflection Portrait produced by the LLM."""

    supported_strengths: list[ReflectionItem] = Field(default_factory=list)
    possible_overlooked_strengths: list[ReflectionItem] = Field(default_factory=list)
    areas_to_validate: list[ReflectionItem] = Field(default_factory=list)
    development_areas: list[ReflectionItem] = Field(default_factory=list)
    insufficient_information: list[str] = Field(default_factory=list)


class CareerAlignmentExplanation(BaseModel):
    """Why a student aligns with a career direction (handoff §22)."""

    alignment: str  # Low | Moderate | Good | High
    reasons: list[str] = Field(default_factory=list)
    uncertainties: list[str] = Field(default_factory=list)


class GapExplanation(BaseModel):
    """Human-readable explanation of a deterministic gap comparison."""

    target_role: str = ""
    notes: list[str] = Field(default_factory=list)


class ActionPlanDraft(BaseModel):
    """Draft plan from the LLM; the planning service enforces the cap."""

    short_term_actions: list[dict] = Field(default_factory=list)
    long_term_vision: dict = Field(default_factory=dict)


class CareerCard(BaseModel):
    """A single curated career card (handoff §22)."""

    onetsoc_code: str
    title: str
    description: str = ""
    alignment: str  # Low | Moderate | Good | High
    reasons: list[str] = Field(default_factory=list)
    uncertainties: list[str] = Field(default_factory=list)


class CareerCardsDraft(BaseModel):
    """LLM output for curated career cards (Step 2)."""

    careers: list[CareerCard] = Field(default_factory=list)


class CompetencyBaselineDraft(BaseModel):
    """LLM-generated 6-dimension competency baseline (Step 1.5 — "Start
    Comparison" button).

    The radar chart on the frontend shows these six competencies against the
    target occupation's scores. Values are 0–100.
    """

    technicalFundamentals: int = Field(ge=0, le=100, default=50)
    programming: int = Field(ge=0, le=100, default=40)
    prototyping: int = Field(ge=0, le=100, default=45)
    systemsThinking: int = Field(ge=0, le=100, default=50)
    communication: int = Field(ge=0, le=100, default=50)
    learningAgility: int = Field(ge=0, le=100, default=60)
    reasoning: str = Field(default="", description="Short explanation the AI used")


class ContextualizedOption(BaseModel):
    id: str
    text: str


class ContextualizedQuestionDraft(BaseModel):
    """Rephrased question retaining exact option IDs and meanings, tailored to student background."""
    question_text: str
    hint: str = ""
    options: list[ContextualizedOption] = Field(default_factory=list)


class AdaptiveClarificationDraft(BaseModel):
    """Dynamic gentle reflective clarification when contradictions are detected."""
    question_text: str
    target_signal: str
    options: list[ContextualizedOption] = Field(default_factory=list)


class HeardSummarySynthesisDraft(BaseModel):
    """Conversational synthesis of the 'Here's What I Heard' checkpoint."""
    opening: str = ""
    summary_bullets: list[str] = Field(default_factory=list)
    closing_prompt: str = "Does this sound right?"


class EvolutionSummaryDraft(BaseModel):
    """Comparative synthesis of student growth across reflection cycles."""

    evolution_summary: str = Field(
        description="Warm 2-3 sentence mentor synthesis comparing current cycle competencies against prior baseline"
    )
    key_growth_highlights: list[str] = Field(
        default_factory=list,
        description="Short bullet points of leveled-up engineering strengths"
    )


class MidpointSynthesisDraft(BaseModel):
    """Structured LLM synthesis generated at Question 5."""
    mentor_synthesis: str = Field(description="2-3 sentences evaluating the student's problem solving style and growth path for their target career.")
    emergent_archetype: str = Field(default="Adaptive Problem Solver", description="A concise 3-5 word title for their problem solving style.")
    second_half_focus: str = Field(default="Exploring technical communication and trade-offs.", description="What the second half of the interview will probe.")
    q6_conversational_bridge: str = Field(default="", description="Natural conversational opening phrase for Question 6.")


class CycleQuestionnaireCalibrationDraft(BaseModel):
    """LLM calibration synthesizing recent project milestone into customized probes for the new cycle."""
    synthesis_rationale: str = Field(description="2-3 sentences explaining how their milestone connects to their target role and selected focus dimension.")
    target_dimension: str = Field(default="Systems Thinking & Architecture", description="The primary competency dimension emphasized.")
    selected_probes: list[str] = Field(default_factory=list, description="3 specific diagnostic probe challenge areas selected for this cycle.")
    initial_question_bridge: str = Field(description="Warm 1-2 sentence lead-in directly referencing their project milestone and introducing Question 1.")
    target_competency_gain: str = Field(default="+5 Growth", description="Estimated target competency growth.")
