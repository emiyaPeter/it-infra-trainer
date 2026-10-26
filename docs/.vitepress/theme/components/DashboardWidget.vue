<template>
  <div class="dashboard-widget">
    <h3>📊 学习仪表盘</h3>

    <!-- Current User -->
    <div class="dw-section dw-user-section">
      <div class="dw-label">👤 当前用户</div>
      <div class="dw-user-info">
        <span v-if="currentUserName && currentUserName !== 'default'" class="dw-user-name">
          {{ currentUserName }}
        </span>
        <span v-else-if="loadingUser" class="dw-user-loading">加载中...</span>
        <span v-else class="dw-user-none">未设置</span>
        <span v-if="userList.length > 1" class="dw-user-count">(共 {{ userList.length }} 位)</span>
        <button
          v-if="currentUserName && currentUserName !== 'default'"
          class="dw-btn dw-btn-reset dw-recovery-btn"
          title="生成/重置账户恢复码（忘记密码时用它重置）"
          @click="openRecoveryModal"
        >🔑 恢复码</button>
      </div>

      <div v-if="userList.length > 1" class="dw-user-create-hint">
        <p>切换账户请用右上角「切换账户」（需验证密码）</p>
      </div>

      <div v-else-if="!loadingUser && !currentUserName" class="dw-user-create-hint">
        <p>点击右上角「注册」创建你的学习账户</p>
        <button class="dw-btn dw-btn-reset dw-demo-btn" @click="loadDemoData">
          🧪 载入演示数据
        </button>
      </div>
    </div>

    <!-- Overall Progress -->
    <div class="dw-section">
      <div class="dw-label">总体进度（已完成章节 {{ completedChapters }} / {{ totalChapters }}）</div>
      <div class="dw-progress-row">
        <div class="dw-progress-bar">
          <div class="dw-progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
        <span class="dw-value">{{ overallProgress }}%</span>
      </div>
      <p class="dw-hint">学习完一页课程后，点击页面右下角「标记已完成」累计进度。</p>
    </div>

    <!-- Phase Progress -->
    <div class="dw-section">
      <div class="dw-label">各阶段进度</div>
      <div v-for="phase in phases" :key="phase.id" class="dw-phase-row">
        <span class="dw-phase-name">{{ phase.label }}</span>
        <div class="dw-mini-bar">
          <div
            class="dw-mini-fill"
            :style="{ width: phase.progress + '%' }"
            :class="{ 'dw-complete': phase.progress >= 100 }"
          ></div>
        </div>
        <span class="dw-phase-pct">{{ phase.total > 0 ? phase.progress + '%' : '—' }}</span>
      </div>
      <p v-if="verifiedCount > 0" class="dw-verified">
        🏆 测验达标模块：{{ verifiedCount }} 个（<a :href="withBase('/quiz/')" class="dw-verified-link">随堂测验</a>≥80 分自动点亮章节）
      </p>
    </div>

    <!-- Quiz Score Stats -->
    <div v-if="quizStatRows.length" class="dw-section">
      <div class="dw-label">📈 测验成绩（各模块最佳）</div>
      <div class="dw-quiz-summary">平均最佳 {{ avgBestScore }} 分 · 已验证 {{ verifiedCount }} 模块</div>
      <div v-for="s in quizStatRows" :key="s.module" class="dw-quiz-row">
        <span class="dw-quiz-name">{{ s.title }}</span>
        <div class="dw-mini-bar">
          <div class="dw-mini-fill" :class="{ 'dw-complete': s.best >= 80 }" :style="{ width: s.best + '%' }"></div>
        </div>
        <span class="dw-quiz-best" :class="{ 'dw-quiz-pass': s.best >= 80 }">{{ s.best }} 分</span>
        <button v-if="s.verified" class="dw-btn dw-btn-reset dw-cert-btn" title="下载结业证书" @click="openCertificate(s)">🎓 证书</button>
        <span v-else-if="s.best < 80" class="dw-quiz-weak">待强化</span>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="dw-section">
      <div class="dw-label">快速操作</div>
      <div class="dw-links">
        <a :href="withBase('/roadmap/')" class="dw-link">🗺️ 学习路线图</a>
        <a :href="withBase('/quiz/')" class="dw-link">📝 随堂测验</a>
        <a :href="withBase('/courses/ai-programming/')" class="dw-link">🤖 AI 编程课</a>
        <a :href="withBase('/courses/networking/')" class="dw-link">🌐 网络基础</a>
        <a :href="withBase('/courses/linux/')" class="dw-link">🐧 Linux 管理</a>
      </div>
    </div>

    <!-- Study Timer -->
    <div class="dw-section">
      <div class="dw-label">🍅 番茄钟</div>
      <div class="dw-timer">
        <span class="dw-timer-display">{{ timerDisplay }}</span>
        <div class="dw-timer-controls">
          <button v-if="!timerRunning" class="dw-btn" @click="startTimer">开始专注</button>
          <button v-else class="dw-btn dw-btn-stop" @click="stopTimer">停止</button>
          <template v-if="!timerRunning && timerSeconds > 0">
            <button class="dw-btn dw-btn-reset" @click="resetTimer">归零</button>
          </template>
        </div>
      </div>
      <p v-if="timerMsg" class="dw-timer-msg">{{ timerMsg }}</p>
    </div>

    <!-- Data Management -->
    <div class="dw-section">
      <div class="dw-label">💾 学习数据管理</div>
      <div v-if="backupReminder" class="dw-backup-reminder">
        ⏰ {{ backupReminder }}——学习数据只存在本浏览器，建议导出一份备份文件。
        <button class="dw-btn dw-btn-reset" @click="exportData">立即备份</button>
      </div>
      <div class="dw-links">
        <button class="dw-link dw-btn-like" @click="exportData">📤 导出备份</button>
        <button class="dw-link dw-btn-like" @click="triggerImport">📥 导入备份</button>
        <button class="dw-link dw-btn-like" @click="openReport">📋 学习报告</button>
      </div>
      <p class="dw-hint">
        备份包含账户（含密码与恢复码哈希）、学习进度、测验成绩与错题本。换浏览器 / 换电脑时：旧环境导出 → 新环境导入。
        学习报告在新标签页打开，可打印成 PDF。
      </p>
      <p v-if="dataMsg" class="dw-data-msg">{{ dataMsg }}</p>
      <input
        ref="importInput"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onImportFile"
      />
    </div>

    <!-- 结业证书弹窗（canvas 本地生成） -->
    <Teleport to="body">
      <div v-if="certModal" class="dw-cert-mask" @click.self="certModal = null">
        <div class="dw-cert-modal">
          <h4>🎓 结业证书 · {{ certModal.title }}</h4>
          <canvas ref="certCanvas" class="dw-cert-canvas"></canvas>
          <div class="dw-cert-actions">
            <button class="dw-btn" @click="downloadCertificate">⬇️ 下载 PNG</button>
            <button class="dw-btn dw-btn-ghost-cert" @click="certModal = null">关闭</button>
          </div>
          <p class="dw-cert-note">证书由本机浏览器生成，记录达标测验成绩，属自学完成证明（非官方认证）。</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { withBase } from 'vitepress'
