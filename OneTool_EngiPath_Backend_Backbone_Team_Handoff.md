# OneTool / EngiPath --- Backend Backbone & Team Handoff

> **Scope:** Track A only\
> **Team:** 2 backend developers\
> **Sprint:** 4 days\
> **Goal:** Provide a simple backend backbone that teammates can pull
> from GitHub and immediately implement their assigned modules without
> restructuring the project.

------------------------------------------------------------------------

# 1. What We Are Building

OneTool / EngiPath is an AI-assisted career reflection and development
companion for students.

The MVP backend should support this journey:

``` text
Choose / explore a career
        ↓
Create minimum student profile
        ↓
Behavioral reflection questions
        ↓
Build Reflection Portrait
        ↓
Retrieve relevant O*NET career knowledge
        ↓
Career alignment / target-role gap analysis
        ↓
Generate maximum 3 short-term actions
        ↓
Save state for the Living Dashboard
```

The product should not behave like a technical examination or a one-shot
résumé matcher.

The AI should focus on:

-   what the student has experienced;
-   what the student personally did;
-   how they approached it;
-   what tools/methods they used;
-   what they enjoyed or struggled with;
-   what evidence supports a reflection;
-   what is still unknown;
-   what they should explore or develop next.

The current product requirements also require:

-   at least 6 aspirational career cards;
-   a Low Match → High Match confidence/alignment result early in
    onboarding;
-   behavioral/experience-based reflection;
-   an explainable Reflection Portrait;
-   student ability to agree/disagree/add context;
-   maximum 3 short-term actions over 4--8 weeks;
-   a 1--2 year longer-term vision;
-   a lightweight Living Dashboard containing confidence, milestones,
    growth/evidence information.

For the 4-day MVP, implement the smallest backend capable of
demonstrating this end-to-end flow.

------------------------------------------------------------------------

# 2. Backend Design Principles

## Keep it simple

Use:

-   **Python**
-   **FastAPI**
-   **Pydantic**
-   **SQLite**
-   \*\*O\*NET JSON\*\*
-   **LLM API/client**
-   Optional vector search only after basic retrieval works

Do not begin with:

-   microservices;
-   Redis;
-   Celery;
-   Kafka;
-   Kubernetes;
-   complex agent frameworks;
-   complicated authentication;
-   production-scale infrastructure.

The backend should initially be one FastAPI application.

------------------------------------------------------------------------

# 3. High-Level Architecture

``` text
                         FRONTEND
                            │
                            ▼
                         FastAPI
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
       Student API     Reflection API    Career API
            │               │               │
            └───────────────┼───────────────┘
                            ▼
                       Orchestrator
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 Reflection/Profile     Career Service       Gap Service
        │                   │                   │
        │                   │                   ▼
        │                   │             Planning Service
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                      Shared Services
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          SQLite       O*NET Store      LLM Client
```

Important separation:

### Code/database should handle

-   storage;
-   O\*NET loading;
-   exact lookups;
-   deterministic comparisons;
-   IDs;
-   profile persistence;
-   history.

### LLM should handle

-   extracting information from natural language;
-   generating adaptive reflection questions;
-   interpreting experience;
-   explaining patterns;
-   explaining gap analysis;
-   generating action plans.

**The LLM is not the database.**

------------------------------------------------------------------------

# 4. Repository Structure

Create this backbone before dividing implementation work:

``` text
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── students.py
│   │   ├── reflection.py
│   │   ├── careers.py
│   │   ├── gap.py
│   │   └── plans.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── student.py
│   │   ├── experience.py
│   │   ├── reflection.py
│   │   ├── occupation.py
│   │   ├── gap.py
│   │   └── action_plan.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── profile_service.py
│   │   ├── reflection_service.py
│   │   ├── career_service.py
│   │   ├── gap_service.py
│   │   └── planning_service.py
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── client.py
│   │   ├── prompts.py
│   │   └── schemas.py
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   └── schema.sql
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── student_repository.py
│   │   └── occupation_repository.py
│   │
│   └── data/
│       ├── raw/
│       │   ├── occupation_data.json
│       │   ├── essential_skills.json
│       │   ├── software_skills.json
│       │   ├── knowledge.json
│       │   └── career_interest_types.json
│       │
│       └── processed/
│           └── occupations.jsonl
│
├── scripts/
│   └── preprocess_onet.py
│
├── tests/
│   ├── test_health.py
│   ├── test_career_service.py
│   ├── test_reflection_service.py
│   └── test_gap_service.py
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

Do not add unnecessary folders during the sprint unless there is a real
requirement.

------------------------------------------------------------------------

# 5. First Files to Create

The repository owner should create the skeleton before teammates branch
off.

## `app/main.py`

Responsible only for:

-   creating FastAPI;
-   registering routers;
-   application startup.

Example structure:

``` python
from fastapi import FastAPI

