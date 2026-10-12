---
title: Linux 进阶课程
description: 4章进阶实战：性能分析三件套、进程调试与 OOM 取证、journald 日志体系、安全加固清单
---

# Linux 进阶课程

基础课（阶段2）让你"会用 Linux"，这门课让你"**能诊断和加固 Linux**"——从执行者到守护者的跨越。

## 适合谁？

- 完成 [Linux 系统管理](../linux/) 8 章基础
- 想处理"服务器变慢/进程异常/被扫描"这类开放性问题
- 面向中级运维岗的必经之路

## 课程目录

1. **[性能分析入门](./01-performance)** — 负载三要素、vmstat/iostat/sar 三件套、CPU/内存/IO 分诊法
2. **[进程调试与 OOM 取证](./02-process-debug)** — ps 深用、/proc 文件系统、lsof、strace、OOM Killer 现场勘查
3. **[journald 与日志体系](./03-journald-logs)** — journalctl 进阶、日志持久化、logrotate、系统级排障流程
4. **[安全加固清单](./04-hardening)** — SSH 加固、fail2ban、服务最小化、审计思路

## 实验环境

WSL2 Ubuntu 全程可用（journald 在 WSL 中部分功能受限的注意点已在相应章节标注），部分观察类实验建议在 VirtualBox 虚拟机中做。
