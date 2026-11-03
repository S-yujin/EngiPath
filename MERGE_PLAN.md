⚠  Something went wrong
    Could not generate your baseline. Please try again.
    [Try Again] button
# Frontend ↔ Backend Merge Plan — Steps 1 & 2 (MVP → LLM-Curated Career Cards)

> Goal: run the website locally, complete the **Minimum Viable Profile**, send it to the **LLM**, and get back **Curated Career Cards**.

---

## 1. Current State (audit findings)

### Backend (done, working)
- `POST /students` accepts `{major, year, intro, skills[], interests[], experiences[]}` → returns `{student_id}` — **matches new Step 1**
- `POST /students/{id}/careers/cards` → **deterministic** curation (≥6 cards with `onetsoc_code`, `title`, `description`, `alignment`, `reasons`) — **needs LLM upgrade**
- LLM client + `generate_structured` ready; DeepSeek configurable via `.env`
- Runs at `localhost:8000`, `/api` prefix NOT used (endpoints are root-level)

### Frontend (friend's, mock-driven)
- Vite + React + TS + Tailwind, dev server port **3000**, proxies `/api → localhost:8000`
- **7 screens in OLD order**: Screen0 Hero → **Screen1 DreamJob (hook FIRST)** → **Screen2 Onboarding (MVP SECOND)** → Screen3 Diagnostic → Screen4 Portrait → Screen5 Plan → Screen6 Dashboard
- `services/api.ts` — `fetchWithFallback` silently falls back to mock data on ANY error; endpoints are **wrong vs backend**:
  - `GET /careers` (backend: no such route) — should be `POST /students/{id}/careers/cards`
  - `POST /students` (shape mismatch: frontend sends `{id, name, ...}`; backend expects `{major, year, intro, skills, interests, experiences}`)
  - `/reflection/portrait?student_id=`, `/plans`, `/dashboard` — all differ from backend contract
- `types/index.ts` — frontend types (DreamJob with `targetScores`, UserProfile with `dreamJobId`) **don't match backend models** (OccupationProfile, StudentProfile)
- `utils/mockData.ts` — DREAM_JOBS uses emoji icons + target scores; backend returns O\*NET data without icons

---

## 2. Target Flow (new order)

```
Screen 0  Hero (intro/CTA)
    ↓
Screen 1  MVP FORM        → POST /students            (name, year, major, intro/self-description,
    ↓                          skills, interests, experiences)        → {student_id}
Screen 2  CURATED CARDS   → POST /students/{id}/careers/cards  (LLM generates cards from profile)
    ↓
Screen 3+ Diagnostic, Portrait, Plan, Dashboard (unchanged for this milestone)
```

**Key principle:** the MVP must be submitted to the backend FIRST (which saves it), then the LLM generates curated cards FROM that profile. No more static dream-job selection before knowing the user.

---

## 3. Backend Changes

### 3a. LLM-powered curated career cards (NEW)
- Add `CareerCardsDraft` schema to `app/llm/schemas.py`:
  ```python
  class CareerCard(BaseModel):
      onetsoc_code: str
      title: str
      description: str
      alignment: str          # Low | Moderate | Good | High
      reasons: list[str]      # why this card fits the student
      uncertainties: list[str]

  class CareerCardsDraft(BaseModel):
      careers: list[CareerCard]
  ```
- Add `CAREER_CARDS_SYSTEM` prompt to `app/llm/prompts.py` — instructs the LLM to:
  - curate 6+ career cards matched to the student's profile
  - only use real occupations (pass candidate list from deterministic scoring)
  - give reasons tied to the student's own words/evidence
- Update `CareerService.curated_cards()` to:
  1. Compute deterministic shortlist (existing logic, top ~10)
  2. Send profile + shortlist to LLM → `CareerCardsDraft` (validated)
  3. **Fallback:** if LLM unavailable/error → return deterministic shortlist (current behavior) so frontend never breaks
- Update `POST /students/{id}/careers/cards` — no signature change (frontend just gets LLM-enriched cards)

### 3b. CORS / proxy
- Backend already has CORS for `http://localhost:3000` ✓
- Frontend proxy `/api → :8000` exists ✓ — but the frontend must call `/api/...` (see 4b)

---

## 4. Frontend Changes

