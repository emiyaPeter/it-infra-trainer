---
title: Docker Compose 多容器编排
description: 用Compose一键启动全套微服务、网络与卷管理
difficulty: intermediate
estimatedTime: 90
---

# Docker Compose 多容器编排

单个`docker run`只能启动一个容器。Compose用YAML文件定义并启动整套服务栈。

## 1. Compose 文件示例

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: ./app
    ports: ["8080:3000"]
    depends_on: [db, redis]
    environment:
      DB_HOST: db
  db:
    image: postgres:15-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_PASSWORD: secret
  redis:
    image: redis:7-alpine
volumes:
  pgdata:
```

## 2. 核心命令

```bash
docker compose up -d        # 启动所有服务
docker compose down         # 停止并清理
docker compose logs -f web  # 查看日志
docker compose ps           # 服务状态
docker compose restart web  # 重启单个服务
```

## 3. 动手实验

```bash
# 创建 docker-compose.yml (上面那个) → 执行:
docker compose up -d
curl localhost:8080
docker compose down
```

## 📺 免费资源
- [Docker Compose 官方教程](https://docs.docker.com/compose/gettingstarted/)
- [Compose实战 (中文)](https://www.bilibili.com/video/BV1Qp4y1X7NY)
