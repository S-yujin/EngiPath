"""Pytest configuration.

Ensures the `backend/` directory is on sys.path so `from app...` imports
work when running `pytest` from the backend directory.
"""

import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.database import init_db


@pytest.fixture(scope="session", autouse=True)
def _ensure_schema():
    """Apply schema.sql before tests.

    Tests connect to the SQLite database directly, bypassing app startup.
    Without this, any database created before a new table was added to
    schema.sql (e.g. questionnaire_sessions) makes tests fail with
    'no such table'. init_db is idempotent (CREATE TABLE IF NOT EXISTS).
    """
    init_db()