from app.api import health, students, reflection, careers, gap, plans

app = FastAPI(title="OneTool / EngiPath API")

app.include_router(health.router)
app.include_router(students.router)
app.include_router(reflection.router)
app.include_router(careers.router)
app.include_router(gap.router)
app.include_router(plans.router)
```

Do not place business logic inside `main.py`.

------------------------------------------------------------------------

# 6. Shared Data Contracts --- Agree on These First

Both developers must agree on the following schemas before working
independently:

``` text
StudentProfile
Experience
ReflectionItem
ReflectionPortrait
OccupationProfile
GapAnalysis
ActionPlan
```

These are the contracts between modules.

------------------------------------------------------------------------

# 7. Student Profile

Minimum conceptual schema:

``` python
class StudentProfile(BaseModel):
    student_id: str
    major: str | None = None
    year: int | None = None
    intro: str | None = None

    skills: list[str] = []
    experiences: list[Experience] = []
    interests: list[str] = []

    strengths: list[ReflectionItem] = []
    development_areas: list[ReflectionItem] = []
    unknown_areas: list[str] = []

    target_role_id: str | None = None
```

Do not treat `skills` as verified proficiency.

It means the skill/tool has appeared in the student's current profile.

------------------------------------------------------------------------

# 8. Experience Schema

``` python
class Experience(BaseModel):
    type: str
    title: str | None = None
    description: str | None = None

    contributions: list[str] = []
    tools_used: list[str] = []

    enjoyed: list[str] = []
    struggled_with: list[str] = []
    learned: list[str] = []
```

Examples of `type`:

``` text
academic_project
personal_project
internship
employment
volunteering
club
competition
research
course
other
```

------------------------------------------------------------------------

# 9. Reflection Item

Every important AI reflection should preserve its reason/evidence.

``` python
class ReflectionItem(BaseModel):
    area: str
    reason: str
    evidence: list[str] = []
```

Example:

``` json
{
  "area": "Technical problem solving",
  "reason": "The student described repeatedly testing different approaches when debugging robot navigation.",
  "evidence": [
    "Debugged navigation failures in autonomous robot project"
  ]
}
```

------------------------------------------------------------------------

# 10. Reflection Portrait

The product requirement expects a portrait containing multiple
categories.

Recommended response:

``` python
class ReflectionPortrait(BaseModel):
    supported_strengths: list[ReflectionItem]
    possible_overlooked_strengths: list[ReflectionItem]
    areas_to_validate: list[ReflectionItem]
    development_areas: list[ReflectionItem]
    insufficient_information: list[str]
```

The student should eventually be able to:

``` text
Agree
Disagree
Add Context
```

A correction should update the profile/portrait instead of being
ignored.

------------------------------------------------------------------------

# 11. Occupation Profile

The raw O\*NET datasets should be merged into one internal occupation
representation.

``` python
class OccupationProfile(BaseModel):
    onetsoc_code: str
    title: str
    description: str

    essential_skills: list[dict] = []
    software_skills: list[dict] = []
    knowledge: list[dict] = []
    career_interests: dict = {}
```

Do not invent fields or scores that do not exist in the actual
downloaded O\*NET files.

------------------------------------------------------------------------

# 12. O\*NET Data Pipeline

Current source datasets:

``` text
Occupation Data
Essential Skills
Software Skills
Knowledge
Career Interest Types
```

Raw:

``` text
app/data/raw/
```

The preprocessing script:

``` text
scripts/preprocess_onet.py
```

should:

``` text
Load all five JSON datasets
        ↓
