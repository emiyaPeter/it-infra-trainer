---
title: Terraform 与基础设施即代码
description: 4章掌握 IaC 思维与 Terraform 工作流：HCL 语法、init/plan/apply、状态管理、模块复用
---

# Terraform 与基础设施即代码

手点控制台建服务器，一次两次是效率，十次百次是灾难（没人记得改过什么、没法回滚、凌晨三点没法重建）。Terraform 用**代码描述基础设施**，一键创建、一键销毁、可版本、可审计——这就是 IaC（Infrastructure as Code）。

## 前置要求

- 完成 [自动化运维课程](../ansible/)（其中第 4 章已有 Terraform 概念入门，本课程是其深化）
- 一个 Docker 环境（WSL2 即可）——用 `kreuzwerker/docker` provider 做零成本实操，无需任何云账号
- 学完本课后若要上云：各云厂商均有免费额度，概念完全一致

## 课程目录

1. **[IaC 思维与 Terraform 定位](./01-iac-concepts)** — 手工 vs IaC、Terraform 与 Ansible 的分工、核心工作流
2. **[HCL 语法与第一次 apply](./02-hcl-basics)** — 块/参数/资源语法、init/plan/apply、用 Docker provider 实操
3. **[状态管理与变量](./03-state-vars)** — state 文件的本质与安全、变量与输出、环境隔离
4. **[模块化与工程实践](./04-modules-practice)** — 模块复用、目录组织、协作规范

## 学习心法

- Terraform 的所有魔力围绕一个文件：**state（状态）**。理解 state，一半的"玄学问题"（想删删不掉、apply 报冲突）瞬间透明
- 每章实操都在本地 Docker 上完成，**零云费、随建随销**
