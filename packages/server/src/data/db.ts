import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.resolve(import.meta.dirname, '../../data/escapist.db')

const db = new Database(DB_PATH)

// WAL 모드 (동시 읽기 성능 향상)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    category TEXT NOT NULL,
    interview_type TEXT NOT NULL DEFAULT 'technical',
    tags TEXT DEFAULT '[]',
    difficulty INTEGER DEFAULT 3,
    status TEXT DEFAULT 'unlearned',
    best_score REAL,
    average_score REAL,
    attempts INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    last_attempt_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
  CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    claude_session_id TEXT DEFAULT '',
    question_id TEXT DEFAULT '',
    question_text TEXT DEFAULT '',
    mode TEXT NOT NULL,
    agent TEXT DEFAULT 'interviewer',
    messages TEXT DEFAULT '[]',
    hints TEXT DEFAULT '[]',
    total_score REAL,
    grade TEXT,
    question_count INTEGER,
    streak INTEGER,
    total_answered INTEGER,
    average_score REAL,
    is_new_record INTEGER,
    categories TEXT,
    created_at TEXT NOT NULL,
    last_activity_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions(mode);
  CREATE INDEX IF NOT EXISTS idx_sessions_question_id ON sessions(question_id);

  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    job_role TEXT DEFAULT 'frontend',
    experience_level TEXT DEFAULT 'junior',
    tech_stack TEXT DEFAULT '[]',
    interest_stack TEXT DEFAULT '[]',
    ai_tools TEXT DEFAULT '[]',
    memo TEXT DEFAULT '',
    updated_at TEXT
  );
  INSERT OR IGNORE INTO user_profile (id) VALUES (1);
`)

export { db }
