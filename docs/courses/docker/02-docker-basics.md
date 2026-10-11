---
title: Docker安装与基础命令
description: 安装Docker、docker run、常用命令速查
difficulty: beginner
estimatedTime: 90
---

# Docker 安装与基础命令

## 1. 安装 Docker Desktop (Windows)

从 docker.com 下载安装。安装后确保WSL2已启用。验证: `docker --version`

## 2. 核心命令速查

```bash
docker run -d -p 8080:80 --name my-nginx nginx   # 启动Nginx
docker ps                  # 运行中的容器
docker ps -a               # 所有容器
docker stop my-nginx       # 停止
docker start my-nginx      # 启动
docker rm my-nginx         # 删除
docker images              # 本地镜像列表
docker pull ubuntu:22.04   # 拉取镜像
docker rmi nginx           # 删除镜像
docker logs -f my-nginx    # 查看日志
docker exec -it my-nginx bash  # 进入容器shell
```

## 3. 动手实验

```bash
# 1. 启动Nginx
docker run -d -p 8080:80 --name web nginx
curl http://localhost:8080           # 看到欢迎页

# 2. 启动MySQL
docker run -d -p 3306:3306 --name db -e MYSQL_ROOT_PASSWORD=pass123 mysql:8

# 3. 进入MySQL容器
docker exec -it db mysql -uroot -ppass123
# 在容器内创建database、table，exit退出

# 4. 查看资源占用
docker stats
```

## 📺 免费资源
- [Docker 101 Tutorial](https://www.docker.com/101-tutorial/) — 官方交互教程
- [Play with Docker](https://labs.play-with-docker.com/) — 浏览器免安装练习
