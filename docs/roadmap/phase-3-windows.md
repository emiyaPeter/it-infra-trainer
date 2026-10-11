# 阶段3：Windows Server 管理

> 🎯 **目标**：能管理企业 Windows Server 环境，特别是 Active Directory 域服务  
> ⏱ **建议时长**：2 个月（每天 1-2 小时）  
> 📊 **难度**：⭐⭐ 基础  

## 为什么还需要学 Windows Server？

虽然 Linux 统治了服务器市场，但企业内网的**身份认证、桌面管理、文件共享**几乎离不开 Windows Server + Active Directory。作为 IT 基础设施工程师，你需要理解两种生态。

## 学习内容

- Windows Server 安装与初始配置（Server Core vs Desktop）
- Active Directory 域服务：域控制器、用户/组/OU 管理
- 组策略管理 (GPO)：安全策略、软件部署、桌面管控
- Windows DNS 与 DHCP 服务
- PowerShell 自动化管理
- 文件服务器与共享权限 (SMB/CIFS)

## 实验环境

使用 **VirtualBox** + **Windows Server 2022 Evaluation**（180天免费），搭建至少 2 台 VM：
- DC01：主域控制器 + DNS + DHCP
- Client01：Windows 10/11 加入域的客户端

## 下一阶段

👉 [阶段4：虚拟化技术 →](/roadmap/phase-4-virtualization)
