"""Reflection API (handoff §21, §24).

    POST /students/{id}/reflection             submit an answer → profile updates + next question
    POST /students/{id}/portrait               generate the Reflection Portrait
    POST /students/{id}/portrait/feedback      agree / disagree / add context → updates portrait
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.reflection import ReflectionPortrait
from app.services.profile_service import ProfileService
from app.services.questionnaire_service import QuestionnaireService
from app.services.reflection_service import ReflectionService

router = APIRouter(prefix="/students/{student_id}", tags=["reflection"])

reflection_service = ReflectionService()
questionnaire_service = QuestionnaireService()
profile_service = ProfileService()


class QuestionnaireAnswerSubmission(BaseModel):
    question_id: str = Field(description="The question ID being answered, e.g. Q01")
    selected_option_ids: list[str] = Field(default_factory=list, description="Selected option IDs, e.g. ['A', 'B']")
    notes: str | None = Field(default=None, description="Optional free-text commentary or evidence")


class HeardSummaryConfirmation(BaseModel):
    response: str = Field(pattern="^(yes|mostly|not_really)$", description="yes | mostly | not_really")
    corrections: list[dict] | None = Field(default=None, description="Optional list of corrections")


class ReflectionSubmission(BaseModel):
    question: str
    answer: str = Field(min_length=1, description="The student's answer")


class ReflectionResponse(BaseModel):
    profile_updates: dict = Field(default_factory=dict)
    next_question: str | None = None
    questionnaire_complete: bool = False


class PortraitFeedback(BaseModel):
    item: str = Field(description="The portrait area being addressed")
    feedback_type: str = Field(
        pattern="^(agree|disagree|add_context)$",
        description="agree | disagree | add_context",
    )
    context: str | None = Field(default=None, description="Extra context (for add_context)")


class QuestionnairePrewarmRequest(BaseModel):
    target_career_id: str | None = Field(default=None, description="Optional target dream job ONET code")
    target_career_title: str | None = Field(default=None, description="Optional target dream job title")


class QuestionnaireNewCycleRequest(BaseModel):
    project_update: str | None = Field(default=None, description="Optional notes on new projects, coursework, or achievements")
    focus_area: str | None = Field(default=None, description="Optional engineering dimension to prioritize")


def _ensure_student(student_id: str) -> None:
    if profile_service.get_profile(student_id) is None:
        raise HTTPException(status_code=404, detail="Student not found")


# ---------------------------------------------------------------------------
# Questionnaire Intelligence Layer Endpoints (Step 3 Diagnostic)
# ---------------------------------------------------------------------------

@router.post("/questionnaire/new-cycle")
async def start_new_questionnaire_cycle(student_id: str, payload: QuestionnaireNewCycleRequest | None = None):
    """Archive previous reflection cycle and start an evolved reflection cycle (Cycle 2, 3...) with unasked questions."""
    _ensure_student(student_id)
    project_update = payload.project_update if payload else None
    focus_area = payload.focus_area if payload else None
    result = await questionnaire_service.start_new_cycle(
        student_id=student_id,
        project_update=project_update,
        focus_area=focus_area,
    )
    return result


@router.post("/questionnaire/prewarm")
async def prewarm_questionnaire(student_id: str, payload: QuestionnairePrewarmRequest | None = None):
    """Pre-warm the questionnaire session in the background while the student is browsing career cards."""
    _ensure_student(student_id)
    career_id = payload.target_career_id if payload else None
    career_title = payload.target_career_title if payload else None
    result = questionnaire_service.prewarm_session(
        student_id=student_id,
        target_career_id=career_id,
        target_career_title=career_title,
    )
    return result


@router.post("/questionnaire/start")
async def start_questionnaire(student_id: str):
    """Start or resume a structured questionnaire session and return the first/next question."""
    _ensure_student(student_id)
    questionnaire_service.get_or_create_session(student_id)
    next_q = await questionnaire_service.get_current_or_next_question(student_id)
    return next_q


@router.get("/questionnaire/next")
async def get_next_question(student_id: str):
    """Fetch the next vetted question with live radar scores and progress."""
    _ensure_student(student_id)
    next_q = await questionnaire_service.get_current_or_next_question(student_id)
    return next_q


@router.post("/questionnaire/answer")
async def answer_question(student_id: str, payload: QuestionnaireAnswerSubmission):
    """Submit an answer to a question, update signal state, and return the next question."""
    _ensure_student(student_id)
    result = await questionnaire_service.submit_answer(
        student_id=student_id,
        question_id=payload.question_id,
        selected_option_ids=payload.selected_option_ids,
        notes=payload.notes,
    )
    return result


@router.get("/questionnaire/heard-summary")
async def get_heard_summary(student_id: str):
    """Get the 'Here's What I Heard' mentor synthesis checkpoint."""
    _ensure_student(student_id)
    summary = await questionnaire_service.get_heard_summary_checkpoint(student_id)
    return summary


@router.post("/questionnaire/heard-summary/confirm")
async def confirm_heard_summary(student_id: str, payload: HeardSummaryConfirmation):
    """Confirm or provide corrections to the heard summary checkpoint."""
    _ensure_student(student_id)
    result = await questionnaire_service.confirm_heard_summary(
        student_id=student_id,
        student_response=payload.response,
        corrections=payload.corrections,
    )
    return result


@router.get("/questionnaire/profile")
async def get_calibrated_profile(student_id: str):
    """Generate the full calibrated Student Profile from the questionnaire."""
    _ensure_student(student_id)
    profile = questionnaire_service.generate_final_profile(student_id)
    return profile


# ---------------------------------------------------------------------------
# Legacy Reflection Endpoints (Preserved for Backward Compatibility)
# ---------------------------------------------------------------------------

@router.post("/reflection", response_model=ReflectionResponse)
async def submit_reflection(student_id: str, payload: ReflectionSubmission):
    _ensure_student(student_id)

    analysis = await reflection_service.analyze_answer(
        student_id, payload.question, payload.answer
    )

    next_question = reflection_service.next_question(student_id, analysis.next_question)

    return ReflectionResponse(
        profile_updates={
            "skills_observed": analysis.skills_observed,
            "possible_strengths": [s.model_dump() for s in analysis.possible_strengths],
            "unknowns": analysis.unknowns,
        },
        next_question=next_question,
        questionnaire_complete=next_question is None,
    )


@router.get("/portrait", response_model=ReflectionPortrait)
@router.post("/portrait", response_model=ReflectionPortrait)
async def get_or_generate_portrait(student_id: str):
    """Generate the explainable Reflection Portrait from the student's reflection state."""
    _ensure_student(student_id)
    portrait = await questionnaire_service.get_reflection_portrait(student_id)
    return portrait


@router.post("/portrait/feedback", response_model=ReflectionPortrait)
async def portrait_feedback(student_id: str, payload: PortraitFeedback):
    """Record student feedback (agree, disagree, add_context) on a portrait item (Master Prompt §5 Rule 6)."""
    _ensure_student(student_id)
    questionnaire_service.save_portrait_feedback(
        student_id=student_id,
        signal_or_area=payload.item,
        feedback_type=payload.feedback_type,
        context_note=payload.context,
    )
    portrait = await questionnaire_service.get_reflection_portrait(student_id)
    return portrait
