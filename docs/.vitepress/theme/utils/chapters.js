// ============================================================
// 课程结构共用工具 — 题库 / 章节清单 / 标题 的单一事实源
// - 题库：quizzes/*.json 构建时 glob 打包（新增文件自动上线）
// - 章节与标题：从 config.ts 的 sidebar 反解（加章节本来就要改 sidebar，零额外维护）
// - 章节判定沿用 progress.js 的两位数字前缀规则
// ============================================================

import { SIDEBAR } from './sidebar.js'

const quizModules = import.meta.glob('../../../../quizzes/*.json', { eager: true })

/** 全部题库（按标题排序，卡片顺序稳定） */
export const QUIZZES = Object.values(quizModules)
  .map((m) => m.default || m)
  .sort((a, b) => String(a.title).localeCompare(String(b.title), 'zh'))

/** 解析 sidebar：{ 模块目录: [章节 slug…] } 与标题映射 */
const MODULE_CHAPTERS = {}
export const MODULE_TITLES = {}
export const CHAPTER_TITLES = {}

function collectSidebar(sidebar) {
  for (const [key, groups] of Object.entries(sidebar || {})) {
    const modMatch = key.match(/^\/courses\/([a-z-]+)\/?$/)
    if (!modMatch || !Array.isArray(groups)) continue
    const mod = modMatch[1]
    for (const group of groups) {
      if (group && group.text && !MODULE_TITLES[mod]) MODULE_TITLES[mod] = group.text
      for (const item of group.items || []) {
        const link = String(item.link || '')
        const chapMatch = link.match(/^\/courses\/([a-z-]+)\/(\d{2})-[^/]+$/)
        if (!chapMatch) continue
        // '/courses/x/01-y' → 'courses/x/01-y.md'
        const clean = link.replace(/^\//, '') + '.md'
        ;(MODULE_CHAPTERS[chapMatch[1]] = MODULE_CHAPTERS[chapMatch[1]] || []).push(clean)
        CHAPTER_TITLES[clean] = String(item.text || clean)
      }
    }
  }
}
collectSidebar(SIDEBAR)

export { MODULE_CHAPTERS }

/** 某模块的章节清单（空数组=无编号章节） */
export function chapterListOf(mod) {
  return (mod && MODULE_CHAPTERS[mod]) || []
}

/** 模块中文名（sidebar 组名，缺省回退目录名） */
export function moduleTitleOf(mod) {
  return MODULE_TITLES[mod] || mod || ''
}

/** 章节显示名（sidebar 项名，缺省回退 slug） */
export function chapterTitleOf(slug) {
  return CHAPTER_TITLES[slug] || slug || ''
}

/**
 * 全库题目按章节建索引：{ 章节slug: [题目…] }
 * 章节页"本章小测"入口与 /quiz/?chapter= 深链共用
 */
export const CHAPTER_QUESTIONS = {}
for (const qz of QUIZZES) {
  for (const q of qz.questions || []) {
    if (!q.chapter) continue
    ;(CHAPTER_QUESTIONS[q.chapter] = CHAPTER_QUESTIONS[q.chapter] || []).push(q)
  }
}

/** 某章的题目数（0=无题，不显示入口） */
export function chapterQuestionCount(slug) {
  return (CHAPTER_QUESTIONS[slug] || []).length
}

// 空清单守卫（坑 10）：sidebar 反解失败时开发期必须报警
if (import.meta.env.DEV && Object.keys(MODULE_CHAPTERS).length === 0) {
  console.warn('[chapters] MODULE_CHAPTERS 为空——sidebar 反解失败，达标点亮与章节小测将不会生效')
}
