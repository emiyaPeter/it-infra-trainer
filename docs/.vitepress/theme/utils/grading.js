// ============================================================
// 分层判分（纯逻辑，从 QuizWidget 抽出，v2.7 有界重构）
// 依赖注入：AI 调用由调用方提供（组件内闭包 aiConfig），本模块可独立测试。
// 哲学（ADR-010）：本地规则优先；AI 只看本地解决不了的；
// 对抗审计只挂在"判错"上——把对的判错伤害最大。
// ============================================================

export function normalizeAnswer(s) {
  return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ')
}

/** OpenAI 兼容 chat 调用工厂；传入 {baseUrl, apiKey, model} 返回 async callAI(system, user, timeoutMs) */
export function createCallAI(cfg) {
  return async function callAI(systemPrompt, userContent, timeoutMs = 15000) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(String(cfg.baseUrl).replace(/\/+$/, '') + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + cfg.apiKey,
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      if (!text) throw new Error('empty reply')
      return text
    } finally {
      clearTimeout(timer)
    }
  }
}

export function parseVerdictJson(text) {
  const m = String(text).match(/\{[\s\S]*?\}/)
  if (!m) return null
  try {
    const j = JSON.parse(m[0])
    const verdict = String(j.verdict || '').toLowerCase()
    if (['correct', 'partial', 'incorrect'].includes(verdict)) {
      return { verdict, reason: String(j.reason || '').slice(0, 300) }
    }
  } catch { /* 容忍模型输出多余文字 */ }
  return null
}

// ---- 客观题（选择题/填空题）：Tier0 本地 / Tier1 AI 初判 / Tier2 对抗审计 ----
const TIER1_SYSTEM =
  '你是严格的考试判分器。给定题目、标准答案（含可接受变体）和学生答案，判断学生答案与标准答案是否语义等价：' +
  '同义写法、命令等效、可忽略的大小写/顺序差异应判对；概念错误、缺关键参数应判错。' +
  '只输出 JSON：{"verdict":"correct 或 incorrect","reason":"一句话理由"}'

const TIER2_SYSTEM =
  '你是对抗性复审员。此前的判分器把学生答案判为错误。请专门寻找该答案与标准答案等价的合理依据：' +
  '同义改写、等效命令、可忽略的拼写/顺序/单位差异。只要存在任何合理解读使二者等价，就推翻为 correct。' +
  '确认不等价才维持 incorrect。只输出 JSON：{"verdict":"correct 或 incorrect","reason":"一句话理由"}'

/**
 * 填空题判分
 * @param q 题目 {question, correct, accepts[]}
 * @param answer 学生答案
 * @param callAIOrNull null=无 AI；否则 createCallAI 的产物
 */
export async function gradeFill(q, answer, callAIOrNull) {
  const candidates = [q.correct, ...(q.accepts || [])].map(normalizeAnswer)
  if (candidates.includes(normalizeAnswer(answer))) {
    return { correct: true, src: 'local', selfMode: false }
  }
  if (!callAIOrNull) {
    return { correct: false, src: 'local', selfMode: false }
  }
  const fact =
    `题目：${q.question}\n标准答案：${q.correct}\n可接受变体：${(q.accepts || []).join('；') || '无'}\n学生答案：${answer}`
  let first
  try {
    first = parseVerdictJson(await callAIOrNull(TIER1_SYSTEM, fact))
  } catch {
    return { correct: false, src: 'local-fallback', selfMode: false }
  }
  if (!first) return { correct: false, src: 'local-fallback', selfMode: false }
  if (first.verdict === 'correct') {
    return { correct: true, src: 'ai', selfMode: false, aiReason: first.reason }
  }
  try {
    const second = parseVerdictJson(
      await callAIOrNull(TIER2_SYSTEM, fact + '\n初判理由：' + first.reason + '\n请复审。')
    )
    if (second && second.verdict === 'correct') {
      return { correct: true, src: 'audit', selfMode: false, aiReason: '审计推翻初判：' + second.reason }
    }
    return { correct: false, src: 'ai+audit', selfMode: false, aiReason: first.reason }
  } catch {
    return { correct: false, src: 'ai', selfMode: false, aiReason: first.reason }
  }
}

// ---- 主观题（问答/实操）：AI 三档判卷 + 错杀审计 + 无密钥自评 ----
const SUBJ_SYSTEM =
  '你是严格的阅卷老师。给定题目、参考答案要点和学生的作答，按三档判分：' +
  'correct=覆盖了主要要点且无明显错误；partial=方向正确但缺关键要点或有次要错误；incorrect=概念错误或未涉及要点。' +
  '只输出 JSON：{"verdict":"correct、partial 或 incorrect","reason":"两句话以内，指出对在哪里/缺了什么"}'

const SUBJ_AUDIT_SYSTEM =
  '你是对抗性复审员。此前的阅卷老师把学生作答判为 incorrect。请专门寻找应得部分分或全分的依据：' +
  '要点部分覆盖、思路正确但表述不同、仅非核心细节有误。可推翻为 partial 或 correct。' +
  '确认不及格才维持 incorrect。只输出 JSON：{"verdict":"correct、partial 或 incorrect","reason":"一句话理由"}'

/**
 * 主观题判卷（无密钥/AI 不可用 → 自评模式，不计分，ADR-010）
 * @param q 题目 {question, reference}
 */
export async function gradeSubjective(q, answer, callAIOrNull) {
  if (!callAIOrNull) {
    return { selfMode: true, src: 'self', verdict: 'incorrect', aiReason: '' }
  }
  const fact =
    `题目：${q.question}\n参考答案要点：${q.reference}\n学生作答：${answer}`
  let first
  try {
    first = parseVerdictJson(await callAIOrNull(SUBJ_SYSTEM, fact, 20000))
  } catch {
    return { selfMode: true, src: 'self-fallback', verdict: 'incorrect', aiReason: '' }
  }
  if (!first) return { selfMode: true, src: 'self-fallback', verdict: 'incorrect', aiReason: '' }
  if (first.verdict !== 'incorrect') {
    return { selfMode: false, src: 'ai', verdict: first.verdict, aiReason: first.reason }
  }
  try {
    const second = parseVerdictJson(
      await callAIOrNull(SUBJ_AUDIT_SYSTEM, fact + '\n初判理由：' + first.reason + '\n请复审。', 20000)
    )
    if (second && second.verdict !== 'incorrect') {
      return { selfMode: false, src: 'ai-audit', verdict: second.verdict, aiReason: '审计改判：' + second.reason }
    }
  } catch { /* 审计失败维持初判 */ }
  return { selfMode: false, src: 'ai', verdict: 'incorrect', aiReason: first.reason }
}

export const VERDICT_POINTS = { correct: 1, partial: 0.5, incorrect: 0 }
