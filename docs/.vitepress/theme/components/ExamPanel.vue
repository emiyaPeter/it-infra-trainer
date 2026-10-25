<template>
  <div class="exam-panel">
    <!-- ============ 考试配置 ============ -->
    <div v-if="stage === 'config'">
      <p class="ep-hint">
        从全部题库随机抽客观题组卷（选择题+填空题，本地判分，不含问答/实操题）。
        考试中不显示对错，交卷后统一回顾。倒计时归零自动交卷。
      </p>
      <div class="ep-config">
        <label class="ep-field">题数
          <select v-model.number="questionCount" class="ep-input">
            <option :value="10">10 题（10 分钟）</option>
            <option :value="20">20 题（20 分钟）</option>
            <option :value="30">30 题（30 分钟）</option>
          </select>
        </label>
        <div class="ep-field">
          <span class="ep-label">题池</span>
          <span class="ep-pool">{{ poolSize }} 道客观题 · 覆盖 {{ quizCount }} 套题库</span>
        </div>
        <button class="ep-btn ep-btn-primary" :disabled="poolSize < questionCount" @click="startExam">🚀 开始考试</button>
      </div>
      <p v-if="!currentUser" class="ep-login-hint">未登录可考试，但成绩与错题不会保存。</p>
    </div>

    <!-- ============ 考试进行中 ============ -->
    <div v-else-if="stage === 'running'" class="ep-running">
      <div class="ep-topbar">
        <button class="ep-btn ep-btn-ghost" @click="confirmQuit">放弃考试</button>
        <div class="ep-dots">
          <span
            v-for="(a, i) in answers"
            :key="i"
            class="ep-dot"
            :class="{ 'ep-dot-here': i === idx, 'ep-dot-done': a !== null && a !== '' }"
            @click="goto(i)"
          >{{ i + 1 }}</span>
        </div>
        <span class="ep-timer" :class="{ 'ep-timer-danger': remainSeconds <= 60 }">⏱ {{ timerText }}</span>
      </div>

      <div class="ep-question">
        <p class="ep-qtext">{{ idx + 1 }}. {{ currentQ.question }}</p>
        <div v-if="currentQ.type === 'multiple-choice'" class="ep-options">
          <button
            v-for="(opt, i) in currentQ.options"
            :key="i"
            class="ep-option"
            :class="{ 'ep-option-picked': answers[idx] === i }"
            @click="answers[idx] = i"
          >
            <span class="ep-opt-letter">{{ 'ABCD'[i] || '?' }}</span>{{ opt }}
          </button>
        </div>
        <div v-else class="ep-fill">
          <input
            v-model="answers[idx]"
            class="ep-input ep-fill-input"
            placeholder="输入答案"
            @input="onFillInput"
          />
        </div>
      </div>

      <div class="ep-nav">
        <button class="ep-btn" :disabled="idx === 0" @click="idx--">← 上一题</button>
        <button v-if="idx < questions.length - 1" class="ep-btn ep-btn-primary" @click="idx++">下一题 →</button>
        <button v-else class="ep-btn ep-btn-submit" @click="confirmSubmit">交卷 🏁</button>
      </div>
      <p class="ep-unanswered" v-if="unansweredCount">还有 {{ unansweredCount }} 题未作答</p>
    </div>

    <!-- ============ 成绩与回顾 ============ -->
    <div v-else class="ep-review">
      <div class="ep-score-ring" :class="{ 'ep-score-pass': score >= 80 }">
        <span class="ep-score-num">{{ score }}</span><span class="ep-score-unit">分</span>
      </div>
      <p class="ep-tier">
        {{ score >= 80 ? '达标！' : score >= 60 ? '接近了，重点看错题。' : '需要回看对应课程章节。' }}
        <span class="ep-meta">正确 {{ correctCount }} / {{ questions.length }} · 用时 {{ usedTimeText }}</span>
      </p>
      <div class="ep-review-list">
        <div v-for="(r, i) in results" :key="i" class="ep-review-item" :class="r.correct ? 'ep-item-ok' : 'ep-item-no'">
          <p class="ep-rq">{{ i + 1 }}. {{ r.q.question }}</p>
          <p class="ep-ans">你的答案：{{ r.display || '（未作答）' }} {{ r.correct ? '✓' : '✗' }}</p>
          <p v-if="!r.correct" class="ep-ans">正确答案：{{ r.correctText }}</p>
          <p v-if="r.q.explanation" class="ep-exp">💡 {{ r.q.explanation }}</p>
        </div>
      </div>
      <div class="ep-actions">
        <button class="ep-btn ep-btn-primary" @click="stage = 'config'">再考一次</button>
        <button class="ep-btn ep-btn-ghost" @click="$emit('exit')">返回题库</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { QUIZZES } from '../utils/chapters.js'
