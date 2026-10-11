---
title: "计算机硬件基础"
description: "理解计算机的组成部分——CPU、内存、存储、主板、网卡"
difficulty: beginner
estimatedTime: 60
prerequisites: []
---

# 计算机硬件基础

## 为什么 IT 工程师需要懂硬件？

你可能想问："我是学运维的，又不是修电脑的，为什么要懂硬件？"

因为**你管理的一切软件都运行在硬件之上**。当你排查一个"服务很慢"的问题时：
- 是 CPU 用满了？→ 需要理解 CPU 核心数和负载
- 是内存不够了？→ 需要理解 RAM 和 SWAP
- 是磁盘 IO 瓶颈？→ 需要理解 HDD vs SSD vs NVMe
- 是网络带宽满了？→ 需要理解网卡速率

不懂硬件，你的故障排查就是在"盲猜"。

## 核心组件

### 1. CPU（中央处理器）

CPU 是计算机的"大脑"。理解这几个概念就够了：

| 参数 | 含义 | IT运维关注点 |
|------|------|-------------|
| **核心数 (Cores)** | 物理处理单元数量 | 决定并发处理能力 |
| **线程数 (Threads)** | 逻辑处理单元 | 超线程技术，1核=2线程 |
| **主频 (Clock Speed)** | 每秒运算次数 (GHz) | 单线程性能 |
| **缓存 (Cache)** | CPU内置高速存储 | L1/L2/L3，减少内存访问延迟 |

**实战知识**：
- 在 Linux 中用 `lscpu` 查看 CPU 信息
- 在 Linux 中用 `top` 或 `htop` 查看实时 CPU 使用率
- 判断标准：CPU 持续 > 80% 需要考虑扩容或优化

### 2. 内存（RAM）

内存是 CPU 的"工作台"——CPU 处理的所有数据都先加载到内存。

| 类型 | 说明 |
|------|------|
| **DRAM** | 主内存，断电丢失数据 |
| **ECC RAM** | 纠错内存，服务器标配 |
| **SWAP** | 当内存不足时，用磁盘虚拟内存（慢！）|

**实战知识**：
- Linux: `free -h` 查看内存使用
- Linux: `cat /proc/meminfo` 查看详细内存信息
- 判断标准：SWAP 使用过高 = 内存不足的信号

### 3. 存储（硬盘）

| 类型 | 速度 | 典型容量 | 适用场景 |
|------|------|---------|---------|
| **HDD** (机械硬盘) | ~100 MB/s | 1-20 TB | 冷数据、备份 |
| **SATA SSD** | ~550 MB/s | 256 GB - 4 TB | 一般服务器 |
| **NVMe SSD** | ~3500 MB/s+ | 256 GB - 4 TB | 高性能服务器 |
| **RAID** | — | — | 多盘组合，提升性能/可靠性 |

**实战知识**：
- Linux: `df -h` 查看磁盘使用
- Linux: `lsblk` 查看块设备
- Linux: `iostat -x 1` 查看磁盘 IO 性能
- 关键指标：IOPS（每秒读写次数）、吞吐量、延迟

### 4. 主板与总线

主板是连接所有组件的"骨架"：
- **PCIe 插槽**：连接显卡、网卡、NVMe 硬盘
- **SATA 接口**：连接传统硬盘
- **DIMM 插槽**：安装内存条
- **芯片组 (Chipset)**：管理数据在组件间的流动

### 5. 网卡（NIC）

IT 基础设施工程师最关心的组件之一：

| 参数 | 说明 |
|------|------|
| **速率** | 1 GbE / 10 GbE / 25 GbE / 100 GbE |
| **接口类型** | RJ45（电口）/ SFP+（光口）|
| **功能** | TCP Offload、SR-IOV（虚拟化场景重要）|

**实战知识**：
- Linux: `ip link show` 查看网卡
- Linux: `ethtool eth0` 查看网卡详细参数
- Windows: `ncpa.cpl` 打开网络连接面板

## 动手实验

打开你的终端（WSL2 Ubuntu），运行以下命令看看你的电脑配置：

```bash
# 查看 CPU
lscpu | head -20

# 查看内存
free -h

# 查看磁盘
lsblk

# 查看网卡
ip link show
```

在 Windows 中，按 `Win + R`，输入 `msinfo32` 回车，可以看到完整的系统信息。

## 📺 免费配套资源

**视频：**
- [计算机组成原理 (Crash Course)](https://www.bilibili.com/video/BV1SW41167Hr) — 动画讲解硬件
- [How Computers Work (Code.org)](https://www.youtube.com/watch?v=OAxT3vO5hYs) — 6分钟理解计算机
- [CPU工作原理](https://www.youtube.com/watch?v=cNN_tTXABUA) — 15分钟深入CPU

**在线资源：**
- [PC Part Picker](https://pcpartpicker.com/) — 在线模拟组装电脑
- [How Computers Work 电子书](https://www.cs.virginia.edu/~robins/How_Computers_Work.pdf) — 图文并茂

## 自测题

1. 服务器内存不足时，操作系统会做什么？这对性能有什么影响？
2. NVMe SSD 比 SATA SSD 快多少倍？为什么？
3. 服务器的网卡为什么比家用电脑更重要？

<details>
<summary>点击查看答案</summary>

1. 会使用 SWAP（磁盘虚拟内存），但磁盘速度远慢于 RAM（NVMe ~3500 MB/s vs DDR4 ~20000 MB/s+），大量使用 SWAP 会导致系统严重变慢
2. NVMe SSD (~3500 MB/s) 比 SATA SSD (~550 MB/s) 快约 6 倍，因为 NVMe 走 PCIe 总线直连 CPU，而 SATA 受限于 AHCI 协议和接口带宽
3. 服务器需要同时处理成千上万的网络连接，网卡的吞吐量、卸载引擎（TCP Offload）、虚拟化支持（SR-IOV）直接影响整体性能
</details>
