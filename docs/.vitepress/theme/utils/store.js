// ============================================================
// localStorage 带版本读写（v2.7 起）
// 存储形态：{ _v: <版本号>, data: <载荷> }
// 旧数据（无 _v 信封）读取时视为 v1 载荷，下次写入自动升级为信封格式。
// 用法：
//   const quiz = readStore('it-trainer-quiz-' + uid, { current: 1 })
//   writeStore('it-trainer-quiz-' + uid, quiz, 1)
// 未来结构变更：current 提到 2 并提供 migrate: { 1: (d) => … }
// ============================================================

/** 读载荷；损坏/不存在返回 null */
export function readStore(key, { current = 1, migrate } = {}) {
  let raw
  try {
    raw = JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
  if (raw == null) return null
  let version = 1
  let payload = raw
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof raw._v === 'number' && 'data' in raw) {
    version = raw._v
    payload = raw.data
  }
  while (version < current) {
    const step = migrate && migrate[version]
    payload = step ? step(payload) : payload
    version++
  }
  return payload ?? null
}

/** 写载荷（自动盖版本信封） */
export function writeStore(key, payload, version = 1) {
  localStorage.setItem(key, JSON.stringify({ _v: version, data: payload }))
}

/** 删除 */
export function removeStore(key) {
  localStorage.removeItem(key)
}
