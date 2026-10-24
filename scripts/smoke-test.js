// ============================================================
// 冒烟自检 — 语法检查 + CLI 冒烟 + 生产构建
// 用法: npm test          （完整，含构建，约 30-60 秒）
//       SKIP_BUILD=1 npm test   （跳过构建，秒级）
// ============================================================

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKIP_BUILD = process.env.SKIP_BUILD === '1';

const CHECK_FILES = [
  'scripts/start-all.js',
  'scripts/backup-db.js',
  'scripts/export-users-json.js',
  'scripts/init-db.js',
  'scripts/set-api-key.js',
  'src/cli/index.js',
  'src/cli/utils/bash.js',
  'src/cli/utils/db.js',
  'src/cli/utils/config.js',
  'src/cli/utils/env.js',
  'src/cli/utils/ai.js',
  'src/cli/commands/env-check.js',
  'src/cli/commands/homework.js',
  'src/cli/commands/lab.js',
  'src/cli/commands/progress.js',
  'src/cli/commands/quiz.js',
  'src/cli/commands/roadmap.js',
  'src/cli/commands/search.js',
  'src/cli/commands/start.js',
  'src/cli/commands/stats.js',
  'src/cli/commands/user.js',
  'src/cli/commands/export-progress.js',
  'src/cli/commands/ask.js',
  'src/server/auth-server.js',
];

// CLI 冒烟：非交互命令必须退出码 0
const SMOKE_CLI = [
  ['src/cli/index.js', ['user', 'list']],
  ['src/cli/index.js', ['user', 'current']],
  ['src/cli/index.js', ['lab', '--list']],
  ['src/cli/index.js', ['homework', '--list']],
  ['src/cli/index.js', ['roadmap']],
];

let failed = 0;
const ok = (msg) => console.log(`  ✅ ${msg}`);
const bad = (msg) => { failed++; console.error(`  ❌ ${msg}`); };

function run(cmd, args, label, expectOutput) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf-8', timeout: 120000, windowsHide: true });
  const passed = r.status === 0 && (!expectOutput || (r.stdout || '').includes(expectOutput));
  passed ? ok(label) : bad(`${label} (exit=${r.status})${r.stderr ? ' :: ' + r.stderr.slice(0, 300) : ''}`);
  return passed;
}

console.log('');
console.log('🧪 IT 培训助手冒烟自检');
console.log('─'.repeat(50));

console.log('\n[1/3] 语法检查（node --check）');
for (const f of CHECK_FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) { bad(`文件缺失: ${f}`); continue; }
  const r = spawnSync(process.execPath, ['--check', f], { cwd: ROOT, encoding: 'utf-8', windowsHide: true });
  r.status === 0 ? ok(f) : bad(`${f} :: ${r.stderr.slice(0, 200)}`);
}

console.log('\n[2/3] CLI 冒烟');
for (const [entry, args] of SMOKE_CLI) {
  run(process.execPath, [entry, ...args], `node ${entry} ${args.join(' ')}`);
}

console.log('\n[3/3] 生产构建（vitepress build）');
if (SKIP_BUILD) {
  ok('已跳过（SKIP_BUILD=1）');
} else {
  const r = spawnSync(process.execPath,
    [path.join('node_modules', 'vitepress', 'bin', 'vitepress.js'), 'build', 'docs'],
    { cwd: ROOT, encoding: 'utf-8', timeout: 300000, windowsHide: true });
  // vitepress 进度输出走 stderr，判定以退出码 + 构建产物为准
  const distOk = fs.existsSync(path.join(ROOT, 'docs', '.vitepress', 'dist', 'index.html'));
  (r.status === 0 && distOk)
    ? ok('vitepress build 完成，产物已生成')
    : bad(`vitepress build 失败 (exit=${r.status}) :: ${(r.stderr || r.stdout || '').slice(-400)}`);
}

console.log('\n' + '─'.repeat(50));
if (failed > 0) {
  console.error(`🚨 ${failed} 项未通过`);
  process.exit(1);
} else {
  console.log('🎉 全部通过');
}
