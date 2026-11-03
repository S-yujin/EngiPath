# Engipath — 백엔드 담당자에게 전달할 수정 안내

**이 파일은 안내문입니다. ZIP에 백엔드 소스를 넣거나 기존 원본 백엔드를 변경하지 않았습니다.**

## 1. DHub 배포 전에 우선 해야 할 일 (코드 수정 아님)

- 위치: `backend/` 폴더에서 `pip install -r requirements.txt` 실행
- 위치: `backend/scripts/preprocess_onet.py` → `python scripts/preprocess_onet.py` 실행. 원본 O*NET JSON을 전처리해 `app/data/processed/occupations.jsonl` 생성
- 위치: `backend/.env` → `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`, `LLM_ENABLED` 값 변경 (상세한 예시는 `README_KO.md` 참고)
- 위치: `backend/app/config.py` → `CORS_ORIGINS`는 `.env` 값을 읽음. 별도 호스팅 프론트가 있다면 `.env`의 `CORS_ORIGINS=https://프론트도메인`으로 정확한 origin 허용
- `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000` 실행, DHub VM 포트 8000 연결 후 `/health` 확인

## 2. Gemini API로 변경 (대부분은 설정만 변경)

`backend/app/config.py`에서 이미 읽는 항목:

```dotenv
LLM_API_KEY=실제_키
LLM_MODEL=gemini-3.8-flash
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_ENABLED=true
```

`backend/app/llm/client.py`는 지정한 BASE_URL 뒤에 `/chat/completions`를 붙이고 Bearer 토큰으로 인증합니다. **Gemini 호환 API를 먼저 이 설정만으로 시험**하고, JSON 스키마 검증 또는 모델 오류가 실제로 발생하면 해당 클라이언트를 조정하세요.

## 3. 기본 한국어 + 기존 다른 언어 출력까지 보장하려면 (백엔드 코드 수정 필요)

프론트는 모든 API 요청에 `Accept-Language`를 전달합니다. 기본 `ko`, 전환 시 `en`, `zh-CN`, `es`, `fr`, `de`입니다. **기존 원본 백엔드는 이 헤더를 자동으로 AI 프롬프트에 적용하지 않습니다.** 아래 위치를 수정해야 신규 Gemini 생성 내용도 선택 언어로 보장됩니다.

1. **`backend/app/llm/prompts.py`**: `SYSTEM_PERSONA`, `CHAT_SYSTEM`, `CAREER_CARDS_SYSTEM`, `CONTEXTUALIZE_QUESTION_SYSTEM`, `ADAPTIVE_CLARIFICATION_SYSTEM`, `HEARD_SUMMARY_SYNTHESIS_SYSTEM`, `ACTION_PLAN_SYSTEM`, `QUESTIONNAIRE_MIDPOINT_SYSTEM` 등 실제 생성 텍스트에 `선택 언어로 사용자에게 보여줄 자연어 값을 작성`하는 규칙을 반영하세요. **JSON 키, ID, 질문 ID, 선택지 ID, O*NET 코드, enum, 고정 분류명은 번역하지 않도록 분리**해야 합니다.
2. **`backend/app/api/` 및 `backend/app/llm/client.py`**: 각 요청의 `Accept-Language`를 읽어 서비스 호출 시 locale을 전달하고, LLM 프롬프트의 최상단 언어 지시문에 포함하세요. 권장 방식은 요청별 FastAPI Dependency로 locale을 얻어 서비스 함수에 명시적으로 전달하는 것입니다. 전역 설정값을 요청마다 변경하지 마세요(동시 요청의 언어가 섞일 위험).
3. **`backend/app/services/questionnaire_service.py` 와 `backend/app/questionnaire/pipeline.py`**: 질문 은행에서 제공하는 원문과 AI가 새로 표현한 질문을 구분하세요. 현재 제공된 50개 고정 문항 및 선택지는 프론트에 한국어 매핑이 있으므로 **API 전송 시 원문 ID는 유지**해야 합니다. 신규 맞춤형 질문 및 근거 요약은 선택 언어에 따라 생성되어야 합니다.
4. **`backend/app/services/chat_service.py`**: `OFF_TOPIC_REPLY`와 키워드 기반 주제 검사 등 영어로 고정된 결과를 선택 언어에 맞춰 처리하고 한국어 질문에 대한 분류도 검증하세요. `CHAT_SYSTEM` 내부의 `OneTool` 앱명도 `Engipath`로 바꿔주세요. (프론트 ZIP에서 백엔드 파일은 변경하지 않았습니다.)
5. **`backend/app/config.py`**: 문서/Swagger 상의 `APP_NAME = "OneTool / EngiPath API"`도 `Engipath API`로 통일하면 일관적입니다. 프론트 화면에는 영향이 없으며 백엔드 팀이 원할 때 변경하세요.

### 프롬프트 권장 원칙

예시 지시문 (locale에 따라 매 요청마다 적용):

> User-facing descriptions, questions, explanations, recommendations and plan steps must be in the requested language: `ko` → Korean by default; `en` → English; `zh-CN` → Chinese; `es` → Spanish; `fr` → French; `de` → German. Keep all required JSON property names, IDs, O*NET codes, enum values, machine-readable categories and validation constraints unchanged. Do not invent evidence or career details.

모델 결과의 자연어 필드와 기계 판독용 값은 별개이므로 **모델 전체 응답을 무조건 번역하는 식으로 처리하지 않는 것**이 중요합니다.

## 4. 확인 방법

1. `GET /health` → HTTP 200
2. `POST /students` → 학생 ID 생성
3. `POST /students/{id}/careers/cards` → 적합 직업, 추천 이유 확인
4. 질문 API → 기본 50개 문항의 ID/선택지 ID가 유지되는지 확인
5. `Accept-Language: ko`일 때 Gemini 요약/동적 질문/실행 계획이 한국어인지 확인
6. `Accept-Language: en`(또는 다른 언어)로 변경할 때 동일 스키마에 자연어만 해당 언어로 생성되는지 확인
7. 실제 Gemini 키 없이 규칙 기반 fallback에서는 백엔드가 원문 영어를 반환하는 경우가 있으므로 UI 고정 문구와 신규 AI 생성 내용의 검증을 구분

**보안:** `.env`, 실제 Gemini API 키, DB 파일, DHub SSH 개인 키는 Git 또는 프론트 정적 파일에 포함하면 안 됩니다.