Inspect/validate fields
        ↓
Group records by onetsoc_code
        ↓
Join occupation information
        ↓
Normalize into OccupationProfile
        ↓
Write occupations.jsonl
```

Use:

``` text
onetsoc_code
```

as the canonical join key.

Do not make the application repeatedly join five large JSON files during
every API request.

------------------------------------------------------------------------

# 13. Processed Knowledge Example

Conceptual only --- use the real O\*NET fields when implementing:

``` json
{
  "onetsoc_code": "15-1252.00",
  "title": "Software Developers",
  "description": "Research, design, and develop computer and network software...",

  "essential_skills": [
    {
      "name": "Programming",
      "importance": 4.5
    }
  ],

  "software_skills": [
    {
      "name": "Python"
    },
    {
      "name": "Git"
    }
  ],

  "knowledge": [
    {
      "name": "Computers and Electronics",
      "importance": 4.6
    }
  ],

  "career_interests": {
    "realistic": 0.0,
    "investigative": 0.0,
    "artistic": 0.0,
    "social": 0.0,
    "enterprising": 0.0,
    "conventional": 0.0
  }
}
```

------------------------------------------------------------------------

# 14. Retrieval --- Start Without RAG

Do not block the project waiting for embeddings/vector search.

### Version 1

Implement:

``` python
search_occupations(query: str)
get_occupation(onetsoc_code: str)
```

Search:

-   title;
-   description;
-   possibly skills.

Simple exact/fuzzy search is enough initially.

### Version 2 --- only if time permits

Add:

``` text
Chroma / FAISS
+
Embeddings
```

for semantic retrieval.

The rest of the backend should not care whether retrieval is exact,
fuzzy, or vector-based.

Expose the same service interface.

------------------------------------------------------------------------

# 15. Repository Layer

Keep storage logic out of API routes.

Example:

``` python
class StudentRepository:

    def create(self, student):
        ...

    def get(self, student_id):
        ...

    def update_profile(self, student_id, profile):
        ...
```

Occupation:

``` python
class OccupationRepository:

    def search(self, query):
        ...

    def get(self, onetsoc_code):
        ...
```

Services call repositories.

Routes call services.

------------------------------------------------------------------------

# 16. Service Layer

## Profile Service

Responsible for:

-   creating/updating StudentProfile;
-   applying extracted profile updates;
-   saving student corrections;
-   retrieving current profile.

## Reflection Service

Responsible for:

-   storing question/answer;
-   calling the Reflection LLM;
-   deciding/generating next question;
-   generating Reflection Portrait.

## Career Service

Responsible for:

-   career-card data;
-   occupation retrieval;
-   candidate career search;
-   basic alignment calculation;
-   career explanation context.

## Gap Service

Responsible for:

-   loading student profile;
-   loading target occupation;
-   deterministic comparison;
-   classifying evidence;
-   calling LLM for explanation.

## Planning Service

Responsible for:

-   converting gap analysis into maximum 3 actions;
-   producing 4--8 week actions;
-   producing 1--2 year vision;
-   saving current plan.

------------------------------------------------------------------------

# 17. Lightweight Agent Design

For this sprint, an "agent" can simply be a well-defined LLM-backed
Python function/service.

Do not require LangGraph or another orchestration framework.

Example:

``` python
async def analyze_reflection(profile, question, answer):
    ...
```

``` python
async def generate_portrait(profile):
    ...
```

``` python
async def explain_career_alignment(profile, occupation):
    ...
```

``` python
async def explain_gap(profile, occupation, comparison):
    ...
```

``` python
async def generate_action_plan(profile, gap_analysis):
    ...
```

The important part is responsibility separation, not framework
complexity.

------------------------------------------------------------------------

# 18. LLM Client

All LLM calls should pass through:

``` text
app/llm/client.py
```

Do not scatter provider-specific calls across services.

Example interface:

``` python
async def generate_structured(
    system_prompt: str,
    user_prompt: str,
    response_model
):
    ...
