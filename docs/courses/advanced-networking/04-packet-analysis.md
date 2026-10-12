---
title: tcpdump 抓包分析 — 网络问题的终局手段
description: 掌握 BPF 过滤器语法与抓包姿势，学会阅读握手挥手、定位重传与延迟，衔接 Wireshark
difficulty: advanced
estimatedTime: 90
prerequisites:
  - 03-wireguard
---

# tcpdump 抓包分析

日志说"连不上"，监控说"有延迟"，只有抓包能回答"**线上到底说了什么**"。tcpdump 是网络排障的终局武器——前面所有课程里"tcpdump 一下"的伏笔，本章兑现。

## 1. 基本姿势

```bash
sudo tcpdump -i eth0                 # 指定网卡（-i any 全部）
sudo tcpdump -i eth0 -c 100          # 抓 100 个包就停
sudo tcpdump -i eth0 -w /tmp/x.pcap  # 存文件（给 Wireshark 用）
sudo tcpdump -r /tmp/x.pcap          # 回放文件
sudo tcpdump -i eth0 -nn -s0         # -nn 不做名称解析(快且准) -s0 抓完整包
# 学习三连：-i 指口 -nn 别解析 -w 存档 —— 生产排查永远先 -w 再慢慢分析
```

## 2. BPF 过滤器：只看想看的

```bash
host 192.168.100.2                    # 按主机
port 80 or port 443                   # 按端口
src 10.0.0.1 and dst port 22          # 组合：源/目的
net 192.168.100.0/24                  # 按网段
icmp                                  # 按协议
tcp[tcpflags] & tcp-syn != 0          # 只看 SYN 包（连接建立的瞬间）
not port 22                           # 排除自己的 SSH 干扰（远程抓包必加！）
```

**组合哲学**：条件用 and/or/not 拼装；远程操作时永远 `not port 22` 排除自己的会话噪音。

## 3. 必会阅读：三次握手与四次挥手

```bash
sudo tcpdump -i eth0 -nn 'tcp port 80 and host 目标IP'
# 一次 curl 的开头长这样：
# 10.0.2.15.52344 > 93.184.216.34.80: Flags [S]      ← 客户端：我想连（SYN）
# 93.184.216.34.80 > 10.0.2.15.52344: Flags [S.]     ← 服务端：好的+我也想（SYN+ACK）
# 10.0.2.15.52344 > 93.184.216.34.80: Flags [.]      ← 客户端：确认，开聊（ACK）
# …… [P.] 数据传输（PSH+ACK）……
# 断开是四次 [F.] / [.] / [F.] / [.]
```

Flags 速查：`S`=SYN 建连、`F`=FIN 断连、`R`=RST 强制重置（**被拒绝/异常**的信号）、`P`=有数据、`.`=纯 ACK。

## 4. 三个经典诊断

### ① "连不上"：卡在哪一步？

```
只看到 S，没有 S.       → SYN 没到对方或被墙/防火墙丢（中间问题）
S. 回来了但没后续        → 回包没到客户端（回程路由问题）
收到 R.                 → 对方明确拒绝（端口没开/服务挂了）
连 DNS 都没查           → 域名解析层就挂了（先查 53 端口）
```

### ② 重传风暴（网络质量差）

```bash
sudo tcpdump -nn 'tcp[tcpflags] & tcp-syn == 0 and tcp[tcpflags] & tcp-ack != 0' | grep -c retrans
# 同一个 seq 出现两次 = 重传；大量 "retransmission" = 链路丢包/拥塞
```

### ③ 延迟在谁（串次对比）

抓出文件后看**相邻包的时间差**（tcpdump 输出最左列）：请求发出→响应回来这段是 RTT；应用处理慢则表现为"数据到了但很久没有 P 回来"——网络背锅还是应用背锅，一条抓包定案。

## 5. 衔接 Wireshark

tcpdump 是"采集+粗看"，Wireshark 是"分析+可视化"：

```
sudo tcpdump -i eth0 -nn -s0 -w /tmp/issue.pcap 'tcp port 443'
# 把 pcap 拷回本机，Wireshark 打开：
#   Statistics → Flow Graph：连接全景图
#   Filter: tcp.analysis.retransmission：一键列出所有重传
#   Follow → TCP Stream：还原完整对话内容
```

## 常见误区

1. **不排除自己的 SSH 就开抓** —— 屏幕被自己的会话刷屏；`not port 22` 是远程抓包礼节
2. **用 hostname 过滤** —— 过滤器里的 `host web1` 触发 DNS 解析歧义；用 IP，`-n` 同理
3. **抓包文件随便扔** —— pcap 里可能有口令等明文（非 TLS 流量）；用完即删，别提交进 git

## 小结

- 姿势三连：-i 指口、-nn 原始显示、-w 存档后细看
- 过滤器按 主机/端口/协议/标志位 组装；远程必 not port 22
- 握手阅读定"连不上"，重传计数定"质量差"，时间差定"谁的锅"

## 练习（结业）

1. 抓一次完整 curl：识别握手、数据、挥手各阶段并标注截图
2. `curl` 一个不存在端口的站点，抓到 R. 定案"服务端拒绝"
3. 用 tc 制造丢包（`tc qdisc add dev eth0 root netem loss 20%`），抓到重传后恢复

👉 恭喜完成网络进阶！回到 [课程目录](/courses/)；四门进阶课（K8s/Terraform/Linux进阶/网络进阶）齐活，可以规划终期项目了
