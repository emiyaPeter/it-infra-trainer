---
title: 模块化与工程实践
description: 学会编写与复用 Terraform 模块，掌握标准目录结构与团队协作规范
difficulty: advanced
estimatedTime: 80
prerequisites:
  - 03-state-vars
---

# 模块化与工程实践

第三个容器项目开始，你会发现自己在新抄前两个的 main.tf——这时候就该学模块了：**模块 = 带参数的一摞 .tf**，一次封装，处处复用。

## 1. 从"复制粘贴"到"调用模块"

```
改造前：每个项目 80 行 main.tf，改个镜像要改三处
改造后：每个项目 15 行，调用一个模块 + 传参
```

**module 块**（调用方视角）：

```hcl
module "web" {
  source = "./modules/docker-app"   # 本地模块路径
  name   = "tf-web"                 # 传参（模块的 variable）
  image  = "nginx:1.27"
  port   = 8080
}
```

**模块本体**（`modules/docker-app/` 目录）就是普通的三件套：

```hcl
# modules/docker-app/variables.tf —— 模块的"入参接口"
variable "name"  { type = string }
variable "image" { type = string }
variable "port"  { type = number }

# modules/docker-app/main.tf —— 用入参干活
resource "docker_container" "app" {
  name  = var.name
  image = var.image
  ports { internal = 80, external = var.port }
}

# modules/docker-app/outputs.tf —— 模块的"返回值"
output "container_id" {
  value = docker_container.app.id
}
```

```bash
terraform init     # 引入/更新模块时需重新 init
terraform apply
```

模块思想与编程函数完全同构：**variables=形参、outputs=返回值、source=import**——你在 [AI 课程](../ai-programming/)里学过的抽象直觉直接迁移。

## 2. 标准项目结构（可直接抄）

```
infra/
├── modules/              # 内部可复用模块（随项目走）
│   └── docker-app/
├── envs/                 # 每环境一个目录、一份 state
│   ├── dev/
│   │   ├── main.tf       # 只做一件事：调用模块+传参
│   │   ├── dev.tfvars
│   │   └── backend.tf    # （生产：远端 state 配置）
│   └── prod/
└── README.md             # 如何 init/plan/apply、环境说明
```

**分层原则**：`modules/` 只写"怎么建"，`envs/` 只写"要什么"——改规格去 envs，改方式去 modules。

## 3. 团队协作规范（Git 工作流）

```
1. 开分支改 .tf → terraform fmt && terraform validate
2. PR 里贴 terraform plan 的输出（reviewer 审的就是这个）
3. 合并后由负责人在 CI 或本地 apply（生产建议 CI 化）
4. state 在远端带锁，谁 apply 谁"持锁"，杜绝并发
```

这套流程的本质：**把基础设施变更纳入和代码完全相同的 review/审计轨道**——这正是第 1 章讲的 IaC 承诺的兑现方式。Terraform Cloud / Atlantis 等工具可自动执行"PR 自动 plan"，原理相同。

## 4. 什么时候不要抽象

- 两处相似代码 ≠ 立即抽模块：**三处以上、且变化方向一致**再抽
- 模块接口（variables）一旦被多项目依赖就很难改——接口设计从最小开始，按需加参数
- 小项目三个文件平铺就够了，结构服务于清晰而非好看

## 常见误区

1. **一上来把所有东西塞进一个巨型模块** —— "超级模块"比复制粘贴更难维护；按职责拆（网络/计算/数据库）
2. **模块不写 outputs，调用方拿不到结果** —— 模块边界上的数据全靠 outputs 传递，接口没设计好就返工
3. **envs 目录间互相 `terraform destroy` 销错环境** —— apply/destroy 前先 `terraform workspace show`/看目录/state 确认在哪个环境——养成"apply 前三看"：看目录、看 plan、看 state

## 小结

- 模块=带参的一摞 .tf：variables 入参、outputs 返回、source 引用
- 标准结构：modules 管"怎么建"，envs 管"要什么"，一环境一 state
- 协作核心：plan 进 PR、apply 走轨道、远端 state 带锁

## 练习（结业）

1. 把上一章的容器项目重构成 module + dev 环境调用
2. 加第二个 env（prod，端口不同），两个目录各自 apply 验证隔离
3. 给你的"终期项目"画一版 Terraform 化蓝图：哪些资源进哪个模块、envs 怎么分

👉 恭喜完成 Terraform 课程！回到 [课程目录](/courses/) 或 [阶段6 路线图](/roadmap/phase-6-automation)