```

This allows the team to change models/providers without rewriting every
service.

------------------------------------------------------------------------

# 19. Structured LLM Output

Avoid passing uncontrolled prose between backend modules.

Example reflection result:

``` json
{
  "skills_observed": [
    "C++",
    "OpenCV"
  ],

  "new_experiences": [],

  "possible_strengths": [
    {
      "area": "Technical problem solving",
      "reason": "Student described iterative debugging.",
      "evidence": [
        "Debugged autonomous robot navigation"
      ]
    }
  ],

  "unknowns": [
    "team collaboration"
  ],

  "next_question": "When the navigation system failed, how did you decide what to test first?"
}
```

Validate LLM responses using Pydantic.

------------------------------------------------------------------------

# 20. Minimal SQLite Schema

Do not over-normalize the MVP database.

Suggested tables:

``` sql
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    major TEXT,
    year INTEGER,
    intro TEXT,
    target_role_id TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE profiles (
    student_id TEXT PRIMARY KEY,
    profile_json TEXT NOT NULL,
    updated_at TEXT
);

CREATE TABLE reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TEXT
);

CREATE TABLE plans (
    student_id TEXT PRIMARY KEY,
    plan_json TEXT NOT NULL,
    updated_at TEXT
);
```

JSON blobs are acceptable for the four-day prototype.

The architecture can be normalized later if the project continues.

------------------------------------------------------------------------

# 21. Core API Contract

Keep the frontend/backend contract small.

## Health

``` http
GET /health
```

Response:

``` json
{
  "status": "ok"
}
```

------------------------------------------------------------------------

## Create Student

``` http
POST /students
```

Request:

``` json
{
  "major": "Computer Engineering",
  "year": 2,
  "intro": "I enjoy AI and robotics but I am unsure which direction to pursue."
}
```

Response:

``` json
{
  "student_id": "..."
}
```

------------------------------------------------------------------------

## Get Student

``` http
GET /students/{student_id}
```

Returns current StudentProfile.

------------------------------------------------------------------------

## Submit Reflection

``` http
POST /students/{student_id}/reflection
```

Request:

``` json
{
  "question": "Tell me about a project you worked on.",
  "answer": "I built an autonomous robot using C++ and OpenCV."
}
```

Response:

``` json
{
  "profile_updates": {},
  "next_question": "What part of the robot did you personally implement?"
}
```

------------------------------------------------------------------------

## Generate Portrait

``` http
POST /students/{student_id}/portrait
```

Response:

``` json
{
  "supported_strengths": [],
  "possible_overlooked_strengths": [],
  "areas_to_validate": [],
  "development_areas": [],
  "insufficient_information": []
}
```

------------------------------------------------------------------------

## Correct Portrait

``` http
POST /students/{student_id}/portrait/feedback
```

Request:

``` json
{
  "item": "Technical problem solving",
  "feedback_type": "add_context",
  "context": "I also used this approach during my internship."
}
```

Backend should update relevant student context and regenerate/update the
portrait.

------------------------------------------------------------------------

## Career Cards

``` http
GET /careers/cards
```

Return at least six career cards required by the current product
requirements.

These may initially be curated from O\*NET.

------------------------------------------------------------------------

## Search Careers

``` http
GET /careers/search?q=software
```

Return relevant occupations.

------------------------------------------------------------------------

## Recommend / Explore Careers

``` http
POST /students/{student_id}/careers
```

Return a small set of career directions and alignment levels.

Example:

``` json
{
  "careers": [
    {
      "onetsoc_code": "15-1252.00",
      "title": "Software Developers",
      "alignment": "High",
      "reasons": [
        "..."
      ],
      "uncertainties": [
        "..."
      ]
    }
  ]
}
```

------------------------------------------------------------------------

## Gap Analysis

``` http
POST /students/{student_id}/gap-analysis
```

Request:

``` json
{
  "onetsoc_code": "15-1252.00"
}
```

Response:

``` json
{
  "target_role": "Software Developers",

  "confirmed": [],
  "partial": [],
  "development_areas": [],
  "unknown": []
}
```

------------------------------------------------------------------------

## Action Plan

``` http
POST /students/{student_id}/action-plan
```

Response:

``` json
{
  "short_term_actions": [
    {
      "title": "...",
      "why": "...",
      "duration": "4-8 weeks",
      "suggested_evidence": "...",
      "reflection_prompt": "..."
    }
  ],

  "long_term_vision": {
    "timeframe": "1-2 years",
    "description": "..."
  }
}
```

`short_term_actions` must contain **no more than 3 items**.

------------------------------------------------------------------------

# 22. Career Alignment / Confidence

The current requirements call for:

``` text
Low Match → High Match
```

early in onboarding.

For MVP, do not build a machine-learning recommendation model.

Use a simple explainable comparison.

Possible internal signals:

``` text
Essential skill overlap
Software/tool overlap
Knowledge overlap
Career-interest alignment
Relevant experience signals
```

If an internal numeric score is used, convert it into categories:

``` text
Low
Moderate
Good
High
```

The user-facing UI should emphasize **why**, not decimal precision.

Example:

``` json
{
  "alignment": "High",
  "reasons": [
    "Programming appears repeatedly across your projects.",
    "You have used several tools relevant to software development.",
    "You described enjoying debugging and system-building."
  ]
}
```

------------------------------------------------------------------------

# 23. Gap Analysis Logic

Do not ask the LLM to perform the entire comparison from memory.

Use:

``` text
Student Profile
        +
