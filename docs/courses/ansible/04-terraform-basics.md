---
title: Terraform 基础设施即代码
description: 用代码管理云资源——声明式创建AWS/阿里云服务器
difficulty: intermediate
estimatedTime: 90
---

# Terraform 基础设施即代码

Terraform是IaC的事实标准。用HCL语言描述"我想要什么"，它自动创建。

## 1. 核心理念

```
你写: "我要一台t3.micro EC2，在us-east-1，带这个安全组"
Terraform: 自动调用AWS API创建，并记录状态
```

## 2. 基本工作流

```bash
terraform init      # 初始化（下载provider插件）
terraform plan      # 预览变更（不会真的执行）
terraform apply     # 执行
terraform destroy   # 销毁所有资源
```

## 3. 示例

```hcl
provider "aws" { region = "us-east-1" }
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  tags = { Name = "WebServer" }
}
```

## 4. 学习建议

注册AWS/Azure免费层 → 写Terraform创建免费资源 → terraform destroy删除（不花钱）。从不在控制台点鼠标开始——一切用代码。

## 📺 免费资源
- [Terraform入门 (freeCodeCamp)](https://www.youtube.com/watch?v=SLB_c_ayRMo) — 1小时
- [HashiCorp官方教程](https://developer.hashicorp.com/terraform/tutorials)
