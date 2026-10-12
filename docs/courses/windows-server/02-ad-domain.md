---
title: Active Directory 域服务 — 企业身份中枢
description: 理解域/林/域控制器概念，动手安装 AD DS 并搭建第一个域，把客户端加入域
difficulty: intermediate
estimatedTime: 120
prerequisites:
  - 01-installation
---

# Active Directory 域服务（AD DS）

Active Directory 是 Windows 企业环境的"身份中枢"：一个数据库，存着全公司的用户、电脑、权限。员工在任何一台域内电脑都能用同一账号登录——这就是域的力量。

## 1. 核心概念

| 概念 | 类比 | 说明 |
|------|------|------|
| **域（Domain）** | 一栋大楼 | 统一管理的边界，如 `corp.local` |
| **域控制器（DC）** | 大楼前台+档案室 | 运行 AD DS 的服务器，存着域数据库 |
| **林（Forest）** | 园区 | 一个或多个域的集合，共享全局配置 |
| **OU（组织单位）** | 部门 | 域内容器，用于委派和挂组策略 |
| **成员服务器** | 入驻公司 | 加入域的服务器，账号由域统一管 |

**关键理解**：
- AD 数据库（NTDS.dit）多台 DC 之间自动**复制**（默认 15 秒内增量同步），所以生产至少两台 DC
- **AD 高度依赖 DNS**——客户端找 DC 靠 DNS 的 SRV 记录，所以装 AD DS 时会一并装 DNS，这也是上一章 DNS 指向自己的原因
- 登录验证协议是 **Kerberos**（域内时间偏差超过 5 分钟即认证失败）

## 2. 安装 AD DS 并提升为域控制器

GUI 路径：服务器管理器 → 添加角色和功能 → 服务器角色勾选 **Active Directory 域服务** → 安装。

安装完只是"装了零件"，还要"提升"为 DC（PowerShell 一条龙，效果等同向导）：

```powershell
# 安装 AD DS 角色（含管理工具）
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools

# 提升为新城新林的域控制器
# -DomainName 用 .local 后缀是学习环境惯例；
#   生产环境微软现在推荐注册一个真实子域如 ad.你的公司.com
Install-ADDSForest `
  -DomainName "corp.local" `
  -DomainNetbiosName "CORP" `
  -SafeModeAdministratorPassword (ConvertTo-SecureString "P@ssw0rdSM!" -AsPlainText -Force) `
  -InstallDns:$true
```

::: warning DSRM 密码
`SafeModeAdministratorPassword` 是**目录服务还原模式**密码——AD 数据库出灾难时用它修复。请记牢，生产环境丢失它是一场灾难。
:::

重启完成后，验证：

```powershell
# 域信息
Get-ADDomain
# DC 是否就绪（命令在管理员 PowerShell 均可用）
Get-Service ADWS,KDC,DNS
# DNS 里的 SRV 记录（客户端就靠它们找到 DC）
Resolve-DnsName -Type SRV _ldap._tcp.corp.local
```

## 3. 把客户端加入域

先按第一章的方法再装一台 **CLIENT01**（Windows 11 评估版），IP 设为同网段（如 192.168.56.20），DNS **必须指向 DC01（192.168.56.10）**。

```powershell
# CLIENT01 上（管理员 PowerShell）
# 改名并一步加域，CORP\Administrator 是域管理员账号
Add-Computer -DomainName "corp.local" -NewName "CLIENT01" -Restart
```

弹出凭据框输入 `CORP\Administrator` 和密码，重启后：
- 登录界面可选 **CORP** 域账号
- 服务器管理器里能看到域内机器（DC01 上"所有服务器"）

**加域排障速查**：

| 报错 | 原因 | 解决 |
|------|------|------|
| 找不到域 corp.local | 客户端 DNS 没指向 DC | 网卡 DNS 改 192.168.56.10 |
| 时钟偏差 | 两台 VM 时间不同步 | 对齐时间（或重启 VM） |
| 账号或密码错误 | 输的是本地账号 | 用 `CORP\` 前缀 |

## 4. 生产视角：为什么要懂 AD？

- 90% 的企业内网攻击路径都经过 AD（Kerberoasting、黄金票据等攻击都针对它）——运维既要用它防（权限最小化），也要懂它的安全模型
- Exchange、文件服务器、SQL Server 的权限体系都挂在 AD 上
- 即使公司"上云"，大量场景仍是 **AD + Azure AD（Entra ID）混合**

## 常见误区

1. **把域管理员账号当日常账号用**——生产大忌，日常用普通域账号，管理时再用管理员
2. **单 DC 就上生产**——DC 一挂全公司登录瘫痪，至少两台
3. **域和_workgroup混为一谈**——工作组是"各自管各自"，域是"集中管"，完全不同的模型

## 小结

- AD = 身份数据库 + Kerberos 认证 + 依赖 DNS
- `Install-ADDSForest` 一步建域，客户端 DNS 指向 DC 后 `Add-Computer` 加域
- DSRM 密码务必保管

## 练习

1. 故意把 CLIENT01 的 DNS 改成 8.8.8.8，再尝试加域，观察并记录报错，然后修复
2. 在 DC01 上用 `Get-ADComputer -Filter *` 列出域内计算机
3. 思考：为什么"加域失败"的排查第一步永远是查 DNS？

👉 下一章：[用户与组管理](./03-users-groups)
