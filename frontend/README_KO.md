# Engipath — OneTool 디자인 유지 / 한국어 기본 프론트엔드

> **전달물: 프론트엔드만.** 기존 `OneTool-bryantest.zip`의 FastAPI 백엔드는 포함·수정하지 않았습니다.

## 요청 범위

- **브랜드:** 표시 이름을 `Engipath`로 통일했습니다. 기존 중국어 WanTu/OneTool 로고 표시는 `engipath-mark.svg`로 교체했으며 위치, 크기, 레이아웃 및 전체 UI 스타일은 유지했습니다.
- **한국어 기본:** 첫 방문 시 `ko`, 문서 언어 및 제목 한국어; 시작 화면/프로필/진로 추천/진단/분석/실행계획/대시보드/설정/AI 코치의 고정 문구를 한국어로 제공합니다.
- **다국어 보존:** 기존 한국어·영어·중국어·스페인어·프랑스어·독일어 전환 메뉴를 유지합니다. 언어 변경은 `ENGIPATH_LOCALE_V2`에 저장되며 앱을 다시 열어도 유지됩니다. 이미 존재하던 각 언어 번역표를 제거하거나 덮어쓰지 않았습니다.
- **질문 한국어:** 기존 `EngiPath_Reflection_Question_Bank_Final_v1.json`의 질문 **50개**, 선택지 **고유 문장 316개** 및 안내 문구를 프론트 화면에서 번역합니다. 질문 ID, 선택지 ID, 서버로 제출하는 원래 값과 API 규격은 보존합니다.
- **DHub 연결:** 기존 `/api` 개발용 프록시 유지. API 요청마다 `Accept-Language`로 UI 언어를 보냅니다. 백엔드가 이 헤더를 실제 처리하도록 하려면 별도 작업이 필요합니다.
- **Gemini:** Gemini는 DHub **백엔드**에서 호출합니다. 프론트 소스에는 API 키가 없고, Gemini 호출 코드도 추가하지 않았습니다.

## 로컬 실행

### 1) 기존 백엔드 실행 (원본을 그대로 사용)

```powershell
cd C:\pj-Engipath\backend
pip install -r requirements.txt
python scripts/preprocess_onet.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

`python scripts/preprocess_onet.py`는 한 번 실행하여 `app/data/processed/occupations.jsonl`을 만들어야 합니다. 백엔드의 `/health`를 확인하세요.

### 2) 프론트엔드 실행 (별도 터미널)

```powershell
cd C:\pj-Engipath\engipath-frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

- 프론트 주소: **http://localhost:3000** (`vite.config.ts`의 포트)
- `.env.local`의 `VITE_BACKEND_URL=http://127.0.0.1:8000`, `VITE_API_BASE_URL=/api`, `VITE_DEMO_MODE=false`
- 개발 중에는 브라우저의 `/api/*`를 Vite가 FastAPI의 `/*`로 프록시합니다.

## 학교 DHub 백엔드 배포

DHub의 `DHub_Getting_Started.pdf` 기준:

1. https://cloud.dauai.org 에서 VM 신청·생성 (Ubuntu 권장), VS Code Remote-SSH로 접속합니다.
2. **백엔드 폴더만** VM에 올리고, VM의 `backend` 디렉터리에서 설치합니다:

```bash
cd ~/Engipath/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/preprocess_onet.py
cp .env.example .env
# .env에 Gemini 환경변수 설정 (아래 참고)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. VM 관리 화면에서 **8000번 포트를 연결**하고 `https://<VM-ID>.apps.dauai.org/health`로 확인합니다. 실제 주소는 VM 관리 화면에서 확인하세요.
4. 백엔드 프로세스를 상시 유지하려면 VM 운영 방법에 맞게 systemd 또는 DHub 안내서의 백그라운드 실행 방식을 사용하세요. 상대경로 데이터가 있으므로 `backend` 디렉터리에서 시작하세요.
5. **DHub에 실제 배포하거나 API 키를 넣는 작업은 이 ZIP에 포함되지 않습니다.**

