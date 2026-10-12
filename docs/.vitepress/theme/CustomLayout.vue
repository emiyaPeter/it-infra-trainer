<template>
  <Layout>
    <template #layout-top>
      <div class="auth-top-bar">
        <div class="auth-top-inner">
          <span class="auth-brand">🖥️ IT 培训助手</span>
          <div class="auth-top-widget">
            <AuthWidget />
          </div>
        </div>
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

const isChapter = computed(() => isChapterPage(page.value?.relativePath))

function refreshState() {
  const userId = localStorage.getItem(ACTIVE_USER_KEY)
  done.value = !!userId && isPageDone(userId, page.value?.relativePath)
}

function toggleDone() {
  const userId = localStorage.getItem(ACTIVE_USER_KEY)
  if (!userId) {
    alert('请先点击右上角「注册」创建学习账户，再标记学习进度。')
    return
  }
  done.value = setPageDone(userId, page.value?.relativePath, !done.value)
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
.auth-top-bar {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
}

.auth-top-inner {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 8px 24px;
  pointer-events: auto;
}

.auth-brand {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-right: 8px;
}

/* 浮动完成标记按钮 */
.done-fab {
  position: fixed;
  right: 24px;
  bottom: 88px;
  z-index: 90;
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
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

@media (max-width: 768px) {
  .auth-top-bar {
    position: static;
    padding: 4px 16px;
    background: var(--vp-c-bg-soft);
    border-bottom: 1px solid var(--vp-c-divider);
  }
  .auth-top-inner {
    justify-content: center;
  }
  .done-fab {
    right: 16px;
    bottom: 72px;
  }
}
</style>
