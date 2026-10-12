# 阶段5：容器技术

> 🎯 **目标**：精通 Docker，能容器化应用并编排多容器服务  
> ⏱ **建议时长**：4 个月（每天 1-2 小时）  
> 📊 **难度**：⭐⭐⭐ 中级  
> 🔥 **行业必备技能**

## 学习内容

- **Docker 核心**：镜像、容器、Dockerfile、多阶段构建
- **Docker 网络与存储**：bridge/host/overlay、volume/bind mount
- **Docker Compose**：多容器应用编排
- **容器最佳实践**：日志、健康检查、资源限制、安全
- **Kubernetes 基础**：Pod、Deployment、Service、ConfigMap、Ingress
- **Helm**：K8s 包管理器基础

## 实验环境

- **Docker Desktop** (WSL2 backend) — 日常开发
- **Minikube** 或 **K3s** — Kubernetes 本地实验

📖 **配套课程**：[Docker 容器（4章）](/courses/docker/) · [Kubernetes 入门（4章）](/courses/kubernetes/)

## 里程碑

部署一个 3 层应用：Nginx (前端) → Flask/Node.js (API) → PostgreSQL (数据库)，全部容器化。

👉 [下一阶段 →](/roadmap/phase-6-automation)
