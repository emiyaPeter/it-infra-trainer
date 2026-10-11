# 阶段4：虚拟化技术

> 🎯 **目标**：理解虚拟化原理，熟练使用主流 Hypervisor  
> ⏱ **建议时长**：2 个月（每天 1-2 小时）  
> 📊 **难度**：⭐⭐ 基础  

## 学习内容

- **虚拟化原理**：Type 1 vs Type 2 Hypervisor、CPU 虚拟化 (VT-x/AMD-V)
- **VirtualBox 精通**：VM 创建、快照/克隆、网络模式 (NAT/Bridged/Host-Only)
- **VMware vSphere 概念**：ESXi、vCenter、vMotion（理论为主）
- **KVM/QEMU**：Linux 原生虚拟化、virt-manager、virsh
- **Hyper-V**：Windows 自带虚拟化（Win11 Pro+）

## 实验环境

- VirtualBox（主力）
- 在 VirtualBox Ubuntu VM 中嵌套启用 KVM（了解即可）

## 里程碑

创建 3 台 VM 的内部网络：1 台 Ubuntu Server 作为路由器 + 2 台作为客户端，配置静态路由使它们互通。

👉 [下一阶段 →](/roadmap/phase-5-containers)
