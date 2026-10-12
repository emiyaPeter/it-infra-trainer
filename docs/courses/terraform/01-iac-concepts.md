---
title: IaC 思维与 Terraform 定位
description: 理解手工运维的不可持续性，建立 IaC 思维，厘清 Terraform 与 Ansible 的分工边界
difficulty: intermediate
estimatedTime: 60
prerequisites:
  - ../ansible/04-terraform-basics.md
---

# IaC 思维与 Terraform 定位

## 1. 手工运维的四个死穴

| 死穴 | 场景 |
|------|------|
| **不可复现** | "测试环境谁搭的？照着再搭一台" ——没人记得点了哪些按钮 |
| **不可审计** | 安全问"这台机器为什么开着 3306？"——查无对证 |
| **不可回滚** | 改错安全组，服务断了——上一版是什么来着？ |
| **不可规模化** | 200 台机器打同一个补丁，手点到明年 |

IaC 的回答：**基础设施 = 代码文件**。建机器 = `apply` 一个 main.tf；改配置 = 改代码提交 git；重来一遍 = 再 apply 一次。代码有的好处（版本/审计/review/回滚），基础设施全有了。

## 2. 声明式 IaC 的心智模型

```hcl
resource "docker_container" "web" {
  name  = "my-web"
  image = "nginx:1.27"
}
```

你声明"**我要一个叫 my-web 的容器**"，Terraform 负责达成。再 apply 一次？它对比现实与声明，发现已存在 → 不动。删掉这行再 apply？它把容器删掉。**幂等**是 IaC 与"脚本堆砌"的本质区别。

## 3. Terraform vs Ansible：分工而非竞争

| 维度 | Terraform | Ansible |
|------|-----------|---------|
| 主要对象 | **创建/销毁**基础设施（虚机、网络、数据库实例） | **配置**已存在的机器（装软件、改配置、启服务） |
| 模式 | 声明式 + 状态文件 | 过程式为主（Playbook 顺序执行） |
| 典型时机 | 项目之初开荒 | 机器就位后装修 |
| 类比 | 买地盖楼 | 水电装修 |

生产组合拳很常见：**Terraform 开资源 → Ansible 配置**（也有全 Terraform 阵营，看你团队生态）。

## 4. 核心工作流（先背下来）

```
编写 .tf → terraform init    拉取 provider 插件（装驱动）
        → terraform plan    预演：将创建/修改/销毁什么（只读不改！）
        → terraform apply   执行（实质=把 plan 变成现实）
        → terraform destroy 销毁全部（实验环境的"收拾桌子"）
```

**plan 是 Terraform 的安全带**：任何 apply 前先 plan，看懂那三列（+ 要建 / ~ 要改 / - 要删）再按回车。养成这个习惯，能躲掉 90% 的事故。

## 常见误区

1. **"有了 Terraform 还学 Ansible 干嘛"** —— 两者管的对象不同（创建 vs 配置），岗位 JD 里也常同时出现
2. **把 .tf 当 shell 脚本写过程逻辑** —— HCL 是声明式的，写"怎么做"会处处别扭；写"要什么"则处处顺畅
3. **跳过 plan 直接 apply** —— 生产环境的经典事故剧本；plan 免费，事故昂贵

## 小结

- IaC 四卖点：可复现、可审计、可回滚、可规模化
- 声明式 + 幂等：只说"要什么"，重复执行无副作用
- Terraform 开荒（创建）、Ansible 装修（配置）；工作流：init→plan→apply→destroy

## 练习

1. 把你（或想象中的）一次手工部署经历，翻译成"如果当时有 IaC"的对照表
2. 用一句话向非技术朋友解释"什么是基础设施即代码"
3. 记忆工作流四步，下一章逐一体检

👉 下一章：[HCL 语法与第一次 apply](./02-hcl-basics)
