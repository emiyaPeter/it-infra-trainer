<template>
  <div class="auth-widget">
    <!-- 已登录 -->
    <template v-if="currentUser">
      <span class="auth-user">{{ currentUser.name }}</span>
      <button class="auth-btn auth-btn-switch" @click="showSwitchModal = true">切换</button>
      <button class="auth-btn auth-btn-register" @click="showRegisterModal = true">注册</button>
    </template>

    <!-- 未登录 -->
    <template v-else>
      <button class="auth-btn auth-btn-register" @click="showRegisterModal = true">注册</button>
      <button class="auth-btn auth-btn-login" @click="showLoginModal = true">登录</button>
    </template>

    <!-- ======== 注册弹窗 ======== -->
    <Teleport to="body">
      <div v-if="showRegisterModal" class="auth-modal-overlay" @click.self="showRegisterModal = false">
        <div class="auth-modal">
          <h3>📝 注册新账户</h3>
          <div class="auth-form">
            <label>姓名</label>
            <input v-model="regForm.name" placeholder="你的姓名" :disabled="submitting" />
            <label>手机号</label>
            <input v-model="regForm.phone" placeholder="11 位手机号" :disabled="submitting" />
            <label>密码</label>
            <input v-model="regForm.password" type="password" placeholder="至少6位" :disabled="submitting" />
            <label>确认密码</label>
            <input v-model="regForm.confirmPassword" type="password" placeholder="再次输入密码" :disabled="submitting" />
            <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
            <p v-if="successMsg" class="auth-success">{{ successMsg }}</p>
            <!-- 注册成功：一次性展示恢复码 -->
            <div v-if="recoveryCodeShown" class="auth-recovery-box">
              <p class="auth-recovery-title">🔑 你的账户恢复码（仅显示这一次）</p>
              <code class="auth-recovery-code">{{ recoveryCodeShown }}</code>
              <p class="auth-recovery-hint">忘记密码时用它重置。请抄写到安全的地方——关闭后无法再查看（可登录后在仪表盘重新生成，旧码同时失效）。</p>
              <div class="auth-actions">
                <button class="auth-submit" @click="copyRecoveryCode">复制恢复码</button>
                <button class="auth-cancel" @click="closeRecoveryAfterRegister">我已保存，关闭</button>
              </div>
            </div>
            <div v-else class="auth-actions">
              <button class="auth-submit" @click="doRegister" :disabled="submitting">
                {{ submitting ? '注册中...' : '注册' }}
              </button>
              <button class="auth-cancel" @click="showRegisterModal = false">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ======== 登录弹窗 ======== -->
      <div v-if="showLoginModal" class="auth-modal-overlay" @click.self="showLoginModal = false">
        <div class="auth-modal">
          <h3>🔐 登录</h3>
          <div class="auth-form">
            <label>姓名</label>
            <input v-model="loginForm.name" placeholder="输入姓名" :disabled="submitting" />
            <label>密码</label>
            <input v-model="loginForm.password" type="password" placeholder="输入密码" :disabled="submitting"
              @keyup.enter="doLogin" />
            <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
            <p v-if="successMsg" class="auth-success">{{ successMsg }}</p>
            <div class="auth-actions">
              <button class="auth-submit" @click="doLogin" :disabled="submitting">
                {{ submitting ? '登录中...' : '登录' }}
              </button>
              <button class="auth-cancel" @click="showLoginModal = false">取消</button>
            </div>
            <p class="auth-forgot-link" @click="openForgotModal">忘记密码？用恢复码重置 →</p>
          </div>
        </div>
      </div>

      <!-- ======== 忘记密码弹窗（恢复码重置） ======== -->
      <div v-if="showForgotModal" class="auth-modal-overlay" @click.self="showForgotModal = false">
        <div class="auth-modal">
          <h3>🔑 忘记密码</h3>
          <div class="auth-form">
            <label>姓名</label>
            <input v-model="forgotForm.name" placeholder="账户姓名" :disabled="submitting" />
            <label>恢复码</label>
            <input v-model="forgotForm.code" placeholder="XXXX-XXXX-XXXX-XXXX" :disabled="submitting" />
            <label>新密码</label>
            <input v-model="forgotForm.password" type="password" placeholder="至少 6 位" :disabled="submitting"
              @keyup.enter="doResetPassword" />
            <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
            <p v-if="successMsg" class="auth-success">{{ successMsg }}</p>
            <div class="auth-actions">
              <button class="auth-submit" @click="doResetPassword" :disabled="submitting">
                {{ submitting ? '重置中...' : '重置密码' }}
              </button>
              <button class="auth-cancel" @click="showForgotModal = false">取消</button>
            </div>
            <p class="auth-recovery-hint">没有恢复码？无法找回——数据只存在本浏览器，可用旧备份文件恢复账户后重新生成。</p>
          </div>
        </div>
      </div>

      <!-- ======== 恢复码管理弹窗（已登录，仪表盘入口触发） ======== -->
      <div v-if="showRecoveryModal" class="auth-modal-overlay" @click.self="showRecoveryModal = false">
        <div class="auth-modal">
          <h3>🔑 恢复码管理</h3>
          <div class="auth-form">
            <div v-if="recoveryCodeShown" class="auth-recovery-box">
              <p class="auth-recovery-title">新恢复码（仅显示这一次）</p>
              <code class="auth-recovery-code">{{ recoveryCodeShown }}</code>
              <p class="auth-recovery-hint">重新生成后旧恢复码立即失效。请妥善保存。</p>
              <div class="auth-actions">
                <button class="auth-submit" @click="copyRecoveryCode">复制</button>
                <button class="auth-cancel" @click="showRecoveryModal = false; recoveryCodeShown = ''">完成</button>
              </div>
            </div>
            <template v-else>
              <p class="auth-recovery-hint">
                恢复码用于忘记密码时重置（数据在本浏览器本地，恢复码即"本机钥匙"的备份）。
                {{ hasRecoveryCode ? '当前账户已有恢复码。' : '当前账户尚未设置恢复码。' }}
              </p>
              <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
              <div class="auth-actions">
                <button class="auth-submit" @click="regenerateRecoveryCode" :disabled="submitting">
                  {{ hasRecoveryCode ? '重新生成（旧码失效）' : '生成恢复码' }}
                </button>
                <button class="auth-cancel" @click="showRecoveryModal = false">关闭</button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ======== 切换账户弹窗 ======== -->
      <div v-if="showSwitchModal" class="auth-modal-overlay" @click.self="showSwitchModal = false">
        <div class="auth-modal">
          <h3>🔄 切换账户</h3>
          <div class="auth-form">
            <label>选择账户</label>
            <select v-model="switchForm.userId" class="auth-select">
              <option value="">— 请选择 —</option>
              <option v-for="u in displayUsers" :key="u.id" :value="u.id">
                {{ u.name }}{{ u.phone !== '00000000000' ? ' (' + u.phone + ')' : '' }}
              </option>
            </select>
            <label>密码</label>
            <input v-model="switchForm.password" type="password" placeholder="输入该账户密码" :disabled="submitting"
              @keyup.enter="doSwitch" />
            <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
            <p v-if="successMsg" class="auth-success">{{ successMsg }}</p>
            <div class="auth-actions">
              <button class="auth-submit" @click="doSwitch" :disabled="submitting || !switchForm.userId">
                {{ submitting ? '切换中...' : '确认切换' }}
              </button>
              <button class="auth-cancel" @click="showSwitchModal = false">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ============================================================