### 4a. Reorder screens: MVP first, cards second
- `App.tsx` step map: **Step 1 → MVP (Screen2_Onboarding content repurposed)**, **Step 2 → Curated Cards (Screen1_DreamJob content repurposed)**
- Cleanest approach: **create 2 new screens** and keep the old ones for reference (or rename):
  - `Screen1_MinimumProfile.tsx` — name, year, major, self-description (intro), skills chips input, interests, add-experience (title + tools + description) — richer than current Screen2 (adds the free-text fields the LLM needs)
  - `Screen2_CuratedCards.tsx` — renders backend cards: title, description, alignment badge (Low→High), reasons; selecting a card sets `dreamJobId` and continues to Step 3
- Update `Layout`/step badges if they hardcode screen titles ("Step 1 of 6 • The 30-Second Dream Job Hook" etc.)

### 4b. Fix `services/api.ts` to hit the real backend
- Keep `fetchWithFallback` pattern (graceful mock fallback = demo safety), but fix paths/payloads:
  - `createStudent(profile)` → `POST /api/students` with `{major, year, intro, skills, interests, experiences}` → returns `{student_id}` (store in context/state)
  - `getCuratedCards(studentId)` → `POST /api/students/{id}/careers/cards` → returns `{careers: [...]}` mapped to frontend `DreamJob[]` shape (add icon/emoji mapping by title keyword in a UI helper)
  - Keep old endpoints (portrait/plans/dashboard) untouched for now — out of scope for this milestone

### 4c. Types
- Add an `onboarding.ts` type (or extend `index.ts`):
  ```ts
  export interface OnboardingProfile {
    major: string; year: number; intro: string;
    skills: string[]; interests: string[]; experiences: ExperienceInput[];
  }
  export interface ExperienceInput {
    type: string; title: string; description: string; tools_used: string[]; learned: string[];
  }
  ```
- Add a `CuratedCareer` type mirroring backend card shape; map to `DreamJob` for the card UI (keep `id` = `onetsoc_code`)

### 4d. Context wiring (`AppContext.tsx`)
- Add `onboardingProfile` state + `submitOnboarding()` that: calls `createStudent`, saves `student_id`, then calls `getCuratedCards`, stores cards in state, advances to Step 2
- Loading + error states (LLM can take seconds)

---

## 5. Testing / Verification

1. `cd backend && .venv/bin/python -m pytest` → all green (13+ tests, add 1 for LLM cards fallback)
2. Backend up: `uvicorn app.main:app --reload` (port 8000)
3. Frontend up: `cd frontend && npm install && npm run dev` (port 3000)
4. Manual flow: Hero → fill MVP (with real text about robotics) → Submit → **watch LLM generate curated cards** → verify cards match profile (e.g. robotics student → robotics/engineering roles) → select card → Step 3
5. Test without `LLM_API_KEY` → should still show deterministic cards (fallback works)

---

## 6. Task Breakdown

| # | Task | Where | Owner |
|---|------|-------|-------|
| 1 | Add `CareerCardsDraft` schema + prompt | backend `llm/` | You |
| 2 | LLM-enrich `curated_cards()` with deterministic fallback | backend `career_service.py` | You |
| 3 | Create `Screen1_MinimumProfile.tsx` (richer MVP form) | frontend | Frontend teammate |
| 4 | Create `Screen2_CuratedCards.tsx` (render backend cards) | frontend | Frontend teammate |
| 5 | Fix `api.ts` (createStudent + getCuratedCards, correct payloads) | frontend | Frontend teammate |
| 6 | Reorder App.tsx steps + add types + context wiring | frontend | Frontend teammate |
| 7 | Integration test both sides together | both | You + teammate |
| 8 | Update README (new flow) | docs | You |

---

## 7. Decisions Needed

1. **Who does frontend work?** Plan assumes frontend teammate does tasks 3–6; you do backend (1–2) and can scaffold API-service changes.
2. **Card icons:** backend returns no emoji icons. Frontend can map title → emoji (e.g. "Robot"→🤖, "Software"→💻) or show a generic icon. (Frontend choice.)
3. **"Curated" semantics:** LLM ranks + explains the deterministic shortlist (recommended — grounded in real O\*NET data, no hallucinated roles), rather than having the LLM invent cards from scratch. Confirm this matches your intent.
