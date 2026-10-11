// ============================================================
// VitePress 自定义主题入口
// 嵌入认证组件和仪表盘组件
// ============================================================

import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import DashboardWidget from './components/DashboardWidget.vue'
import AuthWidget from './components/AuthWidget.vue'
import CustomLayout from './CustomLayout.vue'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  Layout: CustomLayout,
  enhanceApp({ app }) {
    app.component('DashboardWidget', DashboardWidget)
    app.component('AuthWidget', AuthWidget)
  },
} satisfies Theme
