"""Planning API (handoff §21, §25).

    POST /students/{id}/action-plan      generate (≤3 short-term actions + vision) and save
    GET  /students/{id}/action-plan      retrieve the saved plan
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.action_plan import ActionPlan
from app.services.career_service import CareerService
from app.services.gap_service import GapService
from app.services.planning_service import PlanningService
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/students/{student_id}", tags=["plans"])

planning_service = PlanningService()
gap_service = GapService()
profile_service = ProfileService()
career_service = CareerService()


class TargetRoleRequest(BaseModel):
    onetsoc_code: str = Field(min_length=1, description="Target occupation code")


@router.put("/target-role")
async def set_target_role(student_id: str, payload: TargetRoleRequest):
    """Select the target occupation (prerequisite for action-plan generation)."""
    profile_service.get_or_404(student_id)
    if career_service.get_occupation(payload.onetsoc_code) is None:
        raise HTTPException(status_code=404, detail="Target occupation not found")
    profile = profile_service.set_target_role(student_id, payload.onetsoc_code)
    return {"target_role_id": profile.target_role_id}


@router.post("/action-plan", response_model=ActionPlan)
async def generate_action_plan(student_id: str):
    profile = profile_service.get_profile(student_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Student not found")

    if profile.target_role_id is None:
        raise HTTPException(
            status_code=400,
            detail="No target role selected. Set a target role before generating a plan.",
        )

    result = gap_service.compare(student_id, profile.target_role_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Target occupation not found",
        )
    analysis, _, _ = result

    plan = await planning_service.generate(student_id, analysis)
    if not plan.has_valid_action_count():
        # Hard cap enforced (should already be guaranteed by the service).
        plan.short_term_actions = plan.short_term_actions[:3]
    planning_service.save(student_id, plan)
    return plan


@router.get("/action-plan", response_model=ActionPlan)
async def get_action_plan(student_id: str):
    plan = planning_service.load(student_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="No plan found for this student")
    return plan
