---
title: 运维基础与排障
description: 掌握日志/调试/资源监控三板斧，理解探针与资源限额，建立 Pod 排障方法论
difficulty: intermediate
estimatedTime: 90
prerequisites:
  - 03-core-resources
---

# 运维基础与排障

应用跑起来只是开始。本章是 K8s 日常运维的"工具腰带"：看日志、进容器、限资源、配探针，以及一套排障方法论。

## 1. 三板斧：describe / logs / exec

```bash
# 第一刀：describe —— 状态与事件（85% 的问题在这暴露）
kubectl describe pod <pod名>
# 盯两处：Status（Running? Pending? CrashLoopBackOff?）
#         Events（底部）：镜像拉取失败？调度失败？探针失败？全在这

# 第二刀：logs —— 容器日志
kubectl logs <pod名>              # 当前日志
kubectl logs -f <pod名>           # 实时追踪（类似 tail -f）
kubectl logs --previous <pod名>   # 上一个已死容器的日志（崩溃排查神技）

# 第三刀：exec —— 进入容器内确认
kubectl exec -it <pod名> -- sh
# 进去后就是普通 Linux：curl localhost 自测、看进程、查配置
```

## 2. 读懂 Pod 状态机

| 状态 | 含义 | 第一反应 |
|------|------|----------|
| **Pending** | 没调度成/镜像拉不动 | describe 看 Events：资源不够？镜像名错？ |
| **ContainerCreating** | 正在创建 | 正常等待，拉镜像慢 |
| **Running** | 运行中 | 但要配 Ready 才算就绪 |
| **CrashLoopBackOff** | 反复启动反复崩 | `logs --previous` 看崩溃原因 |
| **Evicted** | 被节点驱逐 | 节点资源紧张（常见：磁盘压力） |

**Ready ≠ Running**：Running 只代表容器活着，Ready 还要求探针通过——这是下一节。

## 3. 探针：让 K8s 知道你"真的健康"

```yaml
# 在 Pod template 的 containers 里追加：
livenessProbe:                    # 存活探针：失败就重启容器
  httpGet: { path: /, port: 80 }
  initialDelaySeconds: 10
readinessProbe:                   # 就绪探针：失败就摘除流量（不重启）
  httpGet: { path: /, port: 80 }
```

两者分工（生产必配）：

- **liveness**：应用卡死（进程在但不响应）→ 重启大法
- **readiness**：应用暂时没准备好（启动中/依赖故障）→ 先别给我流量，恢复后再接

还记得 [灾备课程](../dr-backup/03-lb-failover) 里"健康检查必须真实打业务路径"的结论吗？同一原则在 K8s 里的制度化实现就是探针。

## 4. 资源限额：防止"一个邻居吃垮整栋楼"

```yaml
resources:
  requests: { cpu: "100m", memory: "128Mi" }   # 调度依据（保证最低）
  limits:   { cpu: "500m", memory: "256Mi" }   # 上限（超出内存=被杀 OOMKilled）
```

- `100m` = 0.1 核；`128Mi` = 128MB
- **requests 影响调度**（节点放不放得下），**limits 影响生死**（超内存限额的容器会被 OOMKill）
- 没有限额的容器是"流氓邻居"——生产环境必须逐容器声明

配套观测命令：

```bash
kubectl top pods            # 各 Pod 实时 CPU/内存（需要 metrics-server，minikube 自带）
kubectl top nodes           # 节点水位
```

## 5. 排障方法论（面试可直接用）

```
1. kubectl get pods —— 定位异常状态（Pending/Crash/NotReady）
2. kubectl describe pod —— Events 里 85% 有直接答案
3. 三分支：
   镜像/拉取问题 → 检查镜像名与仓库凭证
   调度问题     → 看 requests 是否大于节点容量
   运行问题     → logs（+--previous）看应用日志
4. 仍不通 → exec 进容器自证（网络/配置/依赖）
5. 怀疑网络 → Service selector 与 Pod labels 对不对上？
```

## 常见误区

1. **Not Ready 的 Pod 当成故障重启** —— 多半是 readiness 探针路径配错（比如健康接口是 /healthz 却写了 /），describe 里能看到探针失败
2. **OOMKilled 不看 limits 反复重启** —— describe 的 Last State 会写明 OOMKilled；调 limits 或查内存泄漏
3. **探针路径用 `/` 图省事** —— 首页 200 不代表依赖（数据库）正常；生产用专门的健康端点

## 小结

- 三板斧：describe（事件）、logs（含 --previous）、exec（自证）
- 状态机速查：Pending→调度、CrashLoop→日志、Evicted→节点压力
- 探针分工：liveness 重启、readiness 摘流量；requests 管调度、limits 管生死

## 练习

1. 给 web 加一个故意失败的 liveness（path: /nope），观察重启计数上涨，然后修好
2. 把内存 limits 设成 16Mi，观察 OOMKilled 循环，describe 里找到证据
3. 把 Service 的 selector 改错一个字母，验证流量消失——加深"标签即粘合剂"

👉 恭喜完成 Kubernetes 入门！回到 [课程目录](/courses/) 或用 [故障排查测验](../../quizzes/) 自测
