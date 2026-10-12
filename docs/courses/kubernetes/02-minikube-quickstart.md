---
title: minikube 快速上手
description: 安装 minikube 与 kubectl，启动本地集群，部署第一个应用并跑通 kubectl 基本功
difficulty: intermediate
estimatedTime: 90
prerequisites:
  - 01-k8s-concepts
---

# minikube 快速上手

minikube 把"控制面+节点"塞进一台机器，是官方指定的学习环境。本章从零搭好集群并部署第一个应用。

## 1. 安装（WSL2 Ubuntu 内）

```bash
# 1) kubectl —— 官方命令行客户端
curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/ && rm kubectl
kubectl version --client

# 2) minikube —— 本地集群工具
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
minikube version
```

::: tip 驱动选择
minikube 需要一个"虚拟机驱动"。WSL2 里推荐 `--driver=docker`（需先装 Docker；`wsl --install -d Ubuntu` 后按 [Docker 课程](../docker/02-docker-basics) 安装）。没装 Docker 时它会尝试其他驱动并给出提示。
:::

## 2. 启动集群

```bash
minikube start --driver=docker --cpus=2 --memory=4g
# 完成后验证三连：
kubectl get nodes                 # 应看到 minikube 节点 Ready
kubectl cluster-info              # 控制面地址
kubectl get pods -A               # 全部系统 Pod（kube-system 里一堆）
```

第一次启动要拉镜像，视网络几分钟属正常。`minikube dashboard` 可以打开图形面板（另开终端窗口输出 URL），学习期很好用。

## 3. 第一个应用（命令式入门）

```bash
# 部署官方示例镜像（内含一个小 Web 服务）
kubectl create deployment web --image=nginx:1.27 --replicas=2

# 观察对象三件套
kubectl get deployments           # 期望 2 副本
kubectl get pods                  # 2 个 Pod（名字带随机后缀）
kubectl get pods -o wide          # 多看 IP 和节点（注意 IP 是集群内部 IP）
```

**暴露为 Service**（让集群外能访问）：

```bash
kubectl expose deployment web --type=NodePort --port=80
kubectl get services              # web 有一条 30xxx 端口映射

# minikube 专用方式拿到可访问地址：
minikube service web --url
# 浏览器或 curl 打开输出的地址 → Nginx 欢迎页
```

## 4. 体验"自愈"

```bash
# 手动"杀死"一个 Pod
kubectl delete pod <pod名字>
# 立刻再看：
kubectl get pods
# 新 Pod 出现了！—— Deployment 发现现实(1副本)≠期望(2)，自动补齐
```

这是第一章声明的直接体感：**你不repair，控制器repair**。

## 5. kubectl 基本功速查

| 命令 | 用途 | 高频度 |
|------|------|--------|
| `kubectl get pods/deploy/svc -A` | 看资源（-A 全命名空间） | ⭐⭐⭐⭐⭐ |
| `kubectl describe pod <名>` | 看详情与事件（排障第一刀） | ⭐⭐⭐⭐⭐ |
| `kubectl logs <pod名>` | 看容器日志 | ⭐⭐⭐⭐⭐ |
| `kubectl exec -it <pod名> -- sh` | 进入容器 | ⭐⭐⭐⭐ |
| `kubectl apply -f xxx.yaml` | 声明式提交（下一章主角） | ⭐⭐⭐⭐ |
| `kubectl delete deployment web` | 清理 | ⭐⭐⭐ |

**万能后缀**：`-o wide`（多列信息）、`-A`（全部命名空间）、`--watch`（持续盯）。

## 常见误区

1. **Pod 的 IP 访问不了就慌** —— Pod IP 是集群内部地址，本机访问要走 Service（NodePort/minikube service）
2. **镜像名拼错导致 Pod 卡在 ErrImagePull** —— `describe` 一下，Event 里写得明明白白
3. **每次都敲全称** —— `kubectl get deployments.apps` 没必要；`deploy/svc/po` 简写够用

## 小结

- minikube + kubectl 两条 curl 装；`--driver=docker` 起集群
- create deployment / expose 是命令式入门，理解对象用；日常主力是下一章的 `apply -f`
- 删 Pod 看自愈；排障第一刀永远是 `describe`

## 练习

1. 把 replicas 改成 5 验证扩容：`kubectl scale deployment web --replicas=5`
2. 杀掉一个 Pod，用 `--watch` 模式观察自愈过程
3. 用 `kubectl exec` 进入 Nginx Pod，看一眼 `/usr/share/nginx/html/index.html`

👉 下一章：[核心资源与滚动发布](./03-core-resources)
