# 阶段1：基础入门

> 🎯 **目标**：理解计算机如何通信，掌握基本的IT操作技能  
> ⏱ **建议时长**：1-3 个月（每天 1-2 小时）  
> 📊 **难度**：⭐ 入门  

## 学习内容

### 第1周：计算机硬件基础
- CPU、内存、硬盘、主板、网卡的基本概念
- 计算机启动过程（BIOS/UEFI → Bootloader → OS）
- 二进制、十进制、十六进制转换
- 使用 `msinfo32` 查看自己的电脑配置

### 第2周：操作系统基础
- 什么是操作系统？进程、内存管理、文件系统概念
- Windows 11 基础操作：任务管理器、服务 (services.msc)、事件查看器
- 安装 WSL2 + Ubuntu
- 安装 Windows Terminal

### 第3-6周：网络基础 ⭐ 核心
- OSI 七层模型（逐层理解，不要死记硬背）
- TCP/IP 协议栈：应用层、传输层、网络层、链路层
- IP 地址分类：A/B/C/D/E类、公网/私网地址
- 子网掩码与CIDR：`/24`、`/16` 是什么意思？
- 子网划分计算：一个 `/24` 网络能分几个 `/26` 子网？
- DNS 工作原理：从 `google.com` 到 IP 地址的过程
- DHCP：自动获取IP地址的原理

### 第7-8周：命令行入门
- CMD 基础命令：`ipconfig`, `ping`, `tracert`, `nslookup`
- PowerShell 基础：`Get-Command`, `Get-Help`, 管道操作
- WSL2 初体验：Linux 命令行是什么样的？

### 第9-12周：动手实践
- 使用 `ping` 测试网络连通性
- 使用 `tracert` 追踪数据包路径
- 使用 `nslookup` 查询DNS记录
- 使用 Wireshark（免费）抓包分析
- 在 WSL2 中使用 `curl` 发起 HTTP 请求

## 环境准备

### 必装软件

| 软件 | 用途 | 安装方式 |
|------|------|---------|
| **WSL2 + Ubuntu** | Linux 实验环境 | 管理员PowerShell运行: `wsl --install -d Ubuntu` |
| **Windows Terminal** | 现代化终端 | Microsoft Store 免费下载 |
| **VS Code** | 代码编辑器 | [code.visualstudio.com](https://code.visualstudio.com) |
| **Git** | 版本控制 | [git-scm.com](https://git-scm.com/download/win) |
| **Node.js** | 运行培训工具 | [nodejs.org](https://nodejs.org) (LTS版本) |

### 可选软件

| 软件 | 用途 |
|------|------|
| **Wireshark** | 网络抓包分析（阶段1就会用到）|
| **Draw.io** | 画网络拓扑图（免费）|

## 阶段目标检查清单

- [ ] 能说出 OSI 七层模型每层的名称和功能
- [ ] 理解 TCP 三次握手和四次挥手
- [ ] 能手动计算子网划分（如：`192.168.1.0/24` 划分为4个子网）
- [ ] 理解 DNS 解析的完整过程
- [ ] 熟练使用 `ping`, `tracert`, `nslookup`, `ipconfig`
- [ ] 搭建好 WSL2 + VS Code 开发环境
- [ ] 能用二进制和十六进制表示数字
- [ ] 了解电脑硬件组成，能用工具检测硬件健康状态 → [维修基础课程](/courses/repair-basics/)
- [ ] 掌握网络/网页/系统/打印机常见故障排查方法 → [故障排查手册](/courses/troubleshooting/)

## 下一阶段

完成以上内容后，进入 [阶段2：Linux系统管理 →](/roadmap/phase-2-linux)
