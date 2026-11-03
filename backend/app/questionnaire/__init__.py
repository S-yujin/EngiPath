"""EngiPath Questionnaire Intelligence Layer Module."""

from app.questionnaire.bridge import project_signals_to_competencies
from app.questionnaire.pipeline import (
    ALL_SIGNALS,
    CAPABILITY_SIGNALS,
    CORE_QUESTION_ORDER,
    apply_student_correction,
    build_student_profile,
    classify_reflection,
    generate_heard_summary,
    get_question_bank,
    get_signal_mapping,
    initialise_signal_state,
    process_answer,
    select_next_question,
    should_stop,
    update_signal_state,
)

__all__ = [
    "ALL_SIGNALS",
    "CAPABILITY_SIGNALS",
    "CORE_QUESTION_ORDER",
    "apply_student_correction",
    "build_student_profile",
    "classify_reflection",
    "generate_heard_summary",
    "get_question_bank",
    "get_signal_mapping",
    "initialise_signal_state",
    "process_answer",
    "project_signals_to_competencies",
    "select_next_question",
    "should_stop",
    "update_signal_state",
]
