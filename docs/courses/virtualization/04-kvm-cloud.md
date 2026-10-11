---
title: KVM与云化虚拟化
description: Linux原生KVM虚拟化、virt-manager、模板与自动化部署
difficulty: intermediate
estimatedTime: 90
---

# KVM 与云化虚拟化

KVM是Linux内核自带的虚拟化模块，几乎所有公有云底层都用KVM。

## 1. KVM架构

```
┌─────────────────────────────────┐
│         Linux (Host)            │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ VM1  │ │ VM2  │ │ VM3  │   │
│  │KVM+qemu│KVM+qemu│KVM+qemu│  │
│  └──────┘ └──────┘ └──────┘   │
│       Linux Kernel + KVM        │
│          Physical HW            │
└─────────────────────────────────┘
```

## 2. 快速上手

```bash
# 检查KVM支持
egrep -c '(vmx|svm)' /proc/cpuinfo  # >0 表示支持
# 安装
sudo apt install qemu-kvm libvirt-daemon-system virt-manager
# 启动
sudo systemctl start libvirtd
sudo virt-manager  # 图形界面管理
```

## 3. 常用virsh命令

```bash
virsh list --all            # 列出所有VM
virsh start vm-name         # 启动
virsh shutdown vm-name      # 关机
virsh reboot vm-name        # 重启
virsh domiflist vm-name     # 查看网络接口
virsh dumpxml vm-name > vm.xml  # 导出配置
```

## 4. 模板化部署

企业用KVM的思路：创建黄金模板 → 克隆部署 → 注入个性化配置（IP/主机名）。开源工具Terraform+cloud-init可实现自动化。

## 📺 免费资源
- [KVM虚拟化详解](https://www.bilibili.com/video/BV1JW41167zK) — B站
- [KVM官方文档](https://www.linux-kvm.org/) — 官方
