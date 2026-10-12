---
title: 状态管理与变量
description: 理解 state 文件的本质与安全守则，掌握变量/输出的工程写法与多环境隔离
difficulty: intermediate
estimatedTime: 80
prerequisites:
  - 02-hcl-basics
---

# 状态管理与变量

上一章你可能已经注意到：项目里多了个 `terraform.tfstate`。**理解这个文件，就理解了 Terraform 的一半**。

## 1. state 文件：Terraform 的"账本"

Terraform 的每次 plan/apply，都在做同一件事：

```
期望（你的 .tf） vs 现实（哪来的？）
                    ↑
              查 state 账本：上次 apply 后世界长这样
```

云上/本地的真实资源千千万，Terraform **只认识账本里记着的**。三个推论：

1. **丢了 state = 丢了资源的"户口"** —— 资源还在，但 Terraform 不认了（无法再管理/销毁）
2. **手改资源 = 账实不符** —— 下次 apply 会按声明"纠偏"（可能删掉你手动建的东西）
3. **绝不能两人同时 apply** —— 账本写坏；生产必须用远端带锁的 state（见第 3 节）

::: warning state 安全红线
`terraform.tfstate` **明文包含敏感值**（数据库密码等），且绝不能手工编辑。处理守则：进 .gitignore；备份它（就是备份基础设施的户口本）；泄露即视为事故。
:::

## 2. 变量与输出：让代码可复用

```hcl
# variables.tf —— 声明输入变量
variable "container_name" {
  description = "容器名"
  type        = string
  default     = "tf-web"
}
variable "replica_ports" {
  type    = list(number)
  default = [8080]
}

# main.tf 里引用：var.名字
resource "docker_container" "web" {
  name  = var.container_name
  image = docker_image.nginx.image_id
}

# outputs.tf —— 声明输出
output "容器名" {
  value = docker_container.web.name
}
```

赋值的三种方式（优先级从低到高）：

```bash
terraform apply                              # 用 default
terraform apply -var="container_name=prod"   # 命令行
terraform apply -var-file="prod.tfvars"      # 变量文件（推荐）
```

**工程意义**：同一套 .tf，不同 .tfvars = 不同环境/不同规格——代码复用的最小单位。

## 3. 环境隔离：目录 vs 工作区

| 方案 | 做法 | 适合 |
|------|------|------|
| **目录隔离**（推荐起步） | `envs/dev/main.tf`、`envs/prod/main.tf` 各带自己的 state | 边界清晰、误伤概率低 |
| 工作区 workspace | 同一目录 `terraform workspace select prod` 切换 state | 轻量但容易切错 |

远端 state（生产标配）：state 存到带锁的对象存储（S3+DynamoDB、阿里云 OSS 等），团队共享且 apply 期间自动加锁——本地学习阶段知道概念与时机即可。

## 4. 一个实用的命令清单

```bash
terraform fmt          # 格式化所有 .tf（进 git 前跑）
terraform validate     # 语法检查（不联网）
terraform state list   # 账本里都管着什么
terraform show         # 看账本明细
terraform taint <资源> # 标记"强制重建"（下次 apply 销毁重建它）
```

## 常见误区

1. **state 提交进 git** —— 双重问题：敏感值泄露 + 多人账本混乱；`.gitignore` 写好再 init
2. **用 kubectl/docker 手改了 Terraform 管的资源** —— 账实不符，下次 apply 会被"纠偏"惊吓；管理权要么全给 Terraform，要么全不给
3. **变量满天飞** —— 默认值覆盖 80% 场景，只把"随环境变化的"提取成变量；过度参数化比重复代码还难维护

## 小结

- state=账本：Terraform 的世界=声明+账本；丢账本=丢管理权
- 红线：不进 git、要备份、不手编、不并发 apply
- 变量+tfvars 让一套代码多环境；起步用目录隔离

## 练习

1. 给上一章的项目加 variables.tf（容器名+端口），用 -var 覆盖跑一次
2. `terraform state list` 看账本；手动 `docker rm` 容器后 plan，观察"纠偏"计划
3. 把项目复制成 dev/prod 两个目录，各自 apply，体验目录隔离

👉 下一章：[模块化与工程实践](./04-modules-practice)
