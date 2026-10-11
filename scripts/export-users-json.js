// ============================================================
// 导出用户数据为 JSON — 同时写入 data/ 和 docs/public/data/
// 用法: node scripts/export-users-json.js
// ============================================================

import { exportUsersToJson } from '../src/cli/utils/db.js';
import { getConfig } from '../src/cli/utils/config.js';
import path from 'node:path';
import fs from 'node:fs';

const config = getConfig();

// 1. 写入数据目录（CLI 使用）
const dataPath = path.join(config.dataDir, 'users.json');
let ok1 = exportUsersToJson(dataPath);
if (ok1) {
  console.log(`✅ 用户数据已导出: ${dataPath}`);
}

// 2. 复制到 docs/public/data/（Web 使用）
const publicDataDir = path.join(config.projectRoot, 'docs', 'public', 'data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// 同步 active-user.json 到 public
const bridgePath = path.join(config.dataDir, 'active-user.json');
const publicBridgePath = path.join(publicDataDir, 'active-user.json');
if (fs.existsSync(bridgePath)) {
  fs.copyFileSync(bridgePath, publicBridgePath);
  console.log(`✅ 桥接文件已同步: ${publicBridgePath}`);
}

// 同步 users.json 到 public
const publicUsersPath = path.join(publicDataDir, 'users.json');
const dataUsersPath = path.join(config.dataDir, 'users.json');
if (fs.existsSync(dataUsersPath)) {
  fs.copyFileSync(dataUsersPath, publicUsersPath);
  console.log(`✅ 用户列表已同步: ${publicUsersPath}`);
}

console.log('');
console.log('🌐 Web 端现在可以读取用户数据了。');
