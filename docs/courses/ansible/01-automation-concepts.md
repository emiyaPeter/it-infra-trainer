---
title: 自动化运维概念
description: 理解配置管理与基础设施即代码的核心思想
difficulty: beginner
estimatedTime: 45
---

# 自动化运维概念

## 1. 手动 vs 自动化

手动部署50台Web服务器：SSH→更新→装Nginx→配防火墙→配监控→...  至少2天，还可能每台配得不一样。自动化部署：一条命令，20分钟，完全一致。

## 2. 两种自动化范式

| 范式 | 工具 | 做什么 |
|------|------|--------|
| 配置管理 | Ansible/Puppet/Salt | 管理已有服务器的软件和配置 |
| IaC基础设施即代码 | Terraform/Pulumi | 创建/修改云资源(VM/网络/存储) |

两者结合 = 完整自动化。

## 3. Ansible 为什么流行

- **无Agent**：不需要在目标机器上装客户端，用SSH就能管
- **YAML语法**：易读易写
- **幂等**：跑10次和跑1次结果一样（不会重复安装）
- **社区强大**：3000+模块覆盖几乎所有运维场景

## 4. 自动化对运维工程师的价值

面试加分巨大。能用Ansible管100台服务器的运维 = 效率是手动运维的10倍+。

## 📺 免费资源
- [What is Ansible (Red Hat)](https://www.youtube.com/watch?v=1id6ERvfozo) — 3分钟
- [Infrastructure as Code Explained](https://www.youtube.com/watch?v=P2C2YHdUM7U) — 5分钟
