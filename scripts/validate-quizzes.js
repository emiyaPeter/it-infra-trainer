// ============================================================
// 题库校验 — npm test 的第 2.5 步
// 以后往 quizzes/ 加题，跑 npm test 就能发现结构错误：
//   JSON 合法 / id 与 module 规范 / chapter 指向真实文件 /
//   选择题选项与正确索引合法 / 主观题必有 reference / 全库题干去重
// ============================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const QUIZ_DIR = path.join(ROOT, 'quizzes')
const DOCS = path.join(ROOT, 'docs')

const errors = []
const seenQuestions = new Map() // 题干 → 出现位置（跨文件查重）
const VALID_TYPES = ['multiple-choice', 'fill-blank', 'short-answer', 'coding']
const files = fs.readdirSync(QUIZ_DIR).filter((f) => f.endsWith('.json')).sort()

if (!files.length) errors.push('quizzes/ 目录为空')

for (const file of files) {
  const fp = path.join(QUIZ_DIR, file)
  let quiz
  try {
    quiz = JSON.parse(fs.readFileSync(fp, 'utf8'))
  } catch (e) {
    errors.push(`${file}: JSON 解析失败 — ${e.message}`)
    continue
  }
  const where = (label) => `${file} ${label}`

  if (!quiz.id) errors.push(where('缺顶层 id'))
  if (!quiz.title) errors.push(where('缺顶层 title'))
  if (quiz.module && !fs.existsSync(path.join(DOCS, 'courses', quiz.module))) {
    errors.push(where(`module "${quiz.module}" 在 docs/courses/ 下无对应目录`))
  }
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    errors.push(where('questions 为空'))
    continue
  }

  const ids = new Set()
  for (const [i, q] of quiz.questions.entries()) {
    const at = where(`第 ${i + 1} 题(${q.id || '?'})`)
    if (!q.id || ids.has(q.id)) errors.push(`${at}: id 缺失或重复`)
    ids.add(q.id)
    if (!VALID_TYPES.includes(q.type)) errors.push(`${at}: 未知题型 "${q.type}"`)
    if (!q.question || q.question.length < 5) errors.push(`${at}: 题干过短`)

    if (q.type === 'multiple-choice') {
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`${at}: 选项不足`)
      else if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) {
        errors.push(`${at}: correct 索引越界(${q.correct})`)
      }
      if (!q.explanation) errors.push(`${at}: 选择题缺 explanation`)
    } else if (q.type === 'fill-blank') {
      if (typeof q.correct !== 'string' || !q.correct.trim()) errors.push(`${at}: 填空题 correct 应为非空字符串`)
      if (q.accepts !== undefined && !Array.isArray(q.accepts)) errors.push(`${at}: accepts 应为数组`)
    } else {
      // short-answer / coding
      if (!q.reference || (typeof q.reference === 'string' ? !q.reference.trim() : !q.reference.length)) {
        errors.push(`${at}: 主观题缺 reference（参考答案要点）`)
      }
      if (typeof q.reference !== 'string') {
        errors.push(`${at}: reference 应为字符串（当前 ${Array.isArray(q.reference) ? '数组' : typeof q.reference}）`)
      }
      if (q.options || q.correct !== undefined) errors.push(`${at}: 主观题不应有 options/correct`)
    }

    if (q.chapter) {
      const chapPath = path.join(DOCS, q.chapter)
      if (!q.chapter.startsWith('courses/') || !fs.existsSync(chapPath)) {
        errors.push(`${at}: chapter "${q.chapter}" 文件不存在`)
      }
    }

    const stem = String(q.question).trim()
    if (seenQuestions.has(stem)) {
      errors.push(`${at}: 题干与 ${seenQuestions.get(stem)} 重复`)
    } else {
      seenQuestions.set(stem, file + '/' + q.id)
    }
  }
}

if (errors.length) {
  console.error(`❌ 题库校验未通过（${errors.length} 处）：`)
  for (const e of errors) console.error('  - ' + e)
  process.exit(1)
}
console.log(`✅ 题库校验通过：${files.length} 个题库、${seenQuestions.size} 道题（含 chapter 锚点与题型结构）`)
