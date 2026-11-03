"""Health check endpoint.

Run `GET /health` after every integration merge to confirm the app boots.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok"}
