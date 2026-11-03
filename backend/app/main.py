"""Engipath API — application entrypoint.

Responsible only for creating the FastAPI app, registering routers and
application startup. No business logic lives here.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from app.llm.locale import current_language, normalize_language
from fastapi.middleware.cors import CORSMiddleware

from app.api import careers, chat, dashboard, gap, health, plans, reflection, students
from app.config import settings
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist on startup so the app is immediately usable.
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-assisted career reflection and development companion for "
        "engineering students."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

@app.middleware("http")
async def language_middleware(request: Request, call_next):
    """Use selected frontend language for each request, default Korean."""
    language = normalize_language(request.headers.get("Accept-Language", "ko"))
    token = current_language.set(language)
    try:
        return await call_next(request)
    finally:
        current_language.reset(token)

# Allow the frontend dev server to call this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(students.router)
app.include_router(reflection.router)
app.include_router(careers.router)
app.include_router(gap.router)
app.include_router(plans.router)
app.include_router(dashboard.router)
app.include_router(chat.router)
