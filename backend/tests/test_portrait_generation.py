import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_portrait_generation_and_feedback(client):
    # 1. Create a student
    create_res = client.post("/students", json={
        "major": "Computer Science",
        "year": 2,
        "intro": "Interested in robotics and backend systems",
        "skills": ["Python", "C++"],
        "interests": ["Robotics", "AI"]
    })
    assert create_res.status_code == 201
    student_id = create_res.json()["student_id"]

    # 2. Answer initial questions
    client.post(f"/students/{student_id}/questionnaire/start")
    client.post(f"/students/{student_id}/questionnaire/answer", json={
        "question_id": "Q01",
        "selected_option_ids": ["A", "C"],
        "notes": "Experience in ROS and distributed systems"
    })
    client.post(f"/students/{student_id}/questionnaire/answer", json={
        "question_id": "Q02",
        "selected_option_ids": ["B"]
    })

    # 3. Fetch portrait
    portrait_res = client.get(f"/students/{student_id}/portrait")
    assert portrait_res.status_code == 200
    portrait = portrait_res.json()

    assert "supported_strengths" in portrait
    assert "possible_hidden_strengths" in portrait
    assert "areas_to_validate" in portrait
    assert "developing_picture" in portrait
    assert "still_taking_shape" in portrait
    assert portrait.get("summary_narration") is not None

    # 4. Submit feedback on a portrait item (Master Prompt §5 Rule 6)
    fb_res = client.post(f"/students/{student_id}/portrait/feedback", json={
        "item": "Troubleshooting",
        "feedback_type": "add_context",
        "context": "Built hardware-in-the-loop testing harness for drone ESCs."
    })
    assert fb_res.status_code == 200
    updated_portrait = fb_res.json()

    # Find the troubleshooting item
    allItems = (
        updated_portrait["supported_strengths"] +
        updated_portrait["possible_hidden_strengths"] +
        updated_portrait["areas_to_validate"] +
        updated_portrait["developing_picture"] +
        updated_portrait["still_taking_shape"]
    )
    troubleshooting_item = [x for x in allItems if x["signal"] == "PS2" or "Troubleshooting" in x["label"]][0]
    assert troubleshooting_item["user_feedback"] == "context-added"
    assert troubleshooting_item["user_context_note"] == "Built hardware-in-the-loop testing harness for drone ESCs."
