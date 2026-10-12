// ============================================================
// 导出用户数据为 JSON — 仅写入 data/（本地备份用途）
// 注意：不再复制到 docs/public/data/，避免姓名/手机号被 Web 静态发布
// 用法: node scripts/export-users-json.js
// ============================================================

import { exportUsersToJson } from '../src/cli/utils/db.js';
import { getConfig } from '../src/cli/utils/config.js';
import path from 'node:path';

const config = getConfig();

const dataPath = path.join(config.dataDir, 'users.json');
const ok = exportUsersToJson(dataPath);
if (ok) {
  console.log(`✅ 用户数据已导出: ${dataPath}`);
  console.log('ℹ️ 该文件仅存于 data/ 目录（已被 .gitignore 忽略），不会随网站发布。');
} else {
  console.log('❌ 导出失败');
  process.exitCode = 1;
}
