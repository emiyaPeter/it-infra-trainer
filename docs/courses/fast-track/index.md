---
title: IT基础设施工程师 · 一个月速成指南
description: 零基础30天达到IT运维入门水平，每天2-3小时
---

# 🚀 IT基础设施工程师 · 一个月速成指南

> 零基础 → 能独立管理 Linux 服务器、排查网络故障、做好基础安全加固
> 每天 2-3 小时，30 天完成

## 📅 四周概览

| 周次 | 主题 | 目标 |
|------|------|------|
| 第 1 周 | 计算机+网络基础 | 理解硬件、OSI、TCP/IP、配通网络 |
| 第 2 周 | Linux 命令行 | 熟练操作 Linux，不依赖鼠标 |
| 第 3 周 | Linux 系统管理 | 管用户、管权限、管服务、管存储 |
| 第 4 周 | 网络+安全实战 | DNS/DHCP 配置、防火墙、系统加固 |

---

## 第 1 周：基础入门（每天 2-3 小时）

### Day 1-2：计算机硬件与操作系统
- 📖 [计算机硬件基础](../networking/01-hardware-basics)
- 🖥️ 打开你的电脑机箱看看 CPU、内存、硬盘长什么样
- ✅ 能说出计算机五大部件：CPU/内存/硬盘/主板/网卡

### Day 3-4：OSI 七层模型
- 📖 [OSI 七层模型](../networking/02-osi-model)
- 🧠 记住 "All People Seem To Need Data Processing" 七层口诀
- ✅ 能说出每一层的名称和代表协议

### Day 5-6：TCP/IP 协议栈
- 📖 [TCP/IP 协议栈](../networking/03-tcp-ip)
- 🔬 动手：用 Wireshark 抓包看 TCP 三次握手
- ✅ 理解三次握手、四次挥手、TCP vs UDP

### Day 7：IP 地址与子网划分
- 📖 [IP 地址与子网划分](../networking/04-subnetting)（重点看前两节）
- 🧮 动手：计算 192.168.1.0/26 有几个子网？每个多少 IP？
- ✅ 能计算简单子网（/24、/25 等常见掩码）

---

## 第 2 周：Linux 命令行（每天 2 小时 + 大量动手）

### Day 8-9：Linux 入门
- 📖 [Linux 入门与命令行](../linux/01-command-line)
- 💻 **安装 WSL2 Ubuntu** 或虚拟机
- 🔨 动手：把文中的所有命令敲一遍
- ✅ 能 ls/cd/mkdir/rm/cp/mv/grep/cat/管道

### Day 10-11：文件系统与权限
- 📖 [文件系统与权限](../linux/02-file-permissions)
- 🔨 动手：创建文件、改权限 chmod、改所有者 chown
- ✅ 理解 rwx、755、644、600 分别用在什么场景

### Day 12-13：用户与组管理
- 📖 [用户与组管理](../linux/03-users-groups)
- 🔨 动手：创建用户、加入组、配 sudo
- ✅ 能用 useradd/usermod/chage 管理用户生命周期

### Day 14：复习 + 测验
- 📝 CLI 测验：`npm run cli -- quiz linux`
- 📝 网络测验：`npm run cli -- quiz networking`
- ✅ 两个测验都达到 70% 以上

---

## 第 3 周：Linux 系统管理（每天 2 小时）

### Day 15-16：进程管理
- 📖 [进程管理](../linux/04-process-management)
- 🔨 动手：用 top/htop 观察系统进程，用 kill 发信号
- ✅ 能找出吃 CPU/内存的进程并处理

### Day 17-18：服务管理 systemd
- 📖 [服务管理 systemd](../linux/05-systemd-services)
- 🔨 动手：自己写一个 systemd service 文件并启动
- ✅ 能用 systemctl start/stop/enable/status

### Day 19-20：存储管理
- 📖 [存储与文件系统](../linux/06-storage)
- 🔨 动手：用 df/du 查看磁盘使用、find 找大文件
- ✅ 能处理"磁盘满了"的告警

### Day 21：网络配置
- 📖 [Linux 网络配置](../linux/08-networking)
- 🔨 动手：配 IP、看路由、配防火墙规则
- ✅ 能用 ip/ss/iptables 排查网络问题

---

## 第 4 周：网络与安全实战（每天 2 小时）

### Day 22-23：DNS 实战
- 📖 [DNS 域名系统](../networking/05-dns)
- 🔨 动手：用 dig/nslookup 排查域名解析
- ✅ 能独立排查"网站打不开"的 DNS 问题