Retrieved Occupation Profile
        ↓
Deterministic comparison
        ↓
Structured comparison
        ↓
LLM explanation
```

Classifications:

``` text
CONFIRMED
PARTIAL
DEVELOPMENT AREA
UNKNOWN
```

Example:

``` json
{
  "area": "Programming",
  "status": "confirmed",
  "student_evidence": [
    "Used C++ for autonomous robot project"
  ],
  "reason": "Programming is relevant to the target occupation and the student has described direct experience."
}
```

Important:

> No evidence is not automatically proof that the student lacks the
> capability.

------------------------------------------------------------------------

# 24. Questionnaire Flow

Keep the adaptive questionnaire simple.

Recommended:

``` text
5 core questions
+
2–4 adaptive follow-ups
```

Core themes:

1.  meaningful experience/project;
2.  personal contribution;
3.  tools/methods;
4.  challenge/problem-solving;
5.  enjoyment/interests.

Possible logic:

``` text
Receive answer
    ↓
Store reflection
    ↓
Reflection LLM analyzes answer
    ↓
Update Student Profile
    ↓
Need more context?
    │
    ├── Yes → return follow-up
    │
    └── No → move to next core question
    ↓
Enough information / max questions?
    ↓
Generate Reflection Portrait
```

Do not spend the sprint building a sophisticated adaptive-question
engine.

------------------------------------------------------------------------

# 25. Action Plan Rules

The Planning Service should enforce:

``` text
Maximum 3 short-term actions
4–8 week horizon
+
1–2 year long-term vision
```

Each short-term action should include:

``` text
Title
Why
What to do
Suggested evidence
Reflection prompt
```

The plan should create opportunities for new reflection.

Example:

``` json
{
  "title": "Build one small applied ML project",
  "why": "Your profile shows programming experience but limited evidence of independently applying machine learning.",
  "suggested_evidence": "GitHub repository and short project reflection",
  "reflection_prompt": "Which part of the project did you enjoy most, and which decisions were hardest?"
}
```

------------------------------------------------------------------------

# 26. Living Dashboard --- MVP Backend

Do not build a complex analytics system.

For MVP, the dashboard backend only needs to return:

``` text
Current profile
Current Reflection Portrait
Current career/target
Current alignment
Current action plan
Completed milestones
Submitted evidence (simple)
```

A future version can add:

-   weekly history;
-   trend analysis;
-   richer growth metrics;
-   notifications;
-   evidence verification.

------------------------------------------------------------------------

# 27. Work Split for Two Backend Developers

## Developer A --- Backend/Data Foundation

Primary responsibility:

``` text
FastAPI
SQLite
Pydantic shared models
O*NET preprocessing
Occupation repository
Career retrieval
Career APIs
Basic comparison utilities
```

Suggested ownership:

``` text
app/main.py
app/config.py

app/db/
app/repositories/

app/models/occupation.py

app/services/career_service.py

app/api/careers.py
app/api/students.py