import { readStore, writeStore } from '../utils/store.js'

defineEmits(['exit'])

const USERS_KEY = 'it-trainer-users'
const ACTIVE_USER_KEY = 'it-trainer-active-user-id'
const QUIZ_KEY_PREFIX = 'it-trainer-quiz-'
const WRONG_KEY_PREFIX = 'it-trainer-wrongbook-'

// 题池：全部客观题（带来源题库信息）
const pool = []
for (const qz of QUIZZES) {
  for (const q of qz.questions || []) {
    if (q.type === 'multiple-choice' || q.type === 'fill-blank') {
      pool.push({ ...q, _quizId: qz.id, _quizTitle: qz.title })
    }
  }
}
const quizCount = QUIZZES.length

const stage = ref('config') // config | running | review
const questionCount = ref(20)
const questions = ref([])
const answers = ref([])
const idx = ref(0)
const remainSeconds = ref(0)
const results = ref([])
const score = ref(0)
const correctCount = ref(0)
const currentUser = ref(null)

const poolSize = pool.length
const currentQ = computed(() => questions.value[idx.value] || null)
const unansweredCount = computed(() => answers.value.filter((a) => a === null || a === '').length)
const timerText = computed(() => {
  const m = Math.floor(remainSeconds.value / 60)
  const s = remainSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
const usedTimeText = computed(() => {
  const used = questionCount.value * 60 - remainSecondsAtSubmit.value
  const m = Math.max(0, Math.floor(used / 60))
  return `${m} 分钟`
})
const remainSecondsAtSubmit = ref(0)

let timerInterval = null

function fetchCurrentUser() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const activeId = localStorage.getItem(ACTIVE_USER_KEY)
    const found = activeId ? users.find((u) => String(u.id) === String(activeId)) : null
    currentUser.value = found ? { id: String(found.id), name: found.name } : null
  } catch {
    currentUser.value = null
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function startExam() {
  questions.value = shuffle(pool).slice(0, questionCount.value)
  answers.value = questions.value.map(() => null)
  idx.value = 0
  results.value = []
  stage.value = 'running'
  remainSeconds.value = questionCount.value * 60
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    remainSeconds.value--
    if (remainSeconds.value <= 0) {
      remainSeconds.value = 0
      submitExam(true)
    }
  }, 1000)
}

function goto(i) {
  idx.value = i
}

function onFillInput(e) {
  answers.value[idx.value] = e.target.value
}

function confirmQuit() {
  if (window.confirm('确定放弃本次考试？已答内容将丢弃。')) {
    clearInterval(timerInterval)
    stage.value = 'config'
  }
}

function confirmSubmit() {
  const msg = unansweredCount.value ? `还有 ${unansweredCount.value} 题未作答，确定交卷？` : '确定交卷？'
  if (window.confirm(msg)) submitExam(false)
}

function normalizeAnswer(s) {
  return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ')
}

function submitExam(auto) {
  clearInterval(timerInterval)
  remainSecondsAtSubmit.value = remainSeconds.value
  let correct = 0
  const list = []
  questions.value.forEach((q, i) => {
    const a = answers.value[i]
    const display = q.type === 'multiple-choice'
      ? (a === null ? '' : 'ABCD'[a] + '. ' + q.options[a])
      : String(a || '')
    const isCorrect = q.type === 'multiple-choice'
      ? a === q.correct
      : [q.correct, ...(q.accepts || [])].map(normalizeAnswer).includes(normalizeAnswer(a))
    if (isCorrect) correct++
    list.push({ q, display, correct: isCorrect, correctText: q.type === 'multiple-choice' ? 'ABCD'[q.correct] + '. ' + q.options[q.correct] : q.correct })
  })
  results.value = list
  correctCount.value = correct
  score.value = questions.value.length ? Math.round((correct / questions.value.length) * 100) : 0
  stage.value = 'review'
  persistResult(auto)
}

