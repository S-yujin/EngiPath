"""Planning service (handoff §16, §25).

Responsible for converting a gap analysis into AT MOST 3 short-term
actions (4–8 weeks), producing a 1–2 year long-term vision, and saving
the current plan. The action-count cap is enforced in code, not only by
the prompt.
"""

import logging
from datetime import datetime, timezone

from app.config import settings
from app.db.database import save_json_blob
from app.i18n_outputs import out
from app.llm.client import generate_structured
from app.llm.prompts import ACTION_PLAN_SYSTEM
from app.llm.schemas import ActionPlanDraft
from app.models.action_plan import (
    ActionPlan,
    LongTermMilestone,
    LongTermVision,
    ShortTermAction,
)
from app.models.gap import GapAnalysis
from app.models.student import StudentProfile
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class PlanningService:
    def __init__(self, profile_service: ProfileService | None = None):
        self.profile_service = profile_service or ProfileService()

    async def generate(self, student_id: str, gap: GapAnalysis) -> ActionPlan:
        profile = self.profile_service.get_or_404(student_id)

        # Extract student's growth portrait feedback & custom comments
        from app.services.questionnaire_service import QuestionnaireService
        questionnaire_service = QuestionnaireService()
        state = questionnaire_service.get_or_create_session(student_id)
        portrait_feedback = state.get("portrait_feedback", {})

        feedback_entries = []
        for sig_code, fb in portrait_feedback.items():
            fb_type = fb.get("feedback_type", "none")
            context_note = fb.get("context_note")
            if fb_type != "none" or context_note:
                entry = f"- Dimension/Area: {sig_code} | Student Stance: {fb_type}"
                if context_note:
                    entry += f" | Student Note/Comment: \"{context_note}\""
                feedback_entries.append(entry)

        feedback_block = ""
        if feedback_entries:
            feedback_block = (
                "Student Growth Portrait Feedback, Notes & Specific Comments:\n"
                + "\n".join(feedback_entries)
                + "\n\n"
            )

        user_prompt = (
            f"Student profile:\n{profile.model_dump()}\n\n"
            f"{feedback_block}"
            f"Gap analysis:\n{gap.model_dump()}"
        )

        draft = await generate_structured(
            ACTION_PLAN_SYSTEM,
            user_prompt,
            ActionPlanDraft,
        )
        plan = self._draft_to_plan(draft) if draft is not None else self._fallback_plan(gap)
        # Enforce the hard cap.
        plan.short_term_actions = plan.short_term_actions[: settings.MAX_SHORT_TERM_ACTIONS]

        # Multi-cycle milestone evolution
        current_cycle = state.get("cycle_number", 1)
        plan.cycle_number = current_cycle

        existing_plan = self.load(student_id)
        accomplished = []
        if existing_plan:
            accomplished.extend(getattr(existing_plan, "accomplished_actions", []))
            if current_cycle > getattr(existing_plan, "cycle_number", 1):
                for old_act in existing_plan.short_term_actions:
                    accomplished.append({
                        "cycle_number": getattr(existing_plan, "cycle_number", 1),
                        "title": old_act.title,
                        "why": old_act.why,
                        "what_to_do": old_act.what_to_do,
                        "completed_at": _utcnow(),
                    })
        plan.accomplished_actions = accomplished
        return plan

    def save(self, student_id: str, plan: ActionPlan) -> ActionPlan:
        save_json_blob("plans", student_id, "plan_json", plan.model_dump())
        return plan

    def load(self, student_id: str) -> ActionPlan | None:
        from app.db.database import load_json_blob

        raw = load_json_blob("plans", student_id, "plan_json")
        if raw is None:
            return None
        return ActionPlan.model_validate(raw)

    # -- Conversion helpers --------------------------------------------------

    def _draft_to_plan(self, draft: ActionPlanDraft) -> ActionPlan:
        actions = []
        for raw in draft.short_term_actions[: settings.MAX_SHORT_TERM_ACTIONS]:
            try:
                actions.append(ShortTermAction.model_validate(raw))
            except Exception:  # noqa: BLE001
                logger.warning("Skipping malformed action from LLM: %s", raw)

        vision_raw = dict(draft.long_term_vision or {})
        milestones = []
        for raw in (vision_raw.get("milestones") or [])[:4]:
            try:
                milestones.append(LongTermMilestone.model_validate(raw))
            except Exception:  # noqa: BLE001
                logger.warning("Skipping malformed milestone from LLM: %s", raw)
        vision_raw.pop("milestones", None)
        try:
            vision = LongTermVision.model_validate(vision_raw)
        except Exception:  # noqa: BLE001
            vision = LongTermVision()
        vision.milestones = milestones
        return ActionPlan(short_term_actions=actions, long_term_vision=vision)

    def _fallback_plan(self, gap: GapAnalysis) -> ActionPlan:
        """Original deterministic selection and caps; only display text localized."""
        areas = [item.area for item in gap.development_areas][: settings.MAX_SHORT_TERM_ACTIONS]
        if not areas:
            areas = [item.area for item in gap.unknown][: settings.MAX_SHORT_TERM_ACTIONS]

        actions = []
        for i, area in enumerate(areas[: settings.MAX_SHORT_TERM_ACTIONS]):
            actions.append(
                ShortTermAction(
                    title=out("plan_title", area=area),
                    why=out("plan_why", area=area, role=gap.target_role),
                    what_to_do=out("plan_what", area=area),
                    duration=out("duration_short"),
                    suggested_evidence=out("plan_evidence"),
                    reflection_prompt=out("plan_reflection", area=area),
                    minimum_requirements=[
                        {"label": out("plan_deliver_label", area=area),
                         "detail": out("plan_deliver_detail", area=area)},
                        {"label": out("plan_collect_label"),
                         "detail": out("plan_collect_detail")},
                        {"label": out("plan_reflect_label"),
                         "detail": out("plan_reflect_detail")},
                    ],
                )
            )

        milestone_list = []
        for i, area in enumerate(areas[:3]):
            milestone_list.append(
                LongTermMilestone(
                    timeframe=out("duration_months", count=6 * (i + 1)),
                    title=out("plan_milestone_title", area=area),
                    description=out("plan_milestone_desc", area=area),
                    minimum_requirements=[
                        {"label": out("plan_milestone_label", area=area),
                         "detail": out("plan_milestone_detail", area=area)},
                        {"label": out("plan_publish_label"),
                         "detail": out("plan_publish_detail")},
                    ],
                )
            )

        vision = LongTermVision(
            timeframe=out("duration_vision"),
            description=out("plan_vision", areas=", ".join(areas) if areas else out("plan_target_area")),
            milestones=milestone_list,
        )
        return ActionPlan(short_term_actions=actions, long_term_vision=vision)
