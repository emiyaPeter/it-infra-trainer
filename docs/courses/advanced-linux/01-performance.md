---
title: 性能分析入门 — 服务器变慢的分诊法
description: 掌握负载三要素与 vmstat/iostat/sar 三件套，建立 CPU/内存/IO 的快速分诊流程
difficulty: advanced
estimatedTime: 90
prerequisites:
  - ../linux/04-process-management.md
---

# 性能分析入门

"服务器慢"是运维最常接到的一句话，也是最模糊的。本章给你一套**分诊流程**：五分钟内把"慢"翻译成"哪个子系统、什么压力"。

## 1. 第一步永远是看负载

```bash
uptime
# 20:15:01 up 10 days,  3 users,  load average: 2.10, 1.85, 1.60
#                                              ↑1分钟 ↑5分钟 ↑15分钟
```

**load average = 等待 CPU + 等待 IO 的任务数**（Linux 含不可中断 IO 等待）。判读法：

- 负载 ≈ CPU 核数 → 健康（满负荷但吃得下）
- 负载 > 核数 × 2 → 有拥塞，进入分诊
- 三个数字的**趋势**比绝对值更有信息量：1 分钟 > 15 分钟 = 正在恶化；反之在恢复

```bash
nproc        # 先知道自己有几核，负载永远相对核数而言
```

## 2. 分诊三件套

### vmstat——CPU 与内存总览（每 2 秒采样）

```bash
vmstat 2 5
# procs ────────memory────── ─swap─ ─────io──── ─system─ ─----cpu-----──
#  r  b        swpd   free   buff  cache   si so   bi bo   in cs us sy id wa
#  3  0           0 250000 120000 900000    0  0    5 15  1200 900 45  8 40  7
```

四列定乾坤：`r`（排队跑 CPU 的任务数，持续 > 核数 = CPU 饿）、`b`（卡在 IO 的任务数，>0 = IO 堵）、`si/so`（swap 进出，非零 = 内存不够开始换页）、`wa`（CPU 等 IO 的空闲占比，高 = 瓶颈在磁盘不在 CPU）。

### iostat——磁盘深度体检

```bash
iostat -xz 2 3
# Device  r/s   w/s   rkB/s  wkB/s  await  %util
# sda     80.0  120.0 3200   8500   45.20  92.50
```

盯两个：`await`（每个 IO 平均等待毫秒，机械盘 >20、SSD >10 就值得警惕）和 `%util`（设备繁忙度，长期 >80% = 磁盘饱和）。工具在 sysstat 包：`sudo apt install sysstat`。

### sar——回看历史（案发时不在现场？）

```bash
sar -u 2 5       # CPU 实时
sar -r           # 内存今天的历史曲线
sar -d           # 磁盘历史
sar -q           # 负载历史
```

sar 的杀手锏是**历史数据**（sysstat 会定时采样）：凌晨三点出的事故，早上看 sar 就能还原现场——这就是 [监控课程](../monitoring/) 里"监控是事后复盘的眼睛"在单机上的最小实现。

## 3. 分诊流程图（背下来）

```
uptime 负载高？
├─ vmstat: r 高、us/sy 高 ────────→ CPU 型：top 找吃 CPU 的进程
│                                  （sy 高=内核态，怀疑系统调用/线程风暴）
├─ vmstat: wa 高 / b 多 ──────────→ IO 型：iostat 找哪块盘、哪个进程
│                                  （pidstat -d 1 追进程级 IO）
├─ vmstat: si/so 非零 ────────────→ 内存型：free -m 确认，top 按 RES 排序找大户
└─ 都不高但就是慢 ────────────────→ 网络/锁/应用层：tcpdump、strace 上场
```

```bash
free -m         # available 才是关键列（buff/cache 可回收）
top             # 按 P（CPU）M（内存）排序，先看是"谁"
pidstat -d 1    # 进程级 IO（sysstat 自带）——找出"哪个进程在打爆磁盘"
```

## 4. 一次完整的分诊示范

```
现象：网站响应慢。uptime 负载 8（4 核机）→ 恶化中
vmstat 2 5：r=2, b=5, wa=65          → b 多 + wa 高 = IO 型
iostat -xz：sda %util 98, await 88   → sda 饱和，每个 IO 等 88ms
pidstat -d 1：PID 3142 wkB/s 60000   → 锁定进程
ls -l /proc/3142/cwd && ps -p 3142 -o cmd   → 是日志狂写的应用
处置：让开发降日志级别 / 挪日志到独立盘 → 复查 wa 回落
```

五分钟、四条命令、一条证据链——这就是分诊法的价值。

## 常见误区

1. **只看 CPU 使用率** —— `%CPU 100%` 不一定是坏事（算得动就让它算），负载和等待才是"慢"的本质
2. **free 看到剩余少就慌** —— Linux 拿空闲内存做 cache 是特性不是泄漏，看 `available`
3. **没有基线** —— 出事才第一次跑 sar，历史为空；平时让 sysstat 跑着，基线就是它的价值

## 小结

- 负载 = 等 CPU + 等 IO 的队列长度，相对核数判读、看趋势
- 三件套分工：vmstat 总览分诊、iostat 盯盘、sar 还原历史
- 分诊四分支：CPU/IO/内存/其他，每支都有下一步动作

## 练习

1. `stress-ng --cpu 4 --timeout 60` 制造 CPU 压力，用三件套观察并记录指标变化
2. `dd if=/dev/zero of=/tmp/big bs=1M count=2048` 制造 IO 压力，观察 wa/await/%util
3. 写一页你自己的《服务器慢分诊卡》：流程图 + 常用命令 + 你的机器的正常基线数值

👉 下一章：[进程调试与 OOM 取证](./02-process-debug)
