---
title: Windows Server 管理课程
description: 5章掌握企业Windows环境运维核心：安装配置、AD域、用户组、组策略、DNS/DHCP与文件服务
---

# Windows Server 管理课程

虽然 Linux 统治了云服务器，但企业内网的**身份认证、桌面管理、文件共享**几乎都建立在 Windows Server + Active Directory 之上。IT 基础设施工程师必须理解这两种生态。

## 为什么学 Windows Server？

- 🏢 中大型企业内网的事实标准：域登录、统一账号、权限管控
- 🖥️ 桌面运维基础：组策略批量管理成百上千台电脑
- 📁 文件共享与打印服务：SMB 共享、NTFS 权限
- 💼 招聘刚需：政企、金融、制造业运维岗位普遍要求 AD 经验

## 实验环境（全免费）

| 组件 | 获取方式 | 说明 |
|------|----------|------|
| VirtualBox | [virtualbox.org](https://www.virtualbox.org) | 虚拟机宿主（阶段4 已学） |
| Windows Server 2022 Evaluation | [微软评估中心](https://www.microsoft.com/en-us/evalcenter/) | 180 天免费试用 ISO |
| Windows 10/11 评估版 | 同上 | 作为加入域的客户端 |

建议拓扑（最低配置）：
- **DC01**：Windows Server 2022，2C/4G，域控制器 + DNS + DHCP
- **CLIENT01**：Windows 11，2C/4G，加入域的客户端

## 课程目录

1. **[安装与初始配置](./01-installation)** — ISO 获取、安装流程、Server Core vs Desktop、基础加固
2. **[Active Directory 域服务](./02-ad-domain)** — 域/林/DC 概念、安装 AD DS、加域
3. **[用户与组管理](./03-users-groups)** — AD 用户、组类型与作用域、AGDLP 原则、PowerShell 批量管理
4. **[组策略 GPO](./04-group-policy)** — GPO 结构、链接与继承、密码策略、桌面管控、排障
5. **[DNS、DHCP 与文件服务](./05-server-services)** — 域集成 DNS、DHCP 作用域、SMB 共享与 NTFS 权限

## 📺 免费配套资源

| 资源 | 平台 | 适合 |
|------|------|------|
| Windows Server 2022 教程 | B站搜索"Windows Server 2022 AD" | 中文入门 |
| [John Savill's PowerShell](https://www.youtube.com/playlist?list=PLlVtbbGORMnM6NUcs3-IaN2cQYqDx0mHV) | YouTube | PowerShell 进阶（英文） |
| [Microsoft Learn AD DS 路径](https://learn.microsoft.com/en-us/training/paths/active-directory-domain-services/) | 官方 | 免费官方交互课程 |

## 学习建议

- 每章先读概念，再在 VirtualBox 实验环境里**动手复现**每个操作
- PowerShell 命令和 GUI 操作都要练一遍——生产环境两者都会用到
- 学完本课程回到 [阶段3 路线图](/roadmap/phase-3-windows) 检查掌握情况
