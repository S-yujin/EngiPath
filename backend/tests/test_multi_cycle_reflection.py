import pytest
from app.services.profile_service import ProfileService
from app.services.questionnaire_service import QuestionnaireService
from app.services.planning_service import PlanningService
from app.services.gap_service import GapService

@pytest.mark.asyncio
async def test_multi_cycle_longitudinal_reflection():
    profile_service = ProfileService()
    questionnaire_service = QuestionnaireService()
    planning_service = PlanningService()
    gap_service = GapService()

    # 1. Create Student
    student = profile_service.create_student(
        major="Electrical & Computer Engineering",
        year=2,
        intro="Interested in embedded systems and robotics.",
        skills=["C", "C++", "Python", "Circuits"],
        interests=["Robotics and automation"],
        experiences=[]
    )
    student_id = student.student_id

    # 2. Select Target Career
    profile_service.set_target_role(student_id, "17-2199.08")

    # 3. Complete Cycle 1 Questionnaire (10 questions)
    q_resp = await questionnaire_service.get_current_or_next_question(student_id, contextualize_with_llm=False)
    cycle1_qids = []
    
    while q_resp and not q_resp.get("questionnaire_complete") and q_resp.get("question"):
        qid = q_resp["question"]["id"]
        cycle1_qids.append(qid)
        ans = await questionnaire_service.submit_answer(
            student_id=student_id,
            question_id=qid,
            selected_option_ids=["A"],
            notes="Cycle 1 foundational response",
        )
        if ans.get("questionnaire_complete"):
            break
        q_resp = {"question": ans.get("next_question"), "questionnaire_complete": ans.get("questionnaire_complete")}

    assert len(cycle1_qids) >= 8

    # 4. Generate Cycle 1 Portrait
    p1 = await questionnaire_service.get_reflection_portrait(student_id)
    assert p1.cycle_number == 1
    assert p1.previous_scores is None

    # 5. Start Cycle 2 with project update
    nc = await questionnaire_service.start_new_cycle(
        student_id=student_id,
        project_update="Completed custom STM32 CAN-bus motor driver and ROS2 integration.",
        focus_area="Prototyping & Execution"
    )
    assert nc["cycle_number"] == 2
    assert "previous_scores" in nc

    # 6. Complete Cycle 2 Questionnaire (10 questions)
    # Verify that NO questions in Cycle 2 repeat Cycle 1 questions!
    q_c2_resp = await questionnaire_service.get_current_or_next_question(student_id, contextualize_with_llm=False)
    cycle2_qids = []
    
    while q_c2_resp and not q_c2_resp.get("questionnaire_complete") and q_c2_resp.get("question"):
        qid = q_c2_resp["question"]["id"]
        assert qid not in cycle1_qids, f"Question {qid} was repeated in Cycle 2!"
        cycle2_qids.append(qid)
        ans = await questionnaire_service.submit_answer(
            student_id=student_id,
            question_id=qid,
            selected_option_ids=["A", "B"],
            notes="Cycle 2 hands-on firmware experience",
        )
        if ans.get("questionnaire_complete"):
            break
        q_c2_resp = {"question": ans.get("next_question"), "questionnaire_complete": ans.get("questionnaire_complete")}

    assert len(cycle2_qids) >= 8

    # 7. Generate Cycle 2 Portrait & Verify Deltas
    p2 = await questionnaire_service.get_reflection_portrait(student_id)
    assert p2.cycle_number == 2
    assert p2.previous_scores is not None
    assert p2.score_deltas is not None
    assert p2.evolution_summary is not None
    assert len(p2.evolution_summary) > 0

    # 8. Generate Action Plan & Verify Accomplished Milestone Tracking
    gap_res = gap_service.compare(student_id, "17-2199.08")
    analysis, _, _ = gap_res
    plan = await planning_service.generate(student_id, analysis)
    assert plan.cycle_number == 2
    assert len(plan.short_term_actions) <= 3
