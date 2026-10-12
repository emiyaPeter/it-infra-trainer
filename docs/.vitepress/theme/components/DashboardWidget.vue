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
      </div>

      <div v-if="userList.length > 1" class="dw-user-create-hint">
        <p>切换账户请用右上角「切换账户」（需验证密码）</p>
      </div>

      <div v-else-if="!loadingUser && !currentUserName" class="dw-user-create-hint">
        <p>点击右上角「注册」创建你的学习账户</p>
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
    </div>

    <!-- Quick Links -->
    <div class="dw-section">
      <div class="dw-label">快速操作</div>
      <div class="dw-links">
        <a href="/roadmap/" class="dw-link">🗺️ 学习路线图</a>
        <a href="/courses/" class="dw-link">📚 课程目录</a>
        <a href="/courses/networking/" class="dw-link">🌐 网络基础</a>
        <a href="/courses/linux/" class="dw-link">🐧 Linux 管理</a>
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
    </div>

    <!-- Data Management -->
    <div class="dw-section">
      <div class="dw-label">💾 学习数据管理</div>
      <div class="dw-links">
        <button class="dw-link dw-btn-like" @click="exportData">📤 导出备份</button>
        <button class="dw-link dw-btn-like" @click="triggerImport">📥 导入备份</button>
      </div>
      <p class="dw-hint">
        备份包含账户（含密码）与全部学习进度。换浏览器 / 换电脑时：旧环境导出 → 新环境导入。
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  PHASE_CATALOG,
  ACTIVE_USER_KEY,
  loadUserProgress,
  computePhaseProgress,
  totalCompletedChapters,
} from '../utils/progress.js'

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
    total: p.chapters,
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
let timerInterval = null

const timerDisplay = computed(() => {
  const mins = Math.floor(timerSeconds.value / 60)
  const secs = timerSeconds.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

function startTimer() {
  timerRunning.value = true
  // 不重置，支持继续计时
  timerInterval = setInterval(() => {
    timerSeconds.value++
    if (timerSeconds.value >= 25 * 60) {
      stopTimer()
      alert('🍅 25分钟到了！休息5分钟吧。')
    }
  }, 1000)
}

function stopTimer() {
  timerRunning.value = false
  clearInterval(timerInterval)
}

function resetTimer() {
  timerSeconds.value = 0
}

// ============================================================
// 用户显示（切换账户统一走右上角 AuthWidget，需密码）
// ============================================================
const currentUserName = ref('')
const loadingUser = ref(true)
const userList = ref([])

function refreshAll() {
  const users = loadUsers()
  userList.value = users

  const activeId = loadActiveUserId()
  const found = activeId
    ? users.find(u => String(u.id) === String(activeId))
    : null
  currentUserName.value = found && found.name !== 'default' ? found.name : ''

  loadPhaseProgress()
}

// ============================================================
// 学习数据导出 / 导入（换浏览器、换电脑迁移用）
// ============================================================
const dataMsg = ref('')
const importInput = ref(null)

function collectBackup() {
  const users = loadUsers()
  const progressByUser = {}
  for (const u of users) {
    if (u.name === 'default') continue
    const raw = localStorage.getItem('it-trainer-progress-' + u.id)
    if (raw) progressByUser[u.name] = JSON.parse(raw)
  }
  const activeId = loadActiveUserId()
  const active = users.find(u => String(u.id) === String(activeId))
  return {
    app: 'it-infra-trainer',
    version: 1,
    exportedAt: new Date().toISOString(),
    activeUserName: active ? active.name : '',
    users: users
      .filter(u => u.name !== 'default')
      .map(u => ({
        name: u.name,
        phone: u.phone,
        password_hash: u.password_hash || '',
        created_at: u.created_at || '',
      })),
    progressByUser,
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
    dataMsg.value = `已导出 ${backup.users.length} 个账户的备份文件（注意妥善保管，内含密码哈希）。`
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
        created_at: bu.created_at || new Date().toISOString(),
      }
      users.push(local)
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

  saveUsers(users)
  dataMsg.value = `导入完成：${backup.users.length} 个账户，${importedProgress} 份进度记录。`

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
