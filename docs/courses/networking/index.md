---
title: 网络基础课程
description: 7章从零掌握网络核心技能
---

# 网络基础课程

网络是 IT 基础设施的基石。本课程从硬件到协议，每章都有动手环节。

## 课程目录

1. **[计算机硬件基础](./01-hardware-basics)** — CPU/内存/硬盘/主板，理解数据如何流动
2. **[OSI七层模型](./02-osi-model)** — 网络通信的理论地图，每一层做什么
3. **[TCP/IP协议栈](./03-tcp-ip)** — 互联网的语言，TCP为何可靠
4. **[IP地址与子网划分](./04-subnetting)** — CIDR、子网计算，运维面试必考
5. **[DNS域名系统](./05-dns)** — 互联网电话簿，从dig到DNSSEC
6. **[DHCP动态主机配置](./06-dhcp)** — IP如何自动到手，DORA四步
7. **[命令行网络工具](./07-cli-tools)** — ping/traceroute/nslookup/curl实战

## 📺 免费配套视频资源

| 资源 | 平台 | 适合 |
|------|------|------|
| [计算机网络（谢希仁版）](https://www.bilibili.com/video/BV1c4411d7jb) | B站 | 系统学习 |
| [韩立刚-计算机网络](https://www.bilibili.com/video/BV1Qr4y1w7nu) | B站 | 入门友好 |
| [Computer Networking Course](https://youtube.com/playlist?list=PLIFyRwBY_4bRLmKfP1KnZA6rZbRHtxmXi) | YouTube | 英文系统课 |
| [Wireshark抓包实战](https://www.bilibili.com/video/BV1Vg411V7zC) | B站 | 动手实操 |

## 🌐 免费在线资源

- [RFC 官方文档](https://www.rfc-editor.org/) — 所有网络协议的标准文档
- [子网计算器](https://www.subnet-calculator.com/) — 在线练习子网划分
- [GNS3 网络模拟器](https://www.gns3.com/) — 免费搭建虚拟网络实验室

## 💻 动手实验建议

| 实验 | 工具 | 内容 |
|------|------|------|
| 抓包看三次握手 | Wireshark | 访问任意网站，过滤 `tcp.flags.syn==1` |
| DNS 解析追踪 | `dig +trace` | 从根服务器追踪到最终 A 记录 |
| 子网划分练习 | 纸+笔 | 每天算 5 个子网，直到熟练 |
