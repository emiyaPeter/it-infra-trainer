---
title: 系统安全加固 — 从 CIS Benchmark 到实战
description: Linux 安全加固的完整清单，覆盖 SSH、内核、审计、文件完整性
difficulty: intermediate
estimatedTime: 120
prerequisites:
  - ../../linux/01-command-line
  - ../../linux/03-users-groups
  - ../01-security-concepts
---

# 系统安全加固

安全加固（Hardening）是运维的必修课。本节覆盖 Linux 系统安全加固的 80% 关键点，参照 CIS Benchmark 标准。

## 1. SSH 安全加固

```bash
# /etc/ssh/sshd_config — 安全基线配置

# 禁止 root 直接登录
PermitRootLogin no

# 仅允许密钥认证
PasswordAuthentication no
PubkeyAuthentication yes

# 限制可登录用户
AllowUsers alice bob
# 或禁止特定用户
DenyUsers root git

# 修改默认端口（降低噪音）
Port 2222

# 限制登录尝试
MaxAuthTries 3
LoginGraceTime 30

# 断开空闲会话
ClientAliveInterval 300
ClientAliveCountMax 0

# 禁用不安全的旧协议
Protocol 2
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512
```

**应用后验证：**
```bash
sshd -t                    # 检查配置语法
systemctl reload sshd      # 重载（不关闭已有连接）
# ⚠️ 另开一个终端测试能否登录，不要关闭当前连接！
```

## 2. 账户安全

```bash
# 锁定不需要登录的系统账户
for user in $(awk -F: '$3 < 1000 {print $1}' /etc/passwd); do
  usermod -s /sbin/nologin "$user" 2>/dev/null
done

# 检查空密码账户
awk -F: '$2 == "" {print $1}' /etc/shadow

# 强制 sudo 使用 TTY（/etc/sudoers）
Defaults requiretty
Defaults !visiblepw     # 不回显密码

# 限制 su 使用（仅 wheel 组）
# /etc/pam.d/su
auth required pam_wheel.so use_uid
```

## 3. 内核安全参数

```bash
# /etc/sysctl.d/99-security.conf

# 防 IP 欺骗
net.ipv4.conf.all.rp_filter = 1

# 忽略 ICMP 广播
net.ipv4.icmp_echo_ignore_broadcasts = 1

# 忽略重定向（防中间人攻击）
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# SYN Cookie 防护（防 SYN Flood）
net.ipv4.tcp_syncookies = 1

# 记录 Martian 包（伪造源地址的包）
net.ipv4.conf.all.log_martians = 1

# 禁用 IP 源路由
net.ipv4.conf.all.accept_source_route = 0

# 内核指针隐藏（防信息泄露）
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1

sysctl -p
```

## 4. 文件完整性监控 — AIDE

```bash
apt install aide

# 初始化基线数据库
aideinit
mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# 日常检查（建议 cron 每天跑）
aide -c /etc/aide/aide.conf --check

# 更新基线（系统合法变更后）
aide -c /etc/aide/aide.conf --update
```

## 5. 审计日志 — auditd

```bash
apt install auditd

# 审计关键文件变更
auditctl -w /etc/passwd -p wa -k passwd_changes
auditctl -w /etc/shadow -p wa -k shadow_changes
auditctl -w /etc/sudoers -p wa -k sudoers_changes
auditctl -w /etc/ssh/sshd_config -p wa -k sshd_config

# 审计关键命令执行
auditctl -w /usr/bin/chmod -p x -k cmd_chmod
auditctl -w /usr/bin/chown -p x -k cmd_chown

# 查看审计日志
ausearch -k passwd_changes --start recent
aureport --summary          # 审计摘要
```

## 6. 安全更新策略

```bash
# 自动安装安全更新（仅安全更新，不更新其他）
apt install unattended-upgrades

# /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";  # 生产环境不自动重启

# 查看安全更新状态
apt list --upgradable | grep -i security
unattended-upgrades --dry-run
```

## 7. 安全加固检查清单

| # | 检查项 | 命令 |
|---|--------|------|
| 1 | 禁用 root SSH 登录 | `grep PermitRootLogin /etc/ssh/sshd_config` |
| 2 | 密钥认证优先 | `grep PasswordAuthentication /etc/ssh/sshd_config` |
| 3 | 防火墙启用 | `nft list ruleset` 或 `iptables -L` |
| 4 | Fail2ban 运行 | `fail2ban-client status` |
| 5 | 自动安全更新 | `systemctl status unattended-upgrades` |
| 6 | 审计日志记录 | `systemctl status auditd` |
| 7 | 无空密码账户 | `awk -F: '$2=="" {print $1}' /etc/shadow` |
| 8 | sudo 日志 | `grep use_pty /etc/sudoers` |
| 9 | 无例外 SUID | `find / -perm -4000 -type f 2>/dev/null` |
| 10 | 内核参数安全 | `sysctl net.ipv4.tcp_syncookies` |

## 8. 自测

<details>
<summary>1. 为什么禁止 root SSH 登录？</summary>

1. **每个攻击者都知道有 root 这个用户**，减少了暴力破解需要猜测的变量
2. 所有操作通过普通用户 + sudo 完成，形成审计链（谁在什么时间做了什么）
3. 如果必须 root 身份操作，先用普通用户登录再 `sudo -i`，留下记录
</details>

<details>
<summary>2. 修改了 SSH 配置却把自己锁在外面了怎么办？</summary>

**预防：** 修改后保持当前连接不断开，新开另一个终端测试登录。
**恢复：** 通过 VNC/IPMI/云厂商控制台（带外管理）登录修复。
**自动化：** `sshd -t && systemctl reload sshd` 或使用 `at` 命令计划回滚。
</details>

<details>
<summary>3. 生产环境需要定期做安全加固检查吗？</summary>

是的，至少每季度一次：
1. 跑一遍 CIS Benchmark 或使用 Lynis 自动审计
2. 更新安全补丁
3. 审查新增的开放端口和 SUID 文件
4. 审查 sudo 权限变更
5. 检查是否有异常账户或 SSH key
</details>
