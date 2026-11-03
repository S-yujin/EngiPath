# Engipath: 백엔드 한국어 생성 응답 수정 안내 (소스 수정 없음)

현재 프론트 수정본에서는 **정해진 진단 UI 문구** 및 **백엔드에서 고정 서식으로 제공하는 멘토 도입 문장**을 한국어로 표시합니다. 하지만 Gemini/LLM이 매 요청마다 새롭게 생성하는 내용은 프론트의 정적 번역표만으로 정확하게 처리할 수 없습니다.

## 수정할 백엔드 위치

1. `backend/app/services/questionnaire_service.py`의 `_build_conversational_bridge(...)`:
   - `Welcome! Based on your journey...`, `Makes sense...`, `Milestone Reached...` 등을 한국어로 반환하도록 하거나, 선택된 언어에 따라 분기하도록 구현.
   - 한국어 외 기존 언어도 지원해야 하므로 **한국어 문자열로 일괄 고정하지 말 것**.
   - 질문 ID/선택지 ID와 서버 저장값 변경 금지.
2. `backend/app/llm/prompts.py`:
   - 프로필 분석·맞춤 질문·중간 요약·초상화·행동 계획·AI 코치 등의 system prompt에 "요청된 응답 언어로 사용자에게 보이는 자연어 내용을 작성; JSON 필드/ID/enum은 그대로 유지" 지시를 추가.
3. `backend/app/llm/client.py` 및 API 계층:
   - 프론트의 `Accept-Language` 헤더(`ko`, `en`, `zh`, `es`, `fr`, `de`)를 요청별로 읽어 프롬프트에 전달하도록 처리. 서버 전역 변수에 언어 상태를 저장하면 사용자별 요청이 섞이므로 요청 컨텍스트를 이용.
4. `backend/app/services/questionnaire_service.py`의 `get_heard_summary_checkpoint(...)`:
   - fallback 영어 `opening` 및 `closing_prompt`의 로케일 분기, 중간 요약 / `summary_bullets`의 생성 언어 적용.
5. `backend/app/services/chat_service.py` 및 `backend/app/questionnaire/pipeline.py`:
   - 규칙 기반 응답/진단 요약의 고정 영어 문구와 생성 텍스트의 언어 처리 점검.

## Gemini 설정

로컬: `backend/.env`에서 LLM의 OpenAI 호환 Gemini URL, 발급받은 키, 실제 사용 가능한 모델명을 설정합니다. 키는 프론트 `VITE_*` 환경변수에 절대 넣지 마세요.

**중요:** 이번 ZIP에는 백엔드 파일을 포함하지 않았고 백엔드 코드를 수정하지 않았습니다. 아직 백엔드가 영어로 생성하는 임의의 문장은 일부 영어로 남을 수 있습니다.
