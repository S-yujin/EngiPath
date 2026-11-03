"""Questionnaire Service.

Orchestrates the EngiPath Questionnaire Intelligence Layer session lifecycle,
question selection, contextualization with LLM, answer processing, stopping
logic, and profile generation.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any

from app.i18n import signal_name
from app.i18n_questionnaire import CHECKPOINT_MESSAGES, qtext
from app.llm.locale import get_language
from app.llm.client import generate_structured
from app.llm.prompts import (
    ADAPTIVE_CLARIFICATION_SYSTEM,
    CONTEXTUALIZE_QUESTION_SYSTEM,
    CYCLE_CALIBRATION_SYSTEM,
    EVOLUTION_SUMMARY_SYSTEM,
    HEARD_SUMMARY_SYNTHESIS_SYSTEM,
    QUESTIONNAIRE_MIDPOINT_SYSTEM,
)
from app.llm.schemas import (
    AdaptiveClarificationDraft,
    ContextualizedQuestionDraft,
    CycleQuestionnaireCalibrationDraft,
    EvolutionSummaryDraft,
    HeardSummarySynthesisDraft,
    MidpointSynthesisDraft,
)
from app.models.reflection import ReflectionItem, ReflectionPortrait
from app.models.student import StudentProfile
from app.questionnaire.bridge import project_signals_to_competencies
from app.questionnaire.pipeline import (
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
from app.repositories.questionnaire_repository import QuestionnaireRepository
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class QuestionnaireService:
    def __init__(
        self,
        profile_service: ProfileService | None = None,
        repository: QuestionnaireRepository | None = None,
    ):
        self.profile_service = profile_service or ProfileService()
        self.repository = repository or QuestionnaireRepository()

    def get_or_create_session(self, student_id: str) -> dict[str, Any]:
        """Load an existing questionnaire session or initialize a fresh one."""
        existing = self.repository.get_session(student_id)
        if existing is not None:
            return existing

        profile = self.profile_service.get_profile(student_id)
        context = {
            "major": profile.major if profile else None,
            "year": profile.year if profile else None,
        }
        session_id = f"SESSION_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        state = initialise_signal_state(student_id, session_id, context)
        self.repository.save_session(student_id, session_id, state, "in_progress")
        return state

    def prewarm_session(
        self,
        student_id: str,
        target_career_id: str | None = None,
        target_career_title: str | None = None,
    ) -> dict[str, Any]:
        """Pre-warm a questionnaire session in the background during Step 2.
        Saves student persona context so that Step 3 loads with 0ms delay.
        """
        state = self.get_or_create_session(student_id)
        profile = self.profile_service.get_profile(student_id)

        # Store enriched persona in state context
        if profile:
            state.setdefault("context", {})
            state["context"]["target_career_id"] = target_career_id
            state["context"]["target_career_title"] = target_career_title
            state["context"]["skills"] = profile.skills
            state["context"]["interests"] = profile.interests
            state["context"]["intro"] = profile.intro
            self.repository.save_session(student_id, state["session_id"], state, "in_progress")

        return {"status": "prewarmed", "session_id": state["session_id"]}

    def _generate_midpoint_synthesis(self, state: dict[str, Any], profile: StudentProfile | None) -> str:
        ctx = state.get("context", {})
        dream_job = ctx.get("target_career_title") or "your target career"
        major = profile.major if profile and profile.major else "engineering"

        # Determine emergent top capability from Q1-Q5
        strongest_sig = None
        max_exp = 0.0
        for sig in ("PS1", "PS2", "INT1", "SELF1"):
            agg = state.get("capability_signals", {}).get(sig, {}).get("aggregate", {})
            exp = agg.get("experience_strength", 0.0) or 0.0
            if exp > max_exp:
                max_exp = exp
                strongest_sig = sig

        strength_desc = signal_name(strongest_sig) if strongest_sig else "systematic engineering problem solving"
        return qtext("midpoint_summary", strength=strength_desc, job=dream_job)

    async def _generate_midpoint_synthesis_llm(
        self, state: dict[str, Any], profile: StudentProfile | None
    ) -> dict[str, Any]:
        """Generate a personalized mentor synthesis at Q5."""
        ctx = state.get("context", {})
        dream_job = ctx.get("target_career_title") or "Engineering Role"
        major = profile.major if profile and profile.major else "Engineering"
        skills = profile.skills if profile and profile.skills else []
        intro = profile.intro if profile and profile.intro else ""

        # Collect Q1-Q5 answers with readable question text, options, and notes
        qb = get_question_bank()
        answered_details = []
        for sig, sig_data in state.get("capability_signals", {}).items():
            for obs in sig_data.get("observations", []):
                qid = obs.get("question_id")
                q_text = qb.get(qid, {}).get("text", {}).get("en", qid)
                q_options = {o["id"]: o.get("text", {}).get("en", "") for o in qb.get(qid, {}).get("options", [])}
                selected = [f"Option {opt}: {q_options.get(opt, '')}" for opt in obs.get("selected_options", [])]
                notes = obs.get("notes") or ""
                answered_details.append({
                    "question": q_text,
                    "student_selected": selected,
                    "student_notes": notes,
                })

        user_prompt = f"""Student Profile:
