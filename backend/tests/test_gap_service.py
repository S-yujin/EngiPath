"""Gap + planning service tests (handoff §34)."""

from fastapi.testclient import TestClient

from app.main import app


def _student_with_target(client: TestClient, target_code: str = "15-1252.00") -> str:
    response = client.post(
        "/students",
        json={"major": "Computer Engineering", "year": 2, "intro": "I like software."},
    )
    student_id = response.json()["student_id"]
    client.post(
        f"/students/{student_id}/reflection",
        json={
            "question": "Tell me about a project.",
            "answer": "I built a web app using Python, Git, and SQL for a course.",
        },
    )
    profile = client.get(f"/students/{student_id}").json()
    if not profile["target_role_id"]:
        # Directly set the target role via the profile repository.
        from app.repositories.student_repository import StudentRepository

        repo = StudentRepository()
        stored = repo.get(student_id)
        stored.target_role_id = target_code
        repo.update_profile(stored)
    return student_id


def test_gap_analysis_returns_buckets():
    # Only meaningful if the O*NET data has been processed; otherwise the
    # occupation lookup returns None and the endpoint 404s. Skip gracefully.
    from app.repositories.occupation_repository import occupation_repository

    if occupation_repository.get("15-1252.00") is None:
        return

    with TestClient(app) as client:
        student_id = _student_with_target(client)
        response = client.post(
            f"/students/{student_id}/gap-analysis",
            json={"onetsoc_code": "15-1252.00"},
        )
    assert response.status_code == 200
    body = response.json()
    for key in ("confirmed", "partial", "development_areas", "unknown"):
        assert key in body


def test_action_plan_caps_at_three():
    from app.services.planning_service import PlanningService

    plan_service = PlanningService()
    # Build a minimal plan via the deterministic path.
    from app.models.gap import GapAnalysis, GapItem

    gap = GapAnalysis(
        target_role="Software Developers",
        target_role_id="15-1252.00",
        development_areas=[
            GapItem(area=f"Area {i}", status="development_area", student_evidence=[])
            for i in range(10)
        ],
    )
    plan = plan_service._fallback_plan(gap)
    assert len(plan.short_term_actions) <= 3
    assert plan.has_valid_action_count()
