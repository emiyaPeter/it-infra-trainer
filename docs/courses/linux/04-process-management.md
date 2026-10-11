---
title: Linux 进程管理 — 故障排查实战
description: 掌握进程生命周期、资源监控、性能分析和故障定位
difficulty: intermediate
estimatedTime: 120
prerequisites:
  - 01-command-line
---

# Linux 进程管理

进程管理是运维故障排查的核心技能。服务器变慢了、CPU 飙升了、内存泄漏了——你需要在几分钟内定位原因。

## 1. 进程基础概念

```
PID=1 (systemd/init)
 ├── PID=100 (sshd)
 │    └── PID=2001 (sshd: alice)     ← 一个 SSH 会话
 │         └── PID=2002 (bash)
 │              └── PID=2050 (top)
 ├── PID=200 (nginx master)
 │    ├── PID=201 (nginx worker)
 │    └── PID=202 (nginx worker)
 └── PID=300 (mysqld)
```

**关键状态：**
| 状态 | 代码 | 含义 |
|------|------|------|
| Running | R | 正在运行或在队列中 |
| Sleeping | S | 等待事件（大多数进程） |
| Uninterruptible Sleep | D | 等待 I/O（通常是磁盘） |
| Stopped | T | 被信号暂停 |
| Zombie | Z | 已终止但父进程未回收 |

## 2. 进程监控 — ps 实战

```bash
# 查看所有进程（BSD 风格）
ps aux

# 按 CPU 排序前 10
ps aux --sort=-%cpu | head -11

# 按内存排序前 10
ps aux --sort=-%rss | head -11

# 查看进程树
ps auxf
pstree -p

# 查看特定用户的进程
ps -u alice

# 查看进程启动时间（排查"进程什么时候起来的"）
ps -eo pid,lstart,cmd | grep nginx
```

## 3. 交互式监控 — top/htop

```bash
top      # 实时进程监控
  P      # 按 CPU 排序
  M      # 按内存排序
  k      # kill 进程（输入 PID）
  c      # 显示完整命令行
  1      # 显示每个 CPU 核心

htop     # 更友好的 top（推荐安装）
```

**top 输出解读：**
```
load average: 0.52, 0.63, 0.71
              │     │     └── 15 分钟平均
              │     └── 5 分钟平均
              └── 1 分钟平均

# 单核: load > 1  = 有进程在排队
# 4核:  load < 4   = 正常，load > 4 = 过载
```

## 4. 进程控制

```bash
# 后台运行
command &                         # 后台运行
nohup long-running-command &      # 忽略 HUP 信号（登出后继续）
Ctrl+Z → bg                       # 暂停 → 放到后台

# 信号
kill -l                           # 列出所有信号
kill -15 PID   # SIGTERM: 优雅终止（默认）
kill -9 PID    # SIGKILL: 强制杀死（无法被捕获）
kill -1 PID    # SIGHUP: 重新加载配置（很多服务用）
kill -19 PID   # SIGSTOP: 暂停进程
kill -18 PID   # SIGCONT: 继续进程
```

## 5. 性能故障排查 — 真实场景

### 场景1: CPU 100%

```bash
# 1. 找到吃 CPU 的进程
top -bn1 | head -20

# 2. 找到该进程中最忙的线程
top -H -p <PID>     # -H 显示线程

# 3. 如果进程名被伪装，检查它是什么
ls -l /proc/<PID>/exe
cat /proc/<PID>/cmdline | tr '\0' ' '

# 4. 如果是 Java 应用，用 jstack 看线程栈
jstack <PID> | grep -A 10 <TID_hex>

# 5. 分析是什么系统调用在消耗 CPU
strace -c -p <PID>    # 统计系统调用
perf top -p <PID>     # 函数级 CPU 分析
```

### 场景2: 内存泄漏

```bash
# 查看内存使用全景
free -h

# 按内存排序
ps aux --sort=-%rss | head -20

# 实时监控内存变化
watch -n 2 'ps aux --sort=-%rss | head -10'

# 查看进程的详细内存映射
cat /proc/<PID>/smaps | grep -E '^(Rss|Pss|Size)'

# 检查 OOM Killer 历史
dmesg | grep -i "out of memory"
grep -i "killed process" /var/log/syslog
```

### 场景3: 磁盘 I/O 瓶颈

```bash
# 查看 I/O 统计
iostat -x 1          # 每秒刷新
# 关注: %util (使用率) > 80% 说明 I/O 饱和
#       await (平均等待时间) > 10ms 通常有问题

# 找到吃 I/O 的进程
iotop

# 通过进程看 I/O
cat /proc/<PID>/io
```

## 6. 进程的极限 — 生产环境必须关注

```bash
# 查看当前限制
ulimit -a

# 关键设置（/etc/security/limits.conf）
alice    soft    nofile    65536    # 打开文件数
alice    hard    nofile    131072
alice    soft    nproc     4096     # 进程数

# 运行时修改
ulimit -n 65536     # 仅当前会话

# 检查进程的实际限制
cat /proc/<PID>/limits
```

## 7. 自测

<details>
<summary>1. Zombie 进程是什么？如何清理？</summary>

Zombie（僵尸）进程已经终止，但父进程没有调用 wait() 回收，所以还占用一个 PID 槽位。
- 少量僵尸无害，但大量僵尸会耗尽 PID
- 解决方法：kill 父进程，僵尸由 init 回收
- `ps aux | grep 'Z'` 找到僵尸，`ps -o ppid= -p <zombie_PID>` 找到父进程
</details>

<details>
<summary>2. kill -9 为什么是最后手段？</summary>

- SIGKILL 由内核直接终止进程，进程无法做任何清理
- 可能留下：临时文件、未刷新的数据、共享内存、锁文件
- 正确顺序：kill -15 (SIGTERM) → 等几秒 → kill -2 (SIGINT) → 还不行 → kill -9
</details>

<details>
<summary>3. 服务器 load average 很高但 CPU 使用率不高，什么原因？</summary>

通常是 **I/O 等待**导致的。进程在 D 状态等待磁盘：
- `iostat -x 1` 看磁盘 util%
- `ps aux | grep ' D'` 看哪些进程在 D 状态
- 可能是：磁盘故障、大量同步写入、NFS 挂载超时
</details>
