---
title: 进程调试与 OOM 取证
description: 深用 ps 与 /proc，掌握 lsof/strace 两把手术刀，学会 OOM Killer 现场勘查与预防
difficulty: advanced
estimatedTime: 90
prerequisites:
  - 01-performance
---

# 进程调试与 OOM 取证

上一章找到"哪个进程"之后，本章继续深挖：它在干什么？为什么死了？——工具从"体温计"升级到"手术刀"。

## 1. ps 的正确打开方式

```bash
# 查树：进程的父子关系（谁拉起了谁）
ps -ef --forest | less

# 查线程：一个进程里的所有线程在干嘛（-L）
ps -Lp <PID> -o pid,tid,pcpu,stat,wchan:30,comm

# 查资源细节：常驻内存、启动时间、完整命令行
ps -p <PID> -o pid,ppid,rss,vsz,lstart,etime,args
```

高频场景——找占用最高的三个进程并显示完整命令：

```bash
ps -eo pid,pcpu,pmem,rss,args --sort=-rss | head -4
```

## 2. /proc：进程的"病历本"

每个进程在 `/proc/<PID>/` 下有一个目录，几个关键文件：

```bash
cat /proc/<PID>/status     # 状态总览：内存、线程数、父进程
ls -l /proc/<PID>/cwd      # 它的工作目录在哪
ls -l /proc/<PID>/exe      # 它真正跑的是哪个程序（排查伪装进程）
cat /proc/<PID>/cmdline    # 完整启动命令（参数用\0分隔）
cat /proc/<PID>/limits     # 它的资源限制（文件数、进程数）
```

**实战价值**：进程"看不见、杀不死、来路不明"时，/proc 给的都是第一手事实——不依赖任何命令的包装。

## 3. 两把手术刀

### lsof——它打开了什么

```bash
lsof -p <PID>              # 该进程打开的全部文件/网络/管道
lsof -i :8080              # 谁在监听/使用 8080 端口（端口占用排查第一名）
lsof +D /var/log           # 谁在往这个目录里写文件
```

经典案例：磁盘满了 `rm` 了日志但空间没回来——`lsof | grep deleted` 找到还握着已删文件句柄的进程，重启它才真正释放（这就是"删除了但没释放"的真相）。

### strace——它在和内核说什么

```bash
strace -p <PID>            # 附加观察（看它卡在哪个系统调用）
strace -f -e trace=file,network ./myapp   # 启动并跟踪：文件+网络调用
# -f 跟子进程；-e 过滤只看某类调用；-c 统计汇总模式
```

适用场景：**进程活着但不干活**（八成卡在某个系统调用上）。strace 输出最后一行往往是答案：死等一个不存在的文件？连接一个不通的地址？注意 strace 会显著拖慢目标进程，生产上只做短时诊断。

## 4. OOM Killer：Linux 的"弃车保帅"

物理内存耗尽时，内核会挑一个"最该死"的进程杀掉腾内存——被杀进程的日志里没有任何遗言，应用日志戛然而止。**取证现场在内核日志里**：

```bash
# 方法一：journalctl（WSL 下部分环境不可用，见下一章）
journalctl -k | grep -i -A3 "out of memory"
# 方法二：直接翻内核环形缓冲区（通用）
dmesg -T | grep -i -A3 "out of memory"
# 典型输出：
# Out of memory: Killed process 3142 (java) total-vm:8GB, anon-rss:6.2GB ...
#                                        ↑ 凶手视角：吃了 6.2G 物理内存
```

**确认进程是被 OOM 杀的**三步：应用日志无报错戛然而止 → dmesg 有 OOM 记录 → systemd 显示 `oom-kill`（`systemctl status <svc>` 的原因列）。

**预防三板斧**：

```bash
# 1) 给关键服务设内存硬顶（systemd 单元里）
[Service]
MemoryMax=2G
# 2) 保护关键进程不被优先选中（分数越低越不容易被杀）
echo -1000 > /proc/<PID>/oom_score_adj
# 3) 治本：要么加内存，要么修那个泄漏/超大配置的应用
```

## 常见误区

1. **进程消失就怀疑"崩溃"** —— 先查 OOM（dmesg 一分钟的事）；"被系统处决"和"自己崩溃"的处理方向完全不同
2. **strace 挂上去看几小时** —— 它开销大，只做短观察；长期行为用上一章的采样工具
3. **删了文件以为释放了空间** —— 句柄还在就空间不还；`lsof | grep deleted` 找真凶

## 小结

- ps 看结构、/proc 看事实、lsof 看关联、strace 看内核对话
- "删了没释放"→ lsof deleted；"活着不干活"→ strace 看卡点
- 进程无声消失先查 OOM：dmesg 取证 + MemoryMax 设顶 + oom_score_adj 保关键

## 练习

1. 用 `ps -eo ... --sort=-rss | head` 找出你 WSL 里最大的三个进程，去 /proc 看它们的 exe 与 cmdline
2. 写个吃内存脚本（python 循环 append），触发 OOM 前用 systemd MemoryMax 限住它，观察行为差异
3. `tail -f` 一个日志时另开终端删掉它，用 lsof 复盘"句柄未释放"

👉 下一章：[journald 与日志体系](./03-journald-logs)
