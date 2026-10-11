---
title: Grafana 可视化实战
description: 创建仪表盘、配置告警、导入社区面板
difficulty: intermediate
estimatedTime: 60

prerequisites:
  - 02-prometheus
---

# Grafana 可视化实战

Prometheus存数据，Grafana画图。

## 1. Docker 启动

```bash
docker run -d -p 3000:3000 --name grafana grafana/grafana
# 访问 http://localhost:3000  admin/admin
# Data Sources → 添加 Prometheus (http://host.docker.internal:9090)
```

## 2. 导入社区仪表盘

Grafana.com有数千免费面板。最常用：Node Exporter Full (ID: 1860)。Import → 输入1860 → 选Prometheus数据源 → 即可看到完整服务器监控。

## 3. 告警配置

Alerting → Alert rules → 创建规则：`node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes < 0.1` → 磁盘<10%时告警。

## 📺 免费资源
- [Grafana入门](https://www.youtube.com/watch?v=w-c3KQ1Ut3c) — YouTube
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/) — 社区面板库
