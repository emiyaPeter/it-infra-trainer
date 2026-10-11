// ============================================================
// progress 命令 — 查看学习进度（支持多用户）
// ============================================================

import chalk from 'chalk';
import { getDb, getActiveUserId, getActiveUserName } from '../utils/db.js';

export async function showProgress(options) {
  const db = getDb();
  const userId = getActiveUserId();
  const userName = getActiveUserName();

  console.log('');
  console.log(chalk.bold.cyan('📊 学习进度报告'));
  console.log(chalk.gray(`  用户: ${userName}`));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('');

  // Count all tracked pages for current user
  const allProgress = db.prepare('SELECT * FROM progress WHERE user_id = ?').all(userId);
  const completed = allProgress.filter((p) =>
    ['completed', 'quiz_passed', 'lab_done'].includes(p.status)
  );

  const quizAttempts = db.prepare('SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ?').get(userId);
  const labCompletions = db.prepare(
    "SELECT COUNT(*) as count FROM lab_completions WHERE user_id = ? AND status = 'completed'"
  ).get(userId);
  const sessions = db.prepare(
    "SELECT SUM(duration_min) as total, COUNT(DISTINCT date) as days FROM study_sessions WHERE user_id = ?"
  ).get(userId);

  // Overall bar
  const totalPages = allProgress.length || 20;
  const completedPages = completed.length;
  const pct = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
  const barLen = 20;
  const filled = Math.round((pct / 100) * barLen);
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(barLen - filled));

  console.log(`  总体进度:  ${bar}  ${chalk.bold(pct + '%')}`);
  console.log('');

  // Stats cards
  console.log(`  ${chalk.yellow('📄')} 已完成课程页:  ${chalk.bold(completedPages)} 页`);
  console.log(`  ${chalk.yellow('✅')} 已通过测验:    ${chalk.bold(quizAttempts.count)} 次`);
  console.log(`  ${chalk.yellow('🔬')} 已完成实验:    ${chalk.bold(labCompletions.count)} 个`);
  console.log(`  ${chalk.yellow('⏱')}  总学习时长:    ${chalk.bold((sessions.total || 0) + ' 分钟')}`);
  console.log(`  ${chalk.yellow('📅')} 学习天数:      ${chalk.bold((sessions.days || 0) + ' 天')}`);
  console.log('');

  // Phase progress
  console.log(chalk.bold('  各阶段进度:'));
  console.log('');

  const phaseCategories = {
    '阶段1: 基础入门': 'networking',
    '阶段2: Linux': 'linux',
    '阶段3: Windows Server': 'windows-server',
    '阶段4: 虚拟化': 'virtualization',
    '阶段5: 容器': 'docker',
    '阶段6: 自动化': 'ansible',
    '阶段7: 监控': 'monitoring',
    '阶段8: 云服务': 'cloud',
    '阶段9: 安全': 'security',
    '阶段10: 灾备': 'dr-backup',
  };

  for (const [label, courseSlug] of Object.entries(phaseCategories)) {
    const catProgress = allProgress.filter((p) => p.course_slug === courseSlug);
    const catCompleted = catProgress.filter((p) =>
      ['completed', 'quiz_passed', 'lab_done'].includes(p.status)
    );
    const catPct = catProgress.length > 0
      ? Math.round((catCompleted.length / catProgress.length) * 100)
      : 0;

    const miniBar = Math.round(catPct / 10);
    const miniBarStr = chalk.green('▮'.repeat(miniBar)) + chalk.gray('▯'.repeat(10 - miniBar));

    console.log(`  ${chalk.white(label.padEnd(20))} ${miniBarStr} ${chalk.bold(String(catPct).padStart(3) + '%')}  (${catCompleted.length}/${catProgress.length || '--'}页)`);
  }

  console.log('');
  console.log(chalk.gray('  提示: 运行 npm run docs:dev 在浏览器中学习课程'));
  console.log(chalk.gray('        运行 it-trainer quiz <主题> 开始测验'));
  console.log(chalk.gray('        运行 it-trainer lab <名称> 开始动手实验'));
  console.log('');
}