import {
  PHASE_CATALOG,
  phaseChapterTotal,
  ACTIVE_USER_KEY,
  loadUserProgress,
  computePhaseProgress,
  totalCompletedChapters,
} from '../utils/progress.js'
import { readStore, writeStore } from '../utils/store.js'
import { summarizeModules, buildReportHTML } from '../utils/report.js'

const BACKUP_META_KEY = 'it-trainer-backup-meta'

// 恢复码弹窗在 AuthWidget 内，经事件总线打开
function openRecoveryModal() {
  window.dispatchEvent(new CustomEvent('it-trainer:open-recovery'))
}

// ============================================================
// 结业证书（原生 Canvas，本地生成，零依赖零外发）
// ============================================================
const certModal = ref(null) // {module, title, best}
const certCanvas = ref(null)

function openCertificate(stat) {
  certModal.value = stat
  nextTick(() => drawCertificate(stat))
}

function drawCertificate(stat) {
  const canvas = certCanvas.value
  if (!canvas) return
  const W = 1200, H = 850
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const brand = '#3b82f6'
  const ink = '#1f2329'
  // 底与双边框
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = brand
  ctx.lineWidth = 6
  ctx.strokeRect(28, 28, W - 56, H - 56)
  ctx.lineWidth = 1.5
  ctx.strokeRect(44, 44, W - 88, H - 88)
  // 标题
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.font = 'bold 64px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('结 业 证 书', W / 2, 170)
  ctx.font = '22px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#6b7280'
  ctx.fillText('Course Completion · Self-Study Record', W / 2, 212)
  // 主体
  ctx.fillStyle = ink
  ctx.font = '28px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('兹证明', W / 2, 300)
  ctx.font = 'bold 56px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = brand
  ctx.fillText(currentUserName.value || '学习者', W / 2, 380)
  ctx.fillStyle = ink
  ctx.font = '28px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(`已完成《${stat.title}》模块课程学习`, W / 2, 445)
  ctx.fillText(`并通过模块达标测验（最佳成绩 ${stat.best} 分，达标线 80 分）`, W / 2, 492)
  // 印章（装饰性圆环 + 五角星）
  ctx.strokeStyle = '#d97706'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(W / 2 + 330, 640, 78, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#d97706'
  ctx.font = 'bold 20px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('测验达标', W / 2 + 330, 625)
  ctx.fillText('验 证', W / 2 + 330, 655)
  // 日期与签发
  ctx.textAlign = 'left'
  ctx.fillStyle = '#6b7280'
  ctx.font = '22px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  const now = new Date()
  ctx.fillText(`签发日期：${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`, 120, 700)
  ctx.fillText('签发方：IT 基础设施培训助手（本机浏览器生成）', 120, 738)
  // 诚实声明
  ctx.font = '16px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#9ca3af'
  ctx.fillText('本证书为自学完成证明，成绩来自本浏览器学习记录，非官方认证。', 120, 782)
}

function downloadCertificate() {
  const canvas = certCanvas.value
  if (!canvas) return
  const a = document.createElement('a')
  const mod = certModal.value ? certModal.value.module : 'module'
  a.href = canvas.toDataURL('image/png')
  a.download = `certificate-${mod}-${currentUserName.value || 'learner'}.png`
  a.click()
}

// ============================================================
// 学习报告（新标签页打开，可打印成 PDF；自报/验证分档呈现）
// ============================================================
function openReport() {
  const activeId = loadActiveUserId()
  const users = loadUsers()
  const found = activeId ? users.find(u => String(u.id) === String(activeId)) : null
  if (!found || found.name === 'default') {
    dataMsg.value = '登录后才能生成个人学习报告。'
    return
  }
  const quiz = readStore('it-trainer-quiz-' + found.id) || { attempts: [], verifiedModules: [] }
  const progress = loadUserProgress(found.id)
  const html = buildReportHTML({ userName: found.name, quizStore: quiz, progress })
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  dataMsg.value = ''
}

// ============================================================
// localStorage 用户列表
// ============================================================
const USERS_KEY = 'it-trainer-users'

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch { return [] }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadActiveUserId() {
  return localStorage.getItem(ACTIVE_USER_KEY) || ''
}

// ============================================================
// 阶段进度（基于 utils/progress.js 的真实计算）
// ============================================================
const phases = ref(
  PHASE_CATALOG.map((p) => ({
    id: p.id,
    label: p.label,
    total: phaseChapterTotal(p), // 章节数由 sidebar 自动统计（v2.6）
    progress: 0,
  }))
)

const totalChapters = computed(() => phases.value.reduce((s, p) => s + p.total, 0))
const completedChapters = ref(0)

const overallProgress = computed(() => {
  if (totalChapters.value === 0) return 0
  return Math.round((completedChapters.value / totalChapters.value) * 100)
})

function loadPhaseProgress() {
  const activeId = loadActiveUserId()
  const progress = loadUserProgress(activeId)
  const pct = computePhaseProgress(progress)
  for (const p of phases.value) {
    p.progress = pct[p.id] ?? 0
  }
  completedChapters.value = totalCompletedChapters(progress)
}

// ============================================================
// 番茄钟
// ============================================================
const timerRunning = ref(false)
const timerSeconds = ref(0)
const timerMsg = ref('')
let timerInterval = null

const timerDisplay = computed(() => {
  const mins = Math.floor(timerSeconds.value / 60)
  const secs = timerSeconds.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

function startTimer() {
  stopTitleFlash()
  timerRunning.value = true
  timerMsg.value = ''
  // 不重置，支持继续计时
  timerInterval = setInterval(() => {
    timerSeconds.value++
    if (timerSeconds.value >= 25 * 60) {
      stopTimer()
      timerMsg.value = '🍅 25 分钟到了！休息 5 分钟吧。'
      notifyTimerDone()
    }
  }, 1000)
}

function stopTimer() {
  timerRunning.value = false
  clearInterval(timerInterval)
}

function resetTimer() {
  timerSeconds.value = 0
  timerMsg.value = ''
  stopTitleFlash()
}

// ======== 到点提醒：Web Audio 合成三声 beep + 标题闪烁（切后台也能察觉） ========
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.35)
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.35 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.35 + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.35)
      osc.stop(ctx.currentTime + i * 0.35 + 0.32)
    }
  } catch { /* 无音频权限时静默 */ }
}

