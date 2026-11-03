"""SQLite connection and schema initialisation.

The MVP deliberately keeps the database small (handoff §20). JSON blobs
are acceptable for the 4-day prototype; it can be normalised later.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection (row factory enabled)."""
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create tables from schema.sql if the database file is new."""
    schema = _SCHEMA_PATH.read_text()
    conn = get_connection()
    try:
        conn.executescript(schema)
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Small helpers shared by repositories
# ---------------------------------------------------------------------------

def save_json_blob(table: str, student_id: str, key: str, value) -> None:
    """Upsert a JSON blob row (used by profiles and plans tables)."""
    conn = get_connection()
    try:
        conn.execute(
            f"INSERT INTO {table} (student_id, {key}, updated_at) VALUES (?, ?, ?) "
            f"ON CONFLICT(student_id) DO UPDATE SET {key} = ?, updated_at = ?",
            (
                student_id,
                json.dumps(value),
                _utcnow(),
                json.dumps(value),
                _utcnow(),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def load_json_blob(table: str, student_id: str, key: str):
    """Load a JSON blob row, or None if it does not exist."""
    conn = get_connection()
    try:
        row = conn.execute(
            f"SELECT {key} FROM {table} WHERE student_id = ?", (student_id,)
        ).fetchone()
        if row is None or row[key] is None:
            return None
        return json.loads(row[key])
    finally:
        conn.close()
