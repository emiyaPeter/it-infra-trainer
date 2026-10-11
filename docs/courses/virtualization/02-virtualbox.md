---
title: VirtualBox实战
description: 创建虚拟机、配置网络、快照与克隆、导入导出
difficulty: beginner
estimatedTime: 90
---

# VirtualBox 实战

VirtualBox是免费开源的Type 2 Hypervisor，最适合学习。

## 1. 安装与创建VM

从 virtualbox.org 下载安装。创建第一台VM：
- 名称: Ubuntu-Lab, 类型: Linux/Ubuntu 64bit
- 内存: 2048MB, 硬盘: 20GB 动态分配
- 网络: 默认NAT → VM可上网

## 2. 网络模式——运维必须理解

| 模式 | VM↔Host | VM↔外网 | 外网↔VM | 典型用途 |
|------|---------|----------|----------|----------|
| NAT | ❌ | ✅ | 需端口转发 | 一般上网 |
| 桥接 | ✅ | ✅ | ✅ | 模拟独立服务器 |
| Host-Only | ✅ | ❌ | ❌ | 内部实验网络 |
| 内部网络 | ❌ | ❌ | ❌ | 隔离的测试环境 |

## 3. 快照与克隆

```bash
# 快照 = 保存当前状态，随时回滚
# 克隆 = 复制一台完全相同的VM
# 生产运维场景：升级前拍快照，失败秒级回滚
```

## 4. 动手实验

1. 创建Ubuntu VM → 桥接模式 → 在同一局域网用另一台设备ping它
2. 安装Nginx → 配置端口转发从Host访问
3. 拍快照 → 删掉重要文件 → 回滚恢复

## 📺 免费资源
- [VirtualBox完整教程](https://www.bilibili.com/video/BV1d4411B7eB) — B站
- [VirtualBox Network Modes](https://www.youtube.com/watch?v=HoodaT8p1uo) — YouTube 10分钟
