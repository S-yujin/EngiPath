"""Storage access for students and their profiles (handoff §15).

Routes never touch the database directly — services call repositories,
routes call services.
"""

import uuid
from datetime import datetime, timezone

from app.db.database import get_connection, load_json_blob, save_json_blob
from app.models.experience import Experience
from app.models.student import StudentProfile


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class StudentRepository:
    def create(
        self,
        major: str | None = None,
        year: int | None = None,
        intro: str | None = None,
        skills: list[str] | None = None,
        interests: list[str] | None = None,
        experiences: list[Experience] | None = None,
    ) -> StudentProfile:
        student_id = str(uuid.uuid4())
        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO students (id, major, year, intro, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (student_id, major, year, intro, _utcnow(), _utcnow()),
            )
            conn.commit()
        finally:
            conn.close()

        profile = StudentProfile(
            student_id=student_id,
            major=major,
            year=year,
            intro=intro,
            skills=skills or [],
            interests=interests or [],
            experiences=experiences or [],
        )
        self.update_profile(profile)
        return profile

    def exists(self, student_id: str) -> bool:
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT id FROM students WHERE id = ?", (student_id,)
            ).fetchone()
            return row is not None
        finally:
            conn.close()

    def get(self, student_id: str) -> StudentProfile | None:
        raw = load_json_blob("profiles", student_id, "profile_json")
        if raw is None:
            return None
        return StudentProfile.model_validate(raw)

    def update_profile(self, profile: StudentProfile) -> StudentProfile:
        save_json_blob("profiles", profile.student_id, "profile_json", profile.model_dump())
        conn = get_connection()
        try:
            conn.execute(
                "UPDATE students SET updated_at = ?, target_role_id = ? WHERE id = ?",
                (_utcnow(), profile.target_role_id, profile.student_id),
            )
            conn.commit()
        finally:
            conn.close()
        return profile

    def delete(self, student_id: str) -> None:
        conn = get_connection()
        try:
            conn.execute("DELETE FROM profiles WHERE student_id = ?", (student_id,))
            conn.execute("DELETE FROM reflections WHERE student_id = ?", (student_id,))
            conn.execute("DELETE FROM plans WHERE student_id = ?", (student_id,))
            conn.execute("DELETE FROM evidence WHERE student_id = ?", (student_id,))
            conn.execute("DELETE FROM milestones WHERE student_id = ?", (student_id,))
            conn.execute("DELETE FROM students WHERE id = ?", (student_id,))
            conn.commit()
        finally:
            conn.close()
