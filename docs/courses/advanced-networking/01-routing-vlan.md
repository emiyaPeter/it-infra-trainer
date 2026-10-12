---
title: 路由与 VLAN — 把 Linux 变成路由器
description: 掌握内核路由表与静态路由、IP 转发，理解 VLAN 划分并在实验拓扑中实现跨网段通信
difficulty: advanced
estimatedTime: 90
prerequisites:
  - ../linux/08-networking.md
---

# 路由与 VLAN

## 1. 实验拓扑（先搭台）

两台 VirtualBox Ubuntu 虚拟机，网络设置如下：

```
VM1 "router"：网卡1 = 桥接（能上网），网卡2 = 内部网络 "labnet"
VM2 "hostA" ：网卡1 = 内部网络 "labnet"（仅这一个内网口）

router: net2 = 192.168.100.1/24
hostA : net1 = 192.168.100.2/24，网关指向 192.168.100.1
```

```bash
# VM1 (router)
sudo ip addr add 192.168.100.1/24 dev enp0s8 && sudo ip link set enp0s8 up
# VM2 (hostA)
sudo ip addr add 192.168.100.2/24 dev enp0s3
sudo ip route add default via 192.168.100.1
```

## 2. 路由表：内核的"导航地图"

```bash
ip route show
# default via 10.0.2.1 dev enp0s3      ← 默认路由：没细列的去处全给网关
# 192.168.100.0/24 dev enp0s8 ...      ← 直连路由：自己网段，直接喊
```

**路由决策一句话**：目的地址逐条匹配，最长前缀优先；都不中就丢给 default。排障时"通不通"先看两边的路由表——`192.168.100.0/24` 不在表里，喊破喉咙也没人转达。

## 3. 打开 IP 转发：路由器的灵魂开关

Linux 默认**不转发**别人包（安全默认）。打开它，VM1 才是真路由器：

```bash
sudo sysctl -w net.ipv4.ip_forward=1          # 临时
echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-forward.conf
sudo sysctl --system                           # 永久生效
```

验证：hostA `ping 8.8.8.8` → router 收到包并转发（此时多半还差 NAT，见下一章防火墙的 MASQUERADE）。观察转发证据：router 上 `sudo tcpdump -i enp0s8 icmp` 能看到"进来的请求"，`-i 桥接口` 能看到"出去的请求"。

## 4. 静态路由：告诉别人"还有条路"

三台以上机器时，光有默认网关不够：

```bash
# 例：router2 网段 192.168.200.0/24 在 router1 的另一侧
# 在 router1 上指路：
sudo ip route add 192.168.200.0/24 via 192.168.100.1 dev enp0s8
```

排障口诀：**去程路由 + 回程路由，两边都要有**——"ping 得出去、回不来"是路由排障第一大坑（在源端 tcpdump 看得见请求，目的端看不见）。

## 5. VLAN：一台交换机当多台用

VLAN 在二层把一个物理网络切成多个互不相通的广播域（802.1Q：帧上打 4 字节标签）：

```bash
# 需要 VLAN 子接口支持（虚拟机里把内部网络想象成交换机的 trunk 口）
sudo ip link add link enp0s8 name enp0s8.10 type vlan id 10
sudo ip addr add 192.168.10.1/24 dev enp0s8.10
sudo ip link set enp0s8.10 up
```

**工程意义**：办公网/访客网/服务器网同线隔离，靠路由器（或防火墙策略）控制互访——你在公司"访客 WiFi 访问不了内网系统"，背后就是 VLAN + 三层策略。

## 常见误区

1. **改完 ip 命令重启全丢** —— ip 命令是临时的；持久化用 netplan（Ubuntu），实验环境临时用无所谓
2. **ping 不通就查目标机** —— 先两边 `ip route`，多数"不通"是路标问题不是机器问题
3. **ip_forward 开了还是不通** —— 转发通了≠能上网：跨网段访问外网还需要 NAT（下一章的 MASQUERADE 正是为此）

## 小结

- 路由=最长前缀匹配的导航；default 是兜底路标
- ip_forward 是路由器灵魂开关；三机拓扑要双向路标
- VLAN=二层切广播域，trunk 一线多网

## 练习

1. 搭好拓扑：hostA 经 router 上外网（提示：下一章前的预习——先在 router 上 `iptables -t nat -A POSTROUTING -o 桥接口 -j MASQUERADE` 抄答案跑通）
2. 在 router 的两个口分别 tcpdump，画出一次 ping 的进出路径
3. 建 VLAN 10 和 20 两个子接口，各挂一台"假想主机"地址并验证互 ping 与隔离

👉 下一章：[Linux 防火墙](./02-firewall)
