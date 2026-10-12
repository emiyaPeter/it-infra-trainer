---
title: AD 用户与组管理
description: 掌握 AD 用户/组/OU 的创建与管理，理解组作用域和 AGDLP 授权原则，用 PowerShell 批量操作
difficulty: intermediate
estimatedTime: 100
prerequisites:
  - 02-ad-domain
---

# AD 用户与组管理

域建好了，接下来往里"装人"。本章覆盖：用户创建、组类型与作用域、OU 组织、批量管理。

## 1. 三种对象：用户 / 组 / OU

- **用户（User）**：登录主体，员工身份
- **组（Group）**：权限的载体——**授权永远给组，不给人**（一人离职只需移组，不用改几百处资源权限）
- **OU（Organizational Unit）**：域内的"文件夹"，装用户/计算机/组，用来**挂组策略**和**委派管理**

GUI 管理入口：`dsa.msc`（Active Directory 用户和计算机）。

## 2. 创建 OU 与用户

```powershell
# 建 OU（按部门组织是通用做法）
New-ADOrganizationalUnit -Name "IT部" -Path "DC=corp,DC=local"
New-ADOrganizationalUnit -Name "财务部" -Path "DC=corp,DC=local"

# 建用户（放进 IT部）
New-ADUser -Name "王运维" `
  -SamAccountName "wangyunwei" `
  -UserPrincipalName "wangyunwei@corp.local" `
  -Path "OU=IT部,DC=corp,DC=local" `
  -AccountPassword (ConvertTo-SecureString "Init@12345" -AsPlainText -Force) `
  -Enabled $true `
  -ChangePasswordAtLogon $true      # 首次登录强制改密
```

::: tip UPN vs SamAccountName
登录名有两个：`corp\wangyunwei`（旧式）和 `wangyunwei@corp.local`（UPN，形如邮箱）。日常用 UPN 更顺手。
:::

## 3. 组：类型 × 作用域

这是 AD 学习中最绕也最重要的知识点：

| 维度 | 取值 | 含义 |
|------|------|------|
| **类型** | 安全组 / 通讯组 | 安全组能授权；通讯组只用于邮件列表 |
| **作用域** | 本地域 / 全局 / 通用 | 决定组能"装谁"和"被谁用" |

作用域速记：

- **全局组（G）**：装**本域**用户，能被任何域引用 → 按**部门**建（如"IT部-全局"）
- **本地域组（DL）**：能装**任何域**的组和用户，但只在**本域**有效 → 按**资源**建（如"文件服务器-读写"）
- **通用组（U）**：多域林中跨域用，成员变化会触发全林复制，**少用**

### AGDLP 授权原则（生产标准做法）

```
用户 (A) → 加入全局组 (G) → 全局组加入本地域组 (DL) → 给本地域组授权 (P)
```

举例：王运维 → "IT部-全局" → "文件服务器-读写-DL" → 该 DL 对共享文件夹有修改权限。

好处：换人只动第一层，资源权限永不因人员变动而改。

```powershell
New-ADGroup -Name "IT部-全局" -GroupScope Global -GroupCategory Security -Path "OU=IT部,DC=corp,DC=local"
New-ADGroup -Name "文件服务器-读写-DL" -GroupScope DomainLocal -GroupCategory Security

# 王运维入全局组
Add-ADGroupMember -Identity "IT部-全局" -Members "wangyunwei"
# 全局组入本地域组
Add-ADGroupMember -Identity "文件服务器-读写-DL" -Members "IT部-全局"
```

## 4. 批量操作（运维的真正价值）

从 CSV 批量建用户是面试和实战双高频场景：

```powershell
# users.csv 内容：name,sam,dept
# 王运维,wangyunwei,IT部
# 李财务,licaiwu,财务部

Import-Csv .\users.csv | ForEach-Object {
  New-ADUser -Name $_.name -SamAccountName $_.sam `
    -UserPrincipalName "$($_.sam)@corp.local" `
    -Path "OU=$($_.dept),DC=corp,DC=local" `
    -AccountPassword (ConvertTo-SecureString "Init@12345" -AsPlainText -Force) `
    -Enabled $true -ChangePasswordAtLogon $true
}
Write-Host "批量创建完成" -ForegroundColor Green
```

其他高频命令：

```powershell
Get-ADUser -Filter * -SearchBase "OU=IT部,DC=corp,DC=local"   # 列 OU 内用户
Search-ADAccount -LockedOut | Unlock-ADAccount                # 解锁被锁账号
Disable-ADAccount -Identity "licaiwu"                          # 离职禁用（别急着删，先禁用保审计）
```

## 5. 离职处理规范（生产经验）

1. `Disable-ADAccount` 立即禁用（保留对象做审计）
2. 从所有全局组移除
3. 30/90 天后再删除（按公司制度）

## 常见误区

1. **直接给用户授资源权限**——人员一换就得翻遍所有资源，永远走 AGDLP
2. **人人塞进 Domain Admins**——域管理员组人数应个位数；日常管理用"账户操作员""服务器管理员"等分工角色
3. **删除离职账号太随意**——先禁用后删除，保住 SID 关联的审计记录

## 小结

- OU 管组织 + 挂策略；组管授权；**授权给组不给人是铁律**
- AGDLP：用户→全局组→本地域组→授权
- 批量操作是 PowerShell 的主战场

## 练习

1. 建 CSV 批量创建 5 个用户并分到两个部门 OU
2. 用 CLIENT01 以王运维的域账号登录一次（验证域账号漫游）
3. 把某账号密码连错 5 次，用 `Search-ADAccount -LockedOut` 找到并解锁

👉 下一章：[组策略 GPO](./04-group-policy)
