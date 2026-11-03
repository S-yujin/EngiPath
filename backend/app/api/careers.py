"""Career API (handoff §21, §22).

    GET  /careers/cards                     at least 6 aspirational career cards (FR1)
    GET  /careers/search?q=                 search occupations
    POST /students/{id}/careers             recommended directions + alignment
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.occupation import OccupationProfile
from app.services.career_service import CareerService
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/careers", tags=["careers"])

career_service = CareerService()
profile_service = ProfileService()


@router.get("/cards")
async def career_cards():
    return {"careers": career_service.career_cards()}


@router.get("/search")
async def search_careers(q: str = ""):
    results = career_service.search(q)
    return {"results": [occ.model_dump() for occ in results]}


@router.get("/{onetsoc_code}", response_model=OccupationProfile)
async def get_occupation(onetsoc_code: str):
    occ = career_service.get_occupation(onetsoc_code)
    if occ is None:
        raise HTTPException(status_code=404, detail="Occupation not found")
    return occ
