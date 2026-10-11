// ============================================================
// 一键启动：认证服务 + VitePress 文档网站
// 用法: npm run dev
// ============================================================

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('');
console.log('🚀 正在启动 IT 培训助手...');
console.log('');

// 1. 启动认证服务
const authServer = spawn('node', ['src/server/auth-server.js'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
});

// 等 1 秒让 auth 服务先起来
await new Promise(r => setTimeout(r, 1500));

// 2. 启动 VitePress
const docsServer = spawn('npx', ['vitepress', 'dev', 'docs'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
});

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🔐 认证服务: http://localhost:3456');
console.log('  📚 课程文档: http://localhost:5173');
console.log('  📋 正确访问课程文档即可，右上角可注册/登录');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// 优雅退出
process.on('SIGINT', () => {
  authServer.kill();
  docsServer.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  authServer.kill();
  docsServer.kill();
  process.exit(0);
});
