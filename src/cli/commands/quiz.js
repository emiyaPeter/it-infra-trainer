// ============================================================
// quiz 命令 — 交互式测验
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveQuizAttempt } from '../utils/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUIZZES_DIR = path.join(__dirname, '..', '..', '..', 'quizzes');

function listQuizzes() {
  if (!fs.existsSync(QUIZZES_DIR)) {
    return [];
  }
  return fs
    .readdirSync(QUIZZES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const content = JSON.parse(fs.readFileSync(path.join(QUIZZES_DIR, f), 'utf-8'));
      return { file: f, ...content };
    });
}

async function runSingleQuiz(quiz) {
  console.log('');
  console.log(chalk.bold.cyan(`📝 ${quiz.title}`));
  console.log(chalk.gray(`   难度: ${quiz.difficulty} | 题目数: ${quiz.questions.length}`));
  console.log(chalk.gray('─'.repeat(55)));
  console.log('');

  let correctCount = 0;
  const userAnswers = [];
  let gradedCount = 0; // 参与计分的题数（主观题 CLI 跳过，见下）

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const qNum = chalk.bold(`[${i + 1}/${quiz.questions.length}]`);

    console.log(`  ${qNum} ${chalk.white(q.question)}`);
    console.log('');

    let answer;

    if (q.type === 'multiple-choice') {
      gradedCount++;
      const response = await inquirer.prompt([
        {
          type: 'list',
          name: 'answer',
          message: '选择答案:',
          choices: q.options.map((opt, idx) => ({
            name: `${String.fromCharCode(65 + idx)}. ${opt}`,
            value: idx,
          })),
        },
      ]);
      answer = response.answer;
      userAnswers.push(String(answer));

      if (answer === q.correct) {
        correctCount++;
        console.log(`  ${chalk.green('✅ 正确!')}`);
      } else {
        const correctOpt = q.options[q.correct];
        console.log(`  ${chalk.red('❌ 错误!')} 正确答案是: ${chalk.green(String.fromCharCode(65 + q.correct) + '. ' + correctOpt)}`);
      }
    } else if (q.type === 'fill-blank') {
      gradedCount++;
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'answer',
          message: '请输入答案:',
        },
      ]);
      answer = response.answer.trim();
      userAnswers.push(answer);

      const expectedLower = String(q.correct).toLowerCase().trim();
      const answerLower = answer.toLowerCase().trim();

      if (answerLower === expectedLower) {
        correctCount++;
        console.log(`  ${chalk.green('✅ 正确!')}`);
      } else {
        console.log(`  ${chalk.red('❌ 错误!')} 正确答案是: ${chalk.green(q.correct)}`);
      }
    } else {
      // 问答题/实操题：AI 判卷只在 Web 端（BYOK），CLI 跳过不计分
      userAnswers.push('(skipped)');
      console.log(chalk.yellow('  ⏭ CLI 跳过主观题（不计分）——到网页版「随堂测验」由 AI 判卷，或对照参考答案自评:'));
      console.log(chalk.gray(`     参考答案要点: ${q.reference}`));
      continue;
    }

    if (q.explanation) {
      console.log(`  ${chalk.blue('💡 ' + q.explanation)}`);
    }
    console.log('');
  }

  // Score（分母只算参与计分的客观题）
  const score = gradedCount ? Math.round((correctCount / gradedCount) * 100) : 0;
  const grade =
    score >= 90 ? chalk.green('🏆 优秀!')
    : score >= 70 ? chalk.green('👍 良好')
    : score >= 50 ? chalk.yellow('📚 继续加油')
    : chalk.red('💪 需要复习');

  console.log(chalk.gray('─'.repeat(55)));
  console.log('');
  if (gradedCount < quiz.questions.length) {
    console.log(chalk.gray(`  （${quiz.questions.length - gradedCount} 道主观题已跳过，未计入分数）`));
  }
  console.log(`  得分: ${chalk.bold(score + '%')}  (${correctCount}/${gradedCount})`);
  console.log(`  评价: ${grade}`);
  console.log('');

  // Save to database
  try {
    saveQuizAttempt(quiz.id, score, userAnswers);
    console.log(chalk.gray('  ✓ 成绩已保存'));
  } catch {
    // DB might not be initialized yet, silently ignore
  }
  console.log('');
}

export async function runQuiz(topic) {
  const quizzes = listQuizzes();

  if (quizzes.length === 0) {
    console.log('');
    console.log(chalk.yellow('  📝 暂无测验文件。'));
    console.log(chalk.gray('  测验定义文件放在 quizzes/ 目录下。'));
    console.log('');
    return;
  }

  if (topic) {
    // Find matching quiz
    const match = quizzes.find(
      (q) =>
        q.file.includes(topic.toLowerCase()) ||
        q.id.includes(topic.toLowerCase())
    );

    if (match) {
      await runSingleQuiz(match);
    } else {
      console.log('');
      console.log(chalk.yellow(`  未找到与 "${topic}" 相关的测验。`));
      console.log(chalk.gray('  可用测验:'));
      for (const q of quizzes) {
        console.log(chalk.gray(`    - ${q.id}: ${q.title}`));
      }
      console.log('');
    }
  } else {
    // Let user pick from list
    console.log('');
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'quiz',
        message: '选择测验:',
        choices: [
          ...quizzes.map((q) => ({
            name: `${q.title} [${q.difficulty}] (${q.questions.length}题)`,
            value: q,
          })),
          { name: '返回', value: null },
        ],
      },
    ]);

    if (response.quiz) {
      await runSingleQuiz(response.quiz);
    }
  }
}
