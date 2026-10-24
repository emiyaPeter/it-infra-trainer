<template>
  <Layout>
    <!-- 认证组件嵌入导航栏内部（不再浮层覆盖导航链接） -->
    <template #nav-bar-content-before>
      <div class="auth-nav">
        <AuthWidget />
      </div>
    </template>

    <!-- 移动端抽屉菜单里的认证区 -->
    <template #nav-screen-content-before>
      <div class="auth-nav-screen">
        <AuthWidget />
      </div>
    </template>
  </Layout>

  <!-- 课程章节页：右下角浮动"标记已完成"按钮 -->
  <Teleport to="body">
    <button
      v-if="isChapter"
      class="done-fab"
      :class="{ 'done-fab-active': done }"
      :title="done ? '点击取消完成标记' : '学完本页后点击标记'"
      @click="toggleDone"
    >
      {{ done ? '✓ 已完成' : '标记已完成' }}
    </button>
    <!-- 非阻塞提示（替代 alert） -->
    <div v-if="fabToast" class="fab-toast">{{ fabToast }}</div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import AuthWidget from './components/AuthWidget.vue'
import { ACTIVE_USER_KEY, isChapterPage, isPageDone, setPageDone } from './utils/progress.js'

const { Layout } = DefaultTheme
const { page } = useData()

const done = ref(false)
const fabToast = ref('')
let toastTimer = null

function showToast(msg) {
  fabToast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { fabToast.value = '' }, 2600)
}

const isChapter = computed(() => isChapterPage(page.value?.relativePath))

function refreshState() {
  const userId = localStorage.getItem(ACTIVE_USER_KEY)
  done.value = !!userId && isPageDone(userId, page.value?.relativePath)
}

function toggleDone() {
  const userId = localStorage.getItem(ACTIVE_USER_KEY)
  if (!userId) {
    showToast('请先点击右上角「注册」创建学习账户')
    return
  }
  done.value = setPageDone(userId, page.value?.relativePath, !done.value)
  showToast(done.value ? '✓ 已计入学习进度' : '已取消本页完成标记')
  // 通知首页仪表盘等组件立即刷新进度
  window.dispatchEvent(new CustomEvent('it-trainer:progress-changed'))
}

const onUserChange = () => refreshState()
const onProgressChange = () => refreshState()

onMounted(() => {
  refreshState()
  window.addEventListener('it-trainer:user-changed', onUserChange)
  window.addEventListener('it-trainer:progress-changed', onProgressChange)
})

onUnmounted(() => {
  window.removeEventListener('it-trainer:user-changed', onUserChange)
  window.removeEventListener('it-trainer:progress-changed', onProgressChange)
})
</script>

<style>
/* 导航栏内的认证区：跟随导航栏布局，不悬浮不重叠 */
.auth-nav {
  display: flex;
  align-items: center;
  margin-left: 14px;
  margin-right: 8px;
  flex-shrink: 0;
}

.auth-nav .auth-widget {
  gap: 6px;
}

.auth-nav .auth-btn {
  padding: 3px 10px;
  font-size: 12px;
}

.auth-nav .auth-user {
  font-size: 13px;
  max-width: 9em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 移动端抽屉里的认证区 */
.auth-nav-screen {
  display: flex;
  justify-content: center;
  padding: 14px 0 4px;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 10px;
}

/* 移动端导航栏放不下认证按钮（抽屉菜单里已有），隐藏避免把汉堡按钮挤出屏幕 */
@media (max-width: 767px) {
  .auth-nav {
    display: none;
  }
}

/* 浮动完成标记按钮（z-index 低于侧栏 60，侧栏打开时被盖住） */
.done-fab {
  position: fixed;
  right: 24px;
  bottom: 88px;
  z-index: 50;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-brand);
  background: var(--vp-c-bg);
  color: var(--vp-c-brand);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: background 0.2s, color 0.2s, transform 0.1s;
}

.done-fab:hover {
  transform: translateY(-1px);
}

.done-fab-active {
  background: var(--vp-c-green-1, #10b981);
  border-color: var(--vp-c-green-1, #10b981);
  color: #ffffff;
}

/* 非阻塞提示气泡 */
.fab-toast {
  position: fixed;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  z-index: 50;
  padding: 10px 18px;
  border-radius: 8px;
  background: var(--vp-c-bg-elv, var(--vp-c-bg));
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

@media (max-width: 768px) {
  .done-fab {
    right: 16px;
    bottom: 72px;
  }
}
</style>
