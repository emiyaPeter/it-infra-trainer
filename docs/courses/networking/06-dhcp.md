---
title: DHCP 动态主机配置 — 运维实战
description: 从原理到企业部署，掌握 DHCP 配置、故障排查与安全防护
difficulty: intermediate
estimatedTime: 90
prerequisites:
  - 03-tcp-ip
  - 04-subnetting
---

# DHCP 动态主机配置协议

DHCP 是网络运维的基石。设备插上网线就能自动获取 IP，全靠 DHCP。本节聚焦实际运维场景。

## 1. DHCP 四步握手 (DORA)

```
Client (0.0.0.0:68)                  Server (192.168.1.1:67)
  │                                        │
  │ ──── DHCPDISCOVER (广播) ──────────→  │  ① Discover: "谁给我 IP？"
  │                                        │
  │ ←─── DHCPOFFER (单播/广播) ─────────  │  ② Offer: "你可以用 192.168.1.100"
  │                                        │     含 IP、掩码、网关、DNS、租期
  │                                        │
  │ ──── DHCPREQUEST (广播) ───────────→  │  ③ Request: "我确定要这个 IP"
  │                                        │
  │ ←─── DHCPACK (单播/广播) ───────────  │  ④ Ack: "确认，租约生效"
  │                                        │
  ▼                                        ▼
 配置完成                                 记录租约
```

## 2. Linux DHCP 服务器配置 (isc-dhcp-server)

```bash
# /etc/dhcp/dhcpd.conf — 企业典型配置

default-lease-time 86400;        # 默认租期 24h
max-lease-time 172800;           # 最大 48h
authoritative;                   # 权威服务器

# 办公网 VLAN 10
subnet 10.1.0.0 netmask 255.255.255.0 {
  range 10.1.0.100 10.1.0.200;
  option routers 10.1.0.1;
  option domain-name-servers 10.1.0.10, 10.1.0.11;
  option domain-name "company.local";
}

# 访客网 — 短租期 + 公网 DNS
subnet 10.2.0.0 netmask 255.255.255.0 {
  range 10.2.0.100 10.2.0.250;
  option routers 10.2.0.1;
  option domain-name-servers 8.8.8.8, 1.1.1.1;
  default-lease-time 3600;      # 1 小时
}

# MAC 绑定固定 IP（打印机、门禁）
host printer-3f {
  hardware ethernet 00:1A:2B:3C:4D:5E;
  fixed-address 10.1.0.50;
}
```

## 3. DHCP 中继（多 VLAN 场景）

```bash
# 三层交换机 — 每个 VLAN 接口配中继地址
interface Vlan10
  ip helper-address 192.168.10.10   # DHCP 服务器 IP

interface Vlan20
  ip helper-address 192.168.10.10
```

## 4. 故障排查

```bash
# 客户端
sudo dhclient -v eth0              # Linux 手动请求
ipconfig /release && ipconfig /renew  # Windows

# 服务器
cat /var/lib/dhcp/dhcpd.leases     # 查看所有租约
tail -f /var/log/syslog | grep dhcpd
dhcpd -t -cf /etc/dhcp/dhcpd.conf  # 检查配置语法
```

### 常见故障

| 问题 | 原因 | 解决 |
|------|------|------|
| 获取 169.254.x.x (APIPA) | DHCP 不可达 | 检查网络/DHCP服务/中继 |
| 获取 IP 但无法上网 | 网关/DNS 错误 | 检查 option routers/dns |
| 地址池耗尽 | 可用 IP 用完 | 扩大池/缩短租期/拆分VLAN |
| IP 冲突 | 手动设置相同 IP | 启用冲突检测 |
| 某 VLAN 无法获取 | 中继未配或 ACL | 检查中继和防火墙 |

## 5. DHCP 安全

```bash
# 交换机 DHCP Snooping（防伪造 DHCP 服务器）
ip dhcp snooping
ip dhcp snooping vlan 10,20
interface GigabitEthernet0/1      # 上联口（连 DHCP 服务器）
  ip dhcp snooping trust
interface range GigabitEthernet0/2-24
  ip dhcp snooping limit rate 10  # 限速防泛洪
```

## 6. 自测

<details>
<summary>1. DHCP 四步握手分别是什么？为什么第二步 Offer 后还要 Request？</summary>

DORA: Discover → Offer → Request → Ack

客户端可能收到多个 DHCP 服务器的 Offer，Request 广播告诉所有服务器它选择了哪一个，其他服务器收回预分配的 IP。
</details>

<details>
<summary>2. 新楼层配了 VLAN 拿不到 IP，排查步骤？</summary>

1. VLAN 配置和端口确认
2. DHCP 中继是否配置
3. DHCP 服务器是否有对应 subnet
4. 防火墙 UDP 67/68
5. Wireshark 抓包看 Discover 是否到达
</details>

<details>
<summary>3. 地址池耗尽怎么办？</summary>

1. 扩大 range 或改掩码 (/24→/23)
2. 缩短租期加速回收
3. 清理过期租约
4. 拆分 VLAN 新子网
5. 长期：迁 IPv6
</details>
