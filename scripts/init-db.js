// ============================================================
// 初始化数据库 — 使用统一入口，自动创建表并运行迁移
// ============================================================

import { getDb, getActiveUserId, getUserById } from '../src/cli/utils/db.js';

console.log('');
console.log('🔧 初始化 IT 培训助手数据库...');
console.log('');

const db = getDb();
const dbPath = db.name; // better-sqlite3 的 name 属性是 DB 文件路径

console.log(`  ✓ 数据目录: ${dbPath}`);
console.log('  ✓ 数据表已就绪: users, active_user, progress, quiz_attempts, lab_completions, study_sessions, homework_results');
console.log('  ✓ 已创建默认用户');

// 检查当前活跃用户
const activeId = getActiveUserId();
const activeUser = getUserById(Number(activeId));
if (activeUser) {
  console.log(`  ✓ 当前用户: ${activeUser.name}${activeUser.phone !== '00000000000' ? ` (${activeUser.phone})` : ''}`);
}

console.log('');
console.log('✅ 数据库初始化完成！');
console.log('');
console.log('接下来你可以:');
console.log('  npm run cli -- user create <姓名> <手机号>   — 创建你的账户');
console.log('  npm run docs:dev                              — 启动课程文档网站');
console.log('  npm run cli -- roadmap                        — 查看学习路线图');
console.log('  npm run cli -- env-check                      — 检查环境配置');
console.log('');

db.close();