function persistResult(auto) {
  if (!currentUser.value) return
  const uid = currentUser.value.id
  // attempts 记一笔（quizId=mock-exam；不点亮模块）
  const q = readStore(QUIZ_KEY_PREFIX + uid) || { attempts: [], verifiedModules: [] }
  if (!Array.isArray(q.attempts)) q.attempts = []
  if (!Array.isArray(q.verifiedModules)) q.verifiedModules = []
  q.attempts.push({
    quizId: 'mock-exam',
    score: score.value,
    correct: correctCount.value,
    total: questions.value.length,
    date: new Date().toISOString(),
  })
  writeStore(QUIZ_KEY_PREFIX + uid, q, 1)
  // 错题进错题本（答对自动移出同源题）
  const w = readStore(WRONG_KEY_PREFIX + uid)
  const wrongItems = Array.isArray(w) ? w : []
  for (const r of results.value) {
    const key = r.q._quizId + '/' + r.q.id
    const at = wrongItems.findIndex((it) => it.key === key)
    if (r.correct) {
      if (at >= 0) wrongItems.splice(at, 1)
    } else {
      const entry = {
        key,
        quizId: r.q._quizId,
        quizTitle: r.q._quizTitle,
        qid: r.q.id,
        question: r.q.question,
        type: r.q.type,
        isSubjective: false,
        myAnswer: r.display,
        correctDisplay: r.correctText,
        explanation: r.q.explanation || '',
        reference: '',
        chapter: r.q.chapter || '',
        times: 1,
        lastAt: new Date().toISOString(),
        judgeSrc: '本地规则判分（模拟考试' + (auto ? '·到时自动交卷' : '') + '）',
        aiExplanation: '',
      }
      if (at >= 0) {
        wrongItems[at].times = (wrongItems[at].times || 1) + 1
        wrongItems[at].myAnswer = entry.myAnswer
        wrongItems[at].lastAt = entry.lastAt
      } else {
        wrongItems.unshift(entry)
      }
    }
  }
  writeStore(WRONG_KEY_PREFIX + uid, wrongItems, 1)
}

onMounted(fetchCurrentUser)
onUnmounted(() => clearInterval(timerInterval))
</script>

<style scoped>
.exam-panel {
  font-size: 14px;
}
.ep-hint {
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.7;
  margin: 8px 0 14px;
}
.ep-login-hint {
  border: 1px dashed var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.ep-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 420px;
}
.ep-field {
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.ep-label {
  display: block;
  margin-bottom: 4px;
}
.ep-pool {
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.ep-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 8px 10px;
  font-size: 14px;
}
.ep-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}
.ep-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ep-btn-primary {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}
.ep-btn-ghost {
  background: transparent;
}
.ep-btn-submit {
  background: var(--vp-c-green-1, #10b981);
  border-color: var(--vp-c-green-1, #10b981);
  color: #fff;
}

/* 考试中 */
.ep-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.ep-dots {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
}
.ep-dot {
  min-width: 26px;
  height: 26px;
  line-height: 24px;
  text-align: center;
  font-size: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-3);
  cursor: pointer;
}
.ep-dot-done {
  background: var(--vp-c-brand-soft, rgba(59, 130, 246, 0.14));
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.ep-dot-here {
  outline: 2px solid var(--vp-c-brand-1);
}
.ep-timer {
  font-size: 16px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}
.ep-timer-danger {
  color: var(--vp-c-danger-1, #ef4444);
}
.ep-question {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 14px 16px;
}
.ep-qtext {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
}
.ep-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ep-option {
  display: flex;
  align-items: baseline;
  gap: 10px;
  text-align: left;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.6;
}
.ep-option-picked {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft, rgba(59, 130, 246, 0.14));
}
.ep-opt-letter {
  font-weight: 700;
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}
.ep-fill-input {
  margin-top: 4px;
}
.ep-nav {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
}
.ep-unanswered {
  text-align: right;
  font-size: 12px;
  color: var(--vp-c-warning-1, #d97706);
  margin: 8px 0 0;
}

/* 回顾 */
.ep-review {
  text-align: center;
}
.ep-score-ring {
  width: 110px;
  height: 110px;
  margin: 6px auto 10px;
  border-radius: 50%;
  border: 3px solid var(--vp-c-divider);
  display: flex;
  align-items: baseline;
  justify-content: center;
  line-height: 110px;
}
.ep-score-pass {
  border-color: var(--vp-c-green-1, #10b981);
}
.ep-score-num {
  font-size: 40px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.ep-score-unit {
  font-size: 14px;
  color: var(--vp-c-text-3);
}
.ep-tier {
  font-size: 15px;
  color: var(--vp-c-text-1);
  margin: 0 0 16px;
}
.ep-meta {
  display: block;
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-top: 4px;
}
.ep-review-list {
  text-align: left;
  max-width: 720px;
  margin: 0 auto;
}
.ep-review-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.ep-item-ok {
  border-left: 3px solid var(--vp-c-green-1, #10b981);
}
.ep-item-no {
  border-left: 3px solid var(--vp-c-danger-1, #ef4444);
}
.ep-rq {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.ep-ans {
  margin: 3px 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.ep-exp {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.ep-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 16px;
}
</style>
