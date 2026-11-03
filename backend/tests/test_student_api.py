"""Student API + reflection flow tests (handoff §34)."""

from fastapi.testclient import TestClient

from app.main import app


def _create_student(client: TestClient) -> str:
    response = client.post(
        "/students",
        json={
            "major": "Computer Engineering",
            "year": 2,
            "intro": "I enjoy AI and robotics but I am unsure which direction to pursue.",
        },
    )
    assert response.status_code == 201
    return response.json()["student_id"]


def test_create_and_retrieve_student():
    with TestClient(app) as client:
        student_id = _create_student(client)
        response = client.get(f"/students/{student_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["student_id"] == student_id
    assert body["major"] == "Computer Engineering"


def test_submit_reflection_updates_profile():
    with TestClient(app) as client:
        student_id = _create_student(client)
        response = client.post(
            f"/students/{student_id}/reflection",
            json={
                "question": "Tell me about a project you worked on.",
                "answer": "I built an autonomous robot using C++ and OpenCV.",
            },
        )
    assert response.status_code == 200
    body = response.json()
    assert "profile_updates" in body
    assert "next_question" in body


def test_get_unknown_student_404():
    with TestClient(app) as client:
        response = client.get("/students/does-not-exist")
    assert response.status_code == 404


def test_generate_portrait_has_categories():
    with TestClient(app) as client:
        student_id = _create_student(client)
        client.post(
            f"/students/{student_id}/reflection",
            json={
                "question": "Tell me about a project you worked on.",
                "answer": "I built an autonomous robot using C++ and OpenCV for a class.",
            },
        )
        response = client.post(f"/students/{student_id}/portrait")
    assert response.status_code == 200
    body = response.json()
    for key in (
        "supported_strengths",
        "possible_overlooked_strengths",
        "areas_to_validate",
        "development_areas",
        "insufficient_information",
    ):
        assert key in body
