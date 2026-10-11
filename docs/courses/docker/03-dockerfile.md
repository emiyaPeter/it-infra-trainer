---
title: Dockerfile编写与镜像构建
description: 编写生产级Dockerfile、多阶段构建、最佳实践
difficulty: intermediate
estimatedTime: 90
---

# Dockerfile 编写与镜像构建

## 1. Dockerfile 基础指令

```dockerfile
FROM node:18-alpine                    # 基础镜像（越小越好）
WORKDIR /app                           # 工作目录
COPY package*.json ./                  # 先复制依赖文件（利用缓存）
RUN npm ci --production                # 安装依赖
COPY . .                               # 复制源码
EXPOSE 3000                            # 声明端口
USER node                              # 非root运行
CMD ["node", "server.js"]              # 启动命令
```

## 2. 最佳实践

- **使用alpine版本**（node:18-alpine = 50MB vs node:18 = 350MB）
- **多阶段构建**：编译阶段用大镜像，运行阶段只复制产物
- **利用缓存**：先COPY不常变的文件(package.json)，再COPY源码
- **不用root**: USER指令切换非root用户
- **不要放密钥**：用 .dockerignore 排除 .env

## 3. 动手：构建并推送

```bash
docker build -t myapp:v1 .
docker run -d -p 3000:3000 myapp:v1
docker tag myapp:v1 dockerhub用户名/myapp:v1
docker push dockerhub用户名/myapp:v1
```

## 📺 免费资源
- [Dockerfile Best Practices (官方)](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [多阶段构建教程](https://www.youtube.com/watch?v=yiF4N00FRNs)