// localStorage 存储层（无需后端服务器）
// ============================================================
const USERS_KEY = 'it-trainer-users'
const ACTIVE_USER_KEY = 'it-trainer-active-user-id'

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

function saveActiveUserId(id) {
  localStorage.setItem(ACTIVE_USER_KEY, String(id))
}

// ============================================================
// 密码哈希（v2：多轮迭代 + 按用户区分盐）
// - 优先使用浏览器原生 Web Crypto API，不可用时降级到纯 JS SHA-256
// - v2 存储格式: "v2$<轮数>$<hex>"；登录时自动把旧格式（单轮+固定盐）升级
// ============================================================
const HASH_ROUNDS = 2000
const LEGACY_SALT = 'it-trainer-salt'

async function sha256Hex(message) {
  // 优先尝试浏览器原生 API（硬件加速，仅安全上下文可用）
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(message)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (_) {
      // 降级到纯 JS 实现
    }
  }
  // 纯 JavaScript SHA-256（无任何外部依赖，在任何网络环境均可运行）
  return pureSha256(message)
}

function pureSha256(message) {
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)) }
  function ch(x, y, z) { return (x & y) ^ (~x & z) }
  function maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z) }
  function bsig0(x) { return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22) }
  function bsig1(x) { return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25) }
  function ssig0(x) { return rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3) }
  function ssig1(x) { return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10) }

  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]

  const msgBytes = []
  for (let i = 0; i < message.length; i++) {
    const c = message.charCodeAt(i)
    if (c < 0x80) { msgBytes.push(c) }
    else if (c < 0x800) { msgBytes.push(0xc0 | (c >>> 6), 0x80 | (c & 0x3f)) }
    else { msgBytes.push(0xe0 | (c >>> 12), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f)) }
  }

  const bitLen = msgBytes.length * 8
  msgBytes.push(0x80)
  while ((msgBytes.length + 8) % 64 !== 0) { msgBytes.push(0) }
  for (let i = 0; i < 8; i++) {
    msgBytes.push(Number((BigInt(bitLen) >> BigInt(56 - i * 8)) & 0xffn))
  }

  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]

  for (let i = 0; i < msgBytes.length; i += 64) {
    const W = new Array(64)
    for (let t = 0; t < 16; t++) {
      W[t] = (msgBytes[i + t * 4] << 24) | (msgBytes[i + t * 4 + 1] << 16) |
             (msgBytes[i + t * 4 + 2] << 8) | msgBytes[i + t * 4 + 3]
    }
    for (let t = 16; t < 64; t++) {
      W[t] = (ssig1(W[t - 2]) + W[t - 7] + ssig0(W[t - 15]) + W[t - 16]) >>> 0
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7]
    for (let t = 0; t < 64; t++) {
      const T1 = (h + bsig1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0
      const T2 = (bsig0(a) + maj(a, b, c)) >>> 0
      h = g; g = f; f = e; e = (d + T1) >>> 0; d = c; c = b; b = a; a = (T1 + T2) >>> 0
    }
    H = [H[0]+a, H[1]+b, H[2]+c, H[3]+d, H[4]+e, H[5]+f, H[6]+g, H[7]+h].map(x => x >>> 0)
  }

  return H.map(x => x.toString(16).padStart(8, '0')).join('')
}

