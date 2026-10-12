// ============================================================
// 跨平台 bash 执行工具（lab / homework 实操检查共用）
// - Windows：通过 wsl.exe 在 WSL2 内执行（实验环境本就位于 WSL）
//   使用 execFileSync 参数数组，避免 cmd.exe 的引号转义问题
// - macOS/Linux：直接以宿主 bash 执行
// ============================================================

import { execFileSync } from 'node:child_process';

const IS_WINDOWS = process.platform === 'win32';

let wslAvailable; // 缓存探测结果，避免每次检查都拉起 wsl.exe

function detectWsl() {
  if (wslAvailable !== undefined) return wslAvailable;
  try {
    execFileSync('wsl.exe', ['-e', 'true'], {
      timeout: 10000, stdio: 'ignore', windowsHide: true,
    });
    wslAvailable = true;
  } catch {
    wslAvailable = false;
  }
  return wslAvailable;
}

/** 单引号包裹为安全的 bash 字面量参数 */
export function shq(value) {
  return "'" + String(value).replace(/'/g, `'\\''`) + "'";
}

/**
 * 在 bash 中执行命令，同步返回结果（不会抛异常）。
 *
 * @param {string} command 要执行的 bash 命令
 * @param {{timeout?: number, shell?: string}} [options] shell 可强制指定宿主 shell 路径
 * @returns {{ok: boolean, output: string, error?: string, wslMissing?: boolean}}
 */
export function runBash(command, { timeout = 15000, shell } = {}) {
  // 非 Windows，或显式指定了宿主 shell：直接执行
  if (!IS_WINDOWS || shell) {
    try {
      const output = execFileSync(shell || '/bin/bash', ['-c', command], {
        encoding: 'utf-8', timeout,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { ok: true, output: output ?? '' };
    } catch (err) {
      return { ok: false, output: err.stdout || '', error: err.message };
    }
  }

  // Windows：优先走 WSL
  if (!detectWsl()) {
    return {
      ok: false,
      output: '',
      error: '未检测到 WSL2。实操检查需要在 WSL2 (Ubuntu) 环境中完成，请先在管理员 PowerShell 运行: wsl --install -d Ubuntu',
      wslMissing: true,
    };
  }

  try {
    const output = execFileSync('wsl.exe', ['-e', 'bash', '-c', command], {
      encoding: 'utf-8', timeout, windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, output: output ?? '' };
  } catch (err) {
    return { ok: false, output: err.stdout || '', error: err.message };
  }
}
