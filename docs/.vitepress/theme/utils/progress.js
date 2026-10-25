// ============================================================
// 学习进度工具（Web 端，localStorage）
// - 结构: it-trainer-progress-<userId> = { pages: { '<slug>': { done, doneAt } } }
// - slug 取 VitePress page.relativePath（如 courses/linux/01-command-line.md）
// - 章节页判定: courses/<类目>/ 下以两位数字开头的页面（index 不算）
// ============================================================

import { chapterListOf } from './chapters.js'
import { readStore, writeStore } from './store.js'

export const ACTIVE_USER_KEY = 'it-trainer-active-user-id'
const PROGRESS_KEY_PREFIX = 'it-trainer-progress-'

// 阶段目录：match 为 courses/ 下的类目目录名。
// 章节数由 chapters.js 从 sidebar 自动统计（v2.6 起），新增课程章节无需手工同步。
export const PHASE_CATALOG = [
  { id: 1, label: '阶段1：基础入门', match: 'networking' },
  { id: 2, label: '阶段2：Linux 管理', match: 'linux' },
  { id: 3, label: '阶段3：Windows Server', match: 'windows-server' },
  { id: 4, label: '阶段4：虚拟化', match: 'virtualization' },
  { id: 5, label: '阶段5：容器', match: 'docker' },
  { id: 6, label: '阶段6：自动化', match: 'ansible' },
  { id: 7, label: '阶段7：监控', match: 'monitoring' },
  { id: 8, label: '阶段8：云计算', match: 'cloud' },
  { id: 9, label: '阶段9：安全', match: 'security' },
  { id: 10, label: '阶段10：灾备', match: 'dr-backup' },
]

/** 某阶段的章节总数（sidebar 自动统计） */
export function phaseChapterTotal(phase) {
  return chapterListOf(phase.match).length
}

/** relativePath 是否为课程章节页（courses/<类目>/NN-xxx.md） */
export function isChapterPage(relativePath) {
  return /^courses\/[a-z-]+\/\d{2}-[^/]+\.md$/.test(relativePath || '')
}

function progressKey(userId) {
  return PROGRESS_KEY_PREFIX + userId
}

export function loadUserProgress(userId) {
  if (!userId) return { pages: {} }
  const raw = readStore(progressKey(userId))
  if (raw && typeof raw === 'object' && raw.pages) return raw
  return { pages: {} }
}

export function saveUserProgress(userId, progress) {
  writeStore(progressKey(userId), progress, 1)
}

export function isPageDone(userId, relativePath) {
  const progress = loadUserProgress(userId)
  return !!(progress.pages[relativePath] && progress.pages[relativePath].done)
}

/** 标记/取消标记页面完成，返回标记后的状态 */
export function setPageDone(userId, relativePath, done) {
  const progress = loadUserProgress(userId)
  if (done) {
    progress.pages[relativePath] = { done: true, doneAt: new Date().toISOString() }
  } else {
    delete progress.pages[relativePath]
  }
  saveUserProgress(userId, progress)
  return done
}

/** 某阶段已完成章节数 */
export function phaseCompletedCount(progress, phase) {
  const prefix = `courses/${phase.match}/`
  return Object.keys(progress.pages).filter((slug) => {
    const rec = progress.pages[slug]
    return rec && rec.done && slug.startsWith(prefix) && isChapterPage(slug)
  }).length
}

/** 计算各阶段进度百分比（0-100；无章节的阶段恒为 0） */
export function computePhaseProgress(progress) {
  const result = {}
  for (const phase of PHASE_CATALOG) {
    const total = phaseChapterTotal(phase)
    if (total <= 0) {
      result[phase.id] = 0
      continue
    }
    const done = phaseCompletedCount(progress, phase)
    result[phase.id] = Math.min(100, Math.round((done / total) * 100))
  }
  return result
}

/** 已完成章节总数 */
export function totalCompletedChapters(progress) {
  return PHASE_CATALOG.reduce(
    (sum, phase) => sum + phaseCompletedCount(progress, phase), 0
  )
}
