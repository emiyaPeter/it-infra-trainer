// ============================================================
// 学习报告生成（纯函数）——仪表盘"📋 学习报告"与验收测试共用
// 核心原则：自报已读与测验达标验证在报告中不可混淆（ADR-009 证据分级的产品化）
// ============================================================

import { QUIZZES, MODULE_CHAPTERS, MODULE_TITLES, chapterListOf } from './chapters.js'

const PASS_LINE = 80

/**
 * 汇总各模块状态
 * @param {{ attempts: Array<{quizId, score, total, correct, date}>, verifiedModules: string[] }} quizStore
 * @param {{ pages: Object<string, {done:boolean, doneAt:string}> }} progress
 */
export function summarizeModules(quizStore, progress) {
  const quizByModule = {}
  for (const qz of QUIZZES) {
    if (qz.module) quizByModule[qz.module] = quizByModule[qz.module] || qz
  }
  const pages = (progress && progress.pages) || {}
  const verified = (quizStore && quizStore.verifiedModules) || []
  const attempts = (quizStore && quizStore.attempts) || []

  const mods = []
  for (const mod of Object.keys(MODULE_CHAPTERS).sort()) {
    const chapters = chapterListOf(mod)
    const readCount = chapters.filter((slug) => pages[slug] && pages[slug].done).length
    const qz = quizByModule[mod]
    const best = qz
      ? attempts.filter((a) => a.quizId === qz.id).reduce((m, a) => Math.max(m, a.score || 0), -1)
      : -1
    mods.push({
      module: mod,
      title: MODULE_TITLES[mod] || mod,
      readCount,
      total: chapters.length,
      best: best >= 0 ? best : null,
      verified: verified.includes(mod),
    })
  }
  return mods
}

/** 生成可打印的独立 HTML 报告（新标签页打开 → 用户可打印成 PDF） */
export function buildReportHTML({ userName, quizStore, progress }) {
  const mods = summarizeModules(quizStore, progress)
  const attempts = (quizStore && quizStore.attempts) || []
  const verifiedCount = mods.filter((m) => m.verified).length
  const readTotal = mods.reduce((s, m) => s + m.readCount, 0)
  const chapterTotal = mods.reduce((s, m) => s + m.total, 0)
  const withBest = mods.filter((m) => m.best !== null)
  const avgBest = withBest.length ? Math.round(withBest.reduce((s, m) => s + m.best, 0) / withBest.length) : null
  const mockCount = attempts.filter((a) => a.quizId === 'mock-exam').length
  const now = new Date()
  const dateStr = now.toLocaleString('zh-CN', { hour12: false })
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

  const rows = mods
    .map((m) => {
      const status = m.verified
        ? '<span class="ok">✅ 测验达标验证</span>'
        : m.best !== null
          ? `<span class="warn">🟡 已测未达标（最佳 ${m.best} 分）</span>`
          : m.readCount > 0
            ? '<span class="self">📖 仅自报已读</span>'
            : '<span class="none">⬇ 未开始</span>'
      return `<tr>
        <td>${esc(m.title)}</td>
        <td class="c">${m.readCount} / ${m.total}</td>
        <td class="c">${m.best === null ? '—' : m.best + ' 分'}</td>
        <td>${status}</td>
      </tr>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>学习报告 · ${esc(userName)}</title>
<style>
  body { font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif; color: #1f2329; background: #f6f7f9; margin: 0; padding: 32px 16px; }
  .sheet { max-width: 860px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 36px 40px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
  .stat { flex: 1; min-width: 140px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; }
  .stat b { display: block; font-size: 22px; margin-bottom: 2px; }
  .stat span { font-size: 12px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border-bottom: 1px solid #eef0f3; padding: 9px 8px; text-align: left; }
  th { background: #f9fafb; font-size: 12px; color: #6b7280; }
  td.c { text-align: center; }
  .ok { color: #059669; font-weight: 600; }
  .warn { color: #b45309; }
  .self { color: #6b7280; }
  .none { color: #9ca3af; }
  .note { margin-top: 22px; border-top: 1px dashed #d1d5db; padding-top: 12px; font-size: 12px; color: #6b7280; line-height: 1.8; }
  @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; padding: 12px; } }
</style>
</head>
<body>
<div class="sheet">
  <h1>📚 IT 基础设施培训助手 · 学习报告</h1>
  <p class="meta">学员：${esc(userName)} ｜ 生成时间：${esc(dateStr)} ｜ 数据来源：本浏览器学习记录</p>
  <div class="summary">
    <div class="stat"><b>${readTotal} / ${chapterTotal}</b><span>已读章节（含测验点亮）</span></div>
    <div class="stat"><b>${verifiedCount}</b><span>测验达标模块（≥${PASS_LINE} 分验证）</span></div>
    <div class="stat"><b>${avgBest === null ? '—' : avgBest + ' 分'}</b><span>各模块平均最佳成绩</span></div>
    <div class="stat"><b>${mockCount}</b><span>模拟考试完成次数</span></div>
  </div>
  <table>
    <thead><tr><th>模块</th><th class="c">已读章节</th><th class="c">测验最佳</th><th>状态</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <div class="note">
    <b>状态说明（证据分级）：</b><br>
    ✅ 测验达标验证 = 模块测验 ≥ ${PASS_LINE} 分，系统自动点亮该模块章节，属于客观验证；<br>
    📖 仅自报已读 = 手动「标记已完成」，未经测验验证，仅供个人学习轨迹参考；<br>
    两者在本报告中刻意区分展示，不可相互替代。
  </div>
</div>
</body>
</html>`
}
