<template>
  <div class="quiz-widget">
    <div class="qw-topbar">
      <h3>📝 随堂测验</h3>
      <div class="qw-tabs">
        <button class="qw-tab" :class="{ 'qw-tab-active': view === 'pick' }" @click="goPick">题库</button>
        <button class="qw-tab" :class="{ 'qw-tab-active': view === 'exam' }" @click="view = 'exam'">🎯 模拟考</button>
        <button class="qw-tab" :class="{ 'qw-tab-active': view === 'wrongbook' }" @click="view = 'wrongbook'">
          错题本
          <span v-if="wrongItems.length" class="qw-tab-badge">{{ wrongItems.length }}</span>
        </button>
      </div>
      <button class="qw-ai-btn" :class="{ 'qw-ai-on': aiReady }" @click="openAiSettings">
        ⚙️ AI{{ aiReady ? '✓' : '' }}
      </button>
    </div>

    <!-- ============ 题库选择 ============ -->
    <div v-if="view === 'pick'">
      <p class="qw-hint">
        测验达标（≥80 分）自动点亮对应模块的全部章节；错过的题自动进错题本。
        判分分层：选择题/填空题本地判分（填空对不上再交 AI）；问答/实操题由 AI 判卷（未配密钥时可对照参考答案自评，不计分）。
      </p>
      <div v-if="!currentUser" class="qw-login-hint">
        当前未登录：可以正常做题，但成绩、错题本和达标点亮不会保存。点右上角「注册/登录」后记录会按账户保存。
      </div>
      <!-- AI 引导（未配密钥时展示，提升发现性） -->
      <div v-if="!aiReady" class="qw-ai-banner">
        🤖 配置 AI 密钥可解锁：<b>问答/实操题 AI 判卷</b>、<b>错题针对性精讲</b>（密钥只存你本机浏览器，站点零密钥）。
        <button class="qw-btn qw-btn-primary qw-ai-banner-btn" @click="openAiSettings">点此配置</button>
      </div>
      <!-- 题目搜索：题干/选项/解析/参考答案 全文过滤 -->
      <div class="qw-search">
        <input
          v-model="searchText"
          class="qw-fill-input qw-search-input"
          placeholder="🔎 搜索题目或知识点（如：子网、chmod、RAID）"
        />
      </div>
      <div v-if="searchText.trim()" class="qw-search-results">
        <p v-if="!searchResults.length" class="qw-empty">没有匹配「{{ searchText.trim() }}」的题目</p>
        <div
          v-for="r in searchResults"
          :key="r.quizId + '/' + r.q.id"
          class="qw-search-item"
          @click="startQuiz(r.quiz, 'full')"
        >
          <span class="qw-search-source">{{ r.quiz.title }} · {{ typeLabel(r.q) }}</span>
          <span class="qw-search-q">{{ r.q.question }}</span>
        </div>
      </div>
      <div v-else class="qw-grid">
        <div v-for="qz in quizzes" :key="qz.id" class="qw-card" @click="startQuiz(qz, 'full')">
          <div class="qw-card-title">{{ qz.title }}</div>
          <div class="qw-card-meta">
            <span>{{ difficultyLabel(qz.difficulty) }}</span>
            <span>{{ qz.questions.length }} 题</span>
            <span v-if="qz.module">🔗 {{ moduleTitleOf(qz.module) }}</span>
          </div>
          <div v-if="bestScore(qz.id) !== null" class="qw-card-best" :class="{ 'qw-best-pass': bestScore(qz.id) >= PASS_LINE }">
            最佳 {{ bestScore(qz.id) }} 分{{ isVerified(qz.module) ? ' 🏆' : '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 模拟考试 ============ -->
    <ExamPanel v-else-if="view === 'exam'" @exit="goPick" />

    <!-- ============ 答题 ============ -->
    <div v-else-if="view === 'quiz'" class="qw-quiz">
      <div class="qw-progress-row">
        <button class="qw-btn qw-btn-ghost" @click="confirmQuit">← 退出</button>
        <span class="qw-progress-title">
          {{ runQuiz.title }} · 第 {{ idx + 1 }} / {{ runQuestions.length }} 题
          <em v-if="isPractice">（练习模式）</em>
        </span>
        <span class="qw-progress-score">得分 {{ earnedPoints }}<template v-if="countedSoFar"> / {{ countedSoFar }}</template></span>
      </div>

      <div class="qw-question">
        <span class="qw-qtype" :class="{ 'qw-qtype-subj': isSubjective(currentQ) }">{{ typeLabel(currentQ) }}</span>
        <p class="qw-qtext">{{ currentQ.question }}</p>
      </div>

      <div v-if="currentQ.type === 'multiple-choice'" class="qw-options">
        <button
          v-for="(opt, i) in currentQ.options"
          :key="i"
          class="qw-option"
          :class="optionClass(i)"
          :disabled="answered || grading"
          @click="answerChoice(i)"
        >
          <span class="qw-opt-letter">{{ 'ABCD'[i] || '?' }}</span>
          <span>{{ opt }}</span>
        </button>
      </div>
      <div v-else-if="currentQ.type === 'fill-blank'" class="qw-fill">
        <input
          v-model="fillInput"
          class="qw-fill-input"
          :disabled="answered || grading"
          placeholder="输入你的答案，回车或点提交"
          @keyup.enter="submitFill"
        />
        <button class="qw-btn qw-btn-primary" :disabled="answered || grading || !fillInput.trim()" @click="submitFill">提交</button>
      </div>
      <div v-else class="qw-subjective">
        <textarea
          v-model="fillInput"
          class="qw-textarea"
          :disabled="answered || grading"
          rows="5"
          placeholder="写出你的答案（命令/配置/要点），提交后由 AI 判卷；未配密钥则对照参考答案自评"
        ></textarea>
        <div class="qw-subj-actions">
          <span class="qw-subj-count">{{ fillInput.length }} 字</span>
          <button class="qw-btn qw-btn-primary" :disabled="answered || grading || !fillInput.trim()" @click="submitSubjective">提交</button>
        </div>
      </div>

      <div v-if="grading" class="qw-grading">🤖 AI {{ isSubjective(currentQ) ? '判卷' : '判分' }}中，稍等…</div>

      <!-- 客观题反馈 -->
      <div v-if="answered && lastJudge && !lastJudge.selfMode" class="qw-feedback" :class="feedbackClass">
        <div class="qw-feedback-head">
          <b>{{ feedbackTitle }}</b>
          <span class="qw-judge-src">{{ judgeSrcLabel(lastJudge) }}</span>
        </div>
        <div v-if="currentQ.type === 'fill-blank'" class="qw-your-answer">你的答案：{{ lastAnswerDisplay }}</div>
        <div v-if="currentQ.type === 'fill-blank' && !lastJudge.correct" class="qw-correct-answer">正确答案：{{ correctDisplay(currentQ) }}</div>
        <p v-if="currentQ.explanation" class="qw-explanation">💡 {{ currentQ.explanation }}</p>
        <div v-if="isSubjective(currentQ)" class="qw-reference">
          <div class="qw-reference-title">📋 参考答案</div>
          <p class="qw-reference-body">{{ currentQ.reference }}</p>
        </div>
        <p v-if="lastJudge.aiReason" class="qw-ai-reason">🤖 {{ lastJudge.aiReason }}</p>
        <button class="qw-btn qw-btn-primary qw-next" @click="nextQuestion">
          {{ idx < runQuestions.length - 1 ? '下一题 →' : '交卷 🏁' }}
        </button>
      </div>

      <!-- 主观题自评反馈（未配密钥 / AI 不可用，不计分） -->
      <div v-if="answered && lastJudge && lastJudge.selfMode" class="qw-feedback qw-feedback-self">
        <div class="qw-feedback-head">
          <b>🟡 自评模式（{{ lastJudge.src === 'self-fallback' ? 'AI 不可用，已自动降级' : '未配 AI 密钥' }}，本题不计分）</b>
        </div>
        <div class="qw-your-answer">你的答案：<span class="qw-answer-text">{{ lastAnswerDisplay }}</span></div>
        <div class="qw-reference">
          <div class="qw-reference-title">📋 参考答案（对照自评）</div>
          <p class="qw-reference-body">{{ currentQ.reference }}</p>
        </div>
        <div class="qw-self-actions">
          <button class="qw-btn qw-btn-ok" @click="selfAssess(true)">✅ 我基本答对了</button>
          <button class="qw-btn qw-btn-danger" @click="selfAssess(false)">❌ 没答好，记入错题本</button>
        </div>
        <button class="qw-btn qw-btn-primary qw-next" :disabled="!selfDone" @click="nextQuestion">
          {{ idx < runQuestions.length - 1 ? '下一题 →' : '交卷 🏁' }}
        </button>
      </div>
    </div>

    <!-- ============ 结果 ============ -->
    <div v-else-if="view === 'result'" class="qw-result">
      <div class="qw-score-ring" :class="{ 'qw-score-pass': passed }">
        <span class="qw-score-num">{{ score }}</span><span class="qw-score-unit">分</span>
      </div>
      <p class="qw-tier">{{ tierText }}</p>

      <div v-if="isPractice" class="qw-note">练习模式：不计成绩，也不点亮模块。</div>
      <div v-else-if="uncountedNote" class="qw-note">{{ uncountedNote }}</div>
      <div v-if="!isPractice && passed && markedInfo" class="qw-pass-banner">
        🏆 达标！已自动点亮《{{ moduleTitleOf(markedInfo.module) }}》模块全部 {{ markedInfo.count }} 章进度。
      </div>
      <div v-else-if="!isPractice && passed" class="qw-pass-banner">
        🏆 达标！{{ runQuiz.module ? '该题库未关联章节进度（纯练习题库）。' : '' }}
      </div>
      <div v-else-if="!isPractice && runQuiz.module && chapterListOf(runQuiz.module).length" class="qw-nopass-banner">
        未到 {{ PASS_LINE }} 分，暂不点亮模块章节。看看下面的错题讲解，然后重考一次。
      </div>

      <div v-if="wrongOnes.length" class="qw-wrong-review">
        <h4>❌ 本次待巩固（{{ wrongOnes.length }} 题）</h4>
        <div v-for="w in wrongOnes" :key="w.q.id" class="qw-wrong-item">
          <p class="qw-wrong-q">{{ w.q.question }}</p>
          <p class="qw-wrong-ans">
            {{ w.judge.selfMode ? '自评：没答好' : '你的答案：' + w.display + ' ✗' }}
            <template v-if="!isSubjective(w.q)">　正确答案：{{ correctDisplay(w.q) }}</template>
            <template v-if="w.judge.earned > 0">（部分得分 {{ w.judge.earned }}）</template>
          </p>
          <p v-if="w.q.explanation" class="qw-explanation">💡 {{ w.q.explanation }}</p>
          <div v-if="isSubjective(w.q)" class="qw-reference">
            <div class="qw-reference-title">📋 参考答案</div>
            <p class="qw-reference-body">{{ w.q.reference }}</p>
          </div>
          <a v-if="w.q.chapter" class="qw-backlink" :href="chapterHref(w.q.chapter)">📖 回读：{{ chapterTitleOf(w.q.chapter) }}</a>
        </div>
      </div>

      <div v-if="isPractice" class="qw-result-actions">
        <button class="qw-btn qw-btn-ghost" @click="goPick">返回题库</button>
      </div>
      <div v-else class="qw-result-actions">
        <button class="qw-btn qw-btn-primary" @click="startQuiz(runQuiz, 'full')">重做全套</button>
        <button v-if="wrongOnes.length" class="qw-btn" @click="redoWrongAll">只重做错题</button>
        <button class="qw-btn qw-btn-ghost" @click="goPick">返回题库</button>
      </div>
    </div>

    <!-- ============ 错题本 ============ -->
    <div v-else-if="view === 'wrongbook'">
      <p class="qw-hint">按题库分组；重做答对后自动移出。配好 AI 密钥后，每道错题可以要一份针对性精讲。</p>
      <div v-if="!currentUser" class="qw-login-hint">未登录不保存错题——登录后做题才会收集到这里。</div>
      <div v-if="!wrongGroups.length" class="qw-empty">🎉 错题本是空的（或还没有做题记录）</div>
      <div v-for="g in wrongGroups" :key="g.quizId" class="qw-wb-group">
        <div class="qw-wb-head">
          <b>{{ g.quizTitle }}</b>
          <span class="qw-wb-count">{{ g.items.length }} 题</span>
          <button class="qw-btn qw-btn-ghost" @click="redoWrongGroup(g)">只重做本组</button>
        </div>
        <div v-for="it in g.items" :key="it.key" class="qw-wb-item">
          <div class="qw-wb-q" @click="it.open = !it.open">
            <span class="qw-wb-qtext">{{ it.question }}</span>
            <span class="qw-wb-meta">×{{ it.times }} 次</span>
          </div>
          <div v-if="it.open" class="qw-wb-detail">
            <p class="qw-wrong-ans">
              你的答案：<span class="qw-answer-text">{{ it.myAnswer }}</span>
              <template v-if="!it.isSubjective">　正确答案：{{ it.correctDisplay }}</template>
            </p>
            <p v-if="it.explanation" class="qw-explanation">💡 {{ it.explanation }}</p>
            <div v-if="it.reference" class="qw-reference">
              <div class="qw-reference-title">📋 参考答案</div>
              <p class="qw-reference-body">{{ it.reference }}</p>
            </div>
            <a v-if="it.chapter" class="qw-backlink" :href="chapterHref(it.chapter)">📖 回读：{{ chapterTitleOf(it.chapter) }}</a>
            <div class="qw-self-actions">
              <button v-if="aiReady" class="qw-btn" :disabled="it.explaining" @click="aiExplain(it)">
                {{ it.explaining ? '🤖 生成中…' : '🤖 AI 精讲' }}
              </button>
              <button v-else class="qw-btn qw-btn-ghost" @click="openAiSettings">🤖 AI 精讲（需先配置密钥）</button>
            </div>
            <p v-if="it.aiExplanation" class="qw-ai-reason qw-ai-long">{{ it.aiExplanation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ AI 设置（BYOK） ============ -->
    <div v-if="showAiSettings" class="qw-modal-mask" @click.self="showAiSettings = false">
      <div class="qw-modal">
        <h4>⚙️ AI 判分与精讲（自带密钥）</h4>
        <p class="qw-privacy">
          密钥只保存在<b>你本机浏览器</b>（localStorage），本站代码与仓库零密钥；请求由你的浏览器直连服务商。
          与 CLI 侧 <code>.env</code> 完全独立。不配置也能完整做题（问答/实操题转自评模式，不计分）。
        </p>
        <label class="qw-field">服务商
          <select v-model="aiForm.provider" class="qw-input" @change="onProviderChange">
            <option value="deepseek">DeepSeek（默认）</option>
            <option value="kimi">Kimi（月之暗面）</option>
            <option value="zhipu">智谱 GLM</option>
            <option value="custom">自定义（OpenAI 兼容）</option>
          </select>
        </label>
        <label class="qw-field">API 地址
          <input v-model="aiForm.baseUrl" class="qw-input" placeholder="https://api.deepseek.com" />
        </label>
        <label class="qw-field">模型名
          <input v-model="aiForm.model" class="qw-input" placeholder="deepseek-chat" />
        </label>
        <label class="qw-field">API 密钥
          <input v-model="aiForm.apiKey" type="password" class="qw-input" placeholder="sk-…（输入时隐藏）" />
        </label>
        <div class="qw-modal-actions">
          <button class="qw-btn qw-btn-ghost" :disabled="testingConn" @click="testConnection">
            {{ testingConn ? '测试中…' : '🔌 测试连接' }}
          </button>
          <button v-if="aiConfig.apiKey" class="qw-btn qw-btn-danger" @click="clearAiConfig">清除密钥</button>
          <span class="qw-spacer"></span>
          <button class="qw-btn qw-btn-ghost" @click="showAiSettings = false">取消</button>
          <button class="qw-btn qw-btn-primary" @click="saveAiConfig">保存</button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="qw-toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'
import { ACTIVE_USER_KEY, setPageDone } from '../utils/progress.js'
import { QUIZZES, CHAPTER_QUESTIONS, chapterListOf, moduleTitleOf, chapterTitleOf } from '../utils/chapters.js'
import { readStore, writeStore } from '../utils/store.js'
import { createCallAI, gradeFill, gradeSubjective, VERDICT_POINTS, normalizeAnswer } from '../utils/grading.js'
import ExamPanel from './ExamPanel.vue'

const quizzes = QUIZZES

// ============================================================
// 常量与工具
// ============================================================
const PASS_LINE = 80
const QUIZ_KEY_PREFIX = 'it-trainer-quiz-'
const WRONG_KEY_PREFIX = 'it-trainer-wrongbook-'
const AI_CONFIG_KEY = 'it-trainer-ai-config'
const USERS_KEY = 'it-trainer-users'

const PROVIDER_PRESETS = {
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  kimi: { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  custom: { baseUrl: '', model: '' },
}

const TYPE_LABELS = {
  'multiple-choice': '选择题',
  'fill-blank': '填空题',
  'short-answer': '问答题',
  coding: '实操题',
}

function difficultyLabel(d) {
  return d === 'beginner' ? '入门' : d === 'advanced' ? '高阶' : '进阶'
}
function typeLabel(q) {
  return TYPE_LABELS[q.type] || q.type
}
function isSubjective(q) {
  return q && (q.type === 'short-answer' || q.type === 'coding')
}
function correctDisplay(q) {
  return q.type === 'multiple-choice' ? q.options[q.correct] : q.correct
}
function chapterHref(slug) {
  return withBase('/' + slug.replace(/\.md$/, ''))
}

// ============================================================
// 题目搜索（客户端全库过滤：题干/选项/解析/参考答案）
// ============================================================
const searchText = ref('')
const searchResults = computed(() => {
  const kw = searchText.value.trim().toLowerCase()
  if (!kw) return []
  const out = []
  for (const qz of quizzes) {
    for (const q of qz.questions || []) {
      const haystack = [
        q.question,
        ...(q.options || []),
        q.explanation || '',
        q.reference || '',
        q.correct !== undefined && q.type !== 'multiple-choice' ? String(q.correct) : '',
      ].join('\n').toLowerCase()
      if (haystack.includes(kw)) {
        out.push({ quiz: qz, quizId: qz.id, q })
        if (out.length >= 20) return out
      }
    }
  }
  return out
})

// ============================================================
// AI 测试连接（用表单当前值直接探测，不必先保存）
// ============================================================
const testingConn = ref(false)
async function testConnection() {
  const { baseUrl, model, apiKey } = aiForm.value
  if (!apiKey.trim()) {
    showToast('请先填写密钥再测试')
    return
  }
  testingConn.value = true
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10000)
  try {
    const res = await fetch(String(baseUrl).replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey.trim() },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        temperature: 0,
        max_tokens: 8,
        messages: [{ role: 'user', content: 'ping，只回复 pong' }],
      }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error('HTTP ' + res.status + (res.status === 401 ? '（密钥无效）' : '（检查地址/模型名）'))
    showToast('✅ 连接成功，配置可用')
  } catch (e) {
    showToast('❌ 连接失败：' + (e && e.message ? e.message : '网络问题'))
  } finally {
    clearTimeout(timer)
    testingConn.value = false
  }
}

// ============================================================
// 用户 / 存储（登录用户才持久化；未登录只做题不落盘）
// ============================================================
const currentUser = ref(null)
const quizStore = ref({ attempts: [], verifiedModules: [] })
const wrongItems = ref([])

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

function loadStores() {
  if (!currentUser.value) {
    quizStore.value = { attempts: [], verifiedModules: [] }
    wrongItems.value = []
    return
  }
  const uid = currentUser.value.id
  const q = readStore(QUIZ_KEY_PREFIX + uid)
  quizStore.value = q && Array.isArray(q.attempts) ? q : { attempts: [], verifiedModules: [] }
  if (!Array.isArray(quizStore.value.verifiedModules)) quizStore.value.verifiedModules = []
  const w = readStore(WRONG_KEY_PREFIX + uid)
  wrongItems.value = Array.isArray(w) ? w.map((it) => ({ ...it, open: false, explaining: false })) : []
}

function persistQuizStore() {
  if (!currentUser.value) return
  writeStore(QUIZ_KEY_PREFIX + currentUser.value.id, quizStore.value, 1)
}
function persistWrongItems() {
  if (!currentUser.value) return
  writeStore(WRONG_KEY_PREFIX + currentUser.value.id, wrongItems.value, 1)
}

// ============================================================
// AI 配置（BYOK：只存本浏览器，站点零密钥）
// ============================================================
const aiConfig = ref({ provider: 'deepseek', baseUrl: '', model: '', apiKey: '' })
const aiForm = ref({ provider: 'deepseek', baseUrl: '', model: '', apiKey: '' })
const showAiSettings = ref(false)
const aiReady = computed(() => !!aiConfig.value.apiKey)

function loadAiConfig() {
  try {
    const c = JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || 'null')
    if (c && c.apiKey) {
      aiConfig.value = { provider: 'deepseek', ...c }
      return
    }
  } catch { /* 忽略损坏配置 */ }
  aiConfig.value = { provider: 'deepseek', baseUrl: '', model: '', apiKey: '' }
}

function openAiSettings() {
  aiForm.value = { ...aiConfig.value }
  showAiSettings.value = true
}

function onProviderChange() {
  const preset = PROVIDER_PRESETS[aiForm.value.provider]
  if (preset) {
    aiForm.value.baseUrl = preset.baseUrl
    aiForm.value.model = preset.model
  }
}

function saveAiConfig() {
  const baseUrl = aiForm.value.baseUrl.trim()
  if (aiForm.value.provider === 'custom' && !/^https?:\/\//.test(baseUrl)) {
    showToast('自定义 API 地址需以 http(s):// 开头')
    return
  }
  if (!aiForm.value.apiKey.trim()) {
    showToast('密钥不能为空；不想使用 AI 可直接点「清除密钥」')
    return
  }
  aiConfig.value = {
    provider: aiForm.value.provider,
    baseUrl: baseUrl || PROVIDER_PRESETS[aiForm.value.provider].baseUrl,
    model: aiForm.value.model.trim() || PROVIDER_PRESETS[aiForm.value.provider].model,
    apiKey: aiForm.value.apiKey.trim(),
  }
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(aiConfig.value))
  showAiSettings.value = false
  showToast('已保存到本机浏览器（站点与仓库不含密钥）')
}

function clearAiConfig() {
  localStorage.removeItem(AI_CONFIG_KEY)
  aiConfig.value = { provider: 'deepseek', baseUrl: '', model: '', apiKey: '' }
  aiForm.value = { ...aiConfig.value }
  showAiSettings.value = false
  showToast('已清除，问答/实操题将转为自评模式')
}

/** OpenAI 兼容调用（判分模块注入）；失败抛错由调用方降级 */
const callAI = (system, user, timeout) => createCallAI(aiConfig.value)(system, user, timeout)

function judgeSrcLabel(j) {
  switch (j.src) {
    case 'local': return '本地规则判分'
    case 'local-fallback': return '本地规则判分（AI 不可用，已自动降级）'
    case 'ai': return isSubjective(currentQ.value) ? 'AI 判卷' : 'AI 初判'
    case 'audit': return 'AI 初判 ✗ → 对抗审计推翻为对 ✓'
    case 'ai-audit': return 'AI 判卷 ✗ → 对抗审计改判'
    case 'ai+audit': return 'AI 初判 + 对抗审计维持'
    case 'self': return '自评（未配密钥）'
    case 'self-fallback': return 'AI 不可用，转自评'
    default: return ''
  }
}

// ============================================================
// 答题流程
// ============================================================
const view = ref('pick')            // pick | quiz | result | wrongbook
const runMode = ref('full')         // full | wrong | chapter（练习模式）
const runQuiz = ref(null)
const runQuestions = ref([])
const idx = ref(0)
const answered = ref(false)
const grading = ref(false)
const lastJudge = ref(null)
const lastAnswerDisplay = ref('')
const fillInput = ref('')
const runResults = ref([])          // [{q, display, judge, earned, possible, counted}]
const score = ref(0)
const passed = ref(false)
const markedInfo = ref(null)
const wrongOnes = ref([])
const selfDone = ref(false)

const currentQ = computed(() => runQuestions.value[idx.value] || null)
const isPractice = computed(() => runMode.value !== 'full')
const earnedPoints = computed(() => runResults.value.reduce((s, r) => s + (r.counted ? r.earned : 0), 0))
const countedSoFar = computed(() => runResults.value.filter((r) => r.counted).length)
const uncountedNote = computed(() => {
  const n = runResults.value.filter((r) => !r.counted).length
  return n ? `${n} 道问答/实操题为自评模式，未计入分数（配置 AI 密钥后由 AI 判卷计分）` : ''
})

const feedbackTitle = computed(() => {
  if (!lastJudge.value) return ''
  if (isSubjective(currentQ.value)) {
    if (lastJudge.value.verdict === 'correct') return '✅ 判卷：回答正确（得 1 分）'
    if (lastJudge.value.verdict === 'partial') return '🟡 判卷：部分正确（得 0.5 分）'
    return '❌ 判卷：未达要点（得 0 分）'
  }
  return lastJudge.value.correct ? '✅ 回答正确' : '❌ 回答错误'
})
const feedbackClass = computed(() => {
  if (!lastJudge.value) return ''
  const ok = isSubjective(currentQ.value)
    ? lastJudge.value.verdict === 'correct'
    : lastJudge.value.correct
  const partial = isSubjective(currentQ.value) && lastJudge.value.verdict === 'partial'
  if (ok) return 'qw-feedback-ok'
  if (partial) return 'qw-feedback-partial'
  return 'qw-feedback-no'
})

function bestScore(quizId) {
  const list = quizStore.value.attempts.filter((a) => a.quizId === quizId)
  if (!list.length) return null
  return Math.max(...list.map((a) => a.score))
}
function isVerified(module) {
  return !!module && quizStore.value.verifiedModules.includes(module)
}

function startQuiz(qz, mode) {
  runQuiz.value = qz
  runQuestions.value = qz.questions.map((q) => ({ ...q }))
  resetRun()
  runMode.value = mode
  view.value = 'quiz'
}

/** 章节小测（深链 ?chapter=courses/x/01-y.md）：跨题库聚合该章题目，练习模式 */
function startChapterRun(chapter) {
  const items = CHAPTER_QUESTIONS[chapter] || []
  if (!items.length) return false
  runQuiz.value = { id: 'chapter:' + chapter, title: '章节小测 · ' + chapterTitleOf(chapter), module: '' }
  runQuestions.value = items.map((q) => ({ ...q }))
  resetRun()
  runMode.value = 'chapter'
  view.value = 'quiz'
  return true
}

function resetRun() {
  idx.value = 0
  answered.value = false
  grading.value = false
  lastJudge.value = null
  lastAnswerDisplay.value = ''
  fillInput.value = ''
  runResults.value = []
  score.value = 0
  passed.value = false
  markedInfo.value = null
  wrongOnes.value = []
  selfDone.value = false
}

function confirmQuit() {
  if (window.confirm('确定退出本次测验？当前进度将丢弃。')) {
    view.value = 'pick'
    resetRun()
  }
}

function optionClass(i) {
  if (!answered.value || !lastJudge.value || isSubjective(currentQ.value)) return ''
  if (i === currentQ.value.correct) return 'qw-option-right'
  if (i === lastJudge.value.chosen && !lastJudge.value.correct) return 'qw-option-wrong'
  return ''
}

function answerChoice(i) {
  if (answered.value || grading.value) return
  const q = currentQ.value
  const judge = { correct: i === q.correct, src: 'local', selfMode: false, chosen: i }
  finishAnswer(judge, q.options[i], judge.correct ? 1 : 0, 1, true)
}

async function submitFill() {
  if (answered.value || grading.value || !fillInput.value.trim()) return
  const q = currentQ.value
  const answer = fillInput.value.trim()
  grading.value = true
  let judge
  try {
    judge = await gradeFill(q, answer, aiReady.value ? callAI : null)
  } catch {
    judge = { correct: false, src: 'local-fallback', selfMode: false }
  }
  grading.value = false
  finishAnswer(judge, answer, judge.correct ? 1 : 0, 1, true)
}

async function submitSubjective() {
  if (answered.value || grading.value || !fillInput.value.trim()) return
  const q = currentQ.value
  const answer = fillInput.value.trim()
  grading.value = true
  let judge
  try {
    judge = await gradeSubjective(q, answer, aiReady.value ? callAI : null)
  } catch {
    judge = { selfMode: true, src: 'self-fallback', verdict: 'incorrect', aiReason: '' }
  }
  grading.value = false
  const counted = !judge.selfMode
  const earned = counted ? VERDICT_POINTS[judge.verdict] || 0 : 0
  finishAnswer(judge, answer, earned, 1, counted)
  if (judge.selfMode) selfDone.value = false
}

/** 自评模式按钮：只影响错题本（答对移出/答错记录），不影响分数 */
function selfAssess(ok) {
  if (!lastJudge.value) return
  selfDone.value = true
  const q = currentQ.value
  if (ok) {
    removeFromWrongbook(q)
  } else {
    addWrong(q, lastAnswerDisplay.value, lastJudge.value)
  }
}

function finishAnswer(judge, display, earned, possible, counted) {
  answered.value = true
  lastJudge.value = judge
  lastAnswerDisplay.value = display
  const q = currentQ.value
  runResults.value.push({ q, display, judge, earned, possible, counted })
  if (counted && earned >= possible) {
    removeFromWrongbook(q)
  } else if (counted && earned > 0) {
    // 部分得分：不记错题本（接近掌握），仅结果页提示巩固
  } else if (!judge.selfMode || selfDone.value) {
    addWrong(q, display, judge)
  }
  // 自评模式错题记录延迟到 selfAssess() 选择后
  if (judge.selfMode) {
    const rec = runResults.value[runResults.value.length - 1]
    rec.pendingSelf = true
  }
}

function removeFromWrongbook(q) {
  const key = wrongKey(runQuiz.value.id, q.id)
  const before = wrongItems.value.length
  wrongItems.value = wrongItems.value.filter((it) => it.key !== key)
  if (wrongItems.value.length !== before) persistWrongItems()
}

function wrongKey(quizId, qid) {
  return quizId + '/' + qid
}

function addWrong(q, display, judge) {
  if (!currentUser.value) return
  const key = wrongKey(runQuiz.value.id, q.id)
  const exist = wrongItems.value.find((it) => it.key === key)
  if (exist) {
    exist.myAnswer = display
    exist.times = (exist.times || 1) + 1
    exist.lastAt = new Date().toISOString()
    exist.judgeSrc = judgeSrcLabel(judge)
    if (isSubjective(q)) exist.reference = q.reference
  } else {
    wrongItems.value.unshift({
      key,
      quizId: runQuiz.value.id,
      quizTitle: runQuiz.value.title,
      qid: q.id,
      question: q.question,
      type: q.type,
      isSubjective: isSubjective(q),
      myAnswer: display,
      correctDisplay: isSubjective(q) ? '' : correctDisplay(q),
      explanation: q.explanation || '',
      reference: isSubjective(q) ? q.reference : '',
      chapter: q.chapter || '',
      times: 1,
      lastAt: new Date().toISOString(),
      judgeSrc: judgeSrcLabel(judge),
      aiExplanation: '',
      open: false,
      explaining: false,
    })
  }
  persistWrongItems()
}

function nextQuestion() {
  if (idx.value < runQuestions.value.length - 1) {
    idx.value++
    answered.value = false
    lastJudge.value = null
    lastAnswerDisplay.value = ''
    fillInput.value = ''
    selfDone.value = false
  } else {
    finishQuiz()
  }
}

function finishQuiz() {
  const countedResults = runResults.value.filter((r) => r.counted)
  const total = countedResults.length
  const earned = countedResults.reduce((s, r) => s + r.earned, 0)
  score.value = total ? Math.round((earned / total) * 100) : 0
  passed.value = score.value >= PASS_LINE
  wrongOnes.value = runResults.value.filter((r) => !r.judge.selfMode && r.earned < r.possible)

  if (runMode.value === 'full' && currentUser.value) {
    quizStore.value.attempts.push({
      quizId: runQuiz.value.id,
      score: score.value,
      correct: earned,
      total,
      date: new Date().toISOString(),
    })
    if (passed.value && runQuiz.value.module && chapterListOf(runQuiz.value.module).length) {
      const mod = runQuiz.value.module
      const chapters = chapterListOf(mod)
      for (const slug of chapters) setPageDone(currentUser.value.id, slug, true)
      if (!quizStore.value.verifiedModules.includes(mod)) quizStore.value.verifiedModules.push(mod)
      markedInfo.value = { module: mod, count: chapters.length }
      window.dispatchEvent(new CustomEvent('it-trainer:progress-changed'))
    }
    persistQuizStore()
  }
  view.value = 'result'
}

const tierText = computed(() => {
  if (score.value >= 90) return '优秀！知识掌握得很扎实 🌟'
  if (score.value >= 80) return '达标！对应模块章节已点亮 🏆'
  if (score.value >= 70) return '接近达标，再巩固一下错题就稳了'
  if (score.value >= 50) return '刚过半，建议回看对应课程章节'
  return '还需要系统地学习对应模块内容'
})

function redoWrongAll() {
  if (!wrongOnes.value.length) return
  runQuestions.value = wrongOnes.value.map((w) => ({ ...w.q }))
  resetRun()
  runMode.value = 'wrong'
  view.value = 'quiz'
}

function goPick() {
  view.value = 'pick'
  resetRun()
}

// ============================================================
// 错题本
// ============================================================
const wrongGroups = computed(() => {
  const groups = {}
  for (const it of wrongItems.value) {
    ;(groups[it.quizId] = groups[it.quizId] || {
      quizId: it.quizId,
      quizTitle: it.quizTitle,
      items: [],
    }).items.push(it)
  }
  return Object.values(groups)
})

function redoWrongGroup(g) {
  // 章节小测产生的错题：按题目自身归属的题库找回原题
  const quizId = String(g.quizId).startsWith('chapter:') ? null : g.quizId
  let src = quizId ? quizzes.find((qz) => qz.id === quizId) : null
  if (!src) {
    // 从全库按 题干 匹配（章节小测的兜底）
    const byQuestion = new Map()
    for (const qz of quizzes) for (const q of qz.questions) byQuestion.set(q.question, { qz, q })
    const found = g.items.map((it) => byQuestion.get(it.question)).filter(Boolean)
    if (!found.length) return
    runQuiz.value = { id: g.quizId, title: g.quizTitle, module: '' }
    runQuestions.value = found.map((f) => ({ ...f.q }))
    resetRun()
    runMode.value = 'wrong'
    view.value = 'quiz'
    return
  }
  runQuiz.value = { id: src.id, title: src.title, module: '', questions: src.questions }
  runQuestions.value = g.items
    .map((it) => src.questions.find((q) => q.id === it.qid))
    .filter(Boolean)
    .map((q) => ({ ...q }))
  resetRun()
  runMode.value = 'wrong'
  view.value = 'quiz'
}

// ============================================================
// AI 错题精讲（BYOK）：针对"我的错误答案"讲为什么错
// ============================================================
async function aiExplain(it) {
  if (it.explaining) return
  it.explaining = true
  try {
    const text = await callAI(
      '你是一位耐心的 IT 讲师。学生做错了一道题，请针对学生的错误答案讲解：1) 为什么这个答案是错的（错在哪、容易和什么混淆）；2) 正确答案背后的考点；3) 一个帮助记忆的提示。全部用中文，200 字以内。直接输出讲解正文，不要 JSON。',
      `题目：${it.question}\n学生的错误答案：${it.myAnswer}\n正确答案：${it.correctDisplay || it.reference}\n参考解析：${it.explanation || it.reference}`,
      20000
    )
    it.aiExplanation = String(text).trim()
    persistWrongItems()
  } catch (e) {
    showToast('AI 精讲失败：' + (e && e.message ? e.message : '网络/密钥问题'))
  } finally {
    it.explaining = false
  }
}

// ============================================================
// 生命周期 / 提示 / 章节深链
// ============================================================
let toastTimer = null
const toast = ref('')
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 3000)
}

