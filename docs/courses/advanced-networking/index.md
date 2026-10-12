---
title: 网络进阶课程
description: 4章进阶实战：路由与 VLAN、Linux 防火墙、WireGuard 组网、tcpdump 抓包分析
---

# 网络进阶课程

基础课（阶段1）让你"懂网络怎么说话"，这门课让你"**亲手组网、设卡、验尸**"——网络问题终局手段全在这里。

## 适合谁？

- 完成 [网络基础](../networking/) 与 [Linux 网络配置](../linux/08-networking/)
- 想搭真实的小型网络（路由/防火墙/VPN）而不是纸上谈兵
- 想掌握 tcpdump——"抓包定罪"的终极排障武器

## 课程目录

1. **[路由与 VLAN](./01-routing-vlan)** — 内核路由表、静态路由、IP 转发、VLAN 划分，把 Linux 变成路由器
2. **[Linux 防火墙](./02-firewall)** — netfilter 五钩、nftables/iptables 规则解剖、常用防护集
3. **[WireGuard 组网](./03-wireguard)** — 现代级 VPN：十分钟建一条点对点隧道，理解组网拓扑
4. **[tcpdump 抓包分析](./04-packet-analysis)** — 过滤器语法、握手挥手阅读、重传与延迟定位

## 实验环境

两台 Linux（VirtualBox 两台 Ubuntu，或 WSL + 一台虚拟机组合）即可完成全部实验；第 1 章有拓扑搭建指引。
