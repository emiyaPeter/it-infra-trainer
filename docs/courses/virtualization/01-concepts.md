---
title: 虚拟化概念入门
description: 理解Hypervisor、CPU虚拟化、内存虚拟化，为动手实验打基础
difficulty: beginner
estimatedTime: 60
---

# 虚拟化概念入门

## 1. 什么是虚拟化

一台物理服务器 → 多台虚拟机同时运行。每台VM有自己的CPU、内存、磁盘、网卡——但都是"假的"，由Hypervisor模拟。

```
物理服务器 ─┐
            ├── VM1: Web Server   (4 vCPU, 8GB, 100GB)
Hypervisor  ├── VM2: Database     (8 vCPU, 32GB, 500GB)
(Type 1/2)  ├── VM3: Dev环境      (2 vCPU, 4GB, 50GB)
            └── VM4: 测试环境      (2 vCPU, 4GB, 50GB)
```

## 2. Hypervisor两种类型

| 类型 | 运行位置 | 例子 | 性能 |
|------|----------|------|------|
| Type 1 (裸机) | 直接跑在硬件上 | ESXi, KVM, Hyper-V | 接近物理机 |
| Type 2 (托管) | 跑在操作系统上 | VirtualBox, VMware Workstation | 有损耗 |

## 3. 关键概念：Overcommit

物理24核可以分配100+ vCPU——因为VM不会同时用满。但过度超分会导致性能雪崩。经验比例：CPU 3:1 ~ 5:1，内存不超过物理总量。

## 4. 动手：检查你的CPU是否支持虚拟化

```bash
# Windows: 任务管理器 → 性能 → CPU → "虚拟化: 已启用"
# Linux:
grep -E '(vmx|svm)' /proc/cpuinfo  # Intel=vmx, AMD=svm
```

## 📺 免费资源
- [Virtualization Explained (IBM)](https://www.youtube.com/watch?v=FZR0rG3HKIk) — 8分钟动画
- [什么是虚拟化 (中文)](https://www.bilibili.com/video/BV1VJ411W7iA) — B站入门
