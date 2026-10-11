---
title: DNS 域名系统 — 企业级实战
description: 从工作原理到生产部署，全面掌握 DNS 的配置、排查与安全加固
difficulty: intermediate
estimatedTime: 120
prerequisites:
  - 03-tcp-ip
  - 04-subnetting
---

# DNS 域名系统 — 企业级实战

DNS（Domain Name System）是整个互联网的"电话本"。本节不仅讲原理，更聚焦实际运维中最常见的 DNS 场景。

## 1. DNS 解决什么问题

```
你不必记忆 142.250.80.46
你只需要输入 www.google.com
DNS 帮你完成域名 → IP 的翻译
```

**没有 DNS 的世界：**
- 你需要记住所有网站的 IP 地址
- 服务迁移 IP 后所有人失联
- 负载均衡无法实现

## 2. DNS 解析全流程（一次完整的查询）

```
用户输入 www.example.com
    │
    ▼
┌──────────────────┐
│  1. 浏览器缓存     │  Chrome 内置 DNS 缓存 (~1分钟)
└──────┬───────────┘
       │ 未命中
       ▼
┌──────────────────┐
│  2. OS 缓存       │  Windows: ipconfig /displaydns
│     (stub resolver)│  Linux: systemd-resolved / nscd
└──────┬───────────┘
       │ 未命中
       ▼
┌──────────────────┐
│  3. 本地 DNS 服务器 │  路由器 / 公司 DNS / 114.114.114.114
│     (递归解析器)    │  帮你完成后续所有查询
└──────┬───────────┘
       │ 从根开始迭代查询
       ▼
┌──────────────────┐
│  4. 根域名服务器   │  返回 .com 的 NS 记录
│     (13组, 任播)   │
└──────┬───────────┘
       ▼
┌──────────────────┐
│  5. .com TLD 服务器│  返回 example.com 的 NS 记录
└──────┬───────────┘
       ▼
┌──────────────────┐
│  6. 权威 DNS 服务器 │  返回 A 记录 → 93.184.216.34
└──────────────────┘
```

**实战命令：**

```bash
# 从根开始逐级查询（完整递归过程）
dig +trace www.example.com

# 指定 DNS 服务器查询
dig @8.8.8.8 www.example.com

# 查询不同类型记录
dig example.com A        # IPv4
dig example.com AAAA     # IPv6
dig example.com MX       # 邮件服务器
dig example.com NS       # 权威 DNS
dig example.com TXT      # SPF/DKIM

# 反向解析 (IP → 域名)
dig -x 8.8.8.8

# 简短输出
dig +short example.com
```

## 3. DNS 记录类型 — 必须掌握的 10 种

| 类型 | 用途 | 示例 |
|------|------|------|
| **A** | 域名→IPv4 | `www A 93.184.216.34` |
| **AAAA** | 域名→IPv6 | `www AAAA 2606:2800:220::` |
| **CNAME** | 别名 | `blog CNAME www.example.com` |
| **MX** | 邮件服务器+优先级 | `@ MX 10 mail.example.com` |
| **NS** | 权威 DNS 服务器 | `@ NS ns1.example.com` |
| **TXT** | 文本 (SPF/DKIM) | `@ TXT "v=spf1 mx -all"` |
| **SOA** | 权威区域起始 | 序列号、刷新间隔等 |
| **PTR** | IP→域名 (反向) | `34 PTR www.example.com` |
| **SRV** | 服务定位 | `_ldap._tcp SRV 0 5 389 dc1` |
| **CAA** | 证书颁发授权 | `@ CAA 0 issue "letsencrypt.org"` |

## 4. 企业 DNS 架构

```
                          Internet
                             │
                    ┌────────┴────────┐
                    │  外部 DNS (权威)  │  ns1/ns2.company.com
                    │  发布公网记录     │
                    └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │  内部 DNS (递归)  │  为内网用户解析
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ 办公网 DNS │  │ DMZ DNS  │  │ 开发 DNS  │
        │ 10.1.x.x  │  │ 10.2.x.x │  │ 10.3.x.x │
        └──────────┘  └──────────┘  └──────────┘
```

## 5. DNS 故障排查 — 运维日常

### 排查方法论

```
用户报告 "网站打不开"
    │
    ├── 1. ping 8.8.8.8  → 通？那是 DNS 问题
    │      ping baidu.com → 通？那只是特定网站
    │
    ├── 2. 检查本地 DNS: cat /etc/resolv.conf
    │
    ├── 3. 测试解析: nslookup / dig
    │
    ├── 4. 换 DNS 测试: dig @8.8.8.8 domain
    │
    └── 5. 检查权威: dig @ns1.example.com domain
```

### 常见故障

| 故障 | 含义 | 解决方案 |
|------|------|----------|
| SERVFAIL | DNS 服务器无法得到答案 | 检查权威 DNS 配置 |
| NXDOMAIN | 域名不存在 | 检查记录是否被误删 |
| 解析超时 | DNS 服务器不可达 | 检查防火墙 53 端口 |
| 解析结果错误 | DNS 缓存污染 | 清除缓存 |
| 内外网不一致 | Split DNS 配置错误 | 修正视图配置 |

### 清除 DNS 缓存

```bash
# Linux — systemd-resolved
systemd-resolve --flush-caches

# Linux — nscd
sudo systemctl restart nscd

# Windows
ipconfig /flushdns
ipconfig /displaydns   # 查看缓存
```

## 6. DNS 安全

| 攻击类型 | 原理 | 防护 |
|----------|------|------|
| DNS 劫持 | 篡改解析结果 | DNSSEC |
| DNS 缓存投毒 | 注入虚假记录 | 随机源端口 + DNSSEC |
| DNS 放大攻击 | 利用 DNS 放大 DDoS | 限制递归来源 |
| DNS 隧道 | DNS 协议传输非 DNS 数据 | 流量分析 |
| 域名劫持 | 盗取注册商账户 | 2FA + 注册商锁定 |

```bash
# 验证 DNSSEC
dig +dnssec www.cloudflare.com
```

## 7. 自测

<details>
<summary>1. 用户说"网页打不开"，怎么判断是 DNS 还是网络问题？</summary>

先 ping 8.8.8.8（IP）和 www.baidu.com（域名）：
- IP 通、域名不通 → DNS 问题
- IP 不通 → 网络/防火墙问题
- 都通但某网站打不开 → 该网站问题
</details>

<details>
<summary>2. CNAME 和 A 记录有什么区别？</summary>

- A：域名直接→IP
- CNAME：域名→另一域名（间接解析）
- 注意：**根域名不可用 CNAME**（违反 RFC），应使用 A 或 ALIAS
</details>

<details>
<summary>3. 公司内网用户无法访问内部系统但能上网，最可能什么原因？</summary>

1. 内网 DNS 缺少该系统的 A 记录
2. DNS 条件转发配置错误
3. 用户本机 hosts 文件覆盖
4. DNS 主从同步失败（序列号未更新）
</details>
