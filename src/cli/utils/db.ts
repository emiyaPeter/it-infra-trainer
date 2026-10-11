// ============================================================
// SQLite 数据库操作层
// ============================================================

import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const DB_DIR = path.join(os.homedir(), '.it-trainer');
const DB_PATH = path.join(DB_DIR, 'data.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  const database = db!;

  database.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT DEFAULT 'default',
      course_slug TEXT NOT NULL,
      page_slug TEXT NOT NULL,
      status TEXT CHECK(status IN ('not_started','in_progress','completed','quiz_passed','lab_done')) DEFAULT 'not_started',
      quiz_score REAL,
      completed_at TEXT,
      time_spent_min INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, page_slug)
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id TEXT NOT NULL,
      score REAL,
      answers TEXT,
      attempted_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lab_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id TEXT NOT NULL,
      completed_steps INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_progress',
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT DEFAULT (date('now')),
      duration_min INTEGER DEFAULT 0,
      topic TEXT
    );
  `);
}

// --- Progress Operations ---

export function getProgress(courseSlug?: string): ProgressRecord[] {
  const database = getDb();
  if (courseSlug) {
    return database
      .prepare('SELECT * FROM progress WHERE course_slug = ?')
      .all(courseSlug) as ProgressRecord[];
  }
  return database.prepare('SELECT * FROM progress').all() as ProgressRecord[];
}

export function updateProgress(
  pageSlug: string,
  courseSlug: string,
  status: string,
  quizScore: number | null = null,
  timeSpentMin = 0
): void {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO progress (user_id, page_slug, course_slug, status, quiz_score, completed_at, time_spent_min)
       VALUES ('default', ?, ?, ?, ?, datetime('now'), ?)
       ON CONFLICT(user_id, page_slug)
       DO UPDATE SET status = ?, quiz_score = COALESCE(?, quiz_score),
         completed_at = CASE WHEN ? IN ('completed','quiz_passed','lab_done') THEN datetime('now') ELSE completed_at END,
         time_spent_min = time_spent_min + ?`
    )
    .run(pageSlug, courseSlug, status, quizScore, timeSpentMin, status, quizScore, status, timeSpentMin);
}

export function getOverallProgress(): number {
  const database = getDb();
  const total = database
    .prepare("SELECT COUNT(*) as count FROM progress")
    .get() as { count: number };
  const completed = database
    .prepare(
      "SELECT COUNT(*) as count FROM progress WHERE status IN ('completed','quiz_passed','lab_done')"
    )
    .get() as { count: number };
  if (total.count === 0) return 0;
  return Math.round((completed.count / total.count) * 100);
}

export function getPhaseProgress(phases: Array<{ courseCategory: string }>): Record<string, number> {
  const database = getDb();
  const result: Record<string, number> = {};

  for (const phase of phases) {
    const cat = phase.courseCategory;
    const total = database
      .prepare("SELECT COUNT(*) as count FROM progress WHERE course_slug = ?")
      .get(cat) as { count: number };
    const completed = database
      .prepare(
        "SELECT COUNT(*) as count FROM progress WHERE course_slug = ? AND status IN ('completed','quiz_passed','lab_done')"
      )
      .get(cat) as { count: number };

    result[cat] = total.count === 0 ? 0 : Math.round((completed.count / total.count) * 100);
  }
  return result;
}

// --- Quiz Operations ---

export function saveQuizAttempt(quizId: string, score: number, answers: string[]): void {
  const database = getDb();
  database
    .prepare(
      'INSERT INTO quiz_attempts (quiz_id, score, answers) VALUES (?, ?, ?)'
    )
    .run(quizId, score, JSON.stringify(answers));
}

export function getQuizAttempts(quizId?: string): QuizAttempt[] {
  const database = getDb();
  if (quizId) {
    return database
      .prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? ORDER BY attempted_at DESC')
      .all(quizId) as QuizAttempt[];
  }
  return database
    .prepare('SELECT * FROM quiz_attempts ORDER BY attempted_at DESC')
    .all() as QuizAttempt[];
}

// --- Lab Operations ---

export function saveLabCompletion(labId: string, completedSteps: number, totalSteps: number, status: string): void {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO lab_completions (lab_id, completed_steps, total_steps, status, completed_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(lab_id) DO UPDATE SET completed_steps = ?, total_steps = ?, status = ?,
         completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END`
    )
    .run(labId, completedSteps, totalSteps, status, completedSteps, totalSteps, status, status);
}

export function getLabCompletions(): LabCompletion[] {
  return getDb().prepare('SELECT * FROM lab_completions').all() as LabCompletion[];
}

// --- Study Sessions ---

export function logStudySession(durationMin: number, topic: string): void {
  getDb()
    .prepare('INSERT INTO study_sessions (duration_min, topic) VALUES (?, ?)')
    .run(durationMin, topic);
}

export function getStudySessions(days = 7): StudySession[] {
  return getDb()
    .prepare("SELECT * FROM study_sessions WHERE date >= date('now', ?) ORDER BY date")
    .all(`-${days} days`) as StudySession[];
}

export function getStreak(): number {
  const database = getDb();
  const rows = database
    .prepare(
      `SELECT DISTINCT date FROM study_sessions ORDER BY date DESC LIMIT 30`
    )
    .all() as { date: string }[];

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (rows.some((r) => r.date === dateStr)) {
      streak++;
    } else if (i === 0) {
      // Today not studied yet, check from yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

// --- Re-export types for consumers ---
export interface ProgressRecord {
  course_slug: string;
  page_slug: string;
  status: string;
  quiz_score: number | null;
  completed_at: string | null;
  time_spent_min: number;
}

export interface QuizAttempt {
  id: number;
  quiz_id: string;
  score: number;
  answers: string;
  attempted_at: string;
}

export interface LabCompletion {
  id: number;
  lab_id: string;
  completed_steps: number;
  total_steps: number;
  status: string;
  completed_at: string | null;
}

export interface StudySession {
  id: number;
  date: string;
  duration_min: number;
  topic: string;
}
