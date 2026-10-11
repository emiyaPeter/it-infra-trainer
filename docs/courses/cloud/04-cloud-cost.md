---
title: 云成本管理与FinOps
description: 成本优化、标签策略、防止账单爆炸
difficulty: intermediate
estimatedTime: 60
---

# 云成本管理

云最大的坑：忘记关资源，月底账单爆炸。成本管理是运维核心职责。

## 1. 成本失控常见原因

- 测试完没删EC2 → 跑了一个月
- 开了RDS没关 → 按小时计费
- S3被外部大量下载 → 流量费爆表
- 选了Provisioned IOPS但用不上 → 贵10倍

## 2. 成本控制方法

- **标签 Tag**: 每个资源打标签 `Environment=Dev` `Owner=TeamA` → 成本报告一目了然
- **Budget告警**: 设预算阈值——到80%发邮件
- **自动关机**: 非生产环境晚上自动关、早上开
- **选对规格**: 不用Provisioned IOPS就别勾；用Spot实例便宜90%

## 3. 动手实验

注册AWS → 开t2.micro EC2 → 装Nginx → 24小时后删除 → 查看Billing Dashboard。（t2.micro在免费层内，只要按时删除不收费）

## 📺 免费资源
- [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/) — 官方工具
- [FinOps Foundation](https://www.finops.org/) — 云财务管理最佳实践
