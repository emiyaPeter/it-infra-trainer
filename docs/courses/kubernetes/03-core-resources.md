---
title: 核心资源与滚动发布
description: 掌握 YAML 声明式工作流（apply）、Service 四种类型、扩缩容、滚动更新与一键回滚
difficulty: intermediate
estimatedTime: 100
prerequisites:
  - 02-minikube-quickstart
---

# 核心资源与滚动发布

上一章的 `create/expose` 命令是"玩具用法"。生产的 K8s 世界里，一切皆 **YAML 文件 + git** ——这就是声明式工作流。

## 1. 第一个完整的 YAML

```yaml
# web.yaml —— Deployment + Service 写在一个文件
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels: { app: web }     # 认领规则：管理带 app=web 标签的 Pod
  template:                        # Pod 的模子
    metadata:
      labels: { app: web }         # Pod 出生即打标签
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports: [ { containerPort: 80 } ]
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: NodePort
  selector: { app: web }           # 流量转发给带此标签的 Pod
  ports:
  - port: 80                       # Service 对内端口
    targetPort: 80                 # 转到容器的端口
```

```bash
kubectl apply -f web.yaml          # 提交期望状态
kubectl get all -l app=web         # 一次看全：deploy/pod/svc
```

`apply` 是幂等的：改文件再 apply 即更新。**标签（labels）是 K8s 的"关系粘合剂"**——Deployment 靠 selector 认领 Pod，Service 靠 selector 找到 Pod。标签错了 = 关系断裂（Pod 成孤儿或流量丢光），这是新手第一大坑。

## 2. Service 的四种类型

| 类型 | 一句话 | 场景 |
|------|--------|------|
| **ClusterIP**（默认） | 集群内部虚拟 IP | 微服务互访 |
| **NodePort** | 每台节点开一个 30xxx 端口 | 学习/临时暴露 |
| **LoadBalancer** | 云厂商分配外部 LB | 云上生产入口 |
| **ExternalName** | DNS 别名（CNAME） | 引外部服务 |

进阶提示：生产入口通常是 **Ingress**（七层路由，按域名/路径分流）——知道名字即可，需要时再学。

## 3. 滚动更新（K8s 最亮的特性）

```bash
# 把镜像从 1.27 升到 1.28 —— 只改期望，控制器逐个替换 Pod
kubectl set image deployment/web nginx=nginx:1.28
kubectl rollout status deployment/web     # 盯着进度：逐个 Ready
```

默认策略是"先起新、新就绪、再杀旧"的滚动窗口，**全程不中断**。出问题？

```bash
kubectl rollout history deployment/web            # 看版本历史
kubectl rollout undo deployment/web               # 一键回滚到上一版
kubectl rollout undo deployment/web --to-revision=1   # 回到指定版
```

对比一下你 [灾备课程](../dr-backup/03-lb-failover) 里手工搭 Nginx+脚本切换的发布：K8s 把"蓝绿/滚动"做成了内建能力。

## 4. 扩缩容

```bash
kubectl scale deployment/web --replicas=5      # 手动扩
kubectl autoscale deployment/web --min=2 --max=6 --cpu-percent=70   # HPA 自动扩缩
kubectl get hpa                                 # 观察自动伸缩
```

HPA（水平自动扩缩）依据 CPU/内存水位自动增减副本——"流量高峰加机器、深夜缩容省钱"的自动化版本。

## 5. 常见误区

1. **YAML 手写不过 `selector` 这关** —— 三处标签（template.labels / selector.matchLabels / Service.selector）必须对应，改一处漏两处是高频事故
2. **apply 与 create 混用导致冲突** —— 一个资源从一而终用 apply 管理（git 里是什么，集群里就是什么）
3. **以为 Service 有负载均衡策略可调** —— 默认轮询即可覆盖 95% 场景，别在初学阶段深究

## 小结

- 声明式工作流：YAML 进 git，`apply` 提交期望，改文件再 apply 即变更
- 标签是粘合剂；Service 四型按暴露层级选
- 滚动更新 `set image` + `rollout undo`；HPA 自动扩缩

## 练习

1. 把 web.yaml 改成 3 副本的 ClusterIP Service（去掉 NodePort），apply 后用 `kubectl run tmp --rm -it --image=nginx -- curl web` 从集群内访问验证
2. 故意把镜像改成不存在的 `nginx:9.9`，apply 后 describe 观察失败事件，再 rollout undo 恢复
3. 压缩副本到 1，再 autoscale 到 min=2，观察它自动加回来的过程

👉 下一章：[运维基础与排障](./04-ops-basics)
