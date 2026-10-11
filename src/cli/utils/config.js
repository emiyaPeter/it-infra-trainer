// ============================================================
// 配置解析 — 读取 config.json 并解析路径
// ============================================================

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

let cachedConfig = null;

/**
 * 获取解析后的配置对象
 * @returns {{ dataDir: string, currentUserFile: string, projectRoot: string }}
 */
export function getConfig() {
  if (cachedConfig) return cachedConfig;

  const configPath = path.join(PROJECT_ROOT, 'config.json');
  let raw = {};

  if (fs.existsSync(configPath)) {
    try {
      raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.warn(`[config] 无法解析 config.json，使用默认配置: ${e.message}`);
    }
  }

  // 解析 dataDir
  const dataDir = resolvePath(raw.dataDir || './data', PROJECT_ROOT);

  // 解析 currentUserFile
  const currentUserFile = raw.currentUserFile
    ? resolvePath(raw.currentUserFile, PROJECT_ROOT)
    : path.join(dataDir, 'active-user.json');

  cachedConfig = {
    dataDir,
    currentUserFile,
    projectRoot: PROJECT_ROOT,
  };

  return cachedConfig;
}

/**
 * 解析路径：~ 替换为 HOME，相对路径基于 projectRoot
 */
function resolvePath(inputPath, projectRoot) {
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  return path.resolve(projectRoot, inputPath);
}

/**
 * 清除缓存（用于测试）
 */
export function clearConfigCache() {
  cachedConfig = null;
}
