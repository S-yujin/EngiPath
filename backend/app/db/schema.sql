-- Minimal SQLite schema for the OneTool / EngiPath MVP (handoff §20).
-- Do not over-normalise: JSON blobs are acceptable for the prototype.

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    major TEXT,
    year INTEGER,
    intro TEXT,
    target_role_id TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
    student_id TEXT PRIMARY KEY,
    profile_json TEXT NOT NULL,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS plans (
    student_id TEXT PRIMARY KEY,
    plan_json TEXT NOT NULL,
    updated_at TEXT
);

-- Simple evidence submissions for the Living Dashboard (MVP).
CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT,
    note TEXT,
    created_at TEXT
);

-- Milestones for the Living Dashboard (MVP).
CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending | completed
    created_at TEXT,
    completed_at TEXT
);

-- Stateful questionnaire sessions for the Questionnaire Intelligence Layer.
CREATE TABLE IF NOT EXISTS questionnaire_sessions (
    student_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    state_json TEXT NOT NULL,
    status TEXT DEFAULT 'in_progress',  -- in_progress | completed
    created_at TEXT,
    updated_at TEXT
);
