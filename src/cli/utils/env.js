// ============================================================
// 环境变量加载器 — 轻量 .env 解析（不引入 dotenv 依赖）
// ============================================================

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * 加载 .env 文件到 process.env
 * 支持格式: KEY=VALUE, KEY="VALUE", KEY='VALUE'
 * 忽略空行和 # 注释行
 */
export function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');

  if (!fs.existsSync(envPath)) {
    return; // .env 不存在，静默跳过
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');

  for (let line of lines) {
    line = line.trim();

    // 跳过空行和注释
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // 去除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // 只在未设置时覆盖（系统环境变量优先）
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
