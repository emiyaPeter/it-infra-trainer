import { defineConfig } from 'vitepress'
import { SIDEBAR } from './theme/utils/sidebar.js'

export default defineConfig({
  title: 'IT 基础设施培训助手',
  description: '零基础到3年经验 — IT基础设施工程师自学系统',
  lang: 'zh-CN',
  // GitHub Pages 项目站部署在子路径（/仓库名/）下；本地开发与根域名部署保持 '/'
  base: (process.env.BASE_PATH || '/'),
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  vite: {
    server: {
      // 监听 0.0.0.0：局域网内手机/平板可通过 Network 地址访问
      host: '0.0.0.0',
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '学习路线图', link: '/roadmap/' },
      { text: '课程', link: '/courses/' },
      { text: '🚀 一个月速成', link: '/courses/fast-track/' },
      { text: '🤖 AI 编程', link: '/courses/ai-programming/' },
      { text: '📝 随堂测验', link: '/quiz/' },
      { text: '证书指南', link: '/certifications/' },
    ],

    sidebar: SIDEBAR,

    socialLinks: [],

    footer: {
      message: 'IT 基础设施工程师培训助手',
      copyright: '仅供个人学习使用 · 所有工具均可免费获取',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    docFooter: {
      prev: '上一节',
      next: '下一节',
    },

    lastUpdatedText: '最后更新',
    darkModeSwitchLabel: '深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
  },
})
