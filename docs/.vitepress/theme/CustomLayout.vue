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
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import AuthWidget from './components/AuthWidget.vue'

const { Layout } = DefaultTheme
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
}
</style>