// v2 哈希：多轮迭代，userKey（用户 id）参与加盐，显著提高离线暴力破解成本
async function hashPasswordV2(password, userKey) {
  let digest = await sha256Hex('it-trainer-v2:' + userKey + ':' + password)
  for (let i = 1; i < HASH_ROUNDS; i++) digest = await sha256Hex(digest)
  return 'v2$' + HASH_ROUNDS + '$' + digest
}

// 旧格式哈希（v2.1 及以前）：单轮 SHA-256 + 固定盐
async function hashPasswordLegacy(password) {
  return sha256Hex(password + LEGACY_SALT)
}

/**
 * 校验用户密码；旧格式命中后自动升级为 v2（透明迁移，用户无感知）
 * @returns 匹配则返回该用户对象，否则返回 null
 */
async function verifyAndUpgrade(users, user, password) {
  const stored = user.password_hash
  if (stored && stored.startsWith('v2$')) {
    const parts = stored.split('$')
    const rounds = parseInt(parts[1], 10) || HASH_ROUNDS
    const expected = parts[2]
    let digest = await sha256Hex('it-trainer-v2:' + user.id + ':' + password)
    for (let i = 1; i < rounds; i++) digest = await sha256Hex(digest)
    return digest === expected ? user : null
  }
  if (stored && stored === await hashPasswordLegacy(password)) {
    user.password_hash = await hashPasswordV2(password, user.id)
    saveUsers(users)
    return user
  }
  return null
}

