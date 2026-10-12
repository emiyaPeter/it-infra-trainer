---
title: Kubernetes 入门课程
description: 4章从容器编排概念到 minikube 实操：核心资源、滚动发布、日常运维与排障
---

# Kubernetes 入门课程

Docker 解决了"单机上怎么跑容器"，Kubernetes 解决"**几十台机器、几百个容器怎么管**"。它是云原生时代的操作系统，也是运维岗位薪酬的分水岭。

## 前置要求

- 完成 [Docker 课程](../docker/)（容器概念、镜像、Compose 是硬前提）
- 实验环境：**minikube 单机集群**（WSL2 或 Docker Desktop 均可），第 2 章有完整安装步骤

## 课程目录

1. **[为什么需要 K8s — 核心概念](./01-k8s-concepts)** — 编排痛点、集群架构、Pod/Deployment/Service 对象模型
2. **[minikube 快速上手](./02-minikube-quickstart)** — 安装集群、第一个应用、kubectl 基本功
3. **[核心资源与滚动发布](./03-core-resources)** — YAML 声明式、Service 四种类型、扩缩容、回滚
4. **[运维基础与排障](./04-ops-basics)** — 日志/调试命令、探针、资源限额、排障思路

## 学习心法

- K8s 的学习曲线陡，**90% 的概念障碍来自"对象模型"**——先弄清"声明式：我描述期望状态，K8s 负责达成"，后面全是查词典
- 每章命令都在 minikube 里亲手敲——K8s 是练出来的不是读出来的
- 学完后回到 [阶段5 路线图](/roadmap/phase-5-containers) 检查掌握度