function onUserChanged() {
  fetchCurrentUser()
  loadStores()
}

function initFromUrl() {
  try {
    const chapter = new URLSearchParams(window.location.search).get('chapter')
    if (chapter && CHAPTER_QUESTIONS[chapter]) {
      startChapterRun(chapter)
    }
  } catch { /* URL 解析失败忽略 */ }
}

onMounted(() => {
  fetchCurrentUser()
  loadStores()
  loadAiConfig()
  initFromUrl()
  window.addEventListener('it-trainer:user-changed', onUserChanged)
})
onUnmounted(() => {
  window.removeEventListener('it-trainer:user-changed', onUserChanged)
  clearTimeout(toastTimer)
})
</script>

<style scoped>
.quiz-widget {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  padding: 20px;
  margin: 16px 0;
}

/* ---- 顶栏 ---- */
.qw-topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.qw-topbar h3 {
  margin: 0;
  font-size: 18px;
  border: none;
  padding: 0;
}
.qw-tabs {
  display: flex;
  gap: 4px;
  flex: 1;
}
.qw-tab {
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.qw-tab-active {
  background: var(--vp-c-brand-soft, rgba(59, 130, 246, 0.14));
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.qw-tab-badge {
  display: inline-block;
  min-width: 18px;
  padding: 0 5px;
  margin-left: 4px;
  border-radius: 9px;
  background: var(--vp-c-danger-1, #ef4444);
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}
.qw-ai-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  border-radius: 8px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 13px;
}
.qw-ai-on {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.qw-hint {
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.7;
  margin: 8px 0 14px;
}
.qw-login-hint {
  border: 1px dashed var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 12px;
}

/* ---- AI 引导条 / 题目搜索 ---- */
.qw-ai-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border: 1px dashed var(--vp-c-brand-1);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 12px;
}
.qw-ai-banner b {
  color: var(--vp-c-brand-1);
}
.qw-ai-banner-btn {
  padding: 4px 12px;
  font-size: 12px;
}
.qw-search {
  margin-bottom: 12px;
}
.qw-search-input {
  width: 100%;
  box-sizing: border-box;
}
.qw-search-results {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.qw-search-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  padding: 8px 12px;
  cursor: pointer;
}
.qw-search-item:hover {
  border-color: var(--vp-c-brand-1);
}
.qw-search-source {
  display: block;
  font-size: 11px;
  color: var(--vp-c-text-3);
  margin-bottom: 3px;
}
.qw-search-q {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-1);
  line-height: 1.6;
}

/* ---- 题库卡片 ---- */
.qw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}
.qw-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.qw-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
.qw-card-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
}
.qw-card-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.qw-card-best {
  margin-top: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.qw-best-pass {
  color: var(--vp-c-green-1, #10b981);
  font-weight: 600;
}

/* ---- 答题 ---- */
.qw-progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.qw-progress-title {
  flex: 1;
  font-size: 14px;
  color: var(--vp-c-text-1);
  min-width: 180px;
}
.qw-progress-score {
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.qw-question {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.qw-qtype {
  display: inline-block;
  font-size: 12px;
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  padding: 1px 8px;
  margin-bottom: 8px;
}
.qw-qtype-subj {
  color: var(--vp-c-warning-1, #d97706);
  border-color: var(--vp-c-warning-1, #d97706);
}
.qw-qtext {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
  white-space: pre-wrap;
}
.qw-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.qw-option {
  display: flex;
  align-items: baseline;
  gap: 10px;
  text-align: left;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.6;
  transition: border-color 0.12s;
}
.qw-option:not(:disabled):hover {
  border-color: var(--vp-c-brand-1);
}
.qw-option:disabled {
  cursor: default;
  opacity: 0.75;
}
.qw-option-right {
  border-color: var(--vp-c-green-1, #10b981) !important;
  background: var(--vp-c-green-soft, rgba(16, 185, 129, 0.1)) !important;
  opacity: 1 !important;
}
.qw-option-wrong {
  border-color: var(--vp-c-danger-1, #ef4444) !important;
  background: var(--vp-c-red-soft, rgba(239, 68, 68, 0.08)) !important;
  opacity: 1 !important;
}
.qw-opt-letter {
  font-weight: 700;
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}
.qw-fill {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.qw-fill-input {
  flex: 1;
  min-width: 200px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 8px 12px;
  font-size: 14px;
}
.qw-subjective {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.qw-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.7;
  font-family: inherit;
  resize: vertical;
}
.qw-subj-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}
.qw-subj-count {
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.qw-grading {
  margin-top: 12px;
  font-size: 13px;
  color: var(--vp-c-brand-1);
}
.qw-feedback {
  margin-top: 14px;
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid var(--vp-c-divider);
}
.qw-feedback-ok {
  border-color: var(--vp-c-green-1, #10b981);
  background: var(--vp-c-green-soft, rgba(16, 185, 129, 0.08));
}
.qw-feedback-partial {
  border-color: var(--vp-c-warning-1, #d97706);
  background: var(--vp-c-yellow-soft, rgba(217, 119, 6, 0.08));
}
.qw-feedback-no {
  border-color: var(--vp-c-danger-1, #ef4444);
  background: var(--vp-c-red-soft, rgba(239, 68, 68, 0.06));
}
.qw-feedback-self {
  border-color: var(--vp-c-warning-1, #d97706);
  background: var(--vp-c-yellow-soft, rgba(217, 119, 6, 0.06));
}
.qw-feedback-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.qw-judge-src {
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.qw-your-answer,
.qw-correct-answer {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin: 6px 0 0;
}
.qw-answer-text {
  white-space: pre-wrap;
}
.qw-explanation {
  font-size: 13px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 8px 0 0;
}
.qw-reference {
  margin-top: 10px;
  border-top: 1px dashed var(--vp-c-divider);
  padding-top: 8px;
}
.qw-reference-title {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-bottom: 4px;
}
.qw-reference-body {
  font-size: 13px;
  line-height: 1.8;
  color: var(--vp-c-text-2);
  white-space: pre-wrap;
  margin: 0;
}
.qw-ai-reason {
  font-size: 13px;
  line-height: 1.7;
  color: var(--vp-c-brand-1);
  margin: 8px 0 0;
  border-top: 1px dashed var(--vp-c-divider);
  padding-top: 8px;
}
.qw-ai-long {
  white-space: pre-wrap;
}
.qw-self-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.qw-btn-ok {
  border-color: var(--vp-c-green-1, #10b981);
  color: var(--vp-c-green-1, #10b981);
}
.qw-next {
  margin-top: 12px;
}
.qw-backlink {
  display: inline-block;
  margin-top: 8px;
  font-size: 13px;
  color: var(--vp-c-brand-1);
}

/* ---- 按钮 ---- */
.qw-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.12s;
}
.qw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.qw-btn-primary {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}
.qw-btn-ghost {
  background: transparent;
}
.qw-btn-danger {
  border-color: var(--vp-c-danger-1, #ef4444);
  color: var(--vp-c-danger-1, #ef4444);
}

/* ---- 结果 ---- */
.qw-result {
  text-align: center;
}
.qw-score-ring {
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
.qw-score-pass {
  border-color: var(--vp-c-green-1, #10b981);
}
.qw-score-num {
  font-size: 40px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.qw-score-unit {
  font-size: 14px;
  color: var(--vp-c-text-3);
  margin-left: 2px;
}
.qw-tier {
  font-size: 15px;
  color: var(--vp-c-text-1);
  margin: 0 0 10px;
}
.qw-pass-banner {
  border: 1px solid var(--vp-c-green-1, #10b981);
  background: var(--vp-c-green-soft, rgba(16, 185, 129, 0.1));
  color: var(--vp-c-text-1);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  margin: 10px auto;
  max-width: 560px;
}
.qw-nopass-banner {
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 10px auto;
  max-width: 560px;
}
.qw-note {
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.qw-wrong-review {
  text-align: left;
  margin: 18px auto 0;
  max-width: 720px;
}
.qw-wrong-review h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  border: none;
  padding: 0;
}
.qw-wrong-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  padding: 10px 12px;
  margin-bottom: 8px;
  text-align: left;
}
.qw-wrong-q {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.qw-wrong-ans {
  margin: 4px 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.qw-result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 18px;
}

/* ---- 错题本 ---- */
.qw-empty {
  text-align: center;
  color: var(--vp-c-text-3);
  padding: 30px 0;
}
.qw-wb-group {
  margin-bottom: 16px;
}
.qw-wb-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}
.qw-wb-count {
  font-size: 12px;
  color: var(--vp-c-text-3);
  flex: 1;
}
.qw-wb-item {
  border-bottom: 1px dashed var(--vp-c-divider);
}
.qw-wb-q {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 10px 4px;
  cursor: pointer;
}
.qw-wb-qtext {
  flex: 1;
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
.qw-wb-meta {
  font-size: 12px;
  color: var(--vp-c-danger-1, #ef4444);
  flex-shrink: 0;
}
.qw-wb-detail {
  padding: 0 4px 12px;
}

/* ---- AI 设置弹窗 ---- */
.qw-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}
.qw-modal {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  width: min(440px, 94vw);
  max-height: 88vh;
  overflow-y: auto;
}
.qw-modal h4 {
  margin: 0 0 10px;
  font-size: 16px;
  border: none;
  padding: 0;
  color: var(--vp-c-text-1);
}
.qw-privacy {
  font-size: 12px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 10px;
  margin: 0 0 12px;
}
.qw-field {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 10px;
}
.qw-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  padding: 7px 10px;
  font-size: 13px;
}
.qw-modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;
}
.qw-spacer {
  flex: 1;
}

/* ---- Toast ---- */
.qw-toast {
  position: fixed;
  left: 50%;
  bottom: 36px;
  transform: translateX(-50%);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 13px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
  z-index: 210;
  max-width: 88vw;
}
</style>
