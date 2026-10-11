// ============================================================
// stats 命令 — 查看学习统计数据（支持多用户）
// ============================================================

import chalk from 'chalk';
import { getDb, getStreak, getActiveUserId, getActiveUserName } from '../utils/db.js';

export async function showStats() {
  const db = getDb();
  const userId = getActiveUserId();
  const userName = getActiveUserName();

  const totalSessions = db.prepare('SELECT COUNT(*) as count FROM study_sessions WHERE user_id = ?').get(userId);
  const totalMinutes = db.prepare('SELECT SUM(duration_min) as total FROM study_sessions WHERE user_id = ?').get(userId);
  const totalDays = db.prepare('SELECT COUNT(DISTINCT date) as count FROM study_sessions WHERE user_id = ?').get(userId);
  const totalQuizzes = db.prepare('SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ?').get(userId);
  const avgScore = db.prepare('SELECT AVG(score) as avg FROM quiz_attempts WHERE user_id = ?').get(userId);
  const totalLabs = db.prepare("SELECT COUNT(*) as count FROM lab_completions WHERE user_id = ? AND status = 'completed'").get(userId);
  const streak = getStreak();

  // Recent sessions (last 7 days)
  const recentSessions = db.prepare(
    "SELECT date, SUM(duration_min) as minutes, COUNT(*) as sessions FROM study_sessions WHERE user_id = ? AND date >= date('now', '-6 days') GROUP BY date ORDER BY date"
  ).all(userId);

  console.log('');
  console.log(chalk.bold.cyan('📈 学习统计'));
  console.log(chalk.gray(`  用户: ${userName}`));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('');

  // Big numbers
  console.log(`  ${chalk.yellow('🔥 连续学习')}:   ${chalk.bold(streak + ' 天')}`);
  console.log(`  ${chalk.yellow('⏱  总学习时长')}: ${chalk.bold((totalMinutes.total || 0) + ' 分钟')} (约 ${Math.round((totalMinutes.total || 0) / 60)} 小时)`);
  console.log(`  ${chalk.yellow('📅 学习天数')}:   ${chalk.bold(totalDays.count + ' 天')}`);
  console.log(`  ${chalk.yellow('📝 完成测验')}:   ${chalk.bold(totalQuizzes.count + ' 次')}`);
  if (avgScore.avg) {
    console.log(`  ${chalk.yellow('📊 平均得分')}:   ${chalk.bold(Math.round(avgScore.avg) + '%')}`);
  }
  console.log(`  ${chalk.yellow('🔬 完成实验')}:   ${chalk.bold(totalLabs.count + ' 个')}`);
  console.log(`  ${chalk.yellow('📚 学习节次')}:   ${chalk.bold(totalSessions.count + ' 次')}`);
  console.log('');

  // Weekly chart (ASCII)
  if (recentSessions.length > 0) {
    console.log(chalk.bold('  近7天学习时长:'));
    console.log('');

    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const session = recentSessions.find((s) => s.date === dateStr);
      const minutes = session ? session.minutes : 0;
      const barLen = Math.min(20, Math.ceil(minutes / 5));
      const bar = minutes > 0
        ? chalk.green('█'.repeat(barLen))
        : chalk.gray('░');

      const today2 = new Date().toISOString().split('T')[0];
      const isToday = dateStr === today2;
      const prefix = isToday ? chalk.bold : chalk.white;

      console.log(`  ${prefix(`周${dayName} ${dateStr.slice(5)}`)}  ${bar}  ${chalk.bold(minutes + '分钟')}`);
    }
  }

  console.log('');
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('  提示: 运行 it-trainer start [主题] 记录新的学习会话'));
  console.log('');
}
