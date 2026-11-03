"""Reflection service unit tests (handoff §34).

Run with a temporary database so tests do not pollute the dev DB.
"""

import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(tmp_path: Path):
    # Point the app at a temp database by overriding the env var before import
    # of anything that reads settings. Settings are read at import time, so we
    # monkeypatch the connection path directly through an env var + reload.
    import app.config as config_module
    import app.db.database as database_module

    db_path = tmp_path / "test.db"
    original_path = config_module.settings.DATABASE_PATH
    config_module.settings.DATABASE_PATH = str(db_path)
    database_module.init_db()
    yield TestClient(app)
    config_module.settings.DATABASE_PATH = original_path


def test_reflection_flow_updates_profile(client: TestClient):
    response = client.post(
        "/students",
        json={"major": "Mechanical Engineering", "year": 3, "intro": "I like robotics."},
    )
    student_id = response.json()["student_id"]

    answer = "I built an autonomous robot in a class project using C++ and OpenCV."
    response = client.post(
        f"/students/{student_id}/reflection",
        json={"question": "Tell me about a project.", "answer": answer},
    )
    assert response.status_code == 200
    assert "next_question" in response.json()

    profile = client.get(f"/students/{student_id}").json()
    # Deterministic fallback should have extracted the project experience
    # (runs even without an LLM key).
    assert len(profile["experiences"]) >= 1


def test_questionnaire_progresses(client: TestClient):
    student_id = client.post("/students", json={}).json()["student_id"]
    previous_question = None
    for i in range(6):
        response = client.post(
            f"/students/{student_id}/reflection",
            json={
                "question": f"Question {i}",
                "answer": f"Answer {i} about my project using Python and Git.",
            },
        )
        assert response.status_code == 200
        next_question = response.json().get("next_question")
        assert next_question != previous_question
        previous_question = next_question
        if next_question is None:
            break
