import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'IT 基础设施培训助手',
  description: '零基础到3年经验 — IT基础设施工程师自学系统',
  lang: 'zh-CN',
  base: '/',
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
    logo: '🖥️',
    nav: [
      { text: '首页', link: '/' },
      { text: '学习路线图', link: '/roadmap/' },
      { text: '课程', link: '/courses/' },
      { text: '🚀 一个月速成', link: '/courses/fast-track/' },
      { text: '证书指南', link: '/certifications/' },
    ],

    sidebar: {
      '/roadmap/': [
        {
          text: '学习路线图',
          items: [
            { text: '总览', link: '/roadmap/' },
            { text: '阶段1：基础入门 (1-3月)', link: '/roadmap/phase-1-foundation' },
            { text: '阶段2：Linux系统管理 (4-8月)', link: '/roadmap/phase-2-linux' },
            { text: '阶段3：Windows Server (9-10月)', link: '/roadmap/phase-3-windows' },
            { text: '阶段4：虚拟化技术 (11-12月)', link: '/roadmap/phase-4-virtualization' },
            { text: '阶段5：容器技术 (13-16月)', link: '/roadmap/phase-5-containers' },
            { text: '阶段6：自动化运维 (17-20月)', link: '/roadmap/phase-6-automation' },
            { text: '阶段7：监控与日志 (21-22月)', link: '/roadmap/phase-7-monitoring' },
            { text: '阶段8：云计算基础 (23-25月)', link: '/roadmap/phase-8-cloud' },
            { text: '阶段9：安全基础 (25-26月)', link: '/roadmap/phase-9-security' },
            { text: '阶段10：灾备与高可用 (27-28月)', link: '/roadmap/phase-10-dr' },
          ],
        },
      ],
      '/courses/ai-programming/': [
        {
          text: 'AI 辅助编程',
          items: [
            { text: '概述', link: '/courses/ai-programming/' },
            { text: '01 - AI 编程基础与工具版图', link: '/courses/ai-programming/01-ai-coding-basics' },
            { text: '02 - 提示词工程实战', link: '/courses/ai-programming/02-prompt-engineering' },
            { text: '03 - AI 终端代理工作流', link: '/courses/ai-programming/03-agent-workflow' },
            { text: '04 - 带着 AI 做完整项目', link: '/courses/ai-programming/04-ai-project-practice' },
            { text: '05 - 安全、质量与验证', link: '/courses/ai-programming/05-ai-safety-quality' },
          ],
        },
      ],
      '/courses/windows-server/': [
        {
          text: 'Windows Server 管理',
          items: [
            { text: '概述', link: '/courses/windows-server/' },
            { text: '01 - 安装与初始配置', link: '/courses/windows-server/01-installation' },
            { text: '02 - Active Directory 域服务', link: '/courses/windows-server/02-ad-domain' },
            { text: '03 - AD 用户与组管理', link: '/courses/windows-server/03-users-groups' },
            { text: '04 - 组策略 GPO', link: '/courses/windows-server/04-group-policy' },
            { text: '05 - DNS、DHCP 与文件服务', link: '/courses/windows-server/05-server-services' },
          ],
        },
      ],
      '/courses/dr-backup/': [
        {
          text: '灾备与高可用',
          items: [
            { text: '概述', link: '/courses/dr-backup/' },
            { text: '01 - 备份策略与实战', link: '/courses/dr-backup/01-backup-strategy' },
            { text: '02 - RAID 与单机冗余', link: '/courses/dr-backup/02-raid-ha' },
            { text: '03 - 负载均衡与故障转移', link: '/courses/dr-backup/03-lb-failover' },
            { text: '04 - 灾备规划与演练', link: '/courses/dr-backup/04-dr-plan' },
          ],
        },
      ],
      '/courses/networking/': [        {
          text: '网络基础',
          items: [
            { text: '概述', link: '/courses/networking/' },
            { text: '01 - 计算机硬件基础', link: '/courses/networking/01-hardware-basics' },
            { text: '02 - OSI七层模型', link: '/courses/networking/02-osi-model' },
            { text: '03 - TCP/IP协议栈', link: '/courses/networking/03-tcp-ip' },
            { text: '04 - IP地址与子网划分', link: '/courses/networking/04-subnetting' },
            { text: '05 - DNS域名系统', link: '/courses/networking/05-dns' },
            { text: '06 - DHCP动态主机配置', link: '/courses/networking/06-dhcp' },
            { text: '07 - 命令行网络工具', link: '/courses/networking/07-cli-tools' },
          ],
        },
      ],
      '/courses/linux/': [
        {
          text: 'Linux 系统管理',
          items: [
            { text: '概述', link: '/courses/linux/' },
            { text: '01 - Linux入门与命令行', link: '/courses/linux/01-command-line' },
            { text: '02 - 文件系统与权限', link: '/courses/linux/02-file-permissions' },
            { text: '03 - 用户与组管理', link: '/courses/linux/03-users-groups' },
            { text: '04 - 进程管理', link: '/courses/linux/04-process-management' },
            { text: '05 - 服务管理 (systemd)', link: '/courses/linux/05-systemd-services' },
            { text: '06 - 存储与文件系统', link: '/courses/linux/06-storage' },
            { text: '07 - Shell脚本编程', link: '/courses/linux/07-shell-scripting' },
            { text: '08 - Linux网络配置', link: '/courses/linux/08-networking' },
          ],
        },
      ],
      '/courses/docker/': [
        {
          text: 'Docker 容器',
          items: [
            { text: '概述', link: '/courses/docker/' },
            { text: '01 - 容器概念入门', link: '/courses/docker/01-container-concepts' },
            { text: '02 - Docker安装与基础', link: '/courses/docker/02-docker-basics' },
            { text: '03 - Dockerfile编写', link: '/courses/docker/03-dockerfile' },
            { text: '04 - Docker Compose', link: '/courses/docker/04-docker-compose' },
          ],
        },
      ],
      '/courses/virtualization/': [
        {
          text: '虚拟化技术',
          items: [
            { text: '概述', link: '/courses/virtualization/' },
            { text: '01 - 虚拟化概念入门', link: '/courses/virtualization/01-concepts' },
            { text: '02 - VirtualBox实战', link: '/courses/virtualization/02-virtualbox' },
            { text: '03 - VMware vSphere入门', link: '/courses/virtualization/03-vmware' },
            { text: '04 - KVM与云化虚拟化', link: '/courses/virtualization/04-kvm-cloud' },
          ],
        },
      ],
      '/courses/ansible/': [
        {
          text: '自动化运维',
          items: [
            { text: '概述', link: '/courses/ansible/' },
            { text: '01 - 自动化运维概念', link: '/courses/ansible/01-automation-concepts' },
            { text: '02 - Ansible入门', link: '/courses/ansible/02-ansible-basics' },
            { text: '03 - Ansible Playbook', link: '/courses/ansible/03-ansible-playbook' },
            { text: '04 - Terraform基础', link: '/courses/ansible/04-terraform-basics' },
          ],
        },
      ],
      '/courses/monitoring/': [
        {
          text: '监控与日志',
          items: [
            { text: '概述', link: '/courses/monitoring/' },
            { text: '01 - 监控基础概念', link: '/courses/monitoring/01-monitoring-concepts' },
            { text: '02 - Prometheus入门', link: '/courses/monitoring/02-prometheus' },
            { text: '03 - Grafana可视化', link: '/courses/monitoring/03-grafana' },
            { text: '04 - ELK日志平台', link: '/courses/monitoring/04-elk' },
          ],
        },
      ],
      '/courses/cloud/': [
        {
          text: '云计算',
          items: [
            { text: '概述', link: '/courses/cloud/' },
            { text: '01 - 云计算基础概念', link: '/courses/cloud/01-cloud-concepts' },
            { text: '02 - AWS核心服务', link: '/courses/cloud/02-aws-core' },
            { text: '03 - Azure基础', link: '/courses/cloud/03-azure-basics' },
            { text: '04 - 云成本与架构', link: '/courses/cloud/04-cloud-cost' },
          ],
        },
      ],
      '/courses/security/': [
        {
          text: '安全基础与网络安防',
          items: [
            { text: '概述', link: '/courses/security/' },
            { text: '01 - 安全基础概念 (CIA/纵深防御)', link: '/courses/security/01-security-concepts' },
            { text: '02 - 网络安全基础', link: '/courses/security/02-network-security' },
            { text: '03 - 系统安全加固', link: '/courses/security/03-system-hardening' },
            { text: '04 - 身份与访问管理', link: '/courses/security/04-iam' },
            { text: '05 - 密码学基础', link: '/courses/security/05-cryptography' },
            { text: '06 - 安全监控与事件响应', link: '/courses/security/06-soc-ir' },
            { text: '07 - 渗透测试基础', link: '/courses/security/07-pentest-basics' },
            { text: '08 - 合规与标准 (等保/ISO27001)', link: '/courses/security/08-compliance' },
          ],
        },
        {
          text: '🔴🔵 网络安全专项',
          items: [
            { text: '🔴 红队：渗透测试', link: '/courses/cybersecurity/red-team/' },
            { text: '🔵 蓝队：防御与响应', link: '/courses/cybersecurity/blue-team/' },
          ],
        },
      ],
      '/courses/repair-basics/': [
        {
          text: '🔧 电脑维修基础',
          items: [
            { text: '概述', link: '/courses/repair-basics/' },
            { text: '01 - 硬件组成与检测', link: '/courses/repair-basics/01-hardware-diagnosis' },
            { text: '02 - 常见硬件故障与更换', link: '/courses/repair-basics/02-common-faults' },
            { text: '03 - 系统启动故障排查', link: '/courses/repair-basics/03-boot-troubleshooting' },
            { text: '04 - 预防性维护与保养', link: '/courses/repair-basics/04-preventive-maintenance' },
          ],
        },
      ],
      '/courses/troubleshooting/': [
        {
          text: '🔧 综合故障排查手册',
          items: [
            { text: '概述', link: '/courses/troubleshooting/' },
            { text: '01 - 网络连通性异常排查', link: '/courses/troubleshooting/01-network-troubleshooting' },
            { text: '02 - 网页访问异常排查', link: '/courses/troubleshooting/02-web-access-issues' },
            { text: '03 - Windows系统常见异常', link: '/courses/troubleshooting/03-system-troubleshooting' },
            { text: '04 - 打印机常见异常排查', link: '/courses/troubleshooting/04-printer-troubleshooting' },
            { text: '05 - 诊断工具速查表', link: '/courses/troubleshooting/05-diagnostic-tools' },
          ],
        },
      ],
      '/certifications/': [
        {
          text: '证书考试指南',
          items: [
            { text: '证书路线图总览', link: '/certifications/' },
          ],
        },
      ],
    },

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