- Major: {major} (Year {getattr(profile, 'year', 2)})
- Target Dream Job: {dream_job}
- Declared Skills: {', '.join(skills) if skills else 'Not specified'}
- Intro/Background: {intro}

First 5 Diagnostic Questions & Student Answers:
{json.dumps(answered_details, indent=2)}

Please evaluate this student's emergent engineering problem-solving style and craft an insightful mentor synthesis for their target role: {dream_job}."""

        try:
            res = await generate_structured(
                system_prompt=QUESTIONNAIRE_MIDPOINT_SYSTEM,
                user_prompt=user_prompt,
                response_model=MidpointSynthesisDraft,
            )
            if res and res.mentor_synthesis:
                return {
                    "mentor_synthesis": res.mentor_synthesis,
                    "emergent_archetype": res.emergent_archetype,
                    "second_half_focus": res.second_half_focus,
                    "q6_conversational_bridge": res.q6_conversational_bridge,
                }
        except Exception as e:
            logger.warning("LLM midpoint synthesis failed: %s", e)

        # Fallback to deterministic
        fallback_text = self._generate_midpoint_synthesis(state, profile)
        return {
            "mentor_synthesis": fallback_text,
            "emergent_archetype": qtext("midpoint_archetype"),
            "second_half_focus": qtext("midpoint_focus", job=dream_job),
            "q6_conversational_bridge": qtext("midpoint_bridge", job=dream_job),
        }

    def _build_conversational_bridge(
        self,
        state: dict[str, Any],
        profile: StudentProfile | None,
        next_qid: str,
        layer: str,
        last_qid: str | None = None,
        last_selected_ids: list[str] | None = None,
        last_notes: str | None = None,
    ) -> tuple[str, str, bool]:
        """Localized lead-in and mentor insight; state/option IDs remain unchanged."""
        major = (profile.major if profile and profile.major else "engineering").strip()
        skills = profile.skills if profile and profile.skills else []
        top_skill = skills[0] if skills else "engineering problem solving"
        ctx = state.get("context", {})
        dream_job = ctx.get("target_career_title") or f"{major} engineering"

        unresolved = [c for c in state.get("contradictions", []) if not c.get("resolved")]
        is_adaptive = layer == "adaptive" or bool(unresolved)
        if is_adaptive and unresolved:
            desc = unresolved[-1].get("description", "").lower()
            hidden_strength = "low" in desc or "mastery" in desc
            kind = "adaptive_low" if hidden_strength else "adaptive_high"
            insight_kind = "adaptive_low_insight" if hidden_strength else "adaptive_high_insight"
            return qtext(kind), qtext(insight_kind), True

        q_count = state["questionnaire_state"]["current_question_count"]
        if q_count == 0 or last_qid is None:
            cycle_calib = state.get("latest_cycle_calibration")
            if state.get("cycle_number", 1) > 1 and cycle_calib:
                # An earlier cycle may have been generated in another language.
                if state.get("latest_cycle_calibration_language") == get_language() and cycle_calib.get("initial_question_bridge"):
                    bridge = cycle_calib["initial_question_bridge"]
                else:
                    bridge = qtext("initial_bridge", major=major, skill=top_skill, job=dream_job)
                insight = qtext("cycle_insight", cycle=state.get("cycle_number"), dimension=cycle_calib.get("target_dimension") or major)
                return bridge, insight, False
            return (
                qtext("initial_bridge", major=major, skill=top_skill, job=dream_job),
                qtext("initial_insight", major=major, job=dream_job), False,
            )

        if q_count == 5:
            llm_synth = ctx.get("midpoint_synthesis") or {}
            custom = llm_synth.get("q6_conversational_bridge")
            if (ctx.get("midpoint_synthesis_language") == get_language()
                    and isinstance(custom, str) and len(custom.strip()) > 15):
                bridge = custom.strip()
            else:
                bridge = qtext("midpoint_bridge", job=dream_job)
            return bridge, qtext("midpoint_insight", job=dream_job), False

        if last_notes and last_notes.strip():
            note = last_notes.strip().replace("\n", " ")
            if len(note) > 50:
                note = note[:47] + "..."
            return qtext("note_bridge", note=note), qtext("note_insight"), False

        qb = get_question_bank()
        last_q = qb.get(last_qid or "", {})
        chosen = ""
        if last_selected_ids:
            chosen_option = next((o for o in last_q.get("options", [])
                                  if o["id"] == last_selected_ids[0]), None)
            if chosen_option:
                texts = chosen_option.get("text", {})
                # No translated text? Use a neutral localized lead-in instead.
                option_text = (texts.get(get_language())
                               or (texts.get("en") if get_language() == "en" else ""))
                chosen = option_text.split(".")[0].split(",")[0]
                if len(chosen) > 40:
                    chosen = chosen[:38] + "..."
        bridge = qtext("choice_bridge", choice=chosen) if chosen else qtext("next_bridge", major=major)
        return bridge, qtext("tracking_insight", job=dream_job), False

    async def get_current_or_next_question(
        self,
        student_id: str,
        contextualize_with_llm: bool = False,
        last_qid: str | None = None,
        last_selected_ids: list[str] | None = None,
        last_notes: str | None = None,
    ) -> dict[str, Any]:
        """Fetch the next question for the student, with question metadata,
        conversational bridge, options, progress, live scores, and instant response from question bank.
        """
        state = self.get_or_create_session(student_id)
        profile = self.profile_service.get_profile(student_id)
        live_scores = project_signals_to_competencies(state, profile)

        # Check stopping criteria
        stopped, reason = should_stop(state)
        if stopped:
            return {
                "question": None,
                "is_complete": True,
                "completion_reason": reason,
                "progress": {
                    "answered_count": state["questionnaire_state"]["current_question_count"],
                    "phase": state["questionnaire_state"]["current_phase"],
                },
                "live_scores": live_scores,
            }

        next_qid = select_next_question(state)
        if next_qid is None:
            return {
                "question": None,
                "is_complete": True,
                "completion_reason": "no_more_questions",
                "progress": {
                    "answered_count": state["questionnaire_state"]["current_question_count"],
                    "phase": state["questionnaire_state"]["current_phase"],
                },
                "live_scores": live_scores,
            }

        qb = get_question_bank()
        raw_q = qb.get(next_qid, {})
        locale = get_language()
        base_text = (raw_q.get("text", {}).get(locale)
                     or raw_q.get("text", {}).get("en") or "Reflection question")
        options = [
            {"id": opt["id"], "text": (opt.get("text", {}).get(locale)
                                        or opt.get("text", {}).get("en", ""))}
            for opt in raw_q.get("options", [])
        ]
        instruction = (raw_q.get("instruction", {}).get(locale)
                       or raw_q.get("instruction", {}).get("en"))
        allow_multiple = raw_q.get("allow_multiple", False)
        max_selections = raw_q.get("max_selections", 1 if not allow_multiple else 5)
        layer = raw_q.get("layer", "core")

        bridge_text, mentor_insight, is_contradiction = self._build_conversational_bridge(
            state=state,
            profile=profile,
            next_qid=next_qid,
            layer=layer,
            last_qid=last_qid,
            last_selected_ids=last_selected_ids,
            last_notes=last_notes,
        )

        question_payload = {
            "id": next_qid,
            "text": base_text,
            "instruction": instruction,
            "layer": layer,
            "dimension": raw_q.get("dimension", []),
            "signals": raw_q.get("signals", []),
            "allow_multiple": allow_multiple,
            "max_selections": max_selections,
            "options": options,
            "hint": "",
            "conversational_bridge": bridge_text,
            "mentor_insight": mentor_insight,
            "contradiction_alert": is_contradiction,
        }

        # Optional LLM contextualization (only if explicitly enabled)
        if contextualize_with_llm and profile and (profile.major or profile.skills):
            contextualized = await self._contextualize_question(profile, question_payload)
            if contextualized:
                question_payload["text"] = contextualized.question_text
                if contextualized.hint:
                    question_payload["hint"] = contextualized.hint
                if contextualized.options:
                    opt_map = {o.id: o.text for o in contextualized.options}
                    for opt in question_payload["options"]:
                        if opt["id"] in opt_map and opt_map[opt["id"]]:
                            opt["text"] = opt_map[opt["id"]]

        return {
            "question": question_payload,
            "is_complete": False,
            "completion_reason": None,
            "progress": {
                "answered_count": state["questionnaire_state"]["current_question_count"],
                "phase": state["questionnaire_state"]["current_phase"],
            },
            "live_scores": live_scores,
        }

    async def submit_answer(
        self,
        student_id: str,
        question_id: str,
        selected_option_ids: list[str],
        notes: str | None = None,
    ) -> dict[str, Any]:
        """Record the student's answer, update signal state in SQLite, and return
        the next step with live projected scores, conversational bridge, and midpoint calibration.
        """
        state = self.get_or_create_session(student_id)
        state = process_answer(state, question_id, selected_option_ids, notes)

        # Check stopping criteria
        stopped, reason = should_stop(state)
        status = "completed" if stopped else "in_progress"
        self.repository.save_session(student_id, state["session_id"], state, status)

        profile = self.profile_service.get_profile(student_id)
        live_scores = project_signals_to_competencies(state, profile)
        answered_cnt = state["questionnaire_state"]["current_question_count"]

        if answered_cnt == 5:
            llm_synth = await self._generate_midpoint_synthesis_llm(state, profile)
            state["context"]["midpoint_synthesis"] = llm_synth
            state["context"]["midpoint_synthesis_language"] = get_language()
            is_midpoint = True
            midpoint_summary = llm_synth.get("mentor_synthesis")
        else:
            is_midpoint = False
            midpoint_summary = None

        next_info = await self.get_current_or_next_question(
            student_id=student_id,
            contextualize_with_llm=False,
            last_qid=question_id,
            last_selected_ids=selected_option_ids,
            last_notes=notes,
        )

        return {
            "success": True,
            "question_id": question_id,
            "answered_count": answered_cnt,
            "live_scores": live_scores,
            "is_midpoint": is_midpoint,
            "midpoint_summary": midpoint_summary,
            "is_complete": stopped or next_info.get("is_complete", False),
            "completion_reason": reason or next_info.get("completion_reason"),
            "next_question": next_info.get("question"),
        }

    async def get_heard_summary_checkpoint(
        self,
        student_id: str,
        synthesize_with_llm: bool = True,
    ) -> dict[str, Any]:
        """Generate the 'Here's What I Heard' summary checkpoint directly from
        the student's actual answered reflection signals.
        """
        state = self.get_or_create_session(student_id)
        raw_summary = generate_heard_summary(state)
        opening, closing = CHECKPOINT_MESSAGES[get_language()]

        if not raw_summary.get("heard_summary") or len(raw_summary["heard_summary"]) == 0:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=400,
                detail="Cannot generate Heard Summary: student has not answered reflection questions yet."
            )

        if synthesize_with_llm:
            draft = await generate_structured(
                HEARD_SUMMARY_SYNTHESIS_SYSTEM,
                f"Observations from answered questions:\n{json.dumps(raw_summary, ensure_ascii=False, indent=2)}\n\nGenerate the synthesized checkpoint.",
                HeardSummarySynthesisDraft,
            )
            if draft is not None and draft.summary_bullets and len(draft.summary_bullets) > 0:
                return {
                    "opening": draft.opening or opening,
                    "summary_bullets": draft.summary_bullets,
                    "closing_prompt": draft.closing_prompt or closing,
                    "response_options": raw_summary["response_options"],
                }

        # Deterministic summary directly derived from the student's answered options
        return {
            "opening": opening,
            "summary_bullets": raw_summary["heard_summary"],
            "closing_prompt": closing,
            "response_options": raw_summary["response_options"],
        }

    async def confirm_heard_summary(
        self,
        student_id: str,
        student_response: str,
        corrections: list[dict] | None = None,
    ) -> dict[str, Any]:
        """Apply student confirmation / corrections to the heard summary."""
        state = self.get_or_create_session(student_id)
        state = apply_student_correction(state, student_response, corrections)
        self.repository.save_session(student_id, state["session_id"], state, "completed")
        return {"success": True, "student_response": student_response}

    def generate_final_profile(self, student_id: str) -> dict[str, Any]:
        """Build the full calibrated Student Profile and sync into SQLite."""
        state = self.get_or_create_session(student_id)
        stopped, reason = should_stop(state)
        completion_reason = reason or "completed"

        profile_data = build_student_profile(state, completion_reason)
        live_scores = project_signals_to_competencies(state, self.profile_service.get_profile(student_id))
        profile_data["projected_competency_scores"] = live_scores

        return profile_data

    async def get_reflection_portrait(self, student_id: str) -> ReflectionPortrait:
        """Generate the explainable Reflection Portrait categorized into the 5 Master Prompt buckets."""
        state = self.get_or_create_session(student_id)
        reflections = classify_reflection(state)
        feedback_store = state.get("portrait_feedback", {})

        signal_to_competency = {
            "PS1": "systemsThinking",
            "PS2": "technicalFundamentals",
            "LEARN1": "learningAgility",
            "LEARN2": "learningAgility",
            "EXEC1": "prototyping",
            "EXEC2": "systemsThinking",
            "COM1": "communication",
            "COM2": "communication",
            "MGMT1": "systemsThinking",
            "MGMT2": "learningAgility",
        }

        portrait = ReflectionPortrait()

        for sig, ref in reflections.items():
            label = signal_name(sig)
            competency = signal_to_competency.get(sig, "technicalFundamentals")
            sources = ref.get("supporting_sources", [])
            sources_str = (
                qtext("sources_answers", sources=", ".join(sources))
                if sources else qtext("sources_reflections")
            )
            cls = ref["classification"]
            kind = {
                "supported_strength": "portrait_supported",
                "possible_hidden_strength": "portrait_hidden",
                "worth_validating": "portrait_validate",
                "still_taking_shape": "portrait_unknown",
                "developing_picture": "portrait_developing",
            }.get(cls, "portrait_developing")
            explanation = qtext(kind, label=label, sources=sources_str)

            # Retrieve saved user feedback if any
            fb = feedback_store.get(sig, {})
            raw_user_fb = fb.get("feedback_type", "none")
            fb_map = {
                "agree": "agreed",
                "agreed": "agreed",
                "disagree": "disagreed",
                "disagreed": "disagreed",
                "add_context": "context-added",
                "context-added": "context-added",
                "none": "none",
            }
            user_fb = fb_map.get(raw_user_fb, "none")
            user_note = fb.get("context_note")

            item = ReflectionItem(
                signal=sig,
                label=label,
                competency=competency,
                classification=cls,
                student_self_view=ref.get("student_self_view"),
                experience_strength=ref.get("experience_strength"),
                state_confidence=ref.get("state_confidence", 0.0),
                reason_code=ref.get("reason_code", ""),
                explanation=explanation,
                supporting_sources=sources,
                contradicting_sources=ref.get("contradicting_sources", []),
                user_feedback=user_fb,
                user_context_note=user_note,
            )

            if cls == "supported_strength":
                portrait.supported_strengths.append(item)
            elif cls == "possible_hidden_strength":
                portrait.possible_hidden_strengths.append(item)
            elif cls == "worth_validating":
                portrait.areas_to_validate.append(item)
            elif cls == "still_taking_shape":
                portrait.still_taking_shape.append(item)
            else:
                portrait.developing_picture.append(item)

        # Multi-cycle historical comparison & delta computation
        portrait.cycle_number = state.get("cycle_number", 1)
        history = state.get("cycle_history", [])
        if history:
            prev_snapshot = history[-1]
            prev_scores = prev_snapshot.get("scores", {})
            curr_scores = project_signals_to_competencies(state)
            deltas = {k: curr_scores.get(k, 0) - prev_scores.get(k, 0) for k in curr_scores}
            portrait.previous_scores = prev_scores
            portrait.score_deltas = deltas
            portrait.evolution_summary = await self._generate_evolution_summary_llm(
                state, prev_scores, curr_scores, deltas
            )

        refinement_note = ""
        if state.get("checkpoint_refinements"):
            latest_refinement = state["checkpoint_refinements"][-1]["correction_text"]
            refinement_note = qtext("portrait_refinement", note=latest_refinement)

        cycle_prefix = qtext("portrait_cycle", cycle=portrait.cycle_number) if portrait.cycle_number > 1 else ""
        portrait.summary_narration = cycle_prefix + qtext("portrait_summary") + refinement_note

        return portrait

    def save_portrait_feedback(
        self,
        student_id: str,
        signal_or_area: str,
        feedback_type: str,
        context_note: str | None = None,
    ) -> None:
        """Persist student agreement/disagreement or context note on a portrait item (Master Prompt §5 Rule 6)."""
        state = self.get_or_create_session(student_id)
        if "portrait_feedback" not in state:
            state["portrait_feedback"] = {}

        # Normalize signal code if label was passed
        sig_code = signal_or_area
        from app.i18n import SIGNAL_NAMES
        for code, translations in SIGNAL_NAMES.items():
            if signal_or_area.lower() in (code.lower(), *(label.lower() for label in translations)):
                sig_code = code
                break
        for k, v in {
            "Problem Framing": "PS1",
            "Troubleshooting": "PS2",
            "Learning Initiative": "LEARN1",
            "Strategy Adaptation": "LEARN2",
            "Independence": "EXEC1",
            "Initiative & Ownership": "EXEC2",
            "Idea Communication": "COM1",
            "Team Contribution": "COM2",
            "Prioritisation": "MGMT1",
            "Response to Setbacks": "MGMT2",
        }.items():
            if signal_or_area.lower() in (k.lower(), v.lower()):
                sig_code = v
                break

        fb_map = {
            "agree": "agreed",
            "agreed": "agreed",
            "disagree": "disagreed",
            "disagreed": "disagreed",
            "add_context": "context-added",
            "context-added": "context-added",
            "none": "none",
        }
        normalized_fb = fb_map.get(feedback_type, feedback_type)

        state["portrait_feedback"][sig_code] = {
            "feedback_type": normalized_fb,
            "context_note": context_note,
            "updated_at": _utcnow(),
        }
        self.repository.save_session(student_id, state["session_id"], state, "completed")

    # -- Internal LLM helper -------------------------------------------------

    async def _contextualize_question(
        self,
        profile: StudentProfile,
        question: dict[str, Any],
    ) -> ContextualizedQuestionDraft | None:
        user_prompt = (
            f"Student context:\n"
            f"Major: {profile.major or 'General Engineering'}\n"
            f"Year: {profile.year or 1}\n"
            f"Skills/Tools: {', '.join(profile.skills) if profile.skills else 'N/A'}\n"
            f"Interests: {', '.join(profile.interests) if profile.interests else 'N/A'}\n\n"
            f"Question:\n{question['text']}\n\n"
            f"Options:\n{json.dumps(question['options'], ensure_ascii=False, indent=2)}\n\n"
            "Contextualize the question for this engineering student."
        )
        return await generate_structured(
            CONTEXTUALIZE_QUESTION_SYSTEM,
            user_prompt,
            ContextualizedQuestionDraft,
        )

    async def _calibrate_cycle_probes_llm(
        self,
        student_id: str,
        new_cycle: int,
        project_update: str | None,
        focus_area: str | None,
        prev_scores: dict[str, int],
        dream_job: str
    ) -> dict[str, Any]:
        profile = self.profile_service.get_profile(student_id)
        major = getattr(profile, "major", "Engineering")
        student_name = getattr(profile, "name", "Student")

        prompt_content = (
            f"Student Name: {student_name}\n"
            f"Major: {major}\n"
            f"Target Career: {dream_job}\n"
            f"Transitioning to Reflection Cycle: {new_cycle}\n"
            f"Student's Recent Project Experience / Milestone: {project_update or 'Hands-on project work and skill application'}\n"
            f"Selected Growth Dimension: {focus_area or 'Systems Architecture & Execution'}\n"
            f"Previous Baseline Competency Scores: {prev_scores}\n"
        )

        try:
            draft = await generate_structured(
                CYCLE_CALIBRATION_SYSTEM,
                prompt_content,
                CycleQuestionnaireCalibrationDraft,
            )
            if draft and draft.synthesis_rationale:
                return {
                    "synthesis_rationale": draft.synthesis_rationale,
                    "target_dimension": draft.target_dimension or focus_area or "Systems Thinking & Architecture",
                    "selected_probes": draft.selected_probes or [
                        "Architectural Tradeoff Decisions",
                        "Fault Tolerance & Edge Handling",
                        "Cross-Functional Engineering Impact"
                    ],
                    "initial_question_bridge": draft.initial_question_bridge or qtext(
                        "cycle_calibration_bridge", cycle=new_cycle, update=project_update or "recent milestone"
                    ),
                    "target_competency_gain": draft.target_competency_gain or qtext("cycle_growth_gain", count=5)
                }
        except Exception as e:
            logger.warning("Failed to generate cycle calibration via LLM: %s", e)

        # Deterministic calibration unchanged; only user-visible text is localized.
        dimension = focus_area or "Systems Thinking & Architecture"
        update_excerpt = (project_update[:60] + "...") if project_update and len(project_update) > 60 else (project_update or "recent engineering milestone")
        return {
            "synthesis_rationale": qtext(
                "cycle_calibration_reason", update=update_excerpt, job=dream_job,
                dimension=dimension, cycle=new_cycle,
            ),
            "target_dimension": dimension,
            "selected_probes": [
                qtext("cycle_probe_execution", dimension=dimension),
                qtext("cycle_probe_constraints"),
                qtext("cycle_probe_integration", job=dream_job),
            ],
            "initial_question_bridge": qtext(
                "cycle_calibration_bridge", cycle=new_cycle, update=update_excerpt,
            ),
            "target_competency_gain": qtext("cycle_growth_gain", count=6),
        }

    async def start_new_cycle(
        self,
        student_id: str,
        project_update: str | None = None,
        focus_area: str | None = None,
    ) -> dict[str, Any]:
        """Archive current cycle state into cycle_history, increment cycle_number, and initialize fresh non-repeating question sequence with LLM-calibrated probes."""
        state = self.get_or_create_session(student_id)
        current_cycle = state.get("cycle_number", 1)

        # 1. Take snapshot of current cycle
        scores = project_signals_to_competencies(state)
        questions_answered = list(state.get("questionnaire_state", {}).get("questions_answered", []))

        if "cycle_history" not in state:
            state["cycle_history"] = []

        state["cycle_history"].append({
            "cycle_number": current_cycle,
            "scores": scores,
            "questions_answered": questions_answered,
            "timestamp": _utcnow(),
            "project_update": state.get("latest_project_update"),
        })

        # 2. Accumulate all answered questions across cycles to prevent repeats
        if "all_answered_question_ids" not in state:
            state["all_answered_question_ids"] = []
        state["all_answered_question_ids"].extend(questions_answered)
        # Deduplicate
        state["all_answered_question_ids"] = list(dict.fromkeys(state["all_answered_question_ids"]))

        # 3. Increment cycle
        new_cycle = current_cycle + 1
        state["cycle_number"] = new_cycle

        # 4. Ingest new project experience if provided
        if project_update:
            state["latest_project_update"] = project_update
            try:
                from app.models.student import Experience
                profile = self.profile_service.get_profile(student_id)
                if profile:
                    profile.experiences.append(
                        Experience(
                            type="project",
                            title=f"Cycle {new_cycle} Progress Milestone",
                            description=project_update,
                        )
                    )
                    self.profile_service.repository.update_profile(profile)
            except Exception as e:
                logger.warning("Could not append project update to student profile: %s", e)

        if focus_area:
            state["latest_focus_area"] = focus_area

        # 5. Reset cycle-specific questionnaire state
        state["questionnaire_state"]["questions_asked"] = []
        state["questionnaire_state"]["questions_answered"] = []
        state["questionnaire_state"]["questions_skipped"] = []
        state["questionnaire_state"]["current_question_count"] = 0
        state["questionnaire_state"]["current_phase"] = "core"
        state["questionnaire_state"]["core_completed"] = False
        state["questionnaire_state"]["heard_summary_delivered"] = False
        state["questionnaire_state"]["student_confirmed_summary"] = None
        state["status"] = "in_progress"

        # 6. Generate structured LLM calibration for Cycle N probes
        calibration = await self._calibrate_cycle_probes_llm(
            student_id=student_id,
            new_cycle=new_cycle,
            project_update=project_update,
            focus_area=focus_area,
            prev_scores=scores,
            dream_job=state.get("target_career_title", "Engineering Specialist")
        )
        state["latest_cycle_calibration"] = calibration
        state["latest_cycle_calibration_language"] = get_language()

        self.repository.save_session(student_id, state["session_id"], state, "in_progress")

        return {
            "student_id": student_id,
            "cycle_number": new_cycle,
            "previous_scores": scores,
            "status": "ready_for_questions",
            "calibration": calibration,
        }

    async def _generate_evolution_summary_llm(
        self,
        state: dict,
        prev_scores: dict[str, int],
        curr_scores: dict[str, int],
        deltas: dict[str, int],
    ) -> str:
        student_id = state.get("student_id", "")
        profile = self.profile_service.get_profile(student_id)
        latest_update = state.get("latest_project_update", "Ongoing hands-on engineering projects")

        prompt_content = (
            f"Major: {getattr(profile, 'major', 'Engineering')}\n"
            f"Latest Project Experience / Growth Notes: {latest_update}\n"
            f"Cycle {state.get('cycle_number', 2) - 1} Baseline Scores: {prev_scores}\n"
            f"Cycle {state.get('cycle_number', 2)} Current Scores: {curr_scores}\n"
            f"Competency Deltas: {deltas}\n"
        )
        try:
            draft = await generate_structured(
                EVOLUTION_SUMMARY_SYSTEM,
                prompt_content,
                EvolutionSummaryDraft,
            )
            if draft and draft.evolution_summary:
                return draft.evolution_summary
        except Exception as e:
            logger.warning("Failed to generate evolution summary via LLM: %s", e)

        # High quality deterministic fallback
        top_gainers = [k for k, v in sorted(deltas.items(), key=lambda x: x[1], reverse=True) if v > 0]
        if top_gainers:
            top_str = ", ".join(top_gainers[:2])
            return qtext("evolution_growth", strengths=top_str)
        return qtext("evolution_stable")
