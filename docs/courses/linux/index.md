---
title: Linux 系统管理课程
description: 8章精通Linux运维，每章有动手实验和免费视频参考
---

# Linux 系统管理课程

全球 90%+ 云服务器跑 Linux。这是 IT 运维最重要的技能。

## 为什么 Linux 如此重要？

- 🌐 绝大多数 Web 服务器、数据库、缓存都跑在 Linux
- ☁️ AWS/Azure/GCP 上的虚拟机默认就是 Linux
- 🐳 Docker 容器本质上是精简的 Linux 进程
- 💰 免费开源，不需要许可证
- 🔧 一切皆文件，一切可自动化

## 课程目录

1. **[Linux入门与命令行](./01-command-line)** — 文件系统、70+命令、管道和重定向
2. **[文件系统与权限](./02-file-permissions)** — chmod/chown、ACL、SUID/SGID、生产实践
3. **[用户与组管理](./03-users-groups)** — useradd、sudo精细控制、PAM、集中认证
4. **[进程管理](./04-process-management)** — CPU/内存/IO 故障排查三场景
5. **[服务管理 systemd](./05-systemd-services)** — Service编写、Timer、日志排查
6. **[存储与文件系统](./06-storage)** — LVM在线扩容、df疑难、磁盘故障处理
7. **[Shell脚本编程](./07-shell-scripting)** — 监控脚本、备份脚本、自动化
8. **[Linux网络配置](./08-networking)** — ip/ss/iptables/路由/内核调优

## 📺 免费配套视频资源

| 资源 | 平台 | 适合 |
|------|------|------|
| [Linux教程-韩顺平](https://www.bilibili.com/video/BV1Sv411r7vd) | B站 | 零基础入门 |
| [Linux命令行与Shell](https://www.bilibili.com/video/BV1vW411q7mJ) | B站 | 命令行精通 |
| [The Linux Basics Course](https://youtube.com/playlist?list=PLtK75qxsQaMLZSo7KL-PmiRarU7hrpnwK) | YouTube | 英文系统课 |
| [Linux Server Administration](https://www.youtube.com/watch?v=WMy3OzvBWc0) | YouTube | 服务器管理 |

## 🌐 免费在线资源

- [Linux Journey](https://linuxjourney.com/) — 交互式 Linux 入门（英文，强烈推荐）
- [The Linux Command Line 免费电子书](https://linuxcommand.org/tlcl.php) — 500页命令行圣经
- [ExplainShell](https://explainshell.com/) — 粘贴命令，自动解释每个参数
- [OverTheWire Bandit](https://overthewire.org/wargames/bandit/) — 游戏化学习 Linux

## 💻 实验环境

本课程全程在 **WSL2 Ubuntu** 中进行：

```powershell
# Windows PowerShell（管理员）中运行：
wsl --install -d Ubuntu
```

## 🔬 建议的每日练习

```bash
# Day 1-3: 每天在终端工作至少 1 小时
cd / && ls -la && cd ~ && mkdir practice

# Day 4-7: 用 less 读 /var/log/syslog，用 grep 找特定内容
grep -i error /var/log/syslog | head -20

# Day 8+: 尝试不用鼠标完成所有文件操作
# 复制、移动、重命名、查找全部用命令行
```
