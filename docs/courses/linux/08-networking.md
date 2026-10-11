---
title: Linux 网络配置 — 运维实战
description: 掌握网络接口配置、路由、防火墙、网络故障排查全套技能
difficulty: intermediate
estimatedTime: 120
prerequisites:
  - 01-command-line
---

# Linux 网络配置

服务器上不了网、端口不通、路由不对——这些都是运维必须能快速解决的问题。

## 1. 网络接口配置

```bash
# 查看网络接口
ip addr show                 # 现代方式
ip -br addr                  # 简洁输出
ifconfig                     # 传统方式（需要 net-tools）

# 查看网卡详细信息
ethtool eth0                 # 协商速率、双工、驱动
ip -s link show eth0         # 收发包统计和错误计数

# 临时配置 IP
ip addr add 10.0.0.10/24 dev eth0
ip link set eth0 up
ip link set eth0 down
```

### Netplan (Ubuntu 18.04+)

```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 10.0.0.10/24
      routes:
        - to: default
          via: 10.0.0.1
      nameservers:
        addresses: [10.0.0.10, 8.8.8.8]
```

```bash
netplan try      # 测试配置（失败自动回滚）
netplan apply    # 应用配置
```

## 2. 路由管理

```bash
# 查看路由表
ip route show
route -n          # 传统方式

# 添加静态路由
ip route add 192.168.2.0/24 via 10.0.0.1
ip route add 10.100.0.0/16 via 10.0.0.1 dev eth0

# 添加默认路由
ip route add default via 10.0.0.1

# 删除路由
ip route del 192.168.2.0/24

# 策略路由（高级）
ip rule show
ip route show table main
```

## 3. 防火墙 (iptables/nftables)

### iptables 三链五表速查

```
INPUT 链:  外部 → 本机
OUTPUT 链: 本机 → 外部
FORWARD 链: 外部 → 本机 → 外部（NAT/路由场景）

表 (按优先级):
  raw → mangle → nat → filter
```

```bash
# 查看规则（带行号方便删除）
iptables -L -n -v --line-numbers

# 允许/拒绝
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 3306 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -j DROP    # 默认拒绝（放最后！）

# 删除规则
iptables -D INPUT 3          # 按行号删除

# 保存规则
iptables-save > /etc/iptables/rules.v4

# NAT（端口转发）
iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to 10.0.0.5:80
iptables -t nat -A POSTROUTING -s 10.0.0.0/8 -o eth0 -j MASQUERADE

# SNAT（内网上外网）
iptables -t nat -A POSTROUTING -s 10.0.0.0/8 -o eth0 -j SNAT --to 1.2.3.4
```

## 4. 网络故障排查 — 运维方法论

### 标准排查路径

```bash
# 1. 链路层 — 网线/网卡
ip link show            # Link detected: yes?
ethtool eth0            # Speed, Duplex 正常吗？
dmesg | grep eth0       # 网卡驱动错误？

# 2. 网络层 — IP
ip addr                 # IP 配置对吗？
ping -c 4 8.8.8.8       # 外网通吗？
ping -c 4 gateway       # 网关通吗？

# 3. 传输层 — 端口
ss -tlnp                # 哪些端口在监听？
ss -tlnp | grep :80     # 服务端口监听了吗？
nc -zv localhost 3306   # 端口测试

# 4. 应用层 — DNS/HTTP
dig google.com          # DNS 解析正常吗？
curl -v http://localhost:8080   # HTTP 服务可达吗？
```

### 常用诊断命令

```bash
# 连接追踪
ss -s                   # socket 统计
ss -tan state time-wait # TIME_WAIT 连接数

# 抓包
tcpdump -i eth0 port 80 -n
tcpdump -i any host 10.0.0.5 and port 3306 -w /tmp/db.pcap

# 路由追踪
traceroute 8.8.8.8
mtr 8.8.8.8              # 持续路由监控

# 带宽测试
iperf3 -s                 # 服务端
iperf3 -c 10.0.0.5       # 客户端

# ARP 表
ip neigh show
arp -n
```

### 常见问题速查

| 现象 | 可能原因 | 检查命令 |
|------|----------|----------|
| ping 不通 | 防火墙/路由 | `iptables -L`, `ip route` |
| 端口不监听 | 服务没启动 | `ss -tlnp`, `systemctl status` |
| DNS 解析失败 | /etc/resolv.conf | `dig @8.8.8.8 test.com` |
| 丢包严重 | 网卡/交换机/带宽 | `ip -s link`, `ethtool -S eth0` |
| 连接被拒绝 | 防火墙 drop 而非 reject | `iptables -L -n` |
| 大量 TIME_WAIT | 短连接过多 | `ss -tan`, 调整内核参数 |

## 5. 内核网络参数调优

```bash
# /etc/sysctl.conf 或 /etc/sysctl.d/99-network.conf

# 开启 IP 转发（做网关/路由器需要）
net.ipv4.ip_forward = 1

# TIME_WAIT 优化（高并发 Web 服务器）
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# 连接队列大小
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 8192

# 端口范围
net.ipv4.ip_local_port_range = 1024 65000

# 应用
sysctl -p
```

## 6. 自测

<details>
<summary>1. 用户说连不上服务器，你的排查步骤？</summary>

1. Ping 服务器 IP：通→网络层 OK，不通→继续
2. Ping 网关：通→检查服务器路由/防火墙
3. 检查端口：`nc -zv IP PORT` 或 `telnet IP PORT`
4. 检查服务端：`ss -tlnp` 确认服务在监听
5. 检查防火墙：`iptables -L -n` 是否拦截了端口
6. 抓包确认：`tcpdump -i eth0 port PORT`
</details>

<details>
<summary>2. iptables DROP 和 REJECT 的区别？</summary>

- DROP: 静默丢弃，客户端会等到超时才报错
- REJECT: 立即回复 ICMP port unreachable，客户端马上知道
- 对外暴露的服务用 DROP（防扫描），内网服务用 REJECT（方便排查）
</details>

<details>
<summary>3. 如何限制某 IP 访问 22 端口的速度？</summary>

```bash
iptables -A INPUT -p tcp --dport 22 -m limit --limit 3/minute --limit-burst 5 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j DROP
# 每分钟最多 3 个新连接，突发最多 5 个
```
</details>