### Day 24-25：DHCP 实战
- 📖 [DHCP 动态主机配置](../networking/06-dhcp)
- 🔨 动手：在路由器管理页面配置 DHCP 地址池
- ✅ 理解 DORA 四步、DHCP 中继、地址池管理

### Day 26-27：网络安全基础
- 📖 [网络安全基础](../security/02-network-security)
- 🔨 动手：配置 iptables/nftables 防火墙规则
- ✅ 能用防火墙限制端口访问

### Day 28-29：系统安全加固
- 📖 [系统安全加固](../security/03-system-hardening)
- 🔨 动手：加固 SSH 配置、检查 SUID 文件、开启 auditd
- ✅ 能按安全清单一台新服务器

### Day 30：命令行网络工具 + 综合测验
- 📖 [命令行网络工具](../networking/07-cli-tools)
- 📝 综合测验 + 实验
- ✅ 完成最终测验，庆祝完成！

---

## 🎯 学完 30 天后你会的

- ✅ 独立在 Linux 服务器上工作（不依赖 GUI）
- ✅ 排查基础网络故障（DNS、端口、路由）
- ✅ 管理用户账户和文件权限
- ✅ 编写 systemd 服务文件
- ✅ 配置防火墙和安全加固
- ✅ 分析日志、识别安全威胁

## 📋 后续进阶方向

学完一个月基础后，根据你的方向选择：

| 方向 | 下一步学什么 |
|------|------------|
| IT 运维工程师 | 虚拟化 → 容器(Docker) → 监控 → 自动化 |
| 网络安全工程师 | 等保合规 → 渗透测试 → SOC/应急响应 → 红蓝队 |

---

## 📺 每周配套免费视频

### 第1周 网络基础
| 视频 | 链接 | 时长 |
|------|------|------|
| 计算机网络速成 (Crash Course) | [B站](https://www.bilibili.com/video/BV1xJ411U7LX) | 每集10分钟 |
| 韩立刚-计算机网络 | [B站](https://www.bilibili.com/video/BV1Qr4y1w7nu) | 系统全面 |
| OSI模型详解 | [YouTube](https://www.youtube.com/watch?v=vv4y_uOneC0) | 12分钟 |
| 子网划分入门到精通 | [YouTube](https://www.youtube.com/watch?v=s_Ntt6eTn94) | 18分钟 |

### 第2周 Linux 命令行
| 视频 | 链接 | 时长 |
|------|------|------|
| Linux入门 (freeCodeCamp) | [YouTube](https://www.youtube.com/watch?v=sWbUDq4S6Y8) | 6小时全 |
| 韩顺平Linux | [B站](https://www.bilibili.com/video/BV1Sv411r7vd) | 零基础友好 |
| 最常用Linux命令50条 | [B站](https://www.bilibili.com/video/BV1d4411d7qk) | 快速入门 |
| The 50 Most Popular Linux Commands | [YouTube](https://www.youtube.com/watch?v=ZtqBQ68cfJc) | 2.5小时 |

### 第3-4周 Linux系统管理 + 安全
| 视频 | 链接 | 时长 |
|------|------|------|
| Linux系统管理 (Linux Foundation) | [edX免费](https://www.edx.org/learn/linux) | 自定进度 |
| SSH安全配置 | [YouTube](https://www.youtube.com/watch?v=YS5Zh7KExvE) | 15分钟 |
| iptables防火墙入门 | [YouTube](https://www.youtube.com/watch?v=6Ra17Qpj68c) | 18分钟 |
| Linux安全加固清单 | [YouTube](https://www.youtube.com/watch?v=ZhMw53Ud2tY) | 20分钟 |

## 🌐 每日参考网站

| 网站 | 用途 |
|------|------|
| [explainshell.com](https://explainshell.com/) | 粘贴任意命令，自动解释每个参数 |
| [linuxjourney.com](https://linuxjourney.com/) | 交互式一步步学 Linux |
| [overthewire.org](https://overthewire.org/wargames/bandit/) | 游戏闯关学 Linux 命令 |
| [cmdchallenge.com](https://cmdchallenge.com/) | 命令行挑战（有答案） |
| [subnettingpractice.com](https://subnettingpractice.com/) | 无限子网划分练习题 |

---

::: tip 学习方法
1. **动手 > 阅读**：每学一个命令，立刻在终端敲一遍
2. **每天坚持**：宁可每天 1 小时，不要周末突击 8 小时
3. **用本系统跟踪**：`npm run cli -- start "学习主题"` 记录每天的学习
4. **做测验验证**：`npm run cli -- quiz <主题>`
5. **遇到不会的立刻查**：`npm run cli -- search <关键词>`
6. **看不懂立即点配套视频**，视频理解更快
:::
