---
title: AWS 核心服务实战
description: EC2、S3、VPC、IAM——AWS最核心4个服务快速上手
difficulty: intermediate
estimatedTime: 120
---

# AWS 核心服务实战

AWS是全球最大公有云，运维面试必备。注册免费层即可动手。

## 1. EC2 — 云虚拟机

```bash
# AWS CLI创建EC2（装好AWS CLI并配置后）
aws ec2 run-instances --image-id ami-0c55b159cbfafe1f0 --instance-type t2.micro --key-name MyKey
```

免费层：每月750小时t2.micro/t3.micro（=1台一直开着）。

## 2. S3 — 对象存储

```bash
aws s3 mb s3://my-bucket-name           # 创建桶
aws s3 cp file.txt s3://my-bucket/      # 上传
aws s3 ls s3://my-bucket/               # 列表
aws s3 presign s3://my-bucket/file.txt  # 生成临时下载链接
```

## 3. VPC — 虚拟私有云

```
Internet → IGW → Public Subnet (Web) → NAT GW → Private Subnet (DB)
```
VPC = 你的私有网络。Public子网有公网IP，Private子网只能内部访问。

## 4. IAM — 权限管理

AWS安全第一课：不用root账号！创建IAM用户 → 给最小权限 → 启用MFA。用户/组/角色三种身份，策略用JSON描述权限。

## 📺 免费资源
- [AWS免费层](https://aws.amazon.com/free/) — 注册开始实操
- [AWS入门 (freeCodeCamp)](https://www.youtube.com/watch?v=3hLmDS179YE) — 2小时
- [AWS Skill Builder](https://skillbuilder.aws/) — 官方免费培训
