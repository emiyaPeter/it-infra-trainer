---
title: 容器概念入门
description: 理解容器与虚拟机的区别、Docker架构、镜像分层
difficulty: beginner
estimatedTime: 60
---

# 容器概念入门

## 1. 容器 vs 虚拟机

| 对比 | 虚拟机 | 容器 |
|------|--------|------|
| 启动速度 | 分钟级 | 秒级 |
| 资源开销 | 每个VM有完整OS | 共享Host内核 |
| 隔离程度 | 完全隔离 | 进程级隔离 |
| 磁盘占用 | GB级别 | MB级别 |
| 密度 | 几十台/物理机 | 数百台/物理机 |

容器不是"轻量虚拟机"——它是被命名空间(namespace)和cgroup限制的Linux进程。

## 2. Docker架构

```
docker CLI → Docker Daemon (dockerd) → containerd → runc → Container
```

## 3. 镜像分层

```
ubuntu:22.04  (Base层, 只读)
   └── apt install nginx  (Layer 2, 只读)
       └── COPY app/       (Layer 3, 只读)
           └── Container读写层 (可写)
```

同一台机器上10个Nginx容器共享同一个Nginx镜像层，节省99%的磁盘。

## 4. Docker的运维价值

- 开发环境 = 测试环境 = 生产环境（同一镜像）
- 新成员入职:`docker compose up` 一键启动全套服务
- 回滚: 切换镜像tag，秒级完成

## 📺 免费资源
- [Containers vs VMs (IBM)](https://www.youtube.com/watch?v=cjXI-yxqGTI) — 5分钟
- [Docker概念入门](https://www.bilibili.com/video/BV1s54y1n7Ev) — B站
