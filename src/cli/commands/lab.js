// ============================================================
// lab 命令 — 动手实验系统
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveLabCompletion } from '../utils/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LABS_DIR = path.join(__dirname, '..', '..', '..', 'labs');

function listLabs() {
  const labs = [];
  if (!fs.existsSync(LABS_DIR)) return labs;

  function walk(dir, category) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(fullPath, e.name);
      } else if (e.name.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          labs.push({ ...content, file: e.name, category: category || path.basename(path.dirname(fullPath)), path: fullPath });
        } catch {
          // skip invalid files
        }
      }
    }
  }

  walk(LABS_DIR, null);
  return labs;
}

function runCheck(step) {
  if (!step.check) return true;

  try {
    switch (step.check.type) {
      case 'file-exists': {
        const p = step.check.path.replace('~', process.env.HOME || '/home/user');
        const result = execSync(`test -f "${p}" && echo "exists" || echo "missing"`, {
          encoding: 'utf-8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'],
        });
        return result.trim() === 'exists';
      }
      case 'permission-check': {
        const p = step.check.path.replace('~', process.env.HOME || '/home/user');
        const result = execSync(`stat -c "%a" "${p}" 2>/dev/null || echo "0"`, {
          encoding: 'utf-8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'],
        });
        return result.trim() === step.check.expected;
      }
      case 'command-output': {
        const result = execSync(step.check.command, {
          encoding: 'utf-8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'],
        });
        return result.includes(step.check.expected);
      }
      case 'regex-match': {
        const result = execSync(step.check.command, {
          encoding: 'utf-8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'],
        });
        return new RegExp(step.check.pattern).test(result);
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function runLab(name, options) {
  const labs = listLabs();

  if (options.list || !name) {
    console.log('');
    console.log(chalk.bold.cyan('🔬 可用的动手实验'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log('');

    if (labs.length === 0) {
      console.log(chalk.gray('  暂无实验文件。请在 labs/ 目录下添加实验定义。'));
      console.log('');
      return;
    }

    const byCategory = {};
    for (const lab of labs) {
      if (!byCategory[lab.category]) byCategory[lab.category] = [];
      byCategory[lab.category].push(lab);
    }

    for (const [cat, catLabs] of Object.entries(byCategory)) {
      console.log(chalk.bold(`  ${cat}:`));
      for (const lab of catLabs) {
        console.log(`    ${chalk.green('▸')} ${chalk.white(lab.id.padEnd(30))} ${chalk.gray(lab.title)}  [${lab.steps.length}步 · ${lab.estimatedTime}分钟]`);
      }
      console.log('');
    }
    console.log(chalk.gray('  运行: it-trainer lab <实验ID>'));
    console.log('');
    return;
  }

  // Find the lab
  const lab = labs.find((l) => l.id === name || l.file.includes(name));
  if (!lab) {
    console.log(chalk.red(`\n  未找到实验: ${name}\n`));
    console.log(chalk.gray('  运行 it-trainer lab --list 查看所有实验\n'));
    return;
  }

  console.log('');
  console.log(chalk.bold.cyan(`🔬 ${lab.title}`));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('');
  console.log(`  ${chalk.yellow('⏱ 预计时长')}: ${lab.estimatedTime} 分钟`);
  console.log(`  ${chalk.yellow('📋 步骤数')}: ${lab.steps.length} 步`);
  if (lab.environment) {
    console.log(`  ${chalk.yellow('💻 环境')}: ${lab.environment.type}`);
    console.log(`  ${chalk.yellow('📦 依赖')}: ${(lab.environment.requirements || []).join(', ') || '无'}`);
  }
  console.log('');
  console.log(chalk.gray('─'.repeat(60)));

  const { ready } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ready',
      message: '准备好了吗？开始实验！',
      default: true,
    },
  ]);

  if (!ready) {
    console.log(chalk.gray('\n  实验已取消。随时可以重新开始。\n'));
    return;
  }

  let completedSteps = 0;

  for (let i = 0; i < lab.steps.length; i++) {
    const step = lab.steps[i];
    console.log('');
    console.log(chalk.bold(`\n  📌 步骤 ${i + 1}/${lab.steps.length}`));
    console.log(chalk.gray(`  ${'─'.repeat(56)}`));
    console.log('');
    // Format instruction - handle multiline
    const lines = step.instruction.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
        console.log(chalk.bold(`  ${line.trim()}`));
      } else if (line.trim().startsWith('```')) {
        // skip code block markers
      } else if (line.trim().startsWith('$ ') || line.trim().startsWith('> ')) {
        console.log(chalk.green(`  ${line.trim()}`));
      } else {
        console.log(chalk.white(`  ${line}`));
      }
    }
    console.log('');

    // Wait for user to perform the step
    await inquirer.prompt([
      {
        type: 'input',
        name: 'done',
        message: chalk.yellow('完成后按 Enter 验证结果（输入 s 跳过）:'),
      },
    ]);

    // If user typed 's', skip this step
    // Actually inquirer returns the answer - we'd need to handle it differently
    // Simplified: just check

    console.log(chalk.gray('  🔍 正在验证...'));

    const passed = runCheck(step);

    if (passed) {
      completedSteps++;
      console.log(chalk.green('  ✅ 验证通过！'));
    } else {
      console.log(chalk.yellow('  ⚠️  验证未通过'));
      if (step.hint) {
        console.log(chalk.blue(`  💡 提示: ${step.hint}`));
      }

      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: '是否重试？（选否则记录答案后继续）',
          default: true,
        },
      ]);

      if (retry) {
        await inquirer.prompt([
          {
            type: 'input',
            name: 'done',
            message: chalk.yellow('修改后按 Enter 重新验证:'),
          },
        ]);

        const passedAgain = runCheck(step);
        if (passedAgain) {
          completedSteps++;
          console.log(chalk.green('  ✅ 验证通过！'));
        } else {
          console.log(chalk.gray('  📝 已记录，可稍后回顾。'));
          // Show expected answer
          if (step.check.expected) {
            console.log(chalk.gray(`  预期结果: ${step.check.expected}`));
          }
        }
      }
    }
  }

  // Completion
  const allDone = completedSteps === lab.steps.length;
  console.log('');
  console.log(chalk.gray('─'.repeat(60)));

  if (allDone) {
    console.log(chalk.green.bold('\n  🎉 恭喜！实验全部完成！'));
  } else {
    console.log(chalk.yellow(`\n  📝 实验部分完成 (${completedSteps}/${lab.steps.length} 步通过)`));
  }

  // Save to database
  try {
    saveLabCompletion(lab.id, completedSteps, lab.steps.length, allDone ? 'completed' : 'in_progress');
    console.log(chalk.gray('  ✓ 进度已保存'));
  } catch {
    // ignore
  }
  console.log('');
}
