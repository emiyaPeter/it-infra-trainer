# 阶段2：Linux 系统管理

> 🎯 **目标**：能熟练地从命令行管理一台 Linux 服务器  
> ⏱ **建议时长**：4-8 个月（每天 1-2 小时）  
> 📊 **难度**：⭐⭐ 基础  
> ⭐ **这是整个培训中最重要的阶段！**

## 为什么 Linux 如此重要？

- 全球 **90%+** 的云服务器运行 Linux
- 绝大多数 Web 服务器（Nginx/Apache）、数据库、缓存都在 Linux 上
- Docker 容器本质上是 Linux 进程
- 几乎所有 DevOps 工具链都以 Linux 为第一平台
- Linux 技能是 IT 基础设施工程师的**核心竞争力**

## 学习内容

### 第1-3周：命令行精通
- Linux 文件系统结构（/etc, /var, /home, /tmp...）
- 文件操作：ls, cp, mv, rm, find, grep
- 管道和重定向：`|`, `>`, `>>`, `<`
- 文本处理：grep, sed, awk
- Vim 基础（至少学会编辑、保存、退出）

### 第4-6周：用户与权限
- 用户和组的概念（UID/GID）
- /etc/passwd, /etc/shadow, /etc/group
- chmod, chown, chgrp
- 特殊权限：SUID, SGID, Sticky Bit
- sudo 配置（/etc/sudoers）
- ACL 访问控制列表

### 第7-8周：进程管理
- 进程的概念（PID, PPID）
- ps, top, htop 查看进程
- kill, pkill 管理进程
- 前台/后台进程，nohup, screen, tmux
- /proc 虚拟文件系统

### 第9-10周：服务管理 (systemd)
- systemd 概述（Linux 的 init 系统）
- systemctl 管理服务（start/stop/enable/disable）
- journalctl 查看日志
- 编写自定义 systemd 服务单元
- 定时任务：cron 和 systemd timer

### 第11-12周：存储管理
- 磁盘分区（fdisk, parted）
- 文件系统（ext4, xfs）
- 挂载（mount, /etc/fstab）
- LVM 逻辑卷管理
- RAID 概念（RAID 0/1/5/6/10）
- NFS 网络文件系统

### 第13-16周：Shell 脚本编程
- Bash 基础：变量、条件、循环、函数
- 脚本调试（set -x, set -e）
- 输入输出处理
- 错误处理和日志记录
- 实战项目：备份脚本、监控脚本、批量部署脚本

### 第17-20周：Linux 网络与安全
- ip 命令代替 ifconfig
- 网络配置文件
- iptables/nftables 防火墙基础
- SSH 配置加固
- fail2ban 防暴力破解
- SELinux/AppArmor 概念

## 里程碑项目

在本阶段结束时，你应该能**从零搭建一个 LAMP 服务器**：

```bash
# 在 VirtualBox Ubuntu Server VM 中完成：
1. 安装 Ubuntu Server
2. 配置静态 IP
3. 安装 Apache/Nginx + MySQL + PHP
4. 配置防火墙（只开放 22, 80, 443 端口）
5. 创建虚拟主机
6. 设置自动备份脚本（cron + mysqldump）
7. 编写监控脚本（磁盘、内存、服务状态）
```

## 实验环境

- **日常练习**：WSL2 Ubuntu
- **里程碑项目**：VirtualBox 中的 Ubuntu Server VM
- **强调**：每天使用 WSL2！把终端变成你的日常工具

## 阶段检查清单

- [ ] 能不看笔记完成日常文件操作（创建、编辑、查找、权限修改）
- [ ] 理解并实际使用过管道和重定向
- [ ] 能用 systemctl 管理服务
- [ ] 能编写 50 行以上的 Bash 脚本
- [ ] 能读懂 /var/log/syslog 并排查问题
- [ ] 能用 iptables 设置基本防火墙规则
- [ ] 独立搭建过 LAMP/LEMP 环境
- [ ] 配置过 SSH Key 登录（禁用密码登录）

## 下一阶段

完成 Linux 系统管理后，进入 [阶段3：Windows Server →](/roadmap/phase-3-windows)
