---
layout: home

hero:
  name: "IT 基础设施工程师"
  text: "培训助手"
  tagline: 零基础 → 3年经验水平 · 在家自学 · 全部免费工具
  actions:
    - theme: brand
      text: 🚀 开始学习
      link: /roadmap/
    - theme: alt
      text: 📋 查看课程目录
      link: /courses/
    - theme: alt
      text: 🤖 AI 编程课（零基础→求职）
      link: /courses/ai-programming/

features:
  - icon: 📚
    title: 结构化课程
    details: 17 个模块 78 章讲义，十个学习阶段全覆盖，从计算机硬件到 Kubernetes 与灾备体系，循序渐进。
  - icon: 🤖
    title: AI 辅助编程课
    details: 从第一次 AI 对话到独立交付项目、通过求职面试的完整路径：提示词工程、代理工作流、简历与答辩实战。
  - icon: 🔬
    title: 动手实验与作业批改
    details: 实验在 WSL 真实环境中操作，系统自动验证结果；作业支持理论判分与实操环境检查。
  - icon: ✅
    title: 交互测验
    details: 综合测验在终端中交互作答，即时评分与逐题解析，成绩自动记录。
  - icon: 📊
    title: 进度追踪
    details: 学完一页点「标记已完成」，仪表盘按阶段实时累计进度；数据可导出备份、跨设备迁移。
  - icon: 💰
    title: 完全免费
    details: 所有工具均可免费获取 — WSL2、VirtualBox、Docker Desktop、VS Code、Minikube。零开销开始IT之旅。
  - icon: 🎯
    title: 3年路线图
    details: 参照一线企业IT基础设施工程师岗位要求设计，从零基础到独立搭建完整基础设施，目标明确。

roadmap:
  - phase: 阶段1
    title: 基础入门
    duration: 1-3个月
    topics: 硬件基础、OSI模型、TCP/IP、子网划分、命令行入门
    link: /roadmap/phase-1-foundation
  - phase: 阶段2
    title: Linux系统管理
    duration: 4-8个月
    topics: 命令行精通、权限管理、进程/服务、Shell脚本、存储
    link: /roadmap/phase-2-linux
  - phase: 阶段3
    title: Windows Server
    duration: 9-10个月
    topics: AD域控制器、组策略、DNS/DHCP、PowerShell
    link: /roadmap/phase-3-windows
  - phase: 阶段4
    title: 虚拟化技术
    duration: 11-12个月
    topics: VirtualBox精通、VMware概念、KVM/QEMU、Hyper-V
    link: /roadmap/phase-4-virtualization
  - phase: 阶段5
    title: 容器技术
    duration: 13-16个月
    topics: Docker核心、Docker Compose、Kubernetes基础
    link: /roadmap/phase-5-containers
  - phase: 阶段6
    title: 自动化运维
    duration: 17-20个月
    topics: Ansible、Terraform、CI/CD、基础设施即代码
    link: /roadmap/phase-6-automation
  - phase: 阶段7
    title: 监控与日志
    duration: 21-22个月
    topics: Prometheus、Grafana、ELK Stack、告警规则
    link: /roadmap/phase-7-monitoring
  - phase: 阶段8
    title: 云计算基础
    duration: 23-25个月
    topics: AWS核心服务、Azure基础、混合云概念
    link: /roadmap/phase-8-cloud
  - phase: 阶段9
    title: 安全基础
    duration: 25-26个月
    topics: 防火墙策略、IAM、证书管理、安全合规
    link: /roadmap/phase-9-security
  - phase: 阶段10
    title: 灾备与高可用
    duration: 27-28个月
    topics: 备份策略、负载均衡、故障转移、DR规划
    link: /roadmap/phase-10-dr

getStarted:
  - title: 第一步：配置环境
    details: 按照阶段1的环境准备指南，安装 WSL2、VS Code、Git 等免费工具
  - title: 第二步：开始阶段1
    details: 从计算机硬件基础和网络原理开始，建立IT知识的地基
  - title: 第三步：坚持动手
    details: 每学完一个知识点，立即在终端中动手实验。肌肉记忆比眼睛记忆更可靠
  - title: 第四步：追踪进度
    details: 使用 CLI 或 Web 仪表盘查看学习进度，保持节奏

footer:
  message: 🖥️ IT 基础设施工程师培训助手 · 在家自学 · 完全免费
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #3b82f6, #10b981);
}
.roadmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 24px;
}
.roadmap-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.roadmap-card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.roadmap-card .phase {
  font-size: 12px;
  font-weight: 700;
  color: var(--vp-c-brand);
  text-transform: uppercase;
}
.roadmap-card .title {
  font-size: 18px;
  font-weight: 700;
  margin: 8px 0;
}
.roadmap-card .duration {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}
.roadmap-card .topics {
  font-size: 14px;
  color: var(--vp-c-text-1);
}
.get-started {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 24px;
}
.get-started .step {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
}
.get-started .step h3 {
  margin-top: 0;
  color: var(--vp-c-brand);
}
</style>

## 📋 学习路线图

<div class="roadmap-grid">
  <a v-for="item in $frontmatter.roadmap" :href="item.link" class="roadmap-card">
    <div class="phase">{{ item.phase }}</div>
    <div class="title">{{ item.title }}</div>
    <div class="duration">⏱ {{ item.duration }}</div>
    <div class="topics">{{ item.topics }}</div>
  </a>
</div>

## 🚀 如何开始

<div class="get-started">
  <div v-for="step in $frontmatter.getStarted" class="step">
    <h3>{{ step.title }}</h3>
    <p>{{ step.details }}</p>
  </div>
</div>

## 📊 我的学习

<DashboardWidget />

---

::: tip 💡 提示
本培训系统包含 **Web 文档** 和 **CLI 命令行工具** 两种学习界面。  
- 运行 `npm run docs:dev` 在浏览器中学习  
- 运行 `it-trainer` 在终端中做实验和测验
:::
