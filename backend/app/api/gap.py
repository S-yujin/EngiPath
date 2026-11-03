"""Gap Analysis API (handoff §21, §23).

    POST /students/{id}/gap-analysis   body: {"onetsoc_code": "..."}
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.gap import GapAnalysis
from app.services.gap_service import GapService

router = APIRouter(prefix="/students/{student_id}", tags=["gap"])

gap_service = GapService()


class GapRequest(BaseModel):
    onetsoc_code: str = Field(min_length=1, description="Target occupation code")


@router.post("/gap-analysis", response_model=GapAnalysis)
async def gap_analysis(student_id: str, payload: GapRequest):
    result = gap_service.compare(student_id, payload.onetsoc_code)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Student or occupation not found",
        )
    analysis, occupation, profile = result
    # LLM explanation enriches the response (deterministic fallback otherwise).
    analysis.unknown = analysis.unknown  # keep bucket shape
    return analysis
