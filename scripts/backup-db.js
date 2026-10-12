// ============================================================
// 数据库备份 — 快照 data/data.db 到 data/backups/，保留最近 N 份
// 用法:
//   npm run backup                       手动备份
//   （scripts/start-all.js 每次启动时也会自动调用一次）
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from '../src/cli/utils/db.js';

const KEEP = 7; // 保留最近份数

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export function runBackup({ quiet = false } = {}) {
  const dbPath = path.join(DATA_DIR, 'data.db');
  if (!fs.existsSync(dbPath)) {
    if (!quiet) console.log('ℹ️ 尚无数据库（data/data.db），跳过备份。');
    return null;
  }

  // 打开连接做 WAL 检查点，确保主库文件包含全部已提交数据后安全复制
  const db = getDb();
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const target = path.join(BACKUP_DIR, `data-${stamp}.db`);
  fs.copyFileSync(dbPath, target);

  // 按时间戳排序，只保留最近 KEEP 份
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => /^data-.*\.db$/.test(f))
    .sort()
    .reverse();
  for (const old of backups.slice(KEEP)) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, old)); } catch { /* 忽略 */ }
  }

  if (!quiet) {
    console.log(`✅ 数据库已备份: ${target}（保留最近 ${KEEP} 份）`);
  }
  return target;
}

// 直接运行时执行备份（被 import 时不自动执行）
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBackup();
}
