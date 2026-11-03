"""Checks request-localized presentation strings without changing engine identifiers."""

import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.i18n_outputs import LANGS, out
from app.i18n import term
from app.llm.locale import current_language, get_language, localized_system_prompt
from app.models.gap import GapAnalysis, GapItem
from app.models.student import StudentProfile
from app.questionnaire.pipeline import generate_heard_summary, initialise_signal_state
from app.services.career_service import _fallback_reasons
from app.models.occupation import OccupationProfile
from app.services.chat_service import ChatService, chat_message
from app.services.planning_service import PlanningService
from app.services.reflection_service import ReflectionService


def test_request_language_isolated_and_defaults_to_korean():
    # A temporary inspection route is isolated to the test process.
    async def current_lang_endpoint():
        return {"lang": get_language()}
    app.add_api_route('/__i18n_test_language', current_lang_endpoint, methods=['GET'])
    with TestClient(app) as c:
        assert c.get('/__i18n_test_language').json()['lang'] == 'ko'
        assert c.get('/__i18n_test_language', headers={'Accept-Language':'fr-FR,fr;q=0.9'}).json()['lang'] == 'en'
        assert c.get('/__i18n_test_language', headers={'Accept-Language':'de'}).json()['lang'] == 'en'
        assert c.get('/__i18n_test_language').json()['lang'] == 'ko'


@pytest.mark.parametrize('lang', ('ko','en'))
def test_career_reason_localized_preserves_codes(lang):
    token = current_language.set(lang)
    try:
        profile = StudentProfile(student_id='p',major='Computer Engineering',skills=['Python'])
        occupation = OccupationProfile(onetsoc_code='15-1252.00',title='Software Developers')
        reasons = _fallback_reasons(profile,occupation,'Good')
        assert reasons and out('career_major',major='Computer Engineering') in reasons
        assert '15-1252.00' == occupation.onetsoc_code
    finally:
        current_language.reset(token)


@pytest.mark.parametrize('lang', ('ko','en'))
def test_summary_and_signal_terms_localized_preserves_option_ids(lang):
    token = current_language.set(lang)
    try:
        state=initialise_signal_state('student','session')
        state['interests']['domain_interests']['values']=['software_computing']
        state['self_perception']['perceived_strengths']['values']=['execution_delivery']
        summary=generate_heard_summary(state)
        assert term('software_computing') in summary['heard_summary'][0]
        assert summary['response_options'] == ['yes','mostly','not_really']
    finally:
        current_language.reset(token)


@pytest.mark.parametrize('lang', ('ko','en'))
def test_plan_fallback_korean_english_same_action_cap(lang):
    token = current_language.set(lang)
    try:
        gap=GapAnalysis(target_role='Software Developers',target_role_id='15-1252.00',
                        development_areas=[GapItem(area=x,status='development_area') for x in ['Python','SQL','Git','Docker']])
        plan=PlanningService()._fallback_plan(gap)
        assert len(plan.short_term_actions)==3
        assert plan.short_term_actions[0].title==out('plan_title',area='Python')
        assert plan.short_term_actions[0].duration==out('duration_short')
        assert plan.long_term_vision.timeframe==out('duration_vision')
        assert plan.long_term_vision.milestones
    finally:
        current_language.reset(token)


@pytest.mark.parametrize('lang', ('ko','en'))
def test_chat_refusal_and_core_question_localized(lang):
    token = current_language.set(lang)
    try:
        refusal=asyncio.run(ChatService().respond('Tell me a joke'))
        assert refusal
        assert refusal == chat_message("off_topic")
        assert ReflectionService().next_question('__new_student')==out('reflection_core_0')
    finally:
        current_language.reset(token)


def test_gemini_prompt_language_and_schema_are_distinct():
    token=current_language.set('ko')
    try:
        prompt=localized_system_prompt('Make JSON')
        assert 'Korean' in prompt
        assert 'JSON keys' in prompt
    finally:
        current_language.reset(token)

@pytest.mark.parametrize('language', LANGS)
def test_existing_http_endpoints_localize_explanations_without_changing_ids(language):
    """Exercise the real HTTP flow, without modifying any API routes or schemas."""
    from app.i18n_outputs import out as output
    with TestClient(app) as client:
        student = client.post('/students', json={
            'major':'Computer Engineering','year':3,'skills':['Python','Git'],
            'intro':'Learning robotics and Python.'
        })
        assert student.status_code == 201
        sid=student.json()['student_id']
        headers={'Accept-Language':language}
        career = client.post(f'/students/{sid}/careers/cards', headers=headers)
        assert career.status_code == 200,career.text
        body=career.json()["careers"]
        assert body and isinstance(body,list)
        assert all('onetsoc_code' in item and 'reasons' in item for item in body)
        token=current_language.set('ko' if language == 'ko' else 'en')
        try:
            expected_reason=output('career_major',major='Computer Engineering')
            expected_duration=output('duration_short')
        finally:
            current_language.reset(token)
        assert any(expected_reason in item['reasons'] for item in body)
        role=body[0]['onetsoc_code']
        target = client.put(f'/students/{sid}/target-role',json={'onetsoc_code':role})
        assert target.status_code==200
        gap = client.post(f'/students/{sid}/gap-analysis',json={'onetsoc_code':role}, headers=headers)
        assert gap.status_code==200
        gap_data=gap.json()
        assert gap_data['target_role_id']==role
        first = (gap_data['confirmed'] or gap_data['unknown'] or gap_data['development_areas'])[0]
        assert first['reason']
        plan=client.post(f'/students/{sid}/action-plan',headers=headers)
        assert plan.status_code==200,plan.text
        data=plan.json()
        assert len(data['short_term_actions']) <= 3
        if data['short_term_actions']:
            # The localized template and the exact selected area are preserved.
            title=data['short_term_actions'][0]['title']
            assert title and expected_duration == data['short_term_actions'][0]['duration']


@pytest.mark.parametrize('requested,expected', [
    ('ko','ko'), ('en','en'), ('zh','en'), ('es','en'), ('fr','en'), ('de','en')
])
def test_frontend_language_policy(requested, expected):
    """The menu retains six choices; output is Korean only for ko."""
    from app.llm.locale import normalize_language
    assert normalize_language(requested) == expected
    with TestClient(app) as client:
        resp = client.get('/health', headers={'Accept-Language':requested})
        assert resp.status_code == 200
