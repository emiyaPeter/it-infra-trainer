// ============================================================
// homework 命令 — 作业自动批改系统
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveHomeworkResult } from '../utils/db.js';
import { runBash, shq } from '../utils/bash.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOMEWORK_DIR = path.join(__dirname, '..', '..', '..', 'homework');

function listHomework() {
  const assignments = [];
  if (!fs.existsSync(HOMEWORK_DIR)) return assignments;

  function walk(dir, category) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(fullPath, e.name);
      } else if (e.name.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          assignments.push({ ...content, file: e.name, category, path: fullPath });
        } catch { /* skip */ }
      }
    }
  }

  walk(HOMEWORK_DIR, null);
  return assignments;
}

function runPracticalCheck(check) {
  const clip = (s) => String(s || '').trim().slice(0, 200);

  switch (check.type) {
    case 'command-output': {
      const r = runBash(check.command, { timeout: 15000, shell: check.shell });
      if (!r.ok) return { passed: false, output: clip(r.output || r.error) };
      if (check.expected) return { passed: r.output.includes(check.expected), output: clip(r.output) };
      if (check.pattern) return { passed: new RegExp(check.pattern, check.flags || '').test(r.output), output: clip(r.output) };
      return { passed: r.output.trim().length > 0, output: clip(r.output) };
    }
    case 'file-exists': {
      // 路径赋值不加引号，让 bash 展开 ~（Windows 上自动在 WSL 内执行）
      const r = runBash(`p=${check.path}; test -e "$p" && echo __IT_EXISTS__ || echo __IT_MISSING__`, { timeout: 5000 });
      if (r.wslMissing) return { passed: false, output: r.error };
      return {
        passed: r.ok && r.output.includes('__IT_EXISTS__'),
        output: r.output.includes('__IT_EXISTS__') ? `文件存在: ${check.path}` : `文件不存在: ${check.path}`,
      };
    }
    case 'file-contains': {
      const r = runBash(`p=${check.path}; grep -qF -- ${shq(check.expected)} "$p" && echo __IT_OK__ || echo __IT_MISS__`, { timeout: 5000 });
      if (r.wslMissing) return { passed: false, output: r.error };
      return {
        passed: r.ok && r.output.includes('__IT_OK__'),
        output: r.output.includes('__IT_OK__') ? '内容匹配' : `文件中未找到: ${check.expected}`,
      };
    }
    case 'service-running': {
      const r = runBash(`systemctl is-active ${shq(check.service)} 2>/dev/null || echo "inactive"`, { timeout: 10000 });
      const state = r.ok ? r.output.trim() : 'inactive';
      return { passed: r.ok && state === 'active', output: `服务 ${check.service}: ${state}` };
    }
    case 'port-open': {
      const r = runBash(`ss -tlnp 2>/dev/null | grep ${shq(':' + check.port)} || echo ""`, { timeout: 10000 });
      return {
        passed: r.ok && r.output.trim().length > 0,
        output: r.output.trim() ? `端口 ${check.port} 在监听` : `端口 ${check.port} 未监听`,
      };
    }
    default:
      return { passed: false, output: `未知检查类型: ${check.type}` };
  }
}

function gradeAnswer(question, userAnswer) {
  if (question.type === 'multiple-choice') {
    return userAnswer === question.correct;
  }
  if (question.type === 'multi-select') {
    const correctSet = new Set(question.correct);
    const userSet = new Set(userAnswer);
    return correctSet.size === userSet.size && [...correctSet].every(c => userSet.has(c));
  }
  if (question.type === 'fill-blank') {
    // Case-insensitive comparison, trim whitespace
    const userClean = String(userAnswer).toLowerCase().trim();
    if (Array.isArray(question.correct)) {
      return question.correct.some(a => userClean === a.toLowerCase().trim());
    }
    return userClean === String(question.correct).toLowerCase().trim();
  }
  if (question.type === 'short-answer') {
    // Check for required keywords
    const userClean = String(userAnswer).toLowerCase();
    const keywords = question.keywords || [];
    const found = keywords.filter(kw => userClean.includes(kw.toLowerCase()));
    return { score: Math.round((found.length / keywords.length) * 100), found, total: keywords.length };
  }
  return false;
}

