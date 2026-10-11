#!/usr/bin/env node
// ============================================================
// IT 基础设施培训助手 CLI — 入口文件
// ============================================================

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv } from './utils/env.js';

// 加载 .env 环境变量（API Key 等）
loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name('it-trainer')
  .description('IT 基础设施工程师培训助手 CLI')
  .version('1.0.0');

// --- env-check 命令 ---
program
  .command('env-check')
  .description('检查开发环境：已安装的工具和缺失的依赖')
  .action(async () => {
    const { envCheck } = await import('./commands/env-check.js');
    await envCheck();
  });

// --- progress 命令 ---
program
  .command('progress')
  .description('查看学习进度')
  .option('-p, --phase <number>', '查看指定阶段的进度')
  .option('-a, --all', '查看所有阶段的详细进度')
  .action(async (options) => {
    const { showProgress } = await import('./commands/progress.js');
    await showProgress(options);
  });

// --- roadmap 命令 ---
program
  .command('roadmap')
  .description('查看学习路线图')
  .option('-p, --phase <number>', '查看指定阶段详情')
  .action(async (options) => {
    const { showRoadmap } = await import('./commands/roadmap.js');
    await showRoadmap(options);
  });

// --- quiz 命令 ---
program
  .command('quiz')
  .description('开始测验')
  .argument('[topic]', '测验主题 (networking, linux, docker...)')
  .action(async (topic) => {
    const { runQuiz } = await import('./commands/quiz.js');
    await runQuiz(topic);
  });

// --- lab 命令 ---
program
  .command('lab')
  .description('启动动手实验')
  .argument('[name]', '实验名称')
  .option('-l, --list', '列出所有可用的实验')
  .action(async (name, options) => {
    const { runLab } = await import('./commands/lab.js');
    await runLab(name, options);
  });

// --- search 命令 ---
program
  .command('search')
  .description('搜索课程内容')
  .argument('<keyword>', '搜索关键词')
  .action(async (keyword) => {
    const { searchContent } = await import('./commands/search.js');
    await searchContent(keyword);
  });

// --- start 命令（启动学习会话）---
program
  .command('start')
  .description('开始学习会话（记录时间）')
  .argument('[topic]', '学习主题')
  .action(async (topic) => {
    const { startSession } = await import('./commands/start.js');
    await startSession(topic);
  });

// --- homework 命令 ---
program
  .command('homework')
  .description('作业练习与自动批改')
  .argument('[name]', '作业ID (如 networking-01)')
  .option('-l, --list', '列出所有可用作业')
  .action(async (name, options) => {
    const { runHomework } = await import('./commands/homework.js');
    await runHomework(name, options);
  });

// --- stats 命令 ---
program
  .command('stats')
  .description('查看学习统计')
  .action(async () => {
    const { showStats } = await import('./commands/stats.js');
    await showStats();
  });

// --- user 命令组 ---
const userProgram = program
  .command('user')
  .description('用户管理（创建/切换/删除）')
  .argument('[subcommand]', 'create|switch|list|delete|current|rename|export-json')
  .allowUnknownOption(false)
  .action(async (subcommand) => {
    const { userCommand } = await import('./commands/user.js');
    // commander passes the subcommand as first positional; remaining args follow
    const args = process.argv.slice(process.argv.indexOf('user') + 1);
    await userCommand(args[0], ...args.slice(1));
  });

// 默认行为：显示仪表盘
program
  .action(async () => {
    // 动态获取当前用户
    let userName = '未设置';
    try {
      const { getActiveUserName } = await import('./utils/db.js');
      userName = getActiveUserName();
    } catch { /* DB 未初始化时静默忽略 */ }

    console.log('');
    console.log(chalk.bold.cyan('  🖥️  IT 基础设施工程师培训助手'));
    console.log(chalk.gray('  ─────────────────────────────────'));
    console.log('');
    console.log(chalk.white('  零基础 → 3年经验水平 · 在家自学'));
    console.log('');
    console.log(`  👤 当前用户: ${chalk.yellow.bold(userName)}`);
    console.log('');
    console.log(chalk.bold('  快速开始:'));
    console.log(`    ${chalk.green('it-trainer roadmap')}        查看学习路线图`);
    console.log(`    ${chalk.green('it-trainer env-check')}       检查环境配置`);
    console.log(`    ${chalk.green('it-trainer progress')}        查看学习进度`);
    console.log(`    ${chalk.green('it-trainer quiz <topic>')}    开始测验`);
    console.log(`    ${chalk.green('it-trainer lab <name>')}      启动动手实验`);
    console.log(`    ${chalk.green('it-trainer search <关键词>')}  搜索课程`);
    console.log(`    ${chalk.green('it-trainer homework <id>')}  作业练习与自动批改`);
    console.log(`    ${chalk.green('it-trainer stats')}          查看学习统计`);
    console.log(`    ${chalk.green('it-trainer start [主题]')}   开始学习会话`);
    console.log(`    ${chalk.green('it-trainer user <子命令>')}   用户管理`);
    console.log('');
    console.log(chalk.gray('  运行 it-trainer --help 查看所有命令'));
    console.log('');
  });

program.parse();
