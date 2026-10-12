// ============================================================
// export-progress 命令 — 导出当前用户全部学习记录为 JSON
// 用途：备份、换机迁移、查看原始数据
// ============================================================

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import {
  getDb, getActiveUserId, getUserById,
} from '../utils/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = path.join(__dirname, '..', '..', '..', 'data', 'exports');

export async function exportProgress() {
  const db = getDb();
  const userId = getActiveUserId();
  const user = getUserById(Number(userId));

  if (!user || user.name === 'default') {
    console.log(chalk.yellow('\n  当前没有真实用户。请先运行: it-trainer user create <姓名> <手机号>\n'));
    return;
  }

  const rows = {
    progress: db.prepare('SELECT course_slug, page_slug, status, quiz_score, completed_at, time_spent_min FROM progress WHERE user_id = ? ORDER BY course_slug, page_slug').all(userId),
    quizAttempts: db.prepare('SELECT quiz_id, score, attempted_at FROM quiz_attempts WHERE user_id = ? ORDER BY attempted_at DESC').all(userId),
    labCompletions: db.prepare('SELECT lab_id, completed_steps, total_steps, status, completed_at FROM lab_completions WHERE user_id = ?').all(userId),
    studySessions: db.prepare('SELECT date, duration_min, topic FROM study_sessions WHERE user_id = ? ORDER BY date').all(userId),
    homeworkResults: db.prepare('SELECT homework_id, score, total, percentage, passed, attempted_at FROM homework_results WHERE user_id = ? ORDER BY attempted_at DESC').all(userId),
  };

  const payload = {
    app: 'it-infra-trainer',
    scope: 'cli-records',
    version: 1,
    exportedAt: new Date().toISOString(),
    user: { name: user.name, phone: user.phone, createdAt: user.created_at },
    records: rows,
  };

  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const file = `progress-${user.name}-${stamp}.json`;
  const outPath = path.join(EXPORTS_DIR, file);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

  const total = Object.values(rows).reduce((s, arr) => s + arr.length, 0);
  console.log('');
  console.log(chalk.bold.cyan('📤 学习记录已导出'));
  console.log(chalk.gray('─'.repeat(55)));
  console.log(`  ${chalk.yellow('用户')}: ${user.name} (${user.phone})`);
  console.log(`  ${chalk.yellow('进度')}: ${rows.progress.length} 条`);
  console.log(`  ${chalk.yellow('测验')}: ${rows.quizAttempts.length} 次`);
  console.log(`  ${chalk.yellow('实验')}: ${rows.labCompletions.length} 项`);
  console.log(`  ${chalk.yellow('会话')}: ${rows.studySessions.length} 次`);
  console.log(`  ${chalk.yellow('作业')}: ${rows.homeworkResults.length} 次`);
  console.log(`  ${chalk.yellow('文件')}: ${chalk.green(outPath)}`);
  console.log(`  ${chalk.gray(`共 ${total} 条记录（data/exports/ 目录）`)}`);
  console.log('');
}
