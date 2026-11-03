"""Application configuration.

All settings are read from environment variables (or a local `.env` file).
Each developer creates their own `.env` from `.env.example`; real secrets
are never committed.
"""

import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Runtime settings for the Engipath backend."""

    # --- General ---
    APP_NAME: str = "Engipath API"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in {"1", "true", "yes"}

    # --- Storage ---
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./engipath.db")

    # --- O*NET data ---
    ONET_DATA_PATH: str = os.getenv(
        "ONET_DATA_PATH", "./app/data/processed/occupations.jsonl"
    )
    ONET_RAW_DIR: str = os.getenv(
        "ONET_RAW_DIR", "./app/data/raw"
    )

    # --- LLM ---
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "")
    # Maximum number of LLM retries on malformed / failed responses.
    LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "2"))
    # If no LLM key is configured, services fall back to deterministic
    # (heuristic) behaviour so the app still boots and can be demoed.
    LLM_ENABLED: bool = os.getenv("LLM_ENABLED", "true").lower() in {"1", "true", "yes"}

    # --- Question flow ---
    MAX_CORE_QUESTIONS: int = int(os.getenv("MAX_CORE_QUESTIONS", "5"))
    MAX_FOLLOW_UP_QUESTIONS: int = int(os.getenv("MAX_FOLLOW_UP_QUESTIONS", "4"))
    MAX_SHORT_TERM_ACTIONS: int = int(os.getenv("MAX_SHORT_TERM_ACTIONS", "3"))

    # --- CORS (frontend dev server) ---
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")


settings = Settings()
