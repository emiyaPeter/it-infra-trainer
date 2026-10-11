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

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const qNum = chalk.bold(`[${i + 1}/${quiz.questions.length}]`);

    console.log(`  ${qNum} ${chalk.white(q.question)}`);
    console.log('');

    let answer;

    if (q.type === 'multiple-choice') {
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
    }

    if (q.explanation) {
      console.log(`  ${chalk.blue('💡 ' + q.explanation)}`);
    }
    console.log('');
  }

  // Score
  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const grade =
    score >= 90 ? chalk.green('🏆 优秀!')
    : score >= 70 ? chalk.green('👍 良好')
    : score >= 50 ? chalk.yellow('📚 继续加油')
    : chalk.red('💪 需要复习');

  console.log(chalk.gray('─'.repeat(55)));
  console.log('');
  console.log(`  得分: ${chalk.bold(score + '%')}  (${correctCount}/${quiz.questions.length})`);
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
