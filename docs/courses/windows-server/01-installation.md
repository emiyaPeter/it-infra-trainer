---
title: Windows Server 安装与初始配置
description: 从零安装 Windows Server 2022 评估版，掌握安装流程、Server Core 与 Desktop 的选择、基础加固
difficulty: beginner
estimatedTime: 90
---

# Windows Server 安装与初始配置

本章在 VirtualBox 中安装 Windows Server 2022 评估版，并完成一台生产级服务器该有的初始配置。这是整个阶段3 实验环境的地基。

## 1. 获取安装介质

从[微软评估中心](https://www.microsoft.com/en-us/evalcenter/download-windows-server-2022)下载 **Windows Server 2022 ISO（64 位，Evaluation，Desktop Experience 版）**，注册一个免费微软账号即可，180 天试用。

::: tip 选择哪个版本？
- **Standard**：中小环境够用（本课程用它）
- **Datacenter**：面向大型虚拟化/云场景，功能更全
- 评估版与正式版功能一致，只是有时间限制
:::

## 2. VirtualBox 创建虚拟机

| 配置项 | 建议值 | 说明 |
|--------|--------|------|
| 内存 | 4096 MB | DC 角色最低要求 |
| CPU | 2 核 | |
| 磁盘 | 60 GB | 动态分配即可 |
| 网络 | **仅主机（Host-Only）网络** | 与宿主机、其他 VM 组成独立实验网 |

> 💡 实验环境用 Host-Only 网络可以避免占用家庭网络 IP，多台 VM 之间也能互通。第二章加第二台客户端 VM 时记得用同一个 Host-Only 网络。

## 3. 安装流程

1. 挂载 ISO，启动 VM，选择 **Windows Server 2022 Standard Evaluation (Desktop Experience)**
2. 选择"自定义安装"，磁盘不做分区直接下一步
3. 安装完成后设置 Administrator 密码（**复杂度要求：大写+小写+数字，至少 8 位**）

::: warning 关于 Server Core
安装菜单里还有不带 Desktop Experience 的版本，即 **Server Core**——只有命令行（PowerShell）。生产环境中 Server Core 更安全、占用更小（无浏览器、无 GUI 攻击面），微软推荐生产使用。学习阶段建议先装 Desktop 版理解概念，之后专门练 Core。
:::

## 4. 初始配置清单

安装完 ≠ 能用。生产服务器的初始配置清单：

```powershell
# 1. 改计算机名（DC01 = 域控制器 01，命名规范很重要）
Rename-Computer -NewName "DC01" -Restart

# 2. 配置静态 IP（Host-Only 网段内自选，如 192.168.56.10）
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.56.10 -PrefixLength 24
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 127.0.0.1

# 3. 开启远程管理（生产中用 WinRM 而不是远程桌面到处点）
Enable-PSRemoting -Force

# 4. 时区与时间（AD 对时间敏感， Kerberos 默认允许 5 分钟偏差）
Set-TimeZone -Id "China Standard Time"

# 5. 激活/检查评估剩余天数
slmgr /dli
```

逐条解释：

- **计算机名**：装 AD 之前必须定名，域控制器改名非常麻烦
- **静态 IP**：DNS 服务器（DC 通常兼 DNS）IP 一变，整个域都会瘫痪——所以 DC 必须**永远静态 IP**
- **DNS 指向自己**：这台机器将来是 DNS 服务器，先指向 127.0.0.1
- **时间**：Kerberos 认证要求域内时钟偏差不超过 5 分钟，时间不同步是加域失败的常见原因

## 5. 常用管理工具速查

| 工具 | 打开方式 | 用途 |
|------|----------|------|
| 服务器管理器 | 开机默认打开 | 添加角色、批量管理 |
| PowerShell（管理员） | Win+X | 一切自动化入口 |
| 设备管理器 | devmgmt.msc | 装 VBox 增强功能后检查驱动 |
| 事件查看器 | eventvwr.msc | 排障第一站 |
| services.msc | services.msc | 服务管理 |

## 6. 安装 VirtualBox 增强功能

菜单"设备 → 安装增强功能"，装完后剪贴板共享、分辨率自适应可用。若安装卡住，检查 ISO 是否挂载到了光驱。

## 常见误区

1. **用 NAT 网络装域**——客户端加域找不到 DC，Host-Only 或内部网络才适合同域多机实验
2. **装完不设静态 IP 就装 AD**——DHCP 续租换 IP 后整域故障
3. ** Administrator 密码设太简单**——策略直接拒绝（策略在本地安全策略里，域环境更严）

## 小结

- 评估版 ISO 免费 180 天，Standard + Desktop Experience 适合学习
- 初始配置三件事：**改名、静态 IP、DNS 指向自身**
- Host-Only 网络搭建多机实验环境

## 练习

1. 完成安装后将系统信息（`systeminfo | findstr /B /C:"OS"`）截图存档
2. 把 IP 改错一个数字，观察 `Resolve-DnsName` 的失败表现，再改回来
3. 用 `sconfig`（Server Core 也有的配置菜单）完成改名和 IP 设置——为将来 Core 版热身

👉 下一章：[Active Directory 域服务](./02-ad-domain)
