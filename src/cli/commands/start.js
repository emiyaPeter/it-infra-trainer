// ============================================================
// start 命令 — 开始学习会话
// ============================================================

import chalk from 'chalk';
import { logStudySession, getActiveUserName } from '../utils/db.js';

export async function startSession(topic) {
  const userName = getActiveUserName();

  console.log('');
  console.log(chalk.bold.cyan('⏱  学习会话已开始'));
  console.log(chalk.gray(`  用户: ${userName}`));
  console.log(chalk.gray('─'.repeat(40)));

  const displayTopic = topic || '自主学习';
  console.log('');
  console.log(`  主题: ${chalk.yellow(displayTopic)}`);
  console.log(`  开始: ${chalk.white(new Date().toLocaleString('zh-CN'))}`);
  console.log('');
  console.log(chalk.gray('  提示:'));
  console.log(chalk.gray('  · 运行 npm run docs:dev 打开课程文档'));
  console.log(chalk.gray('  · 运行 it-trainer quiz <主题> 做测验'));
  console.log(chalk.gray('  · 运行 it-trainer lab <名称> 做实验'));
  console.log('');
  console.log(chalk.gray('  会话完成后，运行 it-trainer stats 查看学习数据'));
  console.log('');

  // Log 25 minutes (default Pomodoro)
  try {
    logStudySession(25, displayTopic);
  } catch {
    // silently ignore
  }
}
