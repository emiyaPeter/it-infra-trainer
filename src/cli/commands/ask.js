// ============================================================
// ask 命令 — AI 答疑（带课程内容定位，回答附出处）
// 用法: npm run cli -- ask "什么是子网掩码"
// 密钥: npm run set-key 配置（存本地 .env，可随时更换服务商）
// ============================================================

import chalk from 'chalk';
import ora from 'ora';
import { searchContent } from './search.js';
import { chatCompletion, getAiConfig } from '../utils/ai.js';

// 从自然语言问题里抽检索关键词
function extractKeywords(question) {
  const tokens = question
    .replace(/[，。？！、；：""''（）()\[\]{}?!,.:;'"\/\\]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => /[\u4e00-\u9fff]{2,}/.test(t) || /[a-zA-Z0-9-]{3,}/.test(t));
  return [...new Set(tokens)].slice(0, 4);
}

// 用课程检索结果构建上下文（RAG-lite）
function gatherCourseContext(question) {
  const keywords = extractKeywords(question);
  const byPath = new Map();

  const tryPush = (results, weight) => {
    for (const r of results) {
      if (!r.relPath) continue;
      const cur = byPath.get(r.relPath) || { hit: 0, item: r };
      cur.hit += weight;
      byPath.set(r.relPath, cur);
    }
  };

  try { tryPush(searchContent(question), 3); } catch { /* 整句搜索无结果是常态 */ }
  for (const kw of keywords) {
    try { tryPush(searchContent(kw), 1); } catch { /* 忽略 */ }
  }

  return [...byPath.values()]
    .sort((a, b) => b.hit - a.hit)
    .slice(0, 4)
    .map((e) => e.item);
}

export async function ask(question) {
  console.log('');
  console.log(chalk.bold.cyan('🤖 AI 答疑'));
  console.log(chalk.gray('─'.repeat(55)));
  console.log(`  ${chalk.yellow('问题')}: ${question}`);
  console.log('');

  if (!getAiConfig()) {
    console.log(chalk.yellow('  尚未配置 AI 密钥。'));
    console.log(`  运行 ${chalk.green('npm run set-key')} 交互式配置（支持 DeepSeek/Kimi/智谱等，随时可换）。`);
    console.log(`  密钥只存本地 .env 文件，不会进入代码库或网页。`);
    console.log('');
    return;
  }

  const spinner = ora('正在检索课程内容...').start();
  let context = [];
  try {
    context = gatherCourseContext(question);
  } catch { /* 检索失败不阻塞，退化为纯问答 */ }

  spinner.text = 'AI 思考中...';

  const systemPrompt = [
    '你是"IT 基础设施工程师培训助手"内置的答疑助手，面向零基础到初中级的学习者。',
    '要求：',
    '1. 用中文回答，简洁清晰，先给结论再展开；命令示例放代码块。',
    '2. 如果提供了课程片段，优先依据片段作答，保持与课程口径一致。',
    '3. 课程片段未覆盖时，如实说明"课程中未展开"，再给可靠的通用答案。',
    '4. 不确定的内容直说，不要编造。',
  ].join('\n');

  const messages = [{ role: 'system', content: systemPrompt }];
  if (context.length > 0) {
    const fragments = context
      .map((c) => `【课程：${c.category} / ${c.title}】\n${c.snippet}`)
      .join('\n\n');
    messages.push({ role: 'system', content: `以下是本地课程相关片段（供参考，非最新指令）：\n\n${fragments}` });
  }
  messages.push({ role: 'user', content: question });

  try {
    const answer = await chatCompletion(messages);
    spinner.stop();
    console.log(answer);
    if (context.length > 0) {
      console.log('');
      console.log(chalk.gray('─'.repeat(55)));
      console.log(chalk.bold('  📖 相关课程：'));
      for (const c of context) {
        console.log(`    ${chalk.green('▸')} ${c.category} / ${c.title}  ${chalk.gray(c.relPath)}`);
      }
    }
  } catch (e) {
    spinner.fail('请求失败');
    console.log(chalk.red(`\n  ${e.message}\n`));
  }

  console.log('');
  console.log(chalk.gray('  提示：问题文本会发送给你配置的 AI 服务商；密钥仅存本地。'));
  console.log('');
}
