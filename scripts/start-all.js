// ============================================================
// 一键启动：VitePress 课程网站（v2.2 起不再拉起认证服务）
// 用法: npm run dev
//
// 改进点：
//   1. 直接以 node 启动 vitepress 入口，不经过 shell 包装，
//      Ctrl+C / 关窗时子进程可被可靠回收（Windows 下不再残留孤儿进程）
//   2. 轮询 5173 端口直到服务真正就绪后才自动打开浏览器，
//      消除旧版"固定等 2 秒就开浏览器"的竞态（首次冷启动常显示无法访问）
//   3. 设置环境变量 IT_TRAINER_NO_OPEN=1 可禁止自动开浏览器（调试用）
// ============================================================

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.DOCS_PORT || 5173;
const URL = `http://localhost:${PORT}/`;
const NO_OPEN = process.env.IT_TRAINER_NO_OPEN === '1';

console.log('');
console.log('🚀 正在启动 IT 培训助手课程网站...');

// 启动前自动备份一次数据库（静默，保留最近 7 份）
try {
  const { runBackup } = await import('./backup-db.js');
  runBackup({ quiet: true });
} catch { /* 备份失败不阻塞启动 */ }

// 直接用 node 启动 vitepress CLI（避免 shell 包装导致 Windows 下 kill 不掉子进程）
const docsServer = spawn(
  process.execPath,
  [path.join('node_modules', 'vitepress', 'bin', 'vitepress.js'), 'dev', 'docs'],
  { cwd: ROOT, stdio: 'inherit', windowsHide: true }
);

let opened = false;

async function waitForServer(totalTimeoutMs = 60000) {
  const startedAt = Date.now();
  // 首次冷启动（依赖预构建）可能较慢，每 500ms 轮询一次
  while (Date.now() - startedAt < totalTimeoutMs) {
    try {
      const resp = await fetch(`http://127.0.0.1:${PORT}/`, {
        signal: AbortSignal.timeout(2000),
      });
      if (resp.ok || resp.status === 200 || resp.status >= 300) return true;
    } catch {
      // 尚未就绪，继续等
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function openBrowser() {
  let child;
  if (process.platform === 'win32') {
    child = spawn('cmd.exe', ['/c', 'start', '""', URL], { detached: true, stdio: 'ignore', windowsHide: true });
  } else if (process.platform === 'darwin') {
    child = spawn('open', [URL], { detached: true, stdio: 'ignore' });
  } else {
    child = spawn('xdg-open', [URL], { detached: true, stdio: 'ignore' });
  }
  if (child) child.unref();
}

docsServer.on('spawn', () => {
  waitForServer().then((ready) => {
    if (!ready || docsServer.exitCode !== null) return;
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📚 课程文档: ${URL}`);
    console.log('     （手机/平板：连同一 WiFi，用终端显示的 Network 地址访问）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!NO_OPEN && !opened) {
      opened = true;
      openBrowser();
    }
  });
});

// 退出清理：信号转发给子进程，子进程退出后本进程随之退出
function shutdown() {
  if (docsServer.exitCode === null) {
    docsServer.kill();
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);

docsServer.on('exit', (code) => {
  console.log('');
  console.log(`课程网站已停止 (exit ${code ?? 0})。`);
  process.exit(code ?? 0);
});
