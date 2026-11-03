"""Student API (handoff §21).

    POST /students                             create student (Minimum Viable Profile)
    GET  /students/{student_id}                retrieve current profile
    POST /students/{student_id}/careers        recommended directions + alignment
    POST /students/{student_id}/careers/cards  curated career cards (FR1, LLM-personalized)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.experience import Experience
from app.models.student import StudentProfile
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/students", tags=["students"])

profile_service = ProfileService()


class StudentCreate(BaseModel):
    """Step 1: Minimum Viable Profile.

    Users describe themselves up front (intro / skills / interests /
    experiences) so the AI knows the user before curating career cards.
    """

    major: str | None = Field(default=None, description="Student's major")
    year: int | None = Field(default=None, ge=1, le=10, description="Year of study")
    intro: str | None = Field(default=None, description="Self-description")
    skills: list[str] = Field(default_factory=list, description="Known tools/skills")
    interests: list[str] = Field(default_factory=list, description="Areas of interest")
    experiences: list[Experience] = Field(
        default_factory=list, description="Past projects / experiences"
    )


class StudentCreated(BaseModel):
    student_id: str


@router.post("", response_model=StudentCreated, status_code=201)
async def create_student(payload: StudentCreate):
    student = profile_service.create_student(
        major=payload.major,
        year=payload.year,
        intro=payload.intro,
        skills=payload.skills,
        interests=payload.interests,
        experiences=payload.experiences,
    )
    return StudentCreated(student_id=student.student_id)


@router.get("/{student_id}", response_model=StudentProfile)
async def get_student(student_id: str):
    profile = profile_service.get_profile(student_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return profile


class RecommendCareersResponse(BaseModel):
    careers: list[dict]


@router.post("/{student_id}/careers", response_model=RecommendCareersResponse)
async def recommend_careers(student_id: str, limit: int = 5):
    """Return a small set of career directions and alignment levels (FR2)."""
    profile = profile_service.get_profile(student_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Student not found")
    from app.services.career_service import CareerService

    return RecommendCareersResponse(careers=CareerService().recommend(profile, limit=limit))


class CuratedCardsResponse(BaseModel):
    careers: list[dict]


@router.post("/{student_id}/careers/cards", response_model=CuratedCardsResponse)
async def curated_career_cards(student_id: str, limit: int = 6):
    """Step 2: Curated career cards.

    After the user completes the Minimum Viable Profile, this returns career
    cards curated to their profile — at least 6 aspirational cards (FR1),
    each with an alignment level and plain-language reasons. The curation
    goes through the LLM when configured; otherwise it falls back to the
    deterministic shortlist.
    """
    profile = profile_service.get_profile(student_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Student not found")
    if limit < 6:
        limit = 6  # FR1: always at least 6 cards
    from app.services.career_service import CareerService

    return CuratedCardsResponse(
        careers=await CareerService().curated_cards(profile, limit=limit)
    )


@router.post("/{student_id}/baseline")
async def generate_baseline(student_id: str):
    """Step 1.5: "Start Comparison" — generate the 6-dimension competency
    baseline (radar chart scores) for the student from their profile.

    Goes through the LLM when configured; falls back to a deterministic
    estimate so the chart is never empty.
    """
    profile = profile_service.get_profile(student_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Student not found")
    from app.services.baseline_service import BaselineService

    scores = await BaselineService().generate(student_id)
    return {"scores": scores}