scripts/preprocess_onet.py
```

------------------------------------------------------------------------

## Developer B --- AI / Reflection / Planning

Primary responsibility:

``` text
LLM client
LLM schemas
Reflection flow
Profile extraction/update
Portrait generation
Gap explanation
Planning
```

Suggested ownership:

``` text
app/llm/

app/models/reflection.py
app/models/gap.py
app/models/action_plan.py

app/services/profile_service.py
app/services/reflection_service.py
app/services/gap_service.py
app/services/planning_service.py

app/api/reflection.py
app/api/gap.py
app/api/plans.py
```

------------------------------------------------------------------------

# 28. Shared Files --- Coordinate Before Editing

These files/interfaces affect both developers:

``` text
app/models/student.py
app/models/experience.py
app/models/occupation.py
app/models/gap.py
app/models/action_plan.py
```

Agree on schemas first.

Avoid both developers changing shared schemas independently.

------------------------------------------------------------------------

# 29. Git Workflow

Recommended:

``` text
main
│
├── feature/data-career
│
└── feature/ai-reflection
```

Optional smaller branches:

``` text
feature/onet-preprocessing
feature/student-api
feature/reflection-agent
feature/gap-analysis
feature/action-plan
```

Rules:

1.  `main` should stay runnable.
2.  Pull/rebase before starting work each day.
3.  Keep commits small.
4.  Do not commit `.env`.
5.  Do not commit API keys.
6.  Avoid changing another developer's owned module without
    coordination.
7.  Merge shared schema changes early.
8.  Run the health endpoint after every integration merge.

------------------------------------------------------------------------

# 30. `.env.example`

Commit:

``` text
.env.example
```

Example:

``` env
LLM_API_KEY=
LLM_MODEL=
DATABASE_PATH=./engipath.db
ONET_DATA_PATH=./app/data/processed/occupations.jsonl
```

Each developer creates their own:

``` text
.env
```

Never commit real keys.

------------------------------------------------------------------------

# 31. `requirements.txt`

Start minimal.

Example categories:

``` text
fastapi
uvicorn
pydantic
python-dotenv
```

Then add only the actual LLM SDK and retrieval dependencies your team
chooses.

Do not add large frameworks "just in case."

------------------------------------------------------------------------

# 32. README --- Required Setup Instructions

The repository README should let a teammate clone and run the backend
without asking for help.

Minimum:

``` bash
git clone <repository>
cd backend

python -m venv .venv
```

Activate environment.

macOS/Linux:

``` bash
source .venv/bin/activate
```

Windows:

``` bash
.venv\Scripts\activate
```

Install:

``` bash
pip install -r requirements.txt
```

Create:

``` text
.env
```

from:

``` text
.env.example
```

Preprocess O\*NET:

``` bash
python scripts/preprocess_onet.py
```

Run:

``` bash
uvicorn app.main:app --reload
```

Test:

``` text
GET /health
```

Swagger:

``` text
/docs
```

------------------------------------------------------------------------

# 33. Day-by-Day Backend Plan

## Day 1 --- Backbone + Data

### Developer A

-   create FastAPI backbone;
-   SQLite setup;
-   shared schemas;
-   O\*NET preprocessing;
-   occupation lookup/search.

### Developer B

-   LLM client;
-   structured LLM schemas;
-   Reflection Agent;
-   basic Profile extraction/update.

### End-of-day target

This works:

``` text
Create student
    ↓
Submit reflection
    ↓
LLM extracts structured information
    ↓
Student Profile updates
```

------------------------------------------------------------------------

## Day 2 --- Career Intelligence

### Developer A

-   career-card endpoint;
-   career search;
-   occupation retrieval;
-   basic alignment/comparison utilities.

### Developer B

-   Reflection Portrait;
-   career explanation;
-   Gap Analysis Agent.

### End-of-day target

This works:

``` text
Student Profile
    ↓
Career directions
    ↓
Select target
    ↓
