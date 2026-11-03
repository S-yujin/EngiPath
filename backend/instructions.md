# Backend Handoff — "Starter Radar Comparison" Fix

> **For the frontend/backend teammate (friend).**
> Goal: when a user clicks a curated career card, the radar chart below the
> cards must show real scores instead of placeholders.
> The curated cards already work — the missing piece is the **baseline
> endpoint** that generates the student-side scores for the radar.

---

## 1. The Problem (what the user sees)

- Curated career cards generate fine (AI works).
- Clicking a card shows the "Starter Radar Comparison" section with
  **placeholders / no data** — the radar polygon doesn't render.

Root cause: the frontend calls an endpoint that is missing on your backend:

```
POST /api/students/{student_id}/baseline
```

Because the Vite dev server proxies `/api` → backend and **strips the `/api`
prefix**, your backend must expose the route at the root:

```
POST /students/{student_id}/baseline
```

---

## 2. What the endpoint must return

```
POST /students/{student_id}/baseline
Content-Type: application/json
```

Response `200`:

```json
{
  "scores": {
    "technicalFundamentals": 65,
    "programming": 75,
    "prototyping": 70,
    "systemsThinking": 70,
    "communication": 50,
    "learningAgility": 75
  }
}
```

The six keys are **fixed** — the frontend radar reads exactly these names
(`CompetencyScores` in `src/types/index.ts`):

```ts
export interface CompetencyScores {
  technicalFundamentals: number;
  programming: number;
  prototyping: number;
  systemsThinking: number;
  communication: number;
  learningAgility: number;
}
```

Errors: `404` if the student does not exist. Never `500` on LLM failure —
**always** return the deterministic fallback instead (see §5).

---

## 3. Data flow (match this)

```
User clicks card (frontend)
  → startComparison()  [frontend context]
  → POST /api/students/{id}/baseline
  → Vite proxy strips "/api" → POST /students/{id}/baseline  (your backend)
  → BaselineService.generate(student_id)
      1. Load StudentProfile from SQLite (by student_id)
      2. Ask the LLM to score the 6 competencies (structured JSON)
      3. Merge LLM result with a deterministic fallback
      4. Return {"scores": {...}}
  → frontend renders RadarChart with these scores
```

---

## 4. Implementation (Python / FastAPI / Pydantic)

### 4a. LLM response schema — `app/llm/schemas.py`

Add a Pydantic model with integer fields clamped 0–100:

```python
class CompetencyBaselineDraft(BaseModel):
    technicalFundamentals: int = Field(ge=0, le=100, default=50)
    programming: int = Field(ge=0, le=100, default=40)
    prototyping: int = Field(ge=0, le=100, default=45)
    systemsThinking: int = Field(ge=0, le=100, default=50)
    communication: int = Field(ge=0, le=100, default=50)
    learningAgility: int = Field(ge=0, le=100, default=60)
    reasoning: str = Field(default="", description="Short explanation the AI used")
```

### 4b. LLM prompt — `app/llm/prompts.py`

```python
BASELINE_SYSTEM = SYSTEM_PERSONA + """

You generate an honest, evidence-based 6-dimension competency baseline for
an engineering student based on their Minimum Viable Profile (year, major,
self-description, skills, interests, experiences).

The six dimensions (all 0-100, integers only):
  - technicalFundamentals: depth of core engineering / CS fundamentals
  - programming: hands-on coding ability
  - prototyping: ability to build things (hardware or software)
  - systemsThinking: designing for whole-system behavior
  - communication: working with others, explaining, documenting
  - learningAgility: picking up new tools/concepts quickly

Rules:
- Only score what the student's evidence actually supports. No flattery.
- Year 1 students typically score 30-55; Year 4 with real projects can
  reach 75-90. Be calibrated.
- Skills/tools the student named are strong evidence.
- The `reasoning` field briefly explains the score pattern (2-3 sentences).
- Never invent experiences the student did not mention.

Respond ONLY with a JSON object of EXACTLY this shape:
{
  "technicalFundamentals": <int>,
  "programming": <int>,
  "prototyping": <int>,
  "systemsThinking": <int>,
  "communication": <int>,
  "learningAgility": <int>,
  "reasoning": "<short explanation>"
}"""
```

### 4c. LLM client — `app/llm/client.py`

All LLM calls go through one `generate_structured` wrapper. Important
provider detail for DeepSeek (and most OpenAI-compatible APIs):

```python
# Use json_object, NOT json_schema — DeepSeek rejects json_schema with 400.
response_format = {"type": "json_object"}
```

The prompt MUST contain the word "JSON" (satisfies `json_object` requirement).
Parse + validate the LLM output with Pydantic; on failure return `None`.

### 4d. Baseline service — `app/services/baseline_service.py`

```python
class BaselineService:
    def __init__(self, profile_service):
        self.profile_service = profile_service

    async def generate(self, student_id: str) -> dict:
        profile = self.profile_service.get_or_404(student_id)
        fallback = _fallback_baseline(profile)   # deterministic (see §5)

        draft = await generate_structured(
            BASELINE_SYSTEM,
            f"Student profile:\n{profile.model_dump()}\n\n"
            "Generate the 6-dimension competency baseline as JSON.",
            CompetencyBaselineDraft,
        )
        if draft is None:
            return fallback

        # Merge: LLM only overwrites fields it returned; validate 0-100.
        result = dict(fallback)
        for key in (
            "technicalFundamentals", "programming", "prototyping",
            "systemsThinking", "communication", "learningAgility",
        ):
            value = getattr(draft, key, None)
            if isinstance(value, int) and 0 <= value <= 100:
                result[key] = value
        return result
```