export async function runHomework(name, options) {
  const assignments = listHomework();

  if (options.list || !name) {
    console.log('');
    console.log(chalk.bold.cyan('📝 可用作业列表'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log('');

    if (assignments.length === 0) {
      console.log(chalk.gray('  暂无作业。请在 homework/ 目录添加。'));
      console.log('');
      return;
    }

    const byCategory = {};
    for (const hw of assignments) {
      if (!byCategory[hw.category]) byCategory[hw.category] = [];
      byCategory[hw.category].push(hw);
    }

    for (const [cat, items] of Object.entries(byCategory)) {
      console.log(chalk.bold(`  ${cat}:`));
      for (const hw of items) {
        const totalQ = (hw.questions?.length || 0) + (hw.practical?.length || 0);
        console.log(`    ${chalk.green('▸')} ${chalk.white(hw.id.padEnd(28))} ${chalk.gray(hw.title)} ${chalk.yellow(`[${totalQ}题 · ${hw.totalScore || 100}分]`)}`);
      }
      console.log('');
    }
    console.log(chalk.gray('  运行: it-trainer homework <作业ID>'));
    console.log('');
    return;
  }

  // Find the homework
  const hw = assignments.find(a => a.id === name || a.file.includes(name));
  if (!hw) {
    console.log(chalk.red(`\n  未找到作业: ${name}\n`));
    return;
  }

  console.log('');
  console.log(chalk.bold.cyan(`📝 ${hw.title}`));
  if (hw.description) console.log(chalk.gray(`   ${hw.description}`));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('');
  console.log(`  ${chalk.yellow('📋 理论题')}: ${hw.questions?.length || 0} 题`);
  console.log(`  ${chalk.yellow('💻 实操题')}: ${hw.practical?.length || 0} 题`);
  console.log(`  ${chalk.yellow('📊 总分')}: ${hw.totalScore || 100} 分`);
  console.log(`  ${chalk.yellow('✅ 通过线')}: ${hw.passScore || 60} 分`);
  console.log('');

  const { start } = await inquirer.prompt([{
    type: 'confirm', name: 'start',
    message: '开始答题？',
    default: true,
  }]);

  if (!start) return;

  let totalScore = 0;
  let earnedScore = 0;
  const results = [];

  // --- Theory Questions ---
  if (hw.questions && hw.questions.length > 0) {
    console.log('');
    console.log(chalk.bold.underline('📋 理论题部分'));
    console.log('');

    for (let i = 0; i < hw.questions.length; i++) {
      const q = hw.questions[i];
      const qScore = q.score || 1;
      totalScore += qScore;

      console.log(chalk.bold(`\n  [${i + 1}/${hw.questions.length}] ${q.question} ${chalk.gray(`(${qScore}分)`)}`));
      if (q.hint) console.log(chalk.gray(`   提示: ${q.hint}`));

      let userAnswer;

      if (q.type === 'multiple-choice') {
        const resp = await inquirer.prompt([{
          type: 'list', name: 'answer',
          message: '选择答案:',
          choices: q.options.map((opt, idx) => ({
            name: `${String.fromCharCode(65 + idx)}. ${opt}`,
            value: idx,
          })),
          pageSize: 8,
        }]);
        userAnswer = resp.answer;
      } else if (q.type === 'multi-select') {
        const resp = await inquirer.prompt([{
          type: 'checkbox', name: 'answer',
          message: '选择所有正确答案:',
          choices: q.options.map((opt, idx) => ({
            name: `${String.fromCharCode(65 + idx)}. ${opt}`,
            value: idx,
          })),
        }]);
        userAnswer = resp.answer;
      } else if (q.type === 'fill-blank') {
        const resp = await inquirer.prompt([{
          type: 'input', name: 'answer',
          message: '输入答案:',
        }]);
        userAnswer = resp.answer;
      } else if (q.type === 'short-answer') {
        const resp = await inquirer.prompt([{
          type: 'input', name: 'answer',
          message: '输入你的答案:',
        }]);
        userAnswer = resp.answer;
      } else {
        userAnswer = 'skipped';
      }

      const result = gradeAnswer(q, userAnswer);
      const isCorrect = typeof result === 'object' ? result.score >= 70 : result;

      if (isCorrect) {
        earnedScore += qScore;
        console.log(`  ${chalk.green('✅ 正确!')} (+${qScore}分)`);
      } else {
        if (typeof result === 'object') {
          earnedScore += Math.round(qScore * result.score / 100);
          console.log(`  ${chalk.yellow(`⚠️ 部分正确 (关键点: ${result.found.join(', ')}, 得分: ${Math.round(qScore * result.score / 100)}/${qScore})`)}`);
        } else {
          console.log(`  ${chalk.red('❌ 错误!')}`);
        }
      }

      if (q.explanation) {
        console.log(`  ${chalk.blue('💡 ' + q.explanation)}`);
      }

      results.push({ question: q.question, userAnswer, isCorrect });

      await new Promise(r => setTimeout(r, 300)); // Brief pause
    }
  }

  // --- Practical Tasks ---
  if (hw.practical && hw.practical.length > 0) {
    console.log('');
    console.log(chalk.bold.underline('💻 实操题部分'));
    console.log('');
    console.log(chalk.yellow('  实操题需要你在终端中完成操作，然后系统自动验证。'));
    console.log('');

    for (let i = 0; i < hw.practical.length; i++) {
      const task = hw.practical[i];
      const taskScore = task.score || 5;
      totalScore += taskScore;

      console.log(chalk.bold(`\n  [实操 ${i + 1}/${hw.practical.length}] ${task.title} ${chalk.gray(`(${taskScore}分)`)}`));
      console.log(chalk.white(`  ${task.instruction}`));
      console.log('');

      await inquirer.prompt([{
        type: 'input', name: 'done',
        message: chalk.yellow('完成操作后按 Enter 自动验证:'),
      }]);

      console.log(chalk.gray('  🔍 验证中...'));

      const checkResult = runPracticalCheck(task.check);

      if (checkResult.passed) {
        earnedScore += taskScore;
        console.log(`  ${chalk.green('✅ 验证通过!')} (+${taskScore}分)`);
        console.log(`  ${chalk.gray(checkResult.output)}`);
      } else {
        console.log(`  ${chalk.red('❌ 验证未通过!')}`);
        console.log(`  ${chalk.gray(checkResult.output)}`);
        if (task.hint) {
          console.log(`  ${chalk.blue('💡 提示: ' + task.hint)}`);
        }
        // Allow retry
        const { retry } = await inquirer.prompt([{
          type: 'confirm', name: 'retry',
          message: '是否重试？(50%分数)',
          default: false,
        }]);
        if (retry) {
          await inquirer.prompt([{
            type: 'input', name: 'done',
            message: chalk.yellow('修改后按 Enter 重新验证:'),
          }]);
          const retryResult = runPracticalCheck(task.check);
          if (retryResult.passed) {
            earnedScore += Math.round(taskScore / 2);
            console.log(`  ${chalk.yellow('✅ 重试验证通过!')} (+${Math.round(taskScore/2)}分)`);
          } else {
            console.log(`  ${chalk.red('❌ 仍未通过')}`);
          }
        }
      }

      results.push({ question: `[实操] ${task.title}`, userAnswer: checkResult.output, isCorrect: checkResult.passed });
    }
  }

  // --- Final Score ---
  const finalScore = Math.round((earnedScore / totalScore) * 100);
  const passed = finalScore >= (hw.passScore || 60);

  console.log('');
  console.log(chalk.gray('═'.repeat(60)));
  console.log('');
  console.log(chalk.bold(`  📊 得分: ${chalk.yellow(earnedScore)}/${totalScore} (${finalScore}%)`));

  if (passed) {
    console.log(chalk.green.bold(`  🎉 恭喜！作业通过！ (通过线: ${hw.passScore || 60}%)`));
    if (hw.passMessage) console.log(chalk.green(`  ${hw.passMessage}`));
  } else {
    console.log(chalk.red.bold(`  📚 未通过。需要 ${hw.passScore || 60}%，复习后可以重新提交。`));
    if (hw.failMessage) console.log(chalk.yellow(`  ${hw.failMessage}`));
  }

  // Show detailed feedback
  if (hw.feedback && finalScore < 80) {
    console.log('');
    console.log(chalk.bold('  📖 针对性复习建议:'));
    for (const fb of hw.feedback) {
      if (finalScore < fb.threshold) {
        for (const topic of fb.topics) {
          console.log(`    ${chalk.blue('▸')} ${topic}`);
        }
        break;
      }
    }
  }

  // Suggest next homework
  if (hw.nextHomework && passed) {
    console.log('');
    console.log(chalk.bold('  🎯 推荐下一步:'));
    console.log(`    ${chalk.green('it-trainer homework ' + hw.nextHomework)}`);
  }

  // Save to DB (handles user_id and table creation automatically)
  try {
    saveHomeworkResult(hw.id, earnedScore, totalScore, finalScore, passed);
    console.log(chalk.gray('\n  ✓ 成绩已保存到本地数据库'));
  } catch { /* ignore */ }

  console.log('');
}