let titleFlashTimer = null
let titleFlashOrig = ''
function startTitleFlash() {
  stopTitleFlash()
  titleFlashOrig = document.title
  let on = false
  titleFlashTimer = setInterval(() => {
    document.title = (on = !on) ? '🍅 时间到！休息一下' : titleFlashOrig
  }, 900)
}
function stopTitleFlash() {
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer)
    titleFlashTimer = null
    if (titleFlashOrig) document.title = titleFlashOrig
    titleFlashOrig = ''
  }
}
function notifyTimerDone() {
  playBeep()
  startTitleFlash()
  setTimeout(stopTitleFlash, 15000) // 15 秒后自动恢复标题
}

// ============================================================
// 用户显示（切换账户统一走右上角 AuthWidget，需密码）
// ============================================================
const currentUserName = ref('')
const loadingUser = ref(true)
const userList = ref([])
const verifiedCount = ref(0)
const backupReminder = ref('')
const allQuizStats = ref([])

// 有成绩的模块行（含验证徽章；无成绩模块不显示）
const quizStatRows = computed(() => allQuizStats.value.filter((m) => m.best !== null))
const avgBestScore = computed(() => {
  const rows = quizStatRows.value
  if (!rows.length) return null
  return Math.round(rows.reduce((s, m) => s + m.best, 0) / rows.length)
})

