---
title: HCL 语法与第一次 apply
description: 掌握 HCL 块结构与资源语法，用 Docker provider 完成从 init 到 apply 的完整闭环
difficulty: intermediate
estimatedTime: 90
prerequisites:
  - 01-iac-concepts
---

# HCL 语法与第一次 apply

本章在 WSL2 里用 Docker provider 实操——**不需要任何云账号和费用**，随建随销。语法与工作流和操作 AWS/Azure/阿里云完全一致。

## 1. 安装 Terraform

```bash
# WSL2 Ubuntu 内（官方 APT 仓库）
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/terraform.gpg
echo "deb [signed-by=/usr/share/keyrings/terraform.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/terraform.list
sudo apt update && sudo apt install terraform
terraform version
```

## 2. HCL 语法三件套

Terraform 文件（`*.tf`）由三种核心块构成：

```hcl
# ① provider 块：声明用哪家"驱动"
terraform {
  required_providers {
    docker = {
      source = "kreuzwerker/docker"   # 社区维护的 Docker provider
    }
  }
}
provider "docker" {}                  # 本地 Docker，无需凭证

# ② resource 块：声明"要一个什么东西"（核心，占日常代码 80%）
resource "docker_container" "web" {   # 资源类型.本地名字
  name  = "tf-web"
  image = docker_image.nginx.image_id # 引用另一个资源（见下）
  ports {
    internal = 80
    external = 8080
  }
}
resource "docker_image" "nginx" {
  name = "nginx:1.27"
}

# ③ output 块：声明"执行完给我看什么"
output "访问地址" {
  value = "http://localhost:8080"
}
```

**关键语法——引用**：`资源类型.名字.属性`（如 `docker_image.nginx.image_id`）。资源之间靠引用建立依赖，Terraform 自动算出"先拉镜像再建容器"的顺序——你不用写先后逻辑。

## 3. 走完整个工作流

```bash
mkdir tf-demo && cd tf-demo
# 把上面的内容存为 main.tf，然后：

terraform init      # 下载 docker provider 插件（一次性）
terraform plan      # 预演！输出：+ docker_image.nginx  + docker_container.web
terraform apply     # 输入 yes 确认 → 真实创建
terraform output    # 看输出：访问地址
curl localhost:8080 # Nginx 欢迎页 —— 你的 IaC 第一步成功了

# 幂等验证：再来一次
terraform apply     # 输出：No changes. —— 声明已满足，什么也不做

# 收拾桌子
terraform destroy   # 输入 yes → 容器与镜像按依赖倒序销毁
```

注意 plan/apply 输出的三色语言：`+` 创建、`~` 就地修改、`-` 销毁。**看懂这三列是 Terraform 使用者的第一素养**——尤其 `-`，plan 里出现计划外的销毁行时，绝不回车。

## 4. 修改会发生什么？

```bash
# 把 main.tf 里容器名从 tf-web 改成 tf-web-v2
terraform plan
# 输出：- docker_container.web（旧的销毁）+ docker_container.web-v2（新建）
# Docker provider 对容器只支持"替换"（销毁重建）；
# 云上的很多属性（如磁盘扩容）则支持 ~ 就地修改
```

**替换 vs 修改由 provider 决定**，plan 会提前告诉你——这也是 plan 值钱的原因。

## 常见误区

1. **改完代码忘了 plan 就 apply** —— Terraform 默认 apply 前也会展示计划，但别依赖最后防线，plan-审-apply 当成一个动作
2. **手改了资源再 apply 报冲突** —— 比如手动 docker rm 了容器；Terraform 会尝试"纠偏"回声明状态（理解了下一章的 state 就全懂了）
3. **把密钥写进 .tf** —— provider 凭证走环境变量；`.tf` 进 git，密钥绝不进 git（[AI 课程](../ai-programming/05-ai-safety-quality)的老朋友了）

## 小结

- 三块语法：provider（驱动）、resource（要什么）、output（看什么）；引用建立依赖
- 工作流四步在 Docker 上零成本跑通；幂等=重复 apply 无副作用
- plan 三色语言：+ 建 ~ 改 - 删；计划外的 `-` 绝不回车

## 练习

1. 再加一个 resource：第二个容器跑 `redis:7`，apply 后 `docker ps` 验证
2. 故意把镜像标签写错（nginx:9.9），plan 看懂报错再修复
3. destroy 之后 `docker ps -a` 确认"桌子"真收拾干净了

👉 下一章：[状态管理与变量](./03-state-vars)