Gap analysis
```

------------------------------------------------------------------------

## Day 3 --- Planning + Persistence

### Developer A

-   save portrait/results;
-   dashboard read endpoints;
-   milestone/evidence skeleton if needed.

### Developer B

-   Planning Agent;
-   3-action constraint;
-   long-term vision;
-   student feedback/correction flow.

### End-of-day target

Full backend journey works.

------------------------------------------------------------------------

## Day 4 --- Integration Only

Both developers:

-   frontend integration;
-   fix API contracts;
-   test demo personas;
-   prompt tuning;
-   error handling;
-   bug fixing;
-   README/setup verification.

Do not add major features unless the full core journey already works.

------------------------------------------------------------------------

# 34. Minimum Tests

Do not attempt comprehensive enterprise testing.

At minimum verify:

### Health

``` text
GET /health → 200
```

### O\*NET

``` text
search "software"
→ returns occupations
```

### Student

``` text
create student
→ retrieve same student
```

### Reflection

``` text
submit project experience
→ profile contains extracted tools/experience
```

### Portrait

``` text
generate portrait
→ all expected categories exist
```

### Gap

``` text
known target occupation
→ confirmed/partial/development/unknown arrays returned
```

### Plan

``` text
generate plan
→ <= 3 short-term actions
```

------------------------------------------------------------------------

# 35. What NOT to Build During the 4-Day Sprint

Unless the core flow is already complete, skip:

-   production authentication;
-   OAuth;
-   complex permissions;
-   PostgreSQL migration;
-   Redis;
-   background queues;
-   websockets;
-   LangGraph;
-   complex multi-agent orchestration;
-   job-board scraping;
-   regional labour-market integrations;
-   transcript parsing;
-   GitHub repository analysis;
-   certificate verification;
-   advanced evidence verification;
-   full weekly analytics;
-   sophisticated growth scoring;
-   notification systems;
-   gamification;
-   large-scale vector infrastructure.

------------------------------------------------------------------------

# 36. Definition of Backend MVP Complete

The backend is ready for demo when this complete flow works:

``` text
1. Create student
        ↓
2. Student answers reflection questions
        ↓
3. Profile updates from answers
        ↓
4. Reflection Portrait generated with reasons/evidence
        ↓
5. Career directions retrieved
        ↓
6. Alignment level explained
        ↓
7. Student selects target role
        ↓
8. Gap analysis generated
        ↓
9. Maximum 3 short-term actions generated
        ↓
10. 1–2 year vision generated
        ↓
11. Results are persisted
        ↓
12. Frontend can retrieve them
```

If this works reliably, **stop adding architecture and focus on demo
quality**.

------------------------------------------------------------------------

# 37. First Team Meeting Checklist

Before splitting into branches, both backend developers should agree on:

-   [ ] Python version
-   [ ] FastAPI
-   [ ] LLM provider/model
-   [ ] `StudentProfile` schema
-   [ ] `Experience` schema
-   [ ] `ReflectionPortrait` schema
-   [ ] `OccupationProfile` schema
-   [ ] `GapAnalysis` schema
-   [ ] `ActionPlan` schema
-   [ ] API endpoint names
-   [ ] O\*NET raw file locations
-   [ ] `.env` variable names
-   [ ] branch ownership
-   [ ] JSON response conventions
-   [ ] what counts as MVP complete

Only after these contracts are agreed should both developers begin
independent implementation.

------------------------------------------------------------------------

# 38. Immediate Starting Order

If the repository is currently empty, do this in order:

``` text
STEP 1
Create folders + FastAPI health endpoint
        ↓
STEP 2
Define shared Pydantic schemas
        ↓
STEP 3
Set up SQLite
        ↓
STEP 4
Preprocess O*NET JSON
        ↓
STEP 5
Implement occupation search/get
        ↓
STEP 6
Implement LLM client
        ↓
STEP 7
Implement reflection → profile update
        ↓
STEP 8
Implement Reflection Portrait
        ↓
STEP 9
Implement career alignment
        ↓
STEP 10
Implement gap analysis
        ↓
STEP 11
Implement action plan
        ↓
STEP 12
Connect frontend + test full journey
```

------------------------------------------------------------------------

# 39. Guiding Rule

Whenever deciding whether to add another backend component, ask:

> **Does this help us demonstrate the student's core reflection → career
> understanding → gap → action journey within the 4-day sprint?**

If not, defer it.

The goal is not to build the final production architecture in four days.

The goal is to create a **clean backbone that both developers can work
on independently and that proves the OneTool/EngiPath product concept
end-to-end.**