function refreshAll() {
  const users = loadUsers()
  userList.value = users

  const activeId = loadActiveUserId()
  const found = activeId
    ? users.find(u => String(u.id) === String(activeId))
    : null
  currentUserName.value = found && found.name !== 'default' ? found.name : ''

  // 测验达标模块数 + 成绩明细（随堂测验 ≥80 分点亮，见 QuizWidget）
  verifiedCount.value = 0
  allQuizStats.value = []
  if (found) {
    const q = readStore('it-trainer-quiz-' + found.id)
    if (q && Array.isArray(q.verifiedModules)) verifiedCount.value = q.verifiedModules.length
    allQuizStats.value = summarizeModules(q || { attempts: [], verifiedModules: [] }, loadUserProgress(found.id))
  }

  // 备份提醒：已登录的真实用户，>7 天未备份或注册 >3 天从未备份
  backupReminder.value = ''
  if (found && found.name !== 'default' && found.name !== '演示用户') {
    const meta = readStore(BACKUP_META_KEY)
    const ageDays = found.created_at ? (Date.now() - new Date(found.created_at).getTime()) / 86400000 : 0
    if (!meta || !meta.at) {
      if (ageDays > 3) backupReminder.value = '注册已超过 3 天但从未导出过备份'
    } else {
      const sinceDays = Math.floor((Date.now() - new Date(meta.at).getTime()) / 86400000)
      if (sinceDays > 7) backupReminder.value = `距上次备份已 ${sinceDays} 天`
    }
  }

  loadPhaseProgress()
}

// ============================================================
// 演示数据：为评估者/新访客一键生成带进度的演示账户（免注册）
// ============================================================
const DEMO_CHAPTERS = [
  'courses/networking/01-hardware-basics.md',
  'courses/networking/02-osi-model.md',
  'courses/networking/03-tcp-ip.md',
  'courses/networking/04-subnetting.md',
  'courses/linux/01-command-line.md',
  'courses/linux/02-file-permissions.md',
  'courses/linux/03-users-groups.md',
  'courses/docker/01-container-concepts.md',
  'courses/docker/02-docker-basics.md',
  'courses/security/01-security-concepts.md',
  'courses/security/02-network-security.md',
  'courses/security/03-system-hardening.md',
]