## 프론트 API 배포 방식

**A. 프론트 별도 호스팅(Cloudflare Pages 등):** `.env.production`에 아래 값을 넣고 `npm run build`, 생성된 `dist/`를 정적 호스팅에 업로드합니다.

```dotenv
VITE_API_BASE_URL=https://<실제-VM-ID>.apps.dauai.org
VITE_DEMO_MODE=false
```

이때 백엔드 `.env`의 `CORS_ORIGINS`에 **프론트 정식 도메인의 origin**을 추가해야 합니다. `https://...`와 끝 슬래시 등을 정확히 맞춰주세요. `VITE_BACKEND_URL`은 `npm run dev`의 Vite 개발 프록시에 사용되므로 별도 호스팅 빌드에는 필요 없습니다.

**B. 프론트도 DHub VM에 배포:** Vite의 `dist/`를 Nginx 등 정적 서버에 서비스하고 `/api/*` → `127.0.0.1:8000/*`로 리버스 프록시를 설정하는 방식을 권장합니다. 이 경우 프론트 빌드는 `VITE_API_BASE_URL=/api`로 하고 프록시에서 `/api` 접두어를 제거해야 합니다. Nginx나 포트 정책에 따라 별도 배포 설정이 필요합니다.

## Gemini 설정 (DHub 백엔드의 `.env`만 변경)

```dotenv
LLM_API_KEY=발급받은_실제_Gemini_API_KEY
LLM_MODEL=gemini-3.8-flash
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_ENABLED=true
```

원본 `backend/app/config.py`는 `GEMINI_API_KEY`가 아닌 **`LLM_API_KEY`**를 읽습니다. `backend/app/llm/client.py`는 `LLM_BASE_URL/chat/completions`를 호출하는 OpenAI 호환 HTTP 클라이언트입니다. Google 공식 문서: https://ai.google.dev/gemini-api/docs/openai

API 키를 **프론트 `.env`/`VITE_...` 변수나 JavaScript에 넣지 마세요.** Gemini 실제 API 호출은 별도 키가 없어 이 전달물에서 검증하지 않았습니다.

## 중요: AI가 새로 생성한 한국어 결과

기존 50개 고정 설문·선택지는 프론트에서 한국어로 보이지만, **Gemini가 새로 생성하는 질문 수정문, 응답 요약, 코치 대화, 진로 추천 이유, 역량 분석, 성장 계획은 백엔드가 생성하는 텍스트**입니다. 프론트만 수정해서 모든 언어에서 이 신규 텍스트를 완전히 번역할 수는 없습니다.

프론트는 `Accept-Language: ko`(다른 언어로 전환하면 해당 코드)를 보냅니다. 백엔드가 이 값을 받아 프롬프트에 언어 지시문을 넣고 출력 데이터 스키마/ID/enum은 그대로 유지해야 합니다. `BACKEND_CHANGE_GUIDE.md`에서 수정할 위치를 설명합니다. 원본 백엔드는 이 작업 범위에서 수정하지 않았습니다.

## 점검표

- 최초 접속에서 한글 홈 문구·Engipath 이름 확인
- 프로필 폼·추천 카드·진단 질문 및 선택지 한국어 표시 확인
- 언어 메뉴에서 한국어 / English / 中文 / Español / Français / Deutsch 전환 후 되돌리기 확인
- 실제 API 통신 전 `/health`, DHub TLS/접속 가능 여부, CORS 점검
- Gemini 키를 설정한 후 API 측 실제 모델 호출 및 한국어 동적 응답 점검

**검증 수준:** TypeScript/TSX 파일 구문 검사 및 상대 경로 import 정적 검사 통과. 외부 npm 레지스트리 접근이 불가능하여 이번 수정본의 `npm run build`, DHub 실배포 및 유효한 Gemini 키를 이용한 통합 테스트는 수행하지 못했습니다.