### 4e. API route — `app/api/students.py`

```python
@router.post("/{student_id}/baseline")
async def generate_baseline(student_id: str):
    profile = profile_service.get_profile(student_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Student not found")
    scores = await BaselineService(profile_service).generate(student_id)
    return {"scores": scores}
```

---

## 5. Deterministic fallback (REQUIRED — the app must never break)

If the LLM is unconfigured, down, or returns invalid JSON, return a
deterministic estimate so the radar still renders. Match this behavior:

```python
def _fallback_baseline(profile) -> dict:
    scores = {
        "technicalFundamentals": 50, "programming": 40, "prototyping": 45,
        "systemsThinking": 50, "communication": 50, "learningAgility": 60,
    }
    # 1) Major preset (match on substring in profile.major.lower())
    major_presets = {
        "mechanical": {"technicalFundamentals": 62, "programming": 35, "prototyping": 70,
                       "systemsThinking": 60, "communication": 50, "learningAgility": 60},
        "computer":   {"technicalFundamentals": 55, "programming": 70, "prototyping": 50,
                       "systemsThinking": 60, "communication": 50, "learningAgility": 65},
        "electrical": {"technicalFundamentals": 60, "programming": 55, "prototyping": 55,
                       "systemsThinking": 65, "communication": 50, "learningAgility": 60},
    }
    for key, preset in major_presets.items():
        if key in profile.major.lower():
            scores.update(preset)
            break

    # 2) Year factor: Year 1 -> 0.85 ... Year 4 -> 1.10
    year = max(1, min(4, profile.year or 1))
    factor = 0.85 + (year - 1) * 0.085
    for k in scores:
        scores[k] = int(round(min(95, max(20, scores[k] * factor))))

    # 3) Evidence bumps (skills + experiences)
    n = len(profile.skills) + len(profile.experiences)
    if n >= 6:
        scores["programming"] = min(95, scores["programming"] + 8)
        scores["prototyping"] = min(95, scores["prototyping"] + 6)
    elif n >= 3:
        scores["programming"] = min(95, scores["programming"] + 4)
        scores["prototyping"] = min(95, scores["prototyping"] + 3)

    return scores
```

---

## 6. Frontend side (verify, don't rebuild)

The frontend already calls your endpoint. Just confirm these are in place:

**`frontend/src/services/api.ts`:**

```ts
async getBaseline(studentId: string): Promise<{ scores: CompetencyScores }> {
  return fetchWithFallback<{ scores: CompetencyScores }>(
    `/students/${studentId}/baseline`,
    { method: 'POST' },
    // fallback so the button is usable even if the backend is offline
    { scores: { technicalFundamentals: 55, programming: 50, prototyping: 50,
                systemsThinking: 55, communication: 50, learningAgility: 60 } }
  );
}
```

**`frontend/vite.config.ts`** — must strip `/api`:

```ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    rewrite: (path) => path.replace(/^\/api/, ''),
    changeOrigin: true,
    secure: false,
  }
}
```

**`frontend/src/context/AppContext.tsx`** — `startComparison()`:

```ts
const startComparison = async (payload?) => {
  if (baselineScores) { setCompareStatus('done'); return; }   // cache
  setCompareStatus('loading');
  try {
    const id = await ensureStudent(payload || {});
    const { scores } = await apiService.getBaseline(id);
    setBaselineScores(scores);
    setCompareStatus('done');
  } catch (err) {
    setCompareStatus('error');
  }
};
```

---

## 7. Verification checklist

- [ ] `POST /students/{id}/baseline` returns `{"scores": {...6 keys...}}` → 200
- [ ] Unknown student id → 404
- [ ] With `LLM_API_KEY` set: scores look evidence-based (C++/Python skills →
      high programming)
- [ ] Without `LLM_API_KEY`: scores still return (deterministic fallback), no 500
- [ ] Frontend: click card → spinner → radar renders (no placeholders)
- [ ] Clicking a different card reuses the same baseline (cached) — radar just
      re-compares against the new card's targets
- [ ] Vite proxy check: `curl http://localhost:8000/students/{id}/baseline`
      works directly (no `/api` needed)

---

## 8. Common mistakes to avoid

1. **Adding an `/api` prefix to backend routes** — the Vite proxy strips it;
   backend routes live at the root.
2. **Using `json_schema` response_format** — DeepSeek returns 400
   ("This response_format type is unavailable now"). Use `json_object`.
3. **Not clamping LLM ints to 0–100** — Pydantic `ge/le` handles this.
4. **Returning 500 on LLM failure** — always fall back to deterministic.
5. **Missing the exact 6 field names** — the radar breaks silently if names
   differ (`technicalFundamentals`, `programming`, `prototyping`,
   `systemsThinking`, `communication`, `learningAgility`).