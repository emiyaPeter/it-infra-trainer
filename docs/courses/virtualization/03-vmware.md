---
title: VMware vSphere入门
description: 企业级虚拟化平台ESXi/vCenter核心概念
difficulty: intermediate
estimatedTime: 90
---

# VMware vSphere 入门

vSphere是企业市场占有率最高的虚拟化平台。运维面试必问。

## 1. 核心组件

- **ESXi**: Type 1 Hypervisor，直接装在裸金属服务器上
- **vCenter**: 管理平台，统一管理多台ESXi主机
- **vMotion**: 在线迁移——VM运行中从一台主机迁移到另一台，零停机

## 2. 企业典型架构

```
vCenter Server
   ├── ESXi-01 (Cluster A) — 10台VM
   ├── ESXi-02 (Cluster A) — 12台VM
   ├── ESXi-03 (Cluster B) — 8台VM
   └── 共享存储 (SAN/NAS) — 所有VM文件存这里
```

## 3. 关键功能

| 功能 | 作用 | 场景 |
|------|------|------|
| vMotion | 在线迁移VM | 主机维护前迁移走VM |
| DRS | 自动负载均衡 | 某主机负载高→自动迁移VM |
| HA | 高可用 | 主机故障→VM在其他主机自动重启 |
| FT | 容错 | 双机同步运行，零中断 |

## 4. 自学方法

1. 下载VMware Workstation → 安装ESXi作为VM（嵌套虚拟化）
2. 注册VMware Hands-on Labs → 免费在线vSphere实验
3. 了解vSphere是做运维的加分项，但不建议在家搭物理vSphere（太贵）

## 📺 免费资源
- [VMware Hands-on Labs](https://labs.hol.vmware.com/) — 官方免费
- [vSphere 7入门](https://www.youtube.com/watch?v=Z2idJ9oVlwI) — YouTube
