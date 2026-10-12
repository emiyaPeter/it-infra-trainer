---
title: WireGuard 组网 — 十分钟建一条现代 VPN
description: 理解 VPN 的场景与 WireGuard 的设计，实操点对点隧道与 hub 拓扑，掌握密钥与防火墙配套
difficulty: advanced
estimatedTime: 80
prerequisites:
  - 02-firewall
---

# WireGuard 组网

VPN 的本质：**在不安全的公网上，用加密隧道把两台机器"拉进同一个内网"**。场景：安全访问家里/公司内网、异地机器互联、给分散服务组私网。WireGuard 以约四千行内核级代码实现了过去 OpenVPN 数万行的功能——快、简单、现代。

## 1. 模型：接口 + 密钥对 + 允许网段

WireGuard 的全部概念只有三个：

```
① 每台机器一个接口 wg0（虚拟网卡，有自己的隧道 IP）
② 每台机器一对密钥（私钥保密 + 公钥给对方）
③ Peer 配置 = （对方的公钥，对方的隧道 IP，对方端点地址）
```

一个包从 wg0 出去时：按 Peer 的"允许网段"找到对方 → 用对方公钥加密 → 发往对方端点。没有证书体系、没有握手配置文件——**公钥即身份**。

## 2. 实操：两台虚拟机的点对点隧道

沿用前两章的 VM1/VM2（能互相 ping 通即可）：

```bash
# 两台都装
sudo apt install wireguard

# ① 各自生成密钥对
wg genkey | tee private.key | wg pubkey > public.key
chmod 600 private.key

# ② VM1 配置 /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <VM1私钥>
Address    = 10.9.0.1/24          # 隧道内的身份 IP
ListenPort = 51820

[Peer]                             # 对端 = VM2
PublicKey  = <VM2公钥>
AllowedIPs = 10.9.0.2/32           # 发往谁的流量走隧道

# ③ VM2 配置镜像对称
[Interface]
PrivateKey = <VM2私钥>
Address    = 10.9.0.2/24

[Peer]
PublicKey  = <VM1公钥>
Endpoint   = 192.168.100.1:51820   # VM1 的可达地址（VM1 有公网口时填公网）
AllowedIPs = 10.9.0.1/32

# ④ 两端拉起并放行 UDP 51820（有防火墙时）
sudo wg-quick up wg0
sudo iptables -A INPUT -p udp --dport 51820 -j ACCEPT
```

验证：

```bash
ping 10.9.0.2                      # 走隧道的互 ping
sudo wg                            # 状态：latest handshake 有时间 = 隧道活了
sudo tcpdump -i wg0               # 可见加密封装后的包体
```

`wg` 的 handshake 字段是"隧道是否健康"的金指标——超过 2-3 分钟没有新握手即异常。

## 3. AllowedIPs：既是路由又是准入（最关键的认知）

`AllowedIPs` 同时干两件事：

- **本机路由**：目的地址落在 AllowedIPs 内 → 从隧道发（相当于自动加路由）
- **对端准入**：对方从隧道发来的包，源地址必须匹配它声明的 AllowedIPs，否则丢弃（防伪装）

所以网段写法的语义差别要敏感：

```
10.9.0.2/32   → 只把"发往这一个 IP"的流量给对方（点对点）
10.9.0.0/24   → 整个网段都走这（组网）
0.0.0.0/0     → 全部流量走隧道（"翻回家里上网"，配合路由器端 NAT）
```

## 4. 常见拓扑：星型（hub）

```
        中心节点 hub（有公网 IP，如云服务器）
       /   AllowedIPs = 10.9.0.2/32, 10.9.0.3/32
  节点A —— AllowedIPs = 10.9.0.1/32, 10.9.0.0/24 走 hub
  节点B —— 同 A
```

要点：hub 端逐 Peer 精确写 /32；分支节点写 hub 的网段或 0.0.0.0/0；分支间流量经 hub 转发（hub 需开 ip_forward + 防火墙放行 wg0 转发）——你在第 1、2 章学的路由与防火墙在这里全部派上用场。

## 常见误区

1. **AllowedIPs 两端不对称排查半天** —— 记住双重语义：A 的 peer 段决定"A 发什么给 B"，B 侧的准入校验又要求 A 发来的源地址匹配 B 配置里 A 的 AllowedIPs；互 ping 不通先两边 `wg` 核对四组网段
2. **Endpoint 与隧道 IP 混淆** —— Endpoint 是"现实世界怎么找到你"（公网/内网地址），隧道 IP 是"虚拟世界里的门牌"；两套地址互不相干
3. **私钥进 git** —— 又是它：`.conf` 里含私钥，权限 600、绝不入库（[AI 课程红线](../ai-programming/05-ai-safety-quality)第三次出场）

## 小结

- 三概念：接口/密钥对/Peer；公钥即身份
- 两步建隧道：配置互指 + wg-quick up；`wg` 的 handshake 是健康金标
- AllowedIPs=路由+准入双语义；星型拓扑复用路由与防火墙知识

## 练习

1. 完成点对点隧道，从 VM1 ssh 到 10.9.0.2 验证"像同内网一样用"
2. 故意把一侧 AllowedIPs 写错，观察 ping 失败与 `wg` 的表现，再修复
3. 挑战：加第三台节点组星型，分支 A ping 通分支 B（提示：hub 开转发）

👉 下一章：[tcpdump 抓包分析](./04-packet-analysis)
