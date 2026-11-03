# OneTool / EngiPath — Backend

Backend backbone for **Track A: EngiPath** — an AI-assisted career reflection
and development companion for engineering students.

This repository is the **shared backbone**: teammates pull it and implement
their assigned modules without restructuring the project.

## Tech Stack

- Python 3.10+ (developed against 3.12+)
- FastAPI + Pydantic v2
- SQLite
- O\*NET JSON data (preprocessed to a single `occupations.jsonl`)
- LLM client (OpenAI-compatible; swap provider without touching services)

## Repository Layout

```
backend/
├── app/
│   ├── main.py            # FastAPI app + router registration (no business logic)
│   ├── config.py          # settings from .env
│   ├── api/               # HTTP routers (health, students, reflection, careers, gap, plans, dashboard)
│   ├── models/            # SHARED data contracts — agree before changing!
│   ├── services/          # business logic (profile, reflection, career, gap, planning)
│   ├── llm/               # client + prompts + structured schemas
│   ├── db/                # SQLite connection + schema
│   ├── repositories/      # storage access (student, occupation)
│   └── data/
│       ├── raw/           # 5 raw O*NET JSON datasets (download here)
│       └── processed/     # occupations.jsonl (generated)
├── scripts/
│   └── preprocess_onet.py # O*NET → occupations.jsonl
├── tests/
├── .env.example
└── requirements.txt
```

## Setup (from scratch)

```bash
git clone <repository>
cd backend

python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate        # Windows

pip install -r requirements.txt

cp .env.example .env
# → fill in LLM_API_KEY (optional; deterministic fallbacks work without it)
```

## O\*NET Data (optional but recommended)

Download the 5 raw JSON datasets into `app/data/raw/`:

| File | Contents |
|------|----------|
| `occupation_data.json` | occupation codes, titles, descriptions |
| `essential_skills.json` | essential skills per occupation |
| `software_skills.json` | software/tool skills per occupation |
| `knowledge.json` | knowledge areas per occupation |
| `career_interest_types.json` | RIASEC career interests per occupation |

Then preprocess:

```bash
python scripts/preprocess_onet.py
```

This writes `app/data/processed/occupations.jsonl` — the single file the app
loads at runtime.

**No O\*NET files yet? Use the sample dataset.** This ships a small built-in
dataset of 6 real O\*NET occupations so the full flow (search, alignment, gap
analysis, action plans) works immediately:

```bash
python scripts/preprocess_onet.py --sample
```

The app also boots with no data at all: `/careers/cards` falls back to 6
curated aspirational career cards, and other endpoints return empty /
heuristic results.

## Run

```bash
uvicorn app.main:app --reload
```

- Health check: `GET http://localhost:8000/health` → `{"status": "ok"}`
- Interactive docs: `http://localhost:8000/docs`

## Core API (handoff §21)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | smoke test |
| POST | `/students` | create student `{major, year, intro}` → `{student_id}` |
| GET | `/students/{id}` | current profile |
| POST | `/students/{id}/reflection` | submit `{question, answer}` → `{profile_updates, next_question}` |
| POST | `/students/{id}/portrait` | generate Reflection Portrait |
| POST | `/students/{id}/portrait/feedback` | `{item, feedback_type, context}` — agree/disagree/add_context |
| GET | `/careers/cards` | ≥6 aspirational career cards |
| GET | `/careers/search?q=` | occupation search |
| POST | `/students/{id}/careers` | recommended careers + alignment levels |
| GET | `/careers/{onetsoc_code}` | occupation detail |
| POST | `/students/{id}/gap-analysis` | `{onetsoc_code}` → confirmed/partial/development/unknown |
| POST | `/students/{id}/action-plan` | generate + save plan (≤3 actions + vision) |
| GET | `/students/{id}/action-plan` | retrieve saved plan |
| GET | `/students/{id}/dashboard` | Living Dashboard snapshot |
| POST | `/students/{id}/evidence` | submit evidence `{title, link, note}` |
| GET | `/students/{id}/evidence` | list evidence |

## Testing

```bash
pytest
```

Minimum suite (handoff §34): health 200 · occupation search · student
create/retrieve · reflection→profile update · portrait categories ·
gap buckets · plan ≤3 actions.

## LLM Fallback Behaviour

If `LLM_API_KEY` is empty, all LLM-backed services degrade to deterministic
heuristics (keyword extraction, rule-based portraits/plans). The flow still
works end-to-end — useful for testing the UI before the API key is configured.

## Git Workflow (handoff §29)

- `main` stays runnable; run `GET /health` after every integration merge.
- Feature branches: `feature/data-career` (Dev A), `feature/ai-reflection` (Dev B).
- Pull/rebase before starting work each day. Keep commits small.
- **Never commit `.env` or API keys.**
- Don't change shared models (`app/models/`) without coordinating.
