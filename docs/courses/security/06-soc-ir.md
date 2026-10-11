---
title: 安全监控与应急响应 — 运维实战
description: 日志分析、入侵检测、应急响应流程全覆盖
difficulty: advanced
estimatedTime: 120
prerequisites:
  - ../02-network-security
  - ../03-system-hardening
---

# 安全监控与应急响应

"不是会不会被攻击，而是什么时候被发现"。本节教你检测和响应安全事件。

## 1. 日志分析基础

```bash
# 认证失败日志
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn

# SSH 暴力破解检测
lastb | head -20

# Web 攻击检测（检查异常请求）
grep -E "(SELECT|UNION|../../|/etc/passwd)" /var/log/nginx/access.log
```

## 2. 应急响应六步法

1. **确认** — 判断是否为真实安全事件（非误报）
2. **隔离** — 断网/关机，防止横向移动
3. **取证** — `dd if=/dev/sda of=/evidence/disk.img` 保存磁盘镜像
4. **清除** — 删除后门/malware、重置凭据
5. **恢复** — 从干净备份恢复服务
6. **复盘** — 写事故报告、改进防护

## 3. 关键命令

```bash
# 可疑进程
ps auxf | grep -v grep

# 异常网络连接
ss -tanp | grep ESTAB

# 新创建的文件
find / -mtime -1 -type f 2>/dev/null

# 可疑 crontab
cat /etc/crontab; ls /var/spool/cron/crontabs/
```

## 4. 自测

<details>
<summary>1. 发现服务器被入侵，第一件事做什么？</summary>
**不要慌张关机**（会丢失内存中的证据）。正确步骤：隔离网络 → 保留现场 → 通知上级 → 开始取证和响应。
</details>

<details>
<summary>2. 如何快速找到攻击者的 IP？</summary>
```bash
last -20             # 登录记录
grep Accepted /var/log/auth.log | tail -20  # 成功登录
ss -tanp             # 当前连接
```
</details>
