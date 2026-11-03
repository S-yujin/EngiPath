# EngiPath

**공대생을 위한 AI 기반 진로 탐색 및 성장 지원 서비스**

EngiPath는 전공, 기술, 프로젝트 경험과 성찰 답변을 분석해 적합한 진로를 탐색하고, 목표 직무에 필요한 역량과 구체적인 성장 계획을 제안합니다. 일회성 진로 검사보다 **근거 기반 분석과 지속적인 성장**에 초점을 맞췄습니다.

## 주요 기능

- **맞춤형 진로 추천** — O*NET 직업 데이터와 개인 프로필을 기반으로 진로 방향 제안
- **적응형 성찰 질문** — 답변과 경험에 따라 질문을 선택하고 역량 분석
- **역량 분석 및 피드백** — 강점, 잠재 역량, 추가 확인이 필요한 영역 구분
- **직무 격차 분석** — 현재 역량과 목표 직무의 요구 역량 비교
- **성장 계획 및 대시보드** — 단기 실행 과제, 장기 목표, 진행 현황 관리

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic |
| Database / Data | SQLite, O*NET |
| AI | Gemini API 연동 구조, 규칙 기반 대체 처리 |

## 서비스 흐름

`프로필 입력 → 진로 추천 → 성찰 질문 → 역량 분석 → 성장 계획 → 대시보드`

## 로컬 실행

**Backend** (Python 설치 필요)

```bash
cd backend
pip install -r requirements.txt
python scripts/preprocess_onet.py
python -m uvicorn app.main:app --reload
```

**Frontend** (Node.js 설치 필요, 별도 터미널)

```bash
cd frontend
npm install
npm run dev
```

- 프론트엔드: `http://localhost:3000`
- API 문서: `http://localhost:8000/docs`
- AI 기능을 사용하려면 `backend/.env.example`을 참고하여 백엔드에 API 키를 설정해야 합니다. 키가 없으면 일부 기능은 규칙 기반 결과를 사용합니다.

---

*2026 SZU·DAU·SIT International Summer Camp — Track A*
