---
title: Prometheus 入门
description: 部署Prometheus、配置采集目标、编写PromQL查询
difficulty: intermediate
estimatedTime: 90
---

# Prometheus 入门

Prometheus是云原生监控的事实标准，CNCF毕业项目。

## 1. Docker 快速启动

```bash
docker run -d -p 9090:9090 -v ~/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

## 2. 配置采集目标

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']   # 需要node_exporter
```

## 3. PromQL 常用查询

```promql
rate(node_cpu_seconds_total[5m])          # CPU使用率
node_memory_MemAvailable_bytes / 1024^3   # 可用内存GB
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)  # CPU使用百分比
```

## 4. 动手实验

```bash
# 启动node_exporter暴露本机指标
docker run -d --net=host --name node_exporter prom/node-exporter
# 配置Prometheus采集它 → 访问 http://localhost:9090 → 执行PromQL
```

## 📺 免费资源
- [Prometheus官方文档](https://prometheus.io/docs/) — 最佳
- [PromQL教程](https://www.youtube.com/watch?v=5OjUqN9i5Y0) — YouTube
