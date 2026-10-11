---
title: 监控基础概念
description: 理解Metrics/Logs/Traces三大支柱和告警设计原则
difficulty: beginner
estimatedTime: 60
---

# 监控基础概念

## 1. 可观测性三大支柱

| 支柱 | 回答的问题 | 工具 |
|------|-----------|------|
| Metrics 指标 | "系统现在状态如何？" | Prometheus |
| Logs 日志 | "发生了什么？" | ELK / Loki |
| Traces 追踪 | "请求走了哪些服务？" | Jaeger / Tempo |

## 2. 黄金四信号 (Google SRE)

- **延迟 Latency**: 请求花了多长时间
- **流量 Traffic**: 每秒多少请求
- **错误 Errors**: 失败率
- **饱和度 Saturation**: 资源快满了吗(CPU 80%+ / 磁盘 85%+)

## 3. 告警设计原则

- 告警必须有可操作的action——"磁盘90%"可以自动清理，才告警
- 避免告警疲劳——阈值合理（不用"CPU>50%"就告）
- 分级——P0(立即电话) / P1(30分钟) / P2(第二天)

## 📺 免费资源
- [Google SRE Book (免费)](https://sre.google/books/) — 监控哲学
- [Observability explained](https://www.youtube.com/watch?v=5JwM4vRkU7U) — 15分钟
