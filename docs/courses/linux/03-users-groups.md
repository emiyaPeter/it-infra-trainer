---
title: Linux 用户与组管理 — 企业实战
description: 从 useradd 到 PAM/NSS，掌握企业级用户生命周期管理
difficulty: intermediate
estimatedTime: 120
prerequisites:
  - 01-command-line
  - 02-file-permissions
---

# Linux 用户与组管理

用户管理是 Linux 运维基本功。生产环境中你需要管理数百甚至数千用户。本节从命令到架构，覆盖真实工作场景。

## 1. 用户/组的关键文件

```bash
/etc/passwd     # 用户账户信息
/etc/shadow     # 加密密码（仅 root 可读）
/etc/group      # 组信息
/etc/gshadow    # 组密码
/etc/skel/      # 新用户主目录模板
/etc/default/useradd  # useradd 默认配置
/etc/login.defs       # 密码策略默认值
```

**passwd 格式：**
```
root:x:0:0:root:/root:/bin/bash
│    │ │ │ │    │     └── Shell
│    │ │ │ │    └── 主目录
│    │ │ │ └── GECOS (描述)
│    │ │ └── 主组 GID
│    │ └── UID
│    └── 密码占位符 (x=在shadow中)
└── 用户名
```

## 2. 用户管理命令 — 运维日常

```bash
# 创建用户
useradd -m -s /bin/bash -G sudo,devops alice
# -m: 创建主目录  -s: shell  -G: 附加组

# 批量创建（运维脚本）
while read name; do
  useradd -m -s /bin/bash "$name"
  echo "${name}:$(openssl rand -base64 12)" | chpasswd
  chage -d 0 "$name"    # 首次登录强制改密码
done < new-users.txt

# 修改用户
usermod -aG docker alice      # 加入 docker 组 (别忘了 -a!)
usermod -L alice              # 锁定账户
usermod -U alice              # 解锁
usermod -s /sbin/nologin bob  # 禁止登录

# 删除用户
userdel -r alice   # -r 同时删除主目录和邮件
```

## 3. 密码安全策略

```bash
# 查看密码过期信息
chage -l alice

# 设置密码策略
chage -M 90 alice     # 90 天后过期
chage -m 7 alice      # 最少 7 天后才能改
chage -W 7 alice      # 过期前 7 天警告
chage -E 2026-12-31 alice  # 账户到期日

# 全局密码策略 /etc/security/pwquality.conf
minlen = 12           # 最小长度
minclass = 3          # 至少 3 类字符
maxrepeat = 3         # 最多连续重复
```

## 4. 组管理

```bash
groupadd devops
groupadd -g 2000 dba    # 指定 GID

# 将用户加入组
usermod -aG devops,docker alice

# 临时切换组
newgrp devops     # 当前会话切换到 devops 主组

# 查看组成员
getent group devops
lid -g devops     # 列出组成员
```

**企业组策略示例：**

| 组名 | 用途 | 权限范围 |
|------|------|----------|
| sudo/wheel | 管理员 | 完全 root 权限 |
| devops | 运维工程师 | 服务启停、配置修改 |
| dba | 数据库管理 | /var/lib/mysql |
| developers | 开发人员 | /opt/app, 可重启开发服务 |
| readonly | 只读账号 | 仅查看日志和配置 |

## 5. Sudo 精细控制

```bash
# /etc/sudoers.d/devops — 运维组 sudo 权限（精确控制）

# 运维组可以重启服务和查看日志，但不能改密码
%devops ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart *, /usr/bin/systemctl stop *, /usr/bin/journalctl

# 指定用户可以无密码切换为 app 用户
alice ALL=(app) NOPASSWD: ALL

# 仅允许特定命令
bob ALL=(ALL) /usr/bin/docker ps, /usr/bin/docker logs *

# 禁止运行 shell
charlie ALL=(ALL) !/bin/bash, !/bin/sh, /usr/bin/*
```

```bash
# 查看用户的 sudo 权限
sudo -l -U alice
```

## 6. 集中认证（企业级）

小公司用本地账户，大公司用 LDAP/AD：

```bash
# SSSD 连接 AD 域（/etc/sssd/sssd.conf）
[sssd]
domains = company.com
services = nss, pam

[domain/company.com]
id_provider = ad
access_provider = ad
```

**排查命令：**
```bash
# 检查用户是否能通过 LDAP 认证
id alice               # 是否返回用户信息
getent passwd alice    # 是否在 NSS 中可见

# SSSD 日志
journalctl -u sssd -f
```

## 7. 安全审计

```bash
# 检查空密码账户
awk -F: '($2 == "" || $2 == "!") {print $1}' /etc/shadow

# 检查 UID 0 的账户（root 级别）
awk -F: '($3 == 0) {print $1}' /etc/passwd

# 检查可登录的非系统账户
awk -F: '($7 !~ /(nologin|false)/ && $3 >= 1000) {print $1, $7}' /etc/passwd

# 检查 sudo 组成员
getent group sudo wheel

# 最近登录记录
last -20
```

## 8. 自测

<details>
<summary>1. usermod -G 和 usermod -aG 的区别？</summary>

- `usermod -G docker alice`: **替换**附加组列表（移除之前的所有附加组）
- `usermod -aG docker alice`: **追加**到附加组列表（保留之前的组）

**运维教训：忘记 -a 是最常见的用户管理事故之一！**
</details>

<details>
<summary>2. 如何快速锁定一个被入侵的账户？</summary>

```bash
usermod -L compromised_user   # 锁定密码
pkill -KILL -u compromised_user  # 杀掉所有进程
# 审计该用户的 crontab/sudo 记录
```
</details>

<details>
<summary>3. 公司来了新同事，给他创建账户的完整步骤？</summary>

```bash
useradd -m -s /bin/bash -G developers xinren
echo "xinren:$(openssl rand -base64 12)" | chpasswd
chage -d 0 xinren          # 首次登录改密码
mkdir -p /home/xinren/.ssh
cp authorized_keys /home/xinren/.ssh/
chown -R xinren:xinren /home/xinren/.ssh
chmod 700 /home/xinren/.ssh
chmod 600 /home/xinren/.ssh/authorized_keys
```
</details>
