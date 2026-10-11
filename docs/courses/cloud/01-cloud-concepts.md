---
title: 云计算基础概念
description: IaaS/PaaS/SaaS服务模型、公有云/私有云/混合云
difficulty: beginner
estimatedTime: 60
---

# 云计算基础概念

## 1. 三种服务模型

| 模型 | 你管什么 | 云管什么 | 例子 |
|------|----------|----------|------|
| IaaS | OS以上 | 硬件/网络 | AWS EC2, 阿里云ECS |
| PaaS | 应用+数据 | OS+硬件 | AWS RDS, 阿里云OSS |
| SaaS | 什么都不管 | 全部 | Office365, 钉钉 |

运维的领域：IaaS（管服务器）+ PaaS（管配置）。

## 2. 部署模型

- **公有云**: AWS/Azure/阿里云——最常用
- **私有云**: 自建OpenStack——合规需求
- **混合云**: 核心数据放私有云，前端放公有云

## 3. 云计算的核心优势

- **弹性**: 双11扩容1000台，结束后释放——按需付费
- **全球部署**: 5个区域各开一台 = 全球低延迟
- **托管服务**: RDS不用自己装MySQL——自动备份/高可用/扩容

## 📺 免费资源
- [Cloud Computing Explained](https://www.youtube.com/watch?v=M988_fsOSWo) — 5分钟
- [AWS vs Azure vs GCP](https://www.youtube.com/watch?v=9O8a6N9h2gY) — 对比
