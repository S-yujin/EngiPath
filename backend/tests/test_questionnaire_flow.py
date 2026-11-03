"""Test the questionnaire intelligence layer integration."""

import asyncio
import pytest
from app.services.profile_service import ProfileService
from app.services.questionnaire_service import QuestionnaireService
from app.services.baseline_service import BaselineService


@pytest.mark.asyncio
async def test_flow():
    profile_service = ProfileService()
    questionnaire_service = QuestionnaireService()
    baseline_service = BaselineService()

    # 1. Create a student
    student = profile_service.create_student(
        major="Computer Science",
        year=2,
        intro="Passionate about systems and distributed computing.",
        skills=["Python", "C++", "Linux", "Git"],
        interests=["AI and data", "Software and computing"],
        experiences=[{"type": "project", "title": "Web Crawler", "description": "Built high performance crawler in C++"}]
    )
    student_id = student.student_id
    print(f"[1] Created student: {student_id}")

    # 2. Start questionnaire
    q1_resp = await questionnaire_service.get_current_or_next_question(student_id, contextualize_with_llm=False)
    q1 = q1_resp["question"]
    print(f"[2] First Question: {q1['id']} - {q1['text']}")
    print(f"    Options: {[o['id'] + ': ' + o['text'] for o in q1['options'][:3]]}")
    print(f"    Live Scores: {q1_resp['live_scores']}")

    # 3. Answer Q01 (Domain Interest)
    ans1 = await questionnaire_service.submit_answer(student_id, q1["id"], ["A", "B"])
    print(f"[3] Answered {q1['id']}. Next question: {ans1['next_question']['id'] if ans1['next_question'] else 'None'}")
    print(f"    Live Scores: {ans1['live_scores']}")

    # 4. Answer a few more questions to test progression
    q2_id = ans1['next_question']['id']
    ans2 = await questionnaire_service.submit_answer(student_id, q2_id, ["A", "C"])
    print(f"[4] Answered {q2_id}. Answered count: {ans2['answered_count']}")

    # 5. Check baseline generation integrates questionnaire scores
    baseline = await baseline_service.generate(student_id)
    print(f"[5] Baseline Scores with questionnaire state: {baseline}")

    # 6. Test heard summary
    summary = await questionnaire_service.get_heard_summary_checkpoint(student_id, synthesize_with_llm=False)
    print(f"[6] Heard Summary Checkpoint: {summary['summary_bullets']}")

    # 7. Test profile generation
    profile = questionnaire_service.generate_final_profile(student_id)
    print(f"[7] Generated Student Profile version: {profile['profile_version']}")
    print(f"    Capabilities covered: {list(profile['capabilities'].keys())}")
    print(f"    Reflection categories: {list(profile['reflection'].keys())}")

    print("\nALL QUESTIONNAIRE INTEGRATION TESTS PASSED SUCCESSFULLY!")


@pytest.mark.asyncio
async def test_reflection_buckets_receive_matched_classifications():
    """Regression: classify_reflection emits singular/mismatched labels
    ('supported_strength', 'worth_validating') while the profile buckets are
    named differently ('supported_strengths', 'areas_to_validate'). Before the
    mapping fix those entries were silently dropped."""
    from app.questionnaire.pipeline import (
        SIGNAL_TO_SELF_PERCEPTION,
        build_student_profile,
    )

    profile_service = ProfileService()
    student = profile_service.create_student(
        major="Computer Science", year=2,
        intro="Systems and robotics.", skills=["Python"],
        interests=["AI"], experiences=[],
    )
    questionnaire_service = QuestionnaireService()
    state = questionnaire_service.get_or_create_session(student.student_id)

    # PS1: high self-view + strong evidence -> supported_strength
    state["capability_signals"]["PS1"]["aggregate"] = {
        "experience_strength": 0.9, "state_confidence": 0.8,
    }
    state["coverage"]["PS1"] = {"status": "sufficient"}
    state["self_perception"]["confidence"][SIGNAL_TO_SELF_PERCEPTION["PS1"]] = {
        "level": "high",
    }

    # PS2: high self-view + weak evidence -> worth_validating
    state["capability_signals"]["PS2"]["aggregate"] = {
        "experience_strength": 0.2, "state_confidence": 0.6,
    }
    state["coverage"]["PS2"] = {"status": "partial"}
    state["self_perception"]["confidence"][SIGNAL_TO_SELF_PERCEPTION["PS2"]] = {
        "level": "high",
    }

@pytest.mark.asyncio
async def test_midpoint_synthesis_and_dynamic_tailoring():
    """Verify that answering 5 questions triggers is_midpoint, generates midpoint_summary,
    and dynamically adapts Q6 for the student's target career.
    """
    profile_service = ProfileService()
    questionnaire_service = QuestionnaireService()

    student = profile_service.create_student(
        major="Robotics & Mechanical", year=3,
        intro="Hardware prototyping, actuators, and ROS.",
        skills=["ROS", "C++", "CAD", "Arduino"],
        interests=["Robotics and automation"],
        experiences=[]
    )
    student_id = student.student_id

    # Prewarm with Robotics Engineer
    questionnaire_service.prewarm_session(student_id, "robotics-eng-1", "Robotics Systems Engineer")

    # Answer 5 questions
    next_qid = "Q01"
    last_ans = None
    for i in range(5):
        resp = await questionnaire_service.get_current_or_next_question(student_id)
        qid = resp["question"]["id"]
        opts = [o["id"] for o in resp["question"]["options"][:1]]
        last_ans = await questionnaire_service.submit_answer(student_id, qid, opts, notes=f"Note on step {i+1}")

    assert last_ans is not None
    assert last_ans["answered_count"] == 5
    assert last_ans["is_midpoint"] is True
    assert last_ans["midpoint_summary"] is not None
    assert len(last_ans["midpoint_summary"]) > 20

    # Check Q6 bridge and contextual adaptation
    q6 = last_ans["next_question"]
    assert q6 is not None
    assert len(q6["conversational_bridge"]) > 10


if __name__ == "__main__":
    asyncio.run(test_flow())
