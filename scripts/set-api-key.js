// ============================================================
// AI 密钥配置 — 交互式写入本地 .env（gitignored，永不入库）
// 用法: npm run set-key（重复运行即可更换服务商或密钥）
// 支持 DeepSeek / Kimi / 智谱 等任意 OpenAI 兼容接口
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import inquirer from 'inquirer';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '..', '.env');

const PROVIDERS = [
  { name: 'DeepSeek（默认推荐）', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { name: 'Kimi（月之暗面）', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { name: '自定义（任意 OpenAI 兼容接口）', baseUrl: '', model: '' },
];

function readEnv() {
  const map = {};
  if (fs.existsSync(ENV_PATH)) {
    for (const line of fs.readFileSync(ENV_PATH, 'utf-8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) map[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return map;
}

function writeEnv(updates) {
  const existing = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, 'utf-8').split(/\r?\n/)
    : [];
  const handled = new Set();
  const out = existing.map((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m && updates[m[1]] !== undefined) {
      handled.add(m[1]);
      return `${m[1]}=${updates[m[1]]}`;
    }
    return line;
  });
  for (const [k, v] of Object.entries(updates)) {
    if (!handled.has(k)) out.push(`${k}=${v}`);
  }
  fs.writeFileSync(ENV_PATH, out.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n') + '\n');
}

function mask(v) {
  if (!v) return chalk.gray('（未配置）');
  return v.length <= 8 ? '****' : v.slice(0, 4) + '****' + v.slice(-4);
}

async function main() {
  console.log('');
  console.log(chalk.bold.cyan('🔑 AI 答疑密钥配置'));
  console.log(chalk.gray('─'.repeat(50)));

  const cur = readEnv();
  if (cur.AI_API_KEY) {
    console.log(`  当前配置: ${chalk.green(cur.AI_MODEL || '?')} @ ${cur.AI_BASE_URL || '?'}  密钥 ${mask(cur.AI_API_KEY)}`);
    console.log(chalk.gray('  重新运行本脚本可随时更换。'));
  } else {
    console.log(chalk.gray('  密钥只写入本地 .env（已被 gitignore），不会进入代码库或网页。'));
  }
  console.log('');

  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: '选择 AI 服务商:',
    choices: PROVIDERS.map((p) => p.name),
  }]);

  let { baseUrl, model } = PROVIDERS.find((p) => p.name === provider);

  if (!baseUrl) {
    const ans = await inquirer.prompt([
      { type: 'input', name: 'baseUrl', message: 'API 地址（OpenAI 兼容，如 https://xxx/v1）:', validate: (v) => /^https?:\/\//.test(v) || '需以 http(s):// 开头' },
      { type: 'input', name: 'model', message: '模型名（如 gpt-4o-mini）:' },
    ]);
    baseUrl = ans.baseUrl.replace(/\/+$/, '');
    model = ans.model || 'gpt-4o-mini';
  } else {
    baseUrl = baseUrl.replace(/\/+$/, '');
    const { confirmModel } = await inquirer.prompt([{
      type: 'input',
      name: 'confirmModel',
      message: `模型名（回车用默认 ${model}）:`,
    }]);
    if (confirmModel.trim()) model = confirmModel.trim();
  }

  const { apiKey } = await inquirer.prompt([{
    type: 'password',
    name: 'apiKey',
    message: '粘贴 API 密钥（输入时隐藏）:',
    mask: '*',
    validate: (v) => v.trim().length >= 8 || '密钥看起来太短了',
  }]);

  writeEnv({
    AI_BASE_URL: baseUrl,
    AI_API_KEY: apiKey.trim(),
    AI_MODEL: model,
  });

  console.log('');
  console.log(chalk.green(`✅ 已保存到 ${ENV_PATH}`));
  console.log(`   服务: ${chalk.cyan(model)} @ ${baseUrl}`);
  console.log('');
  console.log(`   现在可以用了: ${chalk.yellow('npm run cli -- ask "什么是子网掩码"')}`);
  console.log('');
}

main().catch((e) => { console.error('配置失败:', e.message); process.exit(1); });
