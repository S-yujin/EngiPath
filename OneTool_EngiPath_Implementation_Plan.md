# OneTool / EngiPath — 4-Day Implementation Plan (Track A)

> **Track:** A — EngiPath (AI companion for engineering students' growth diagnosis & next-step planning)
> **Window:** 4 build days (Aug 18–21, 2026) + demo day
> **Source docs:** AI Summer School Project Briefing(1).pptx · OneTool(1).docx · OneTool_EngiPath_Backend_Backbone_Team_Handoff.md
> **Assumed team:** Module A (Growth Framework / backend-data), Module B (AI Planning Engine / backend-AI), Module C (UI & Visualization / frontend), Team Lead (Integration). The backend handoff covers Modules A+B (2 backend developers).

---

## 1. Mission & Guardrails

**One sentence:** Build an AI companion that takes an engineering student from "I'm not sure what to focus on" to "here are ≤3 concrete things to do in the next 4–8 weeks" — in a single, low-friction session, then keeps them coming back.

**The 5 failure patterns we must NOT repeat** (from product requirements):

| # | Failure | Our guardrail |
|---|---------|---------------|
| 1 | Delayed value | Show something valuable within the first ~2 minutes (career cards → live match %) |
| 2 | Single-use | Living Dashboard gives a reason to return (evidence, milestones) |
| 3 | Generic output | Every AI output carries a reason + evidence; never just a label |
| 4 | Emotional misfit | Warm, supportive, mentor-like tone in every prompt |
| 5 | Trust breakdown | Explainability everywhere; never overpromise in the demo |

**Product requirements locked in (FR1–FR6):**
- FR1: ≥ 6 aspirational career cards (title, icon, description)
- FR2: Low→High match confidence within 120 s of onboarding
- FR3: Behavioral/experience-based reflection (not just numeric self-scores)
- FR4: Explainable Reflection Portrait (supported strengths, overlooked strengths, areas to validate, development areas, insufficient info) + student can Agree / Disagree / Add Context, and it updates
- FR5: Max 3 short-term actions (4–8 weeks) + 1–2 year long-term vision
- FR6: Dashboard — confidence, completed milestones, growth, evidence submission

**Scope discipline (from handoff §35):** NO auth, OAuth, Redis, Celery, Kafka, PostgreSQL, websockets, LangGraph, multi-agent frameworks, vector search (unless core flow works first).

---

## 2. Product Journey → Features → Modules

The 6-step journey (DOCX §3) is the spine. Everything maps to a module and an API.

| Step | Journey stage | Time budget | Key feature | Owner |
|------|---------------|-------------|-------------|-------|
| 1 | Dream Job Hook | ~30 s | Select from ≥6 aspirational career cards | A (data) |
| 2 | Minimum Viable Profile | ~90 s | Year + major + short intro (no heavy form) | A (data) |
| 3 | Live-Score Diagnostic | 3–5 min | 10–15 adaptive reflection questions; live Low→High match % | B (AI) + C (UI) |
| 4 | Growth Portrait | ~2 min | Radar chart; strengths/gaps/pathways with reasons & evidence; agree/disagree/add context | B (AI) + C (UI) |
| 5 | Action Plan | ~1 min | ≤3 short-term actions (4–8 wks) + 1–2 yr vision | B (AI) |
| 6 | Living Dashboard | ongoing | Confidence, milestones, growth, evidence submission (student + mentor view) | A (data) + C (UI) |

**Team module mapping (PPTX slide 11):**
- **Module A — Growth Framework** (Backend Dev A): FastAPI backbone, SQLite, shared Pydantic models, O\*NET preprocessing, occupation retrieval/search, career cards, comparison utilities, dashboard read endpoints
- **Module B — AI Planning Engine** (Backend Dev B): LLM client, reflection flow, profile extraction, Reflection Portrait, career alignment explanation, gap analysis, action planning, feedback/correction flow
- **Module C — UI & Visualization** (Frontend): career card selector, live diagnostic UI with animated match %, radar chart, portrait cards, action plan view, evidence submission, mentor dashboard
- **Team Lead**: owns integration contract, demo narrative, daily sync, branch coordination

---

## 3. Tech Stack (backend handoff §2, §31)

- Python 3.10+ · FastAPI · Pydantic v2 · SQLite · uvicorn
- O\*NET JSON datasets (raw) → preprocessed `occupations.jsonl`
- LLM provider SDK (OpenAI-compatible preferred; decide at kickoff)
- Optional vector search (Chroma/FAISS) — ONLY after basic retrieval works
- Frontend (Module C choice): React + Vite recommended, but team decides
- `requirements.txt` minimal: `fastapi, uvicorn, pydantic, python-dotenv` + LLM SDK

---

## 4. Architecture

```
FRONTEND (Module C)
      │
      ▼
FastAPI app (app/main.py — routers only, no business logic)
      │
      ├── api/students.py     ├── api/reflection.py     ├── api/careers.py
      ├── api/gap.py          ├── api/plans.py          ├── api/health.py
      │
      ▼
Services (services/)  ── profile · reflection · career · gap · planning
      │
      ▼
Shared Services ── SQLite (db/) · O\*NET store (repositories/occupation_repository) · LLM Client (llm/client.py)
```

**Hard rule (handoff §3):** Code/db handles storage, exact lookups, deterministic comparisons, IDs, history. LLM handles extraction from language, adaptive questions, interpretation, explanations, plans. **The LLM is not the database.**

---

## 5. Data Contracts — Sign Off FIRST (handoff §6–11, §28)

Agree in the kickoff meeting before anyone branches. Do NOT change independently afterward.

```python
StudentProfile   # student_id, major, year, intro, skills[], experiences[],
                 # interests[], strengths[ReflectionItem], development_areas[], unknown_areas[], target_role_id
Experience       # type, title, description, contributions[], tools_used[],
                 # enjoyed[], struggled_with[], learned[]
ReflectionItem   # area, reason, evidence[]          ← every AI claim carries reason+evidence
ReflectionPortrait # supported_strengths[], possible_overlooked_strengths[],
                   # areas_to_validate[], development_areas[], insufficient_information[]
OccupationProfile  # onetsoc_code, title, description, essential_skills[], software_skills[],
                   # knowledge[], career_interests{}
GapAnalysis      # confirmed[], partial[], development_areas[], unknown[]
ActionPlan       # short_term_actions[] (≤3), long_term_vision{}
```

---

## 6. API Surface (handoff §21)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | smoke test |
| POST | `/students` | create student (major, year, intro) |
| GET | `/students/{id}` | current profile |
| POST | `/students/{id}/reflection` | submit answer → `{profile_updates, next_question}` |
| POST | `/students/{id}/portrait` | generate Reflection Portrait |
| POST | `/students/{id}/portrait/feedback` | agree / disagree / add_context → updates portrait |
| GET | `/careers/cards` | ≥6 aspirational career cards |
| GET | `/careers/search?q=` | occupation search |
| POST | `/students/{id}/careers` | recommended directions + alignment level + reasons |
| POST | `/students/{id}/gap-analysis` | body `{onetsoc_code}` → confirmed/partial/development/unknown |
| POST | `/students/{id}/action-plan` | ≤3 actions + long-term vision |
| GET | `/students/{id}/dashboard` | Living Dashboard snapshot (MVP read endpoint) |
| POST | `/students/{id}/evidence` | simple evidence submission (title/link/note) |

**Alignment output (FR2):** internal numeric score if used → convert to categories `Low / Moderate / Good / High`; UI emphasizes the *why* (reasons list), not precision.

---

## 7. Day-by-Day Execution Plan

**Daily rhythm (PPTX slide 17):** 10-minute end-of-day sync — progress, blockers, tomorrow's priorities. After every integration merge, run `GET /health`.

### Day 0 — Kickoff & Contracts (same day as briefing)

All members. No code branches yet.

- [ ] Confirm Python version, FastAPI, LLM provider/model, `.env` variable names (handoff §37 checklist)
- [ ] Sign off all data contracts in §5 + endpoint names + JSON conventions
- [ ] Decide branch ownership: `feature/data-career` (A), `feature/ai-reflection` (B), `feature/ui` (C)
- [ ] Create repo skeleton per handoff §4 (folders + empty `app/main.py` with health router committed on `main`)
- [ ] Download the 5 O\*NET raw JSON datasets into `app/data/raw/` (occupation_data, essential_skills, software_skills, knowledge, career_interest_types)
- [ ] Define the 3 demo personas (e.g., 1st-year undecided generalist; 3rd-year embedded/AI student; final-year with projects but weak soft skills) — used for demo + test data
- [ ] Create `.env.example`; everyone copies to local `.env` (never commit real keys)

### Day 1 — Backbone + Reflection Core

**Module A (backend/data):**
- FastAPI backbone: `main.py`, config, health endpoint, routers wired
- SQLite setup (`db/database.py`, `schema.sql` — 4 tables: students, profiles, reflections, plans)
- Shared Pydantic schemas (contract files from §5)
- `scripts/preprocess_onet.py`: load 5 JSONs → join on `onetsoc_code` → `occupations.jsonl`
- `OccupationRepository.search()/get()` — simple title/description/skills matching (no RAG)

**Module B (backend/AI):**
- `llm/client.py` — single `generate_structured(system, user, response_model)` wrapper
- Structured LLM schemas (reflection result: skills_observed, new_experiences, possible_strengths, unknowns, next_question)
- Reflection Agent: store Q/A → LLM extracts structured info → update profile → return next question
- Basic profile extraction/update service

**Module C (frontend):** Static screens for Steps 1–2 (career card grid, minimal profile form) wired against stub/mock data.

**End-of-day target:** `Create student → submit reflection → LLM extracts → profile updates` works end-to-end over the API. `GET /health` → 200.

### Day 2 — Career Intelligence + Portrait

**Module A:**
- `GET /careers/cards` (≥6 curated cards)
- `GET /careers/search`
- Basic alignment/comparison utilities (essential skill overlap, tools overlap, knowledge overlap, career-interest alignment → Low/Moderate/Good/High)

**Module B:**
- Reflection Portrait generation (5 categories, each item with reason + evidence)
- Career alignment explanation (`explain_career_alignment`)
- Gap Analysis Agent: deterministic comparison first → structured result → LLM explanation (handoff §23; classifications: confirmed / partial / development area / unknown)

**Module C:** Live-score diagnostic UI (adaptive questions + animated match %), portrait radar chart, career direction cards.

**End-of-day target:** `Profile → career directions → select target → gap analysis` works over the API; portrait rendered in UI.

### Day 3 — Planning + Persistence + Dashboard

**Module A:**
- Persist portrait/gap/plan results (profiles/plans tables)
- Dashboard read endpoints (profile, portrait, target, alignment, plan, milestones, evidence)
- Simple evidence storage (title/link/note)

**Module B:**
- Planning Agent: gap → ≤3 short-term actions (4–8 weeks) with title/why/what/evidence/reflection prompt + 1–2 yr vision (hard cap enforced in service, not prompt only)
- Student feedback/correction flow (`/portrait/feedback`) — Agree/Disagree/Add Context updates profile & regenerates portrait

**Module C:** Action plan view, evidence submission form, student dashboard; mentor dashboard read-only view (starter).

**End-of-day target:** Full journey works backend-to-frontend for one persona; persistence verified by reload.

### Day 4 — Integration, QA, Demo Polish (handoff §33, PPTX slides 17–18)

- Frontend↔backend integration; fix API contract mismatches
- Test all 3 personas end-to-end; prompt tuning per persona
- Error handling + edge cases (empty profile, unknown occupation, LLM timeout)
- README setup verification on a clean clone
- Record demo video; write demo narrative script; assign speaking roles
- Draft presentation (8–12 slides) + technical note (architecture, model choices, methodology)
- Rehearse

**End-of-day target:** 12-step definition of complete (handoff §36) works reliably for all 3 personas → then **stop building and polish the demo**.

---

## 8. Definition of Done (demo acceptance, handoff §36)

1. Create student → 2. answer reflection questions → 3. profile updates → 4. Reflection Portrait generated with reasons/evidence → 5. career directions retrieved → 6. alignment level explained → 7. select target role → 8. gap analysis generated → 9. ≤3 short-term actions → 10. 1–2 yr vision → 11. results persisted → 12. frontend retrieves them.

Plus: ≥6 career cards · match % within 120 s · portrait agree/disagree/add-context works · 3 personas demoed · evidence submission works · mentor dashboard view exists.

---

## 9. Minimum Tests (handoff §34)

| Test | Expectation |
|------|-------------|
| `GET /health` | 200 |
| search "software" | returns occupations |
| create → retrieve student | same data |
| submit project experience | profile contains extracted tools/experience |
| generate portrait | all 5 categories present |
| gap analysis on known occupation | confirmed/partial/development/unknown arrays returned |
| generate plan | ≤ 3 short-term actions |

---

## 10. Demo Plan (PPTX slide 11, slide 18)

**Scenario:** Persona-based simulation — 3 fictional students with distinct backgrounds/goals/paces.
1. Show persona A onboarding (career hook + live match % rising) — demonstrates 120-second value
2. Show portrait with one Agree / one Add Context interaction — demonstrates explainability & update
3. Show persona B gap analysis + action plan (≤3 items) — demonstrates personalization
4. Show persona C dashboard with evidence submitted + milestone — demonstrates retention loop
5. Close with: what's explainable, what's uncertain, what we'd build next

**Deliverables checklist:** runnable prototype · presentation (8–12 slides) · technical note · demo data/use cases · recorded demo.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| O\*NET JSON schema surprises | Day 0 inspect fields; preprocess script tolerant; don't invent fields (handoff §11) |
| LLM returns malformed/unstructured output | Pydantic validation + retry; always fall back to deterministic comparison |
| Reflection flow too slow (FR2: 120 s) | Keep onboarding to 10–15 questions; show match % live with partial data |
| Frontend/backend contract drift | Sign off contracts Day 0; merge shared schema changes early; daily integration merge |
| LLM API rate limits / cost during demo | Cache repeated calls; use demo personas' pre-warmed outputs if needed |
| Scope creep | Every feature passes the test: "Does this help demonstrate the reflection → career → gap → action journey?" If not, defer (handoff §39) |

---

## 12. First Actions (right now)

1. Share this plan with the team; book the Day 0 kickoff meeting
2. Complete the handoff §37 checklist (contracts) before anyone writes module code
3. Assign roles: Module A / B / C / Team Lead (confirm who is frontend — assumed Module C)
4. Start the immediate starting order from handoff §38 (skeleton → schemas → SQLite → O\*NET → search → LLM client → reflection → portrait → alignment → gap → plan → frontend)
