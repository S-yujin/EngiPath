"""Questionnaire Repository.

Handles persistence of student questionnaire session states in SQLite.
"""

from datetime import datetime, timezone
import json
from typing import Any

from app.db.database import get_connection


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class QuestionnaireRepository:
    def get_session(self, student_id: str) -> dict[str, Any] | None:
        """Fetch the current signal state dictionary for a student."""
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT session_id, state_json, status, created_at, updated_at "
                "FROM questionnaire_sessions WHERE student_id = ?",
                (student_id,),
            ).fetchone()
            if row is None or row["state_json"] is None:
                return None
            return json.loads(row["state_json"])
        finally:
            conn.close()

    def save_session(
        self,
        student_id: str,
        session_id: str,
        state: dict[str, Any],
        status: str = "in_progress",
    ) -> None:
        """Upsert a questionnaire session state."""
        now = _utcnow()
        state_str = json.dumps(state, ensure_ascii=False)
        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO questionnaire_sessions (student_id, session_id, state_json, status, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?) "
                "ON CONFLICT(student_id) DO UPDATE SET "
                "session_id = excluded.session_id, "
                "state_json = excluded.state_json, "
                "status = excluded.status, "
                "updated_at = excluded.updated_at",
                (student_id, session_id, state_str, status, now, now),
            )
            conn.commit()
        finally:
            conn.close()

    def delete_session(self, student_id: str) -> None:
        """Delete / reset a student's session."""
        conn = get_connection()
        try:
            conn.execute(
                "DELETE FROM questionnaire_sessions WHERE student_id = ?",
                (student_id,),
            )
            conn.commit()
        finally:
            conn.close()
