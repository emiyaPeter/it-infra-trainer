---
title: 网络安全基础 — 从攻防到防护
description: 掌握网络安全的攻击面识别、防火墙架构和入侵检测
difficulty: intermediate
estimatedTime: 120
prerequisites:
  - ../../networking/03-tcp-ip
  - ../01-security-concepts
---

# 网络安全基础

网络安全是 IT 基础设施的最后一道防线。本节从攻击者的角度理解网络，再回到运维的防御视角。

## 1. 网络攻击面识别

作为运维，你必须先知道"哪些东西暴露在攻击面上"。

```bash
# 扫描自身暴露的端口
ss -tlnp                       # 本机监听端口
nmap -sS localhost             # 端口扫描（需安装 nmap）

# 检查对外开放的服务
netstat -tlnp                  # 0.0.0.0 开头的 = 对外监听
ss -tlnp | grep '0.0.0.0'     # 所有对外端口

# 默认应该只开放必要的端口
# 生产服务器对外端口清单:
#  22/tcp  — SSH (限制来源 IP 或改用跳板机)
#  80/443  — Web (如果对外提供)
#  其他一切使用内网或 VPN 访问
```

## 2. 防火墙实战 — nftables

现代 Linux 推荐 nftables（替代 iptables）：

```bash
# nftables 基本结构
nft list ruleset

# 创建安全基线规则集
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0\; policy drop\; }
nft add chain inet filter forward { type filter hook forward priority 0\; policy drop\; }
nft add chain inet filter output { type filter hook output priority 0\; policy accept\; }

# 允许回环
nft add rule inet filter input iif lo accept

# 允许已建立的连接
nft add rule inet filter input ct state established,related accept

# 允许 SSH（限制来源 IP）
nft add rule inet filter input ip saddr 10.0.0.0/8 tcp dport 22 accept

# 允许 Web
nft add rule inet filter input tcp dport {80, 443} accept

# 限制 SSH 连接速率
nft add rule inet filter input tcp dport 22 ct state new limit rate 5/minute accept
nft add rule inet filter input tcp dport 22 ct state new drop
```

## 3. 端口安全实践

```bash
# 改变默认端口（降低自动化攻击风险）
# SSH → 2222
# 但更安全的是：保留 22 + fail2ban + 密钥认证

# 端口敲门 (Port Knocking) — 高级隐蔽
# 先访问一系列封闭端口，SSH 端口才临时开放
```

## 4. Fail2ban — 自动封禁暴力破解

```bash
# 安装
apt install fail2ban

# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
maxretry = 5         # 5 次失败后封禁
bantime = 3600       # 封禁 1 小时
findtime = 600       # 10 分钟内的失败计数

# 查看封禁状态
fail2ban-client status sshd
fail2ban-client get sshd banned

# 手动解封
fail2ban-client set sshd unbanip 10.0.0.5
```

## 5. 网络分段 — 企业架构

```
Internet
   │
   ▼
[边界防火墙]  ← 只开放 80/443
   │
   ▼
[DMZ 区]  ← Web 服务器、反向代理（可直接访问 internet）
   │
   ▼
[内部防火墙]  ← 规则严格
   │
   ├── [应用区]  ← App 服务器（不可直连外网）
   │
   ├── [数据区]  ← 数据库（最深，多重限制）
   │
   └── [管理区]  ← 运维跳板机（唯一能 SSH 的入口）
```

**每层防火墙规则收紧：**
- 边界：仅 80/443，限速防 DDoS
- DMZ→内部：仅特定端口（如 Web→App 的 8080）
- App→DB：仅 3306/5432
- 管理→所有：22，但通过跳板机

## 6. 日志与监控

```bash
# 实时监控可疑连接
watch -n 2 'ss -tan | grep -E "SYN|ESTAB" | wc -l'

# 检查异常连接来源
ss -tan | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn

# 审计 iptables/nftables 日志
journalctl -k | grep -i "DROP\|REJECT"
```

## 7. 自测

<details>
<summary>1. 生产服务器的防火墙原则是什么？</summary>

**最小权限原则**：默认拒绝所有入站流量，仅明确允许必要的端口。
- 对外：只开 80/443（Web）+ 22（SSH，且限制来源 IP）
- 对内：数据库端口不应对外
- SSH 不应对公网开放，走 VPN 或跳板机
</details>

<details>
<summary>2. 如何检测自己的服务器是否被扫描？</summary>

```bash
# 检查异常连接
ss -tan | grep SYN_RECV | wc -l   # 大量半开连接 = 可能被扫描
# 查看防火墙日志
journalctl -k | grep DROP | tail -20
# 使用 PSAD (Port Scan Attack Detector) 自动检测
```
</details>

<details>
<summary>3. DMZ 是什么？为什么需要它？</summary>

DMZ（Demilitarized Zone，非军事区）是内网和外网之间的隔离区。
- 对外提供服务的 Web 服务器放 DMZ
- 即使 Web 服务器被攻破，攻击者仍然无法直接访问数据库
- 内部防火墙确保 DMZ → 内网的流量经过严格过滤
</details>