// 用户变更后通知页面内其他组件（如首页仪表盘）立即刷新
function broadcastUserChange() {
  window.dispatchEvent(new CustomEvent('it-trainer:user-changed'))
}

// ============================================================
// 响应式状态
// ============================================================
const currentUser = ref(null)
const userList = ref([])
const showRegisterModal = ref(false)
const showLoginModal = ref(false)
const showSwitchModal = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const regForm = ref({ name: '', phone: '', password: '', confirmPassword: '' })
const loginForm = ref({ name: '', password: '' })
const switchForm = ref({ userId: '', password: '' })

// ======== 恢复码（忘记密码重置用，ADR-011） ========
const showForgotModal = ref(false)
const forgotForm = ref({ name: '', code: '', password: '' })
const showRecoveryModal = ref(false)
const recoveryCodeShown = ref('')

// 去易混字符（无 I/L/O/0/1）的 32 字符表，16 位 ≈ 80 bit 熵
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function generateRecoveryCode() {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  const chars = Array.from(buf, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length])
  return chars.join('').replace(/(.{4})(?=.)/g, '$1-')
}

async function hashRecovery(code, userId) {
  const normalized = String(code || '').trim().toUpperCase().replace(/\s+/g, '')
  return sha256Hex('it-trainer-recovery:' + userId + ':' + normalized)
}

const hasRecoveryCode = computed(() => {
  const users = loadUsers()
  const activeId = loadActiveUserId()
  const u = users.find(x => String(x.id) === String(activeId))
  return !!(u && u.recovery_hash)
})

function openForgotModal() {
  showLoginModal.value = false
  forgotForm.value = { name: '', code: '', password: '' }
  recoveryCodeShown.value = ''
  clearMessages()
  showForgotModal.value = true
}

async function doResetPassword() {
  clearMessages()
  const { name, code, password } = forgotForm.value
  if (!name.trim() || !code.trim() || !password) {
    errorMsg.value = '请填写姓名、恢复码和新密码'
    return
  }
  if (password.length < 6) {
    errorMsg.value = '新密码至少 6 位'
    return
  }
  submitting.value = true
  try {
    await new Promise(r => setTimeout(r, 300))
    const users = loadUsers()
    const candidates = users.filter(u => u.name === name.trim())
    let target = null
    for (const u of candidates) {
      if (u.recovery_hash && (await hashRecovery(code, u.id)) === u.recovery_hash) {
        target = u
        break
      }
    }
    if (!target) {
      errorMsg.value = candidates.length
        ? '恢复码不正确（或该账户未设置恢复码）'
        : `未找到用户 "${name.trim()}"`
      return
    }
    target.password_hash = await hashPasswordV2(password, target.id)
    saveUsers(users)
    successMsg.value = '密码已重置！请关闭后用新密码登录。'
    forgotForm.value = { name: '', code: '', password: '' }
    setTimeout(() => { showForgotModal.value = false; clearMessages(); showLoginModal.value = true }, 1500)
  } finally {
    submitting.value = false
  }
}

/** 已登录用户重新生成恢复码（旧码立即失效）；由仪表盘按钮经事件总线触发 */
async function regenerateRecoveryCode() {
  clearMessages()
  const users = loadUsers()
  const activeId = loadActiveUserId()
  const u = users.find(x => String(x.id) === String(activeId))
  if (!u) {
    errorMsg.value = '请先登录'
    return
  }
  submitting.value = true
  try {
    const code = generateRecoveryCode()
    u.recovery_hash = await hashRecovery(code, u.id)
    saveUsers(users)
    recoveryCodeShown.value = code
  } finally {
    submitting.value = false
  }
}

async function copyRecoveryCode() {
  try {
    await navigator.clipboard.writeText(recoveryCodeShown.value)
    successMsg.value = '已复制到剪贴板'
  } catch {
    errorMsg.value = '复制失败，请手动抄写'
  }
}

function closeRecoveryAfterRegister() {
  recoveryCodeShown.value = ''
  showRegisterModal.value = false
  clearMessages()
}

const displayUsers = computed(() => {
  return userList.value.filter(u => u.name !== 'default')
})

