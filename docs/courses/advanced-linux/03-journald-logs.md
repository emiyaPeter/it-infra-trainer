---
title: journald 与日志体系
description: journalctl 进阶过滤、日志持久化配置、logrotate 轮转与系统级排障的日志工作流
difficulty: advanced
estimatedTime: 80
prerequisites:
  - 02-process-debug
---

# journald 与日志体系

基础课用过 `journalctl -u 服务名`，本章把它用成"时间机器"：任意维度切片检索、跨服务还原事故时间线，并管好日志的"下半生"（持久化与轮转）。

::: tip WSL 注意
WSL2 的 systemd/journald 可用，但默认日志易失（重启即清）。想做持久化实验建议在 VirtualBox 虚拟机里；WSL 里以下命令大多可用，个别输出为空属正常。
:::

## 1. journalctl 的五个切片维度

```bash
# ① 按服务/单元
journalctl -u nginx -u mysql          # 多服务一起看（事故时间线！）

# ② 按时间
journalctl --since "2026-10-12 09:00" --until "2026-10-12 09:15"
journalctl --since "30 min ago"       # 相对时间

# ③ 按优先级
journalctl -p err                     # 只看错误及以上（err/warn/info...）
journalctl -p 3                       # 数字等价：0-emerg ... 7-debug

# ④ 按可执行文件 / PID / UID（进程视角）
journalctl /usr/sbin/nginx
journalctl _PID=3142
journalctl _UID=33                    # 某用户（如 www-data）的全部日志

# ⑤ 输出控制
journalctl -f                         # 实时追踪
journalctl -n 200 --no-pager          # 末尾 200 条，不进分页器
journalctl -o json-pretty             # 结构化输出（带全部元数据字段）
```

**事故还原的标准操作**：`--since` 圈定事发区间 + `-u` 拉入相关服务 + `-p err` 先看错误 → 一条时间线把"谁先出的问题"排出来。

## 2. 让日志活过重启（持久化）

默认 journald 日志存内存/易失目录，重启即丢。生产必开持久化：

```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald
ls /var/log/journal/                  # 出现机器 ID 目录 = 生效
```

限制磁盘占用（防日志吃满盘——上一章 IO 教训的应用）：

```ini
# /etc/systemd/journald.conf
SystemMaxUse=500M        # 总量上限
MaxRetentionSec=2week    # 保留时长
```

改完 `sudo systemctl restart systemd-journald`。

## 3. 传统日志与 logrotate

很多软件仍直接写文本日志（`/var/log/*.log`），它们靠 **logrotate** 管理生命周期：

```bash
# 看已有规则
ls /etc/logrotate.d/
cat /etc/logrotate.d/nginx

# 手动演练一轮（排障时确认规则生效）
sudo logrotate -d /etc/logrotate.d/nginx   # dry-run：只演示不动手
sudo logrotate -f /etc/logrotate.d/nginx   # 强制执行一次
```

给自研服务写一条最小可用规则：

```
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily              # 每天轮转
    rotate 14          # 保留 14 份历史
    compress           # 历史压缩
    missingok          # 文件不存在不报错
    notifempty         # 空文件不轮转
    copytruncate       # 先复制再清空原文件（应用无需重启，简单场景够用）
}
```

## 4. 系统级日志排障工作流

```
1. 圈时间：事故发生的精确区间（监控/告警给出的时间戳）
2. 先看错误：journalctl --since X --until Y -p err
3. 拉服务：把可疑的 2-3 个服务 -u 拼进同一条命令 → 输出即时间线
4. 补内核：journalctl -k 同区间（磁盘/网络/OOM 的内核侧证词）
5. 下钻应用：按 ④ 的进程维度切，或直接读应用文本日志
6. 结论写进工单：时间线 + 证据行 + 处置动作
```

## 常见误区

1. **grep 万能论** —— journalctl 的结构化字段（_PID/_UNIT/时间）比 grep 纯文本精准得多；先切维度再 grep
2. **持久化没开就接生产** —— 重启一次现场全没；装机清单里就该有 `mkdir /var/log/journal`
3. **轮转配置只写不验** —— `logrotate -d` 干跑一次 30 秒，避免"自以为配了"（typo 导致规则从未生效是高频坑）

## 小结

- 五维切片：单元/时间/优先级/进程/输出——组合即时间线
- 持久化三步 + 容量上限；文本日志交给 logrotate（写完必 -d 验证）
- 排障=圈时间→错误→多服务时间线→内核证词→应用下钻

## 练习

1. 查你的机器上周三全天的 err 级日志（若持久化未开，先开启再攒几天）
2. 用一条命令输出 nginx + php 两个服务在事发 10 分钟的合并时间线
3. 给任意自建服务的日志写 logrotate 规则并 `-d` 演练，截图存档

👉 下一章：[安全加固清单](./04-hardening)
