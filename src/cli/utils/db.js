// ============================================================
// SQLite 数据库操作层 — 支持多用户、数据隔离
// ============================================================

import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { getConfig } from './config.js';

let db = null;

export function getDb() {
  if (!db) {
    const config = getConfig();
    const dbDir = config.dataDir;
    const dbPath = path.join(dbDir, 'data.db');

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initializeSchema();
    runMigrations();
  }
  return db;
}

// ============================================================
// Schema 初始化
// ============================================================

function initializeSchema() {
  const database = db;

  database.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      last_active_at TEXT,
      UNIQUE(name, phone)
    );

    -- 活跃用户（始终只有一行）
    CREATE TABLE IF NOT EXISTS active_user (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      user_id TEXT NOT NULL
    );

    -- 学习进度
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

    -- 测验记录
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      quiz_id TEXT NOT NULL,
      score REAL,
      answers TEXT,
      attempted_at TEXT DEFAULT (datetime('now'))
    );

    -- 实验完成记录
    CREATE TABLE IF NOT EXISTS lab_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      lab_id TEXT NOT NULL,
      completed_steps INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_progress',
      completed_at TEXT,
      UNIQUE(user_id, lab_id)
    );

    -- 学习会话
    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      date TEXT DEFAULT (date('now')),
      duration_min INTEGER DEFAULT 0,
      topic TEXT
    );

    -- 作业成绩
    CREATE TABLE IF NOT EXISTS homework_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      homework_id TEXT NOT NULL,
      score INTEGER,
      total INTEGER,
      percentage INTEGER,
      passed INTEGER,
      attempted_at TEXT
    );
  `);
}

// ============================================================
// 数据迁移（旧版本兼容）
// ============================================================

function runMigrations() {
  const database = db;

  // --- V1 → V2：为旧表添加 user_id 列 ---

  // quiz_attempts
  if (!columnExists('quiz_attempts', 'user_id')) {
    database.exec("ALTER TABLE quiz_attempts ADD COLUMN user_id TEXT DEFAULT 'default'");
  }

  // lab_completions: 需要重建以修改 UNIQUE 约束
  if (!columnExists('lab_completions', 'user_id')) {
    // 检查旧表是否有 UNIQUE(lab_id) 约束
    const oldLabData = database.prepare('SELECT * FROM lab_completions').all();
    database.exec('DROP TABLE IF EXISTS lab_completions_old');
    database.exec('ALTER TABLE lab_completions RENAME TO lab_completions_old');
    database.exec(`
      CREATE TABLE lab_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default',
        lab_id TEXT NOT NULL,
        completed_steps INTEGER DEFAULT 0,
        total_steps INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        completed_at TEXT,
        UNIQUE(user_id, lab_id)
      )
    `);
    const insert = database.prepare(
      'INSERT INTO lab_completions (id, user_id, lab_id, completed_steps, total_steps, status, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const row of oldLabData) {
      insert.run(row.id, 'default', row.lab_id, row.completed_steps, row.total_steps, row.status, row.completed_at);
    }
    database.exec('DROP TABLE IF EXISTS lab_completions_old');
  }

  // study_sessions
  if (!columnExists('study_sessions', 'user_id')) {
    database.exec("ALTER TABLE study_sessions ADD COLUMN user_id TEXT DEFAULT 'default'");
  }

  // homework_results (可能由 homework.js 动态创建，不保证存在)
  try {
    if (tableExists('homework_results') && !columnExists('homework_results', 'user_id')) {
      database.exec("ALTER TABLE homework_results ADD COLUMN user_id TEXT DEFAULT 'default'");
    }
  } catch (e) {
    // homework_results 表不存在，忽略
  }

  // --- 确保有 default 用户和活跃用户记录 ---
  const existingDefault = database.prepare("SELECT id FROM users WHERE name = 'default' AND phone = '00000000000'").get();
  let defaultUserId;
  if (!existingDefault) {
    const info = database.prepare("INSERT INTO users (name, phone) VALUES ('default', '00000000000')").run();
    defaultUserId = String(info.lastInsertRowid);
  } else {
    defaultUserId = String(existingDefault.id);
  }

  // 确保 active_user 有值
  const activeRow = database.prepare('SELECT user_id FROM active_user WHERE id = 1').get();
  if (!activeRow) {
    database.prepare('INSERT OR REPLACE INTO active_user (id, user_id) VALUES (1, ?)').run(defaultUserId);
  }
}

function columnExists(tableName, columnName) {
  const database = db;
  try {
    const cols = database.prepare(`PRAGMA table_info(${tableName})`).all();
    return cols.some(c => c.name === columnName);
  } catch {
    return false;
  }
}

function tableExists(tableName) {
  const database = db;
  const row = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
  return !!row;
}

// ============================================================
// 用户管理
// ============================================================

export function createUser(name, phone) {
  const database = getDb();
  // 检查重复
  const existing = database.prepare('SELECT id FROM users WHERE name = ? AND phone = ?').get(name, phone);
  if (existing) {
    return { existed: true, id: String(existing.id) };
  }
  const info = database.prepare('INSERT INTO users (name, phone) VALUES (?, ?)').run(name, phone);
  const newId = String(info.lastInsertRowid);

  // 如果是第一个真实用户（除了 default），自动切换
  const count = database.prepare("SELECT COUNT(*) as c FROM users WHERE name != 'default'").get();
  if (count.c === 1) {
    setActiveUser(newId);
  }

  return { existed: false, id: newId };
}

export function getAllUsers() {
  const database = getDb();
  return database.prepare('SELECT * FROM users ORDER BY name').all();
}

export function getUserByName(name) {
  const database = getDb();
  return database.prepare('SELECT * FROM users WHERE name = ?').all(name);
}

export function getUserById(userId) {
  const database = getDb();
  return database.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

export function deleteUser(userId) {
  const database = getDb();
  const userIdStr = String(userId);

  // 删除所有关联数据
  database.prepare('DELETE FROM progress WHERE user_id = ?').run(userIdStr);
  database.prepare('DELETE FROM quiz_attempts WHERE user_id = ?').run(userIdStr);
  database.prepare('DELETE FROM lab_completions WHERE user_id = ?').run(userIdStr);
  database.prepare('DELETE FROM study_sessions WHERE user_id = ?').run(userIdStr);
  try {
    database.prepare('DELETE FROM homework_results WHERE user_id = ?').run(userIdStr);
  } catch (e) { /* 表可能不存在 */ }

  // 如果当前活跃用户是被删除的，切换到 default
  const activeId = getActiveUserId();
  if (activeId === userIdStr) {
    const defaultUser = database.prepare("SELECT id FROM users WHERE name = 'default'").get();
    if (defaultUser) {
      setActiveUser(String(defaultUser.id));
    }
  }

  database.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return { deleted: true };
}

export function renameUser(userId, newName) {
  const database = getDb();
  const existing = database.prepare('SELECT id FROM users WHERE name = ? AND id != ?').get(newName, userId);
  if (existing) {
    return { conflict: true };
  }
  database.prepare('UPDATE users SET name = ? WHERE id = ?').run(newName, userId);
  writeActiveUserBridgeFile(getActiveUserId());
  return { conflict: false };
}

// ============================================================
// 活跃用户管理
// ============================================================

export function getActiveUserId() {
  const database = getDb();
  const row = database.prepare('SELECT user_id FROM active_user WHERE id = 1').get();
  if (row && row.user_id) return row.user_id;

  // 回退：找第一个用户
  const firstUser = database.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  if (firstUser) {
    const id = String(firstUser.id);
    setActiveUser(id);
    return id;
  }
  // 极端情况：创建 default
  const info = database.prepare("INSERT INTO users (name, phone) VALUES ('default', '00000000000')").run();
  setActiveUser(String(info.lastInsertRowid));
  return String(info.lastInsertRowid);
}

export function getActiveUserName() {
  const userId = getActiveUserId();
  const user = getUserById(Number(userId));
  if (user && user.name !== 'default') return user.name;
  // 尝试用 phone 识别
  if (user && user.phone && user.phone !== '00000000000') return user.phone;
  return user ? user.name : '未知用户';
}

export function setActiveUser(userId) {
  const database = getDb();
  const userIdStr = String(userId);

  // 验证用户存在
  const user = database.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error(`用户 ID ${userId} 不存在`);

  database.prepare('INSERT OR REPLACE INTO active_user (id, user_id) VALUES (1, ?)').run(userIdStr);
  database.prepare("UPDATE users SET last_active_at = datetime('now') WHERE id = ?").run(userId);

  // 写入桥接文件供 Web 读取
  writeActiveUserBridgeFile(userIdStr);
}

function writeActiveUserBridgeFile(userId) {
  const config = getConfig();
  const database = db;
  const user = database.prepare('SELECT name, phone FROM users WHERE id = ?').get(userId);

  if (!user) return;

  const bridgeData = JSON.stringify({
    name: user.name,
    phone: user.phone,
    activeSince: new Date().toISOString(),
  }, null, 2);

  // 写入 data/ 目录（仅本地，不同步到 docs/public —— 避免姓名/手机号被当作静态资源对外服务）
  const bridgeFile = config.currentUserFile;
  try {
    const dir = path.dirname(bridgeFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(bridgeFile, bridgeData);
  } catch (e) {
    console.warn(`[db] 无法写入桥接文件 ${bridgeFile}: ${e.message}`);
  }
}

// ============================================================
// 进度操作
// ============================================================

export function getProgress(courseSlug) {
  const database = getDb();
  const userId = getActiveUserId();
  if (courseSlug) {
    return database
      .prepare('SELECT * FROM progress WHERE user_id = ? AND course_slug = ?')
      .all(userId, courseSlug);
  }
  return database.prepare('SELECT * FROM progress WHERE user_id = ?').all(userId);
}

export function updateProgress(pageSlug, courseSlug, status, quizScore = null, timeSpentMin = 0) {
  const database = getDb();
  const userId = getActiveUserId();
  database
    .prepare(
      `INSERT INTO progress (user_id, page_slug, course_slug, status, quiz_score, completed_at, time_spent_min)
       VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
       ON CONFLICT(user_id, page_slug)
       DO UPDATE SET status = ?, quiz_score = COALESCE(?, quiz_score),
         completed_at = CASE WHEN ? IN ('completed','quiz_passed','lab_done') THEN datetime('now') ELSE completed_at END,
         time_spent_min = time_spent_min + ?`
    )
    .run(userId, pageSlug, courseSlug, status, quizScore, timeSpentMin, status, quizScore, status, timeSpentMin);
}

export function getOverallProgress() {
  const database = getDb();
  const userId = getActiveUserId();
  const total = database
    .prepare("SELECT COUNT(*) as count FROM progress WHERE user_id = ?")
    .get(userId);
  const completed = database
    .prepare(
      "SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND status IN ('completed','quiz_passed','lab_done')"
    )
    .get(userId);
  if (total.count === 0) return 0;
  return Math.round((completed.count / total.count) * 100);
}

export function getPhaseProgress(phases) {
  const database = getDb();
  const userId = getActiveUserId();
  const result = {};
  for (const phase of phases) {
    const total = database
      .prepare("SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND course_slug = ?")
      .get(userId, phase.courseCategory || phase.course_slug);
    const completed = database
      .prepare(
        "SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND course_slug = ? AND status IN ('completed','quiz_passed','lab_done')"
      )
      .get(userId, phase.courseCategory || phase.course_slug);
    result[phase.id || phase.title] = total.count === 0 ? 0 : Math.round((completed.count / total.count) * 100);
  }
  return result;
}

// ============================================================
// 测验操作
// ============================================================

export function saveQuizAttempt(quizId, score, answers) {
  const database = getDb();
  const userId = getActiveUserId();
  database
    .prepare(
      'INSERT INTO quiz_attempts (user_id, quiz_id, score, answers) VALUES (?, ?, ?, ?)'
    )
    .run(userId, quizId, score, JSON.stringify(answers));
}

export function getQuizAttempts(quizId) {
  const database = getDb();
  const userId = getActiveUserId();
  if (quizId) {
    return database
      .prepare('SELECT * FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY attempted_at DESC')
      .all(userId, quizId);
  }
  return database
    .prepare('SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY attempted_at DESC')
    .all(userId);
}

// ============================================================
// 实验操作
// ============================================================

export function saveLabCompletion(labId, completedSteps, totalSteps, status) {
  const database = getDb();
  const userId = getActiveUserId();
  database
    .prepare(
      `INSERT INTO lab_completions (user_id, lab_id, completed_steps, total_steps, status, completed_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, lab_id) DO UPDATE SET completed_steps = ?, total_steps = ?, status = ?,
         completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END`
    )
    .run(userId, labId, completedSteps, totalSteps, status, completedSteps, totalSteps, status, status);
}

export function getLabCompletions() {
  const database = getDb();
  const userId = getActiveUserId();
  return database.prepare('SELECT * FROM lab_completions WHERE user_id = ?').all(userId);
}

// ============================================================
// 学习会话
// ============================================================

export function logStudySession(durationMin, topic) {
  const database = getDb();
  const userId = getActiveUserId();
  database
    .prepare('INSERT INTO study_sessions (user_id, duration_min, topic) VALUES (?, ?, ?)')
    .run(userId, durationMin, topic);
}

export function getStudySessions(days = 7) {
  const database = getDb();
  const userId = getActiveUserId();
  return database
    .prepare("SELECT * FROM study_sessions WHERE user_id = ? AND date >= date('now', ?) ORDER BY date")
    .all(userId, `-${days} days`);
}

export function getStreak() {
  const database = getDb();
  const userId = getActiveUserId();
  const rows = database
    .prepare(
      `SELECT DISTINCT date FROM study_sessions WHERE user_id = ? ORDER BY date DESC LIMIT 30`
    )
    .all(userId);

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
      // 今天还没学，从昨天开始算
      continue;
    } else {
      break;
    }
  }

  return streak;
}

// ============================================================
// 作业成绩
// ============================================================

export function saveHomeworkResult(homeworkId, score, total, percentage, passed) {
  const database = getDb();
  const userId = getActiveUserId();
  // 确保表存在
  database.exec(`
    CREATE TABLE IF NOT EXISTS homework_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      homework_id TEXT NOT NULL,
      score INTEGER,
      total INTEGER,
      percentage INTEGER,
      passed INTEGER,
      attempted_at TEXT
    )
  `);
  database
    .prepare(
      'INSERT INTO homework_results (user_id, homework_id, score, total, percentage, passed, attempted_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))'
    )
    .run(userId, homeworkId, score, total, percentage, passed ? 1 : 0);
}

export function getHomeworkResults(homeworkId) {
  const database = getDb();
  const userId = getActiveUserId();
  try {
    if (homeworkId) {
      return database
        .prepare('SELECT * FROM homework_results WHERE user_id = ? AND homework_id = ? ORDER BY attempted_at DESC')
        .all(userId, homeworkId);
    }
    return database
      .prepare('SELECT * FROM homework_results WHERE user_id = ? ORDER BY attempted_at DESC')
      .all(userId);
  } catch {
    return [];
  }
}

// ============================================================
// 数据导出（供 Web 层使用）
// ============================================================

export function exportUsersToJson(outputPath) {
  const database = getDb();
  const users = database.prepare('SELECT id, name, phone, created_at, last_active_at FROM users ORDER BY name').all();
  const activeUserId = getActiveUserId();
  const data = {
    activeUserId,
    users,
  };
  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.warn(`[db] 无法导出用户数据: ${e.message}`);
    return false;
  }
}
