"""Living Dashboard MVP API (handoff §26).

    GET  /students/{id}/dashboard    current profile + portrait + target + alignment + plan
    POST /students/{id}/evidence     submit simple evidence (title/link/note)
    GET  /students/{id}/evidence     list submitted evidence
    POST /students/{id}/milestones   mark a milestone complete
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db.database import get_connection
from app.models.action_plan import ActionPlan
from app.models.reflection import ReflectionPortrait
from app.services.career_service import CareerService
from app.services.gap_service import GapService
from app.services.planning_service import PlanningService
from app.services.profile_service import ProfileService
from app.services.reflection_service import ReflectionService

router = APIRouter(prefix="/students/{student_id}", tags=["dashboard"])

profile_service = ProfileService()
reflection_service = ReflectionService()
career_service = CareerService()
gap_service = GapService()
planning_service = PlanningService()


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_student(student_id: str) -> None:
    if profile_service.get_profile(student_id) is None:
        raise HTTPException(status_code=404, detail="Student not found")


class EvidenceSubmission(BaseModel):
    title: str = Field(min_length=1)
    link: str | None = None
    note: str | None = None


class MilestoneComplete(BaseModel):
    milestone_id: int


@router.get("/dashboard")
async def dashboard(student_id: str):
    """Lightweight dashboard snapshot: everything the UI needs in one call."""
    _ensure_student(student_id)

    profile = profile_service.get_profile(student_id)
    portrait: ReflectionPortrait | None = None
    try:
        portrait = await reflection_service.generate_portrait(student_id)
    except Exception:  # noqa: BLE001 - dashboard must not 500 on LLM failure
        portrait = None

    target = None
    alignment = None
    gap = None
    plan: ActionPlan | None = None

    if profile and profile.target_role_id:
        occupation = career_service.get_occupation(profile.target_role_id)
        if occupation:
            target = {"onetsoc_code": occupation.onetsoc_code, "title": occupation.title}
            from app.services.career_service import compute_alignment_score

            alignment = compute_alignment_score(profile, occupation)["alignment"]
        gap_result = gap_service.compare(student_id, profile.target_role_id)
        if gap_result:
            gap = gap_result[0]

    plan = planning_service.load(student_id)

    conn = get_connection()
    try:
        evidence_rows = conn.execute(
            "SELECT id, title, link, note, created_at FROM evidence "
            "WHERE student_id = ? ORDER BY created_at DESC",
            (student_id,),
        ).fetchall()
        milestone_rows = conn.execute(
            "SELECT id, title, status, created_at, completed_at FROM milestones "
            "WHERE student_id = ? ORDER BY id DESC",
            (student_id,),
        ).fetchall()
    finally:
        conn.close()

    return {
        "profile": profile.model_dump() if profile else None,
        "reflection_portrait": portrait.model_dump() if portrait else None,
        "target_role": target,
        "alignment": alignment,
        "gap_analysis": gap.model_dump() if gap else None,
        "action_plan": plan.model_dump() if plan else None,
        "evidence": [dict(row) for row in evidence_rows],
        "milestones": [dict(row) for row in milestone_rows],
    }


@router.post("/evidence", status_code=201)
async def submit_evidence(student_id: str, payload: EvidenceSubmission):
    _ensure_student(student_id)
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO evidence (student_id, title, link, note, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (student_id, payload.title, payload.link, payload.note, _utcnow()),
        )
        conn.commit()
        return {"id": cursor.lastrowid, "status": "submitted"}
    finally:
        conn.close()


@router.get("/evidence")
async def list_evidence(student_id: str):
    _ensure_student(student_id)
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, title, link, note, created_at FROM evidence "
            "WHERE student_id = ? ORDER BY created_at DESC",
            (student_id,),
        ).fetchall()
        return {"evidence": [dict(row) for row in rows]}
    finally:
        conn.close()


@router.post("/milestones/complete")
async def complete_milestone(student_id: str, payload: MilestoneComplete):
    _ensure_student(student_id)
    conn = get_connection()
    try:
        cursor = conn.execute(
            "UPDATE milestones SET status = 'completed', completed_at = ? "
            "WHERE id = ? AND student_id = ?",
            (_utcnow(), payload.milestone_id, student_id),
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Milestone not found")
        return {"status": "completed"}
    finally:
        conn.close()
