---
title: ELK 日志平台
description: Elasticsearch+Logstash+Kibana日志收集与搜索实战
difficulty: intermediate
estimatedTime: 90
---

# ELK 日志平台

集中管理所有服务器的日志——不用再一台台SSH查日志。

## 1. ELK 架构

```
App Server → Filebeat(采集) → Logstash(处理) → Elasticsearch(存储) → Kibana(展示)
```

## 2. Docker Compose 快速启动

```yaml
services:
  elasticsearch:
    image: elasticsearch:8.12.0
    environment: ["discovery.type=single-node","xpack.security.enabled=false"]
    ports: ["9200:9200"]
  kibana:
    image: kibana:8.12.0
    ports: ["5601:5601"]
    environment: ["ELASTICSEARCH_HOSTS=http://elasticsearch:9200"]
```

`docker compose up -d` → 访问 http://localhost:5601

## 3. 核心用途

- **集中搜索**: 100台服务器的日志在一个搜索框里查
- **故障定位**: 根据时间戳和关键词快速找错误
- **安全审计**: 所有SSH登录记录、sudo命令可追溯

## 📺 免费资源
- [ELK入门](https://www.youtube.com/watch?v=g7hOo4T7Btg) — YouTube
- [Elastic官方文档](https://www.elastic.co/guide/) — 完整参考