function clearMessages() {
  errorMsg.value = ''
  successMsg.value = ''
}

function fetchCurrentUser() {
  const users = loadUsers()
  userList.value = users
  const activeId = loadActiveUserId()
  if (activeId) {
    const found = users.find(u => String(u.id) === String(activeId))
    if (found) {
      currentUser.value = { id: String(found.id), name: found.name, phone: found.phone }
      return
    }
  }
  currentUser.value = null
}

function fetchUsers() {
  userList.value = loadUsers()
}

async function doRegister() {
  clearMessages()
  const { name, phone, password, confirmPassword } = regForm.value

  if (!name.trim() || !phone.trim() || !password) {
    errorMsg.value = '请填写所有字段'
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    errorMsg.value = '请输入 11 位手机号'
    return
  }
  if (password !== confirmPassword) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  if (password.length < 6) {
    errorMsg.value = '密码至少 6 位'
    return
  }

  submitting.value = true
  try {
    // 模拟短暂延迟，让用户感知正在处理
    await new Promise(r => setTimeout(r, 300))

    const users = loadUsers()

    // 检查是否已存在
    const existing = users.find(u => u.name === name.trim() && u.phone === phone.trim())
    if (existing) {
      errorMsg.value = `用户 "${name}" (${phone}) 已存在，请直接登录`
      submitting.value = false
      return
    }

    // 检查同名不同号
    const sameName = users.find(u => u.name === name.trim())
    if (sameName) {
      errorMsg.value = `"${name}" 已存在（手机号: ${sameName.phone}），请换一个名字或使用已有账户`
      submitting.value = false
      return
    }

    const maxId = users.reduce((max, u) => Math.max(max, u.id || 0), 0)
    const newUser = {
      id: maxId + 1,
      name: name.trim(),
      phone: phone.trim(),
      password_hash: await hashPasswordV2(password, maxId + 1),
      created_at: new Date().toISOString(),
    }

    users.push(newUser)
    // 生成恢复码（只存哈希，明文仅此一次展示）
    const recoveryCode = generateRecoveryCode()
    newUser.recovery_hash = await hashRecovery(recoveryCode, newUser.id)
    saveUsers(users)
    saveActiveUserId(newUser.id)

    currentUser.value = { id: String(newUser.id), name: newUser.name, phone: newUser.phone }
    fetchUsers()
    broadcastUserChange()
    successMsg.value = '注册成功！已自动登录。'
    regForm.value = { name: '', phone: '', password: '', confirmPassword: '' }
    recoveryCodeShown.value = recoveryCode
    // 不再自动关闭：等用户保存恢复码后手动点"我已保存，关闭"
  } catch (e) {
    errorMsg.value = '注册失败: ' + e.message
  } finally {
    submitting.value = false
  }
}

async function doLogin() {
  clearMessages()
  const { name, password } = loginForm.value
  if (!name.trim() || !password) {
    errorMsg.value = '请输入姓名和密码'
    return
  }

  submitting.value = true
  try {
    await new Promise(r => setTimeout(r, 300))
    const users = loadUsers()
    const matched = users.filter(u => u.name === name.trim())

    if (matched.length === 0) {
      errorMsg.value = `未找到用户 "${name}"，请先注册`
      submitting.value = false
      return
    }

    let matchedUser = null
    for (const u of matched) {
      if (!u.password_hash) {
        // 老用户无密码，首次登录即设定密码（v2 格式）
        u.password_hash = await hashPasswordV2(password, u.id)
        saveUsers(users)
        matchedUser = u
        break
      }
      matchedUser = await verifyAndUpgrade(users, u, password)
      if (matchedUser) break
    }

    if (!matchedUser) {
      errorMsg.value = '密码错误'
      submitting.value = false
      return
    }

    saveActiveUserId(matchedUser.id)
    currentUser.value = { id: String(matchedUser.id), name: matchedUser.name, phone: matchedUser.phone }
    broadcastUserChange()
    successMsg.value = '登录成功'
    loginForm.value = { name: '', password: '' }
    setTimeout(() => { showLoginModal.value = false; clearMessages() }, 1500)
  } catch (e) {
    errorMsg.value = '登录失败: ' + e.message
  } finally {
    submitting.value = false
  }
}

