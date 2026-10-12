---
title: Windows Server 的 DNS、DHCP 与文件服务
description: 管理域集成 DNS、DHCP 作用域与授权，配置 SMB 文件共享与 NTFS 权限组合
difficulty: intermediate
estimatedTime: 110
prerequisites:
  - 02-ad-domain
  - 03-users-groups
---

# DNS、DHCP 与文件服务

域环境三大件：DNS（找得到）、DHCP（连得上）、文件共享（用得着）。本章在 DC01 上补齐它们，并把 AGDLP 落到真实共享上。

## 1. 域集成 DNS

第二章装 AD DS 时一并安装了 DNS 服务。它和普通 DNS 最大的区别：**域控制器注册信息自动写入 DNS**（SRV 记录），客户端由此"发现"域。

```powershell
# 核心验证：DC 的 SRV 记录（加域/登录的寻路基础）
Resolve-DnsName -Type SRV _ldap._tcp.corp.local
Resolve-DnsName -Type SRV _kerberos._tcp.corp.local

# 正反向区域
Get-DnsServerZone | Format-Table ZoneName,ZoneType,IsDsIntegrated
```

::: tip 理解"动态更新"
域内机器开机后会自动把自己的 A 记录注册进 DNS（动态更新）。好处是 IP 变了记录跟着变；代价是 DNS 里可能积累陈旧记录——生产中要配置"老化/清理"（默认 7 天无更新可清理）。
:::

转发器配置（域内解析不了的查外网）：

```powershell
Set-DnsServerForwarder -IPAddress 223.5.5.5,119.29.29.29
```

## 2. DHCP：IP 的自动分配

装角色并建作用域：

```powershell
Install-WindowsFeature DHCP -IncludeManagementTools

# 作用域：地址池 + 网关 + DNS
Add-DhcpServerInBox -PassThru    # 提示授权（域环境 DHCP 必须由域管理员授权，防私接）
Add-DhcpServerv4Scope -Name "办公网" `
  -StartRange 192.168.56.100 -EndRange 192.168.56.200 `
  -SubnetMask 255.255.255.0 -State Active
Set-DhcpServerv4OptionValue -ScopeId $(Get-DhcpServerv4Scope).ScopeId `
  -Router 192.168.56.1 -DnsServer 192.168.56.10 -DnsDomain corp.local
```

客户端验证（CLIENT01 改回 DHCP）：`ipconfig /renew` 后应拿到 100-200 段地址，DNS 自动指向 DC01。

**排障速查**：

- 拿不到 IP：`Get-DhcpServerv4Scope` 确认 State=Active；服务 `Get-Service DHCPServer`
- **169.254.x.x**：APIPA 地址 = 完全没联系上 DHCP（广播不通/服务没授权）
- 地址池耗尽：`Get-DhcpServerv4Scope | Get-DhcpServerv4Lease` 看租约清理

## 3. SMB 文件共享与 NTFS 权限

文件服务是企业内网的"刚需"。核心概念——**两层权限**：

```
共享权限（网络入口） ∩ NTFS 权限（文件系统） = 实际有效权限
```

生产实践：**共享权限给 Everyone 完全控制，靠 NTFS 做精细化**——只维护一套权限，清爽不乱。

```powershell
# 建目录与共享
New-Item -Path C:\Shares\IT资料 -ItemType Directory
New-SmbShare -Name "IT资料" -Path "C:\Shares\IT资料" `
  -FullAccess Everyone                    # 入口全开，精细控制交给 NTFS

# NTFS 权限：给第三章建好的本地域组授权（AGDLP 落地）
$path = "C:\Shares\IT资料"
$acl  = Get-Acl $path
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
  "CORP\文件服务器-读写-DL","Modify","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($rule)
Set-Acl $path $acl
```

验证矩阵（用不同账号从 CLIENT01 访问 `\\DC01\IT资料`）：

| 账号 | 所在组 | 预期 |
|------|--------|------|
| wangyunwei | IT部-全局 → 读写-DL | 能读写 |
| licaiwu | 无 | 拒绝访问 |

::: warning 权限是"叠加最宽"还是"显式拒绝优先"？
NTFS 权限累加取最宽，但 **Deny 优先于一切 Allow**。生产中慎用 Deny——优先用"不给"而不是"显式拒绝"。
:::

## 4. 日常运维三件套

```powershell
# 事件查看器（排障第一站：System / Directory Service / DNS Server 日志）
Get-EventLog -LogName System -Newest 20 -EntryType Error,Warning

# 共享清单与连接中的会话
Get-SmbShare; Get-SmbSession

# 备份 DNS 区域（区域存于 AD 数据库，随系统备份；独立区域用导出）
Export-DnsServerZone -Name corp.local -FileName backup-dns.txt
```

## 常见误区

1. **共享权限和 NTFS 都精细配**——两套权限打架没人看得懂；入口放开、NTFS 精细
2. **DHCP 未授权就排"故障"**——域环境 DHCP 不授权不会服务，先看授权
3. **拿 169.254 地址去查 DHCP 作用域配置**——那是连不上 DHCP，先查网络层

## 小结

- 域集成 DNS 靠 SRV 记录寻路，动态更新要配老化清理
- DHCP 必须授权；169.254 = 广播都没通
- 共享入口全开 + NTFS 精细化 + AGDLP 组授权

## 练习

1. 删掉 DHCP 作用域的 DNS 选项值，客户端 `ipconfig /renew` 后观察加域机器的域登录异常，再恢复
2. 新建一个"只读-DL"组并给共享 Read 权限，验证其成员只能读
3. 用 `Get-SmbSession | Disconnect-SmbSession` 踢掉一个会话，观察客户端表现

👉 阶段3 完成！回到 [学习路线图](/roadmap/) 进入阶段4，或做 [网络基础实验](/courses/networking/) 巩固