function loadDemoData() {
  const users = loadUsers()
  if (users.some(u => u.name === '演示用户')) {
    // 已存在则直接切换过去
    const demo = users.find(u => u.name === '演示用户')
    localStorage.setItem(ACTIVE_USER_KEY, String(demo.id))
  } else {
    const maxId = users.reduce((max, u) => Math.max(max, u.id || 0), 0)
    const demo = {
      id: maxId + 1,
      name: '演示用户',
      phone: '13800000000',
      password_hash: '',   // 空 = 首次登录可设密码（AuthWidget 行为）
      created_at: new Date().toISOString(),
    }
    users.push(demo)
    saveUsers(users)
    localStorage.setItem(ACTIVE_USER_KEY, String(demo.id))

    // 预置 12 章完成进度，仪表盘即刻有真实读数
    const now = new Date().toISOString()
    const progress = { pages: {} }
    for (const slug of DEMO_CHAPTERS) {
      progress.pages[slug] = { done: true, doneAt: now }
    }
    localStorage.setItem('it-trainer-progress-' + demo.id, JSON.stringify(progress))

    // v2.8：演示数据补测验态——载入后成绩区/证书按钮/学习报告三态齐现
    writeStore('it-trainer-quiz-' + demo.id, {
      attempts: [
        { quizId: 'docker-01', score: 92, correct: 11, total: 12, date: now },
        { quizId: 'linux-01', score: 65, correct: 6, total: 9, date: now },
      ],
      verifiedModules: ['docker'],
    }, 1)
    writeStore('it-trainer-wrongbook-' + demo.id, [
      {
        key: 'linux-01/q3', quizId: 'linux-01', quizTitle: 'Linux 基础测验', qid: 'q3',
        question: '哪个命令用于实时查看系统进程？', type: 'multiple-choice', isSubjective: false,
        myAnswer: 'ps', correctDisplay: 'top',
        explanation: 'top 实时显示进程和系统资源使用（htop 是其增强版）。ps 是快照，ls 是列文件，df 是磁盘使用。',
        reference: '', chapter: 'courses/linux/01-command-line.md',
        times: 2, lastAt: now, judgeSrc: '本地规则判分', aiExplanation: '',
      },
      {
        key: 'networking-01/q6', quizId: 'networking-01', quizTitle: '网络基础综合测验', qid: 'q6',
        question: '在 Linux 中使用什么命令查看 IP 地址？', type: 'fill-blank', isSubjective: false,
        myAnswer: 'ifconfig', correctDisplay: 'ip addr',
        explanation: 'ip addr 是现代 Linux 查看地址的方式，旧的 ifconfig 已逐渐被取代。',
        reference: '', chapter: 'courses/networking/03-tcp-ip.md',
        times: 1, lastAt: now, judgeSrc: '本地规则判分', aiExplanation: '',
      },
    ], 1)
  }

  refreshAll()
  window.dispatchEvent(new CustomEvent('it-trainer:user-changed'))
  dataMsg.value = '演示账户已就绪（12 章进度已预置）。正式使用请注册自己的账户。'
}

// ============================================================
// 学习数据导出 / 导入（换浏览器、换电脑迁移用）
// ============================================================
const dataMsg = ref('')
const importInput = ref(null)

function collectBackup() {
  const users = loadUsers()
  const progressByUser = {}
  const quizByUser = {}
  const wrongbookByUser = {}
  for (const u of users) {
    if (u.name === 'default') continue
    const raw = localStorage.getItem('it-trainer-progress-' + u.id)
    if (raw) progressByUser[u.name] = JSON.parse(raw)
    // v2 备份：测验成绩与错题本一并带走（quizStore 键内为信封格式，原样转存）
    const qz = localStorage.getItem('it-trainer-quiz-' + u.id)
    if (qz) quizByUser[u.name] = JSON.parse(qz)
    const wb = localStorage.getItem('it-trainer-wrongbook-' + u.id)
    if (wb) wrongbookByUser[u.name] = JSON.parse(wb)
  }
  const activeId = loadActiveUserId()
  const active = users.find(u => String(u.id) === String(activeId))
  return {
    app: 'it-infra-trainer',
    version: 2,
    exportedAt: new Date().toISOString(),
    activeUserName: active ? active.name : '',
    users: users
      .filter(u => u.name !== 'default')
      .map(u => ({
        name: u.name,
        phone: u.phone,
        password_hash: u.password_hash || '',
        recovery_hash: u.recovery_hash || '',
        created_at: u.created_at || '',
      })),
    progressByUser,
    quizByUser,
    wrongbookByUser,
  }
}