async function doSwitch() {
  clearMessages()
  const { userId, password } = switchForm.value
  if (!userId) {
    errorMsg.value = '请选择账户'
    return
  }
  if (!password) {
    errorMsg.value = '请输入密码'
    return
  }

  const targetUser = userList.value.find(u => String(u.id) === userId)
  if (!targetUser) {
    errorMsg.value = '未找到该用户'
    return
  }

  submitting.value = true
  try {
    await new Promise(r => setTimeout(r, 300))
    const users = loadUsers()
    const fullUser = users.find(u => String(u.id) === userId)

    if (!fullUser) {
      errorMsg.value = '未找到该用户'
      submitting.value = false
      return
    }

    if (!fullUser.password_hash) {
      // 老用户无密码 → 首次切换即设定密码（v2 格式）
      fullUser.password_hash = await hashPasswordV2(password, fullUser.id)
      saveUsers(users)
    } else {
      const verified = await verifyAndUpgrade(users, fullUser, password)
      if (!verified) {
        errorMsg.value = '密码错误'
        submitting.value = false
        return
      }
    }

    saveActiveUserId(userId)
    currentUser.value = { id: String(fullUser.id), name: fullUser.name, phone: fullUser.phone }
    broadcastUserChange()
    successMsg.value = `已切换到 ${fullUser.name}`
    switchForm.value = { userId: '', password: '' }
    setTimeout(() => { showSwitchModal.value = false; clearMessages() }, 1500)
  } catch (e) {
    errorMsg.value = '切换失败: ' + e.message
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCurrentUser()
  // 仪表盘"🔑 恢复码"按钮经事件总线打开管理弹窗
  window.addEventListener('it-trainer:open-recovery', () => {
    recoveryCodeShown.value = ''
    clearMessages()
    showRecoveryModal.value = true
    fetchCurrentUser()
  })
})
</script>

<style scoped>
.auth-widget {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ======== 恢复码 ======== */
.auth-recovery-box {
  margin-top: 12px;
  border: 1px dashed var(--vp-c-brand);
  border-radius: 10px;
  padding: 12px;
  background: var(--vp-c-bg-soft);
}
.auth-recovery-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.auth-recovery-code {
  display: block;
  text-align: center;
  font-size: 18px;
  letter-spacing: 1px;
  font-weight: 700;
  color: var(--vp-c-brand-1, var(--vp-c-brand));
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px;
  user-select: all;
}
.auth-recovery-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--vp-c-text-3);
}
.auth-forgot-link {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--vp-c-brand-1, var(--vp-c-brand));
  cursor: pointer;
  text-align: center;
}
.auth-forgot-link:hover {
  text-decoration: underline;
}

.auth-user {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand);
  margin-right: 4px;
}

.auth-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  white-space: nowrap;
  transition: border-color 0.2s, background 0.2s;
}

.auth-btn:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg-soft);
}

.auth-btn-register {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.auth-btn-register:hover {
  background: var(--vp-c-brand-dark);
}

.auth-btn-login {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

/* Modal styles */
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.auth-modal {
  background: var(--vp-c-bg);
  border-radius: 12px;
  padding: 28px;
  width: min(400px, 92vw);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.auth-modal h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.auth-form label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  margin-top: 12px;
  color: var(--vp-c-text-2);
}

.auth-form input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 14px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-sizing: border-box;
}

.auth-form input:focus {
  border-color: var(--vp-c-brand);
  outline: none;
}

.auth-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 14px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.auth-error {
  color: var(--vp-c-danger-1, #ef4444);
  font-size: 13px;
  margin: 8px 0 0;
}

.auth-success {
  color: var(--vp-c-green-1, #10b981);
  font-size: 13px;
  margin: 8px 0 0;
}

.auth-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.auth-submit {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-brand);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-submit:hover:not(:disabled) {
  background: var(--vp-c-brand-dark);
}

.auth-cancel {
  padding: 10px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
}
</style>
