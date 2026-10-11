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

      <!-- User Switcher Dropdown -->
      <div v-if="userList.length > 1" class="dw-user-switcher">
        <select v-model="selectedUserId" @change="doSwitchUser" class="dw-user-select">
          <option value="" disabled>— 切换用户 —</option>
          <option v-for="u in displayUsers" :key="u.id" :value="u.id">
            {{ u.name }}{{ u.phone !== '00000000000' ? ' (' + u.phone + ')' : '' }}
          </option>
        </select>
        <span v-if="switchMsg" class="dw-switch-msg">{{ switchMsg }}</span>
      </div>

      <div v-else-if="!loadingUser && !currentUserName" class="dw-user-create-hint">
        <p>点击右上角「注册」创建你的学习账户</p>
      </div>
    </div>

    <!-- Overall Progress -->
    <div class="dw-section">
      <div class="dw-label">总体进度</div>
      <div class="dw-progress-row">
        <div class="dw-progress-bar">
          <div class="dw-progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
        <span class="dw-value">{{ overallProgress }}%</span>
      </div>
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
        <span class="dw-phase-pct">{{ phase.progress }}%</span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ============================================================
// localStorage 存储层
// ============================================================
const USERS_KEY = 'it-trainer-users'
const ACTIVE_USER_KEY = 'it-trainer-active-user-id'
const PROGRESS_KEY_PREFIX = 'it-trainer-progress-'

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch { return [] }
}

function loadActiveUserId() {
  return localStorage.getItem(ACTIVE_USER_KEY) || ''
}

function saveActiveUserId(id) {
  localStorage.setItem(ACTIVE_USER_KEY, String(id))
}

function loadProgressForUser(userId) {
  const key = PROGRESS_KEY_PREFIX + userId
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch { return {} }
}

// ============================================================
// 阶段定义
// ============================================================
const phases = ref([
  { id: 1, label: '阶段1：基础入门', progress: 0 },
  { id: 2, label: '阶段2：Linux 管理', progress: 0 },
  { id: 3, label: '阶段3：Windows Server', progress: 0 },
  { id: 4, label: '阶段4：虚拟化', progress: 0 },
  { id: 5, label: '阶段5：容器', progress: 0 },
  { id: 6, label: '阶段6：自动化', progress: 0 },
  { id: 7, label: '阶段7：监控', progress: 0 },
  { id: 8, label: '阶段8：云计算', progress: 0 },
  { id: 9, label: '阶段9：安全', progress: 0 },
  { id: 10, label: '阶段10：灾备', progress: 0 },
])

const overallProgress = computed(() => {
  const total = phases.value.reduce((sum, p) => sum + p.progress, 0)
  return Math.round(total / phases.value.length)
})

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
// 用户管理（localStorage）
// ============================================================
const currentUserName = ref('')
const loadingUser = ref(true)
const userList = ref([])
const selectedUserId = ref('')
const switchMsg = ref('')

const displayUsers = computed(() => {
  return userList.value.filter(u => u.name !== 'default')
})

function doSwitchUser() {
  switchMsg.value = ''
  const user = userList.value.find(u => String(u.id) === selectedUserId.value)
  if (!user) return

  // 在纯离线模式下，直接切换（不校验密码 —— 仪表盘快速切换）
  saveActiveUserId(user.id)
  currentUserName.value = user.name
  switchMsg.value = `已切换至 ${user.name}`
  loadPhaseProgress()
  setTimeout(() => { switchMsg.value = '' }, 2000)
}

function loadPhaseProgress() {
  const activeId = loadActiveUserId()
  if (!activeId) return
  const progress = loadProgressForUser(activeId)
  if (progress.phases) {
    for (const p of phases.value) {
      if (progress.phases[p.id] !== undefined) {
        p.progress = progress.phases[p.id]
      }
    }
  }
}

onMounted(() => {
  // 加载用户列表
  const users = loadUsers()
  userList.value = users

  const activeId = loadActiveUserId()
  if (activeId) {
    const found = users.find(u => String(u.id) === String(activeId))
    if (found && found.name !== 'default') {
      currentUserName.value = found.name
    }
    selectedUserId.value = String(activeId)
  }

  // 加载进度
  loadPhaseProgress()

  loadingUser.value = false
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

.dw-user-switcher {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dw-user-select {
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
  min-width: 180px;
}

.dw-user-select:focus {
  border-color: var(--vp-c-brand);
  outline: none;
}

.dw-switch-msg {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
}

.dw-user-create-hint {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.dw-user-create-hint p {
  margin: 0;
}

.dw-user-create-hint code {
  font-size: 12px;
  background: var(--vp-c-bg-soft);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
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