function exportData() {
  dataMsg.value = ''
  try {
    const backup = collectBackup()
    if (backup.users.length === 0) {
      dataMsg.value = '当前浏览器还没有任何学习账户，无需备份。'
      return
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    a.href = url
    a.download = `it-trainer-backup-${date}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    // 记录备份时间（提醒条依据）
    writeStore(BACKUP_META_KEY, { at: new Date().toISOString() }, 1)
    backupReminder.value = ''
    dataMsg.value = `已导出 ${backup.users.length} 个账户的备份文件（含进度/测验成绩/错题本；内含密码哈希，请妥善保管）。`
  } catch (e) {
    dataMsg.value = '导出失败: ' + e.message
  }
}

function triggerImport() {
  dataMsg.value = ''
  importInput.value?.click()
}

function onImportFile(event) {
  const file = event.target.files?.[0]
  event.target.value = '' // 允许重复选择同一文件
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result)
      if (backup.app !== 'it-infra-trainer' || !Array.isArray(backup.users)) {
        dataMsg.value = '导入失败：不是本系统的备份文件。'
        return
      }
      const ok = confirm(
        `将导入 ${backup.users.length} 个账户及其学习进度。\n` +
        '同名账户会保留本机密码，进度以备份为准（覆盖）。\n确定继续吗？'
      )
      if (!ok) return
      applyBackup(backup)
    } catch (e) {
      dataMsg.value = '导入失败：' + e.message
    }
  }
  reader.readAsText(file)
}

function applyBackup(backup) {
  const users = loadUsers()
  const nameToLocalId = {}

  for (const bu of backup.users) {
    let local = users.find(u => u.name === bu.name)
    if (!local) {
      const maxId = users.reduce((max, u) => Math.max(max, u.id || 0), 0)
      local = {
        id: maxId + 1,
        name: bu.name,
        phone: bu.phone || '',
        password_hash: bu.password_hash || '',
        recovery_hash: bu.recovery_hash || '',
        created_at: bu.created_at || new Date().toISOString(),
      }
      users.push(local)
    } else if (bu.recovery_hash && !local.recovery_hash) {
      local.recovery_hash = bu.recovery_hash // 本机没有恢复码时随备份补齐
    }
    nameToLocalId[bu.name] = local.id
  }

  let importedProgress = 0
  for (const [name, progress] of Object.entries(backup.progressByUser || {})) {
    const localId = nameToLocalId[name]
    if (localId && progress && typeof progress === 'object') {
      localStorage.setItem('it-trainer-progress-' + localId, JSON.stringify(progress))
      importedProgress++
    }
  }
  // v2 备份：测验成绩与错题本（v1 旧备份无此两节，跳过即可）
  let importedQuiz = 0
  for (const [name, qz] of Object.entries(backup.quizByUser || {})) {
    const localId = nameToLocalId[name]
    if (localId && qz) {
      localStorage.setItem('it-trainer-quiz-' + localId, JSON.stringify(qz))
      importedQuiz++
    }
  }
  let importedWrong = 0
  for (const [name, wb] of Object.entries(backup.wrongbookByUser || {})) {
    const localId = nameToLocalId[name]
    if (localId && wb) {
      localStorage.setItem('it-trainer-wrongbook-' + localId, JSON.stringify(wb))
      importedWrong++
    }
  }

  saveUsers(users)
  dataMsg.value = `导入完成：${backup.users.length} 个账户，${importedProgress} 份进度、${importedQuiz} 份成绩、${importedWrong} 份错题本。`

  refreshAll()
  window.dispatchEvent(new CustomEvent('it-trainer:user-changed'))
}

onMounted(() => {
  refreshAll()
  // 右上角登录/切换、页面"标记已完成"后立即刷新仪表盘
  window.addEventListener('it-trainer:user-changed', refreshAll)
  window.addEventListener('it-trainer:progress-changed', refreshAll)
  loadingUser.value = false
})

onUnmounted(() => {
  window.removeEventListener('it-trainer:user-changed', refreshAll)
  window.removeEventListener('it-trainer:progress-changed', refreshAll)
})
</script>

<style scoped>
.dw-user-section {
  padding: 12px 16px;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.dw-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.dw-user-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--vp-c-brand);
}

.dw-user-loading {
  font-size: 14px;
  color: var(--vp-c-text-3);
  font-style: italic;
}

.dw-user-none {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.dw-user-count {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.dw-user-create-hint {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.dw-user-create-hint p {
  margin: 0;
}

.dw-demo-btn {
  margin-top: 10px;
}

.dashboard-widget {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
}

.dashboard-widget h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: var(--vp-c-brand);
}

.dw-section {
  margin-bottom: 20px;
}

.dw-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dw-progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dw-progress-bar {
  height: 10px;
  background: var(--vp-c-divider);
  border-radius: 5px;
  overflow: hidden;
  flex: 1;
}

.dw-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--vp-c-brand), #10b981);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.dw-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--vp-c-brand);
  min-width: 48px;
  text-align: right;
}

.dw-phase-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}

.dw-phase-name {
  width: 150px;
  flex-shrink: 0;
  color: var(--vp-c-text-1);
}

.dw-mini-bar {
  flex: 1;
  height: 6px;
  background: var(--vp-c-divider);
  border-radius: 3px;
  overflow: hidden;
}

.dw-mini-fill {
  height: 100%;
  background: var(--vp-c-brand);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.dw-mini-fill.dw-complete {
  background: #10b981;
}

.dw-phase-pct {
  width: 36px;
  text-align: right;
  font-weight: 600;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.dw-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.dw-link {
  display: block;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  font-size: 14px;
  transition: border-color 0.2s, background 0.2s;
}

.dw-link:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg);
}

.dw-btn-like {
  cursor: pointer;
  background: var(--vp-c-bg);
  text-align: center;
}

.dw-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.dw-verified {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--vp-c-green-1, #10b981);
}

.dw-verified-link {
  color: inherit;
  text-decoration: underline;
}

.dw-recovery-btn {
  font-size: 12px;
  padding: 2px 8px;
  margin-left: 6px;
}

.dw-backup-reminder {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border: 1px dashed var(--vp-c-warning-1, #d97706);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 10px;
}

/* ======== 测验成绩区 ======== */
.dw-quiz-summary {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}
.dw-quiz-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.dw-quiz-name {
  flex: 0 0 150px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dw-quiz-best {
  font-size: 12px;
  color: var(--vp-c-text-3);
  min-width: 44px;
  text-align: right;
}
.dw-quiz-pass {
  color: var(--vp-c-green-1, #10b981);
  font-weight: 600;
}
.dw-quiz-weak {
  font-size: 11px;
  color: var(--vp-c-warning-1, #d97706);
}
.dw-cert-btn {
  font-size: 11px;
  padding: 2px 8px;
}

/* ======== 证书弹窗 ======== */
.dw-cert-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 16px;
}
.dw-cert-modal {
  background: var(--vp-c-bg);
  border-radius: 12px;
  padding: 18px;
  width: min(760px, 94vw);
  max-height: 92vh;
  overflow-y: auto;
}
.dw-cert-modal h4 {
  margin: 0 0 12px;
  font-size: 16px;
  border: none;
  padding: 0;
  color: var(--vp-c-text-1);
}
.dw-cert-canvas {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}
.dw-cert-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 14px;
}
.dw-btn-ghost-cert {
  background: transparent;
}
.dw-cert-note {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.dw-data-msg {
  margin: 6px 0 0;
  font-size: 13px;
  color: #10b981;
  font-weight: 500;
}

.dw-timer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.dw-timer-display {
  font-family: 'Courier New', monospace;
  font-size: 32px;
  font-weight: 700;
  color: var(--vp-c-brand);
}

.dw-timer-controls {
  display: flex;
  gap: 8px;
}

.dw-timer-msg {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand);
}

.dw-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-brand);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.dw-btn:hover {
  background: var(--vp-c-brand-dark);
}

.dw-btn-stop {
  background: #ef4444;
}

.dw-btn-stop:hover {
  background: #dc2626;
}

.dw-btn-reset {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.dw-btn-reset:hover {
  background: var(--vp-c-bg);
}
</style>
