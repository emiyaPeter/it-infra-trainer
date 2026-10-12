---
title: Linux 防火墙 — netfilter 与 nftables
description: 理解 netfilter 五钩与表/链结构，掌握 iptables/nftables 规则读写与常用防护集，完成 NAT 上网
difficulty: advanced
estimatedTime: 90
prerequisites:
  - 01-routing-vlan
---

# Linux 防火墙

防火墙的本质：内核在网络包的行进路线上设**检查站**（钩子），按你写的规则放行或丢弃。现代工具是 nftables，运维世界里 iptables 仍随处可见——本章两者都讲，语法互通。

## 1. 心智模型：五钩、四表、链

一个包的旅程与检查站：

```
入站包 → [PREROUTING] → 路由判断 ─ 给我的 ─→ [INPUT] → 本机进程
                              └─ 转发的 ─→ [FORWARD] → [POSTROUTING] → 出去
本机发包 → [OUTPUT] → [POSTROUTING] → 网卡
```

| 表 | 干什么 | 常用链 |
|----|--------|--------|
| **filter** | 放行/丢弃（传统防火墙） | INPUT / FORWARD / OUTPUT |
| **nat** | 地址改写（共享上网、端口发布） | PREROUTING / POSTROUTING |
| mangle | 改包标记（QoS 等，进阶） | 各链 |

**判断流程**：包每到一站，从上到下扫该链的规则，命中即执行（ACCEPT/DROP），全不中走默认策略（`iptables -L` 末尾的 policy）。

## 2. 读规则：iptables 语法解剖

```bash
sudo iptables -L INPUT -n -v --line-numbers
# num   pkts  target  prot  opt  source     destination
# 1     1523  ACCEPT  tcp   --   0.0.0.0/0  0.0.0.0/0  tcp dpt:22
# 2        0  DROP    all   --   10.0.0.0/8 0.0.0.0/0
```

写成命令的通式：`iptables -A 链 -匹配条件 -j 动作`：

```bash
# 放行 SSH（先放行再改默认策略——锁门之前先配钥匙，SSH 加固同款教训）
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
# 已建立连接的回包直接放（state 模块是 filter 的灵魂）
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
# 本机回环放行
sudo iptables -A INPUT -i lo -j ACCEPT
# 其余入站丢弃 + 默认策略
sudo iptables -P INPUT DROP
```

**state 匹配是关键认知**：防火墙不是"逐包失忆"，而是记得"这是我自己发起的连接的回包"——所以只需开极少的进门，回包自动放行。

## 3. NAT：补完上一章的作业

hostA（192.168.100.2）要经 router 上网，需要把内网源地址改写为 router 的公网口地址：

```bash
# 伪装（MASQUERADE）：拨号/动态 IP 场景的源地址改写
sudo iptables -t nat -A POSTROUTING -s 192.168.100.0/24 -o 桥接口名 -j MASQUERADE
# 回到 hostA：ping 8.8.8.8 通了 —— 上一章拓扑至此完整
```

反向场景（外网访问内网服务）是 DNAT/端口发布，思路相同方向相反，用到再查。

## 4. nftables：下一代写法（同一模型）

```bash
sudo nft add table inet filter
sudo nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }
sudo nft add rule inet filter input tcp dport 22 accept
sudo nft add rule inet filter input ct state established,related accept
sudo nft list ruleset                 # 看全部
```

iptables 语法可平滑迁移（nft 兼容层 `iptables-nft`），日常用 firewalld/ufw 的读者注意：**它们都是 nftables 的前端**——理解了本章的钩子/链/规则模型，所有前端工具都不再是黑盒。

## 5. 一套最小防护集（可直接抄）

```bash
# INPUT 默认丢弃前，确保三件事：SSH、回包、lo（上文三条）
# FORWARD 场景（当路由器）：只放内网出去的转发
sudo iptables -A FORWARD -s 192.168.100.0/24 -j ACCEPT
sudo iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -P FORWARD DROP
# 持久化（重启不丢）
sudo apt install iptables-persistent && sudo netfilter-persistent save
```

## 常见误区

1. **规则顺序不当** —— 规则是从上到下首个命中即止；把 DROP 写在 ACCEPT 上面，后面的放行永远不生效（`--line-numbers` 配 `-I 链 序号` 插入）
2. **改远程机防火墙不留后门** —— 永远先加"放行我的 SSH"再收紧默认策略；和 SSH 加固一样的保命顺序
3. **以为 ufw/firewalrd 是独立防火墙** —— 它们只是 nft/iptables 的规则生成器；底层模型就是本章这一套

## 小结

- 五钩四表一默认策略；命中即止、末尾兜底
- state 匹配让"少开门+自动回包"成立；NAT 补完路由作业
- iptables 与 nft 同模型不同语法；ufw/firewalld 都是前端

## 练习

1. 在 router 上完成最小防护集，hostA 验证：能上网、能 SSH router、其他端口被拒
2. 故意把 DROP 放在 SSH 放行之上，体验"锁死自己"，用 VirtualBox 控制台救回
3. `nft list ruleset` 对照 iptables 规则，找到一一对应的影子

👉 下一章：[WireGuard 组网](./03-wireguard)
