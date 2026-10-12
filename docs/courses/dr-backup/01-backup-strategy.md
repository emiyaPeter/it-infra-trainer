---
title: 备份策略与实战 — 3-2-1 原则
description: 理解 RPO/RTO 两个核心指标，掌握 3-2-1 备份原则与全量/增量/差异组合，动手写备份脚本并验证可恢复性
difficulty: intermediate
estimatedTime: 90
---

# 备份策略与实战

"有没有备份"不是问题，"**备份能不能恢复出来**"才是。无数事故的剧本都是：备份一直在跑，出事后才发现从来没验证过。

## 1. 两个先问自己的指标

| 指标 | 问题 | 例子 |
|------|------|------|
| **RPO**（恢复点目标） | 最多能接受丢多少数据？ | RPO=1小时 = 最多丢 1 小时内的变更 |
| **RTO**（恢复时间目标） | 最多能接受停多久？ | RTO=4小时 = 4 小时内必须恢复服务 |

RPO 决定**备份频率**，RTO 决定**恢复方案**（从备份文件恢复慢，热备/双活快）。先和业务方对齐数字，再谈技术选型——这是方案设计的起点。

## 2. 3-2-1 原则（行业黄金标准）

```
3 份数据 ：1 份生产 + 2 份备份
2 种介质 ：例如 磁盘 + 磁带/NAS/对象存储
1 份异地 ：防火、防水、防勒索的最后底牌
```

::: warning 勒索软件时代的新解读
"异地"不等于"另一台能互相访问的服务器"。勒索软件会加密它能挂载的所有盘。真正有效的是**离线或不可变存储**（对象存储版本锁定/WORM、磁带、快照隔离）。
:::

## 3. 全量 / 增量 / 差异

| 类型 | 备份内容 | 恢复所需 | 特点 |
|------|----------|----------|------|
| 全量（Full） | 全部数据 | 仅最新全量 | 恢复最快，占用最大 |
| 增量（Incremental） | 距上次**任意备份**的变化 | 全量+一串增量 | 最省空间，恢复链条最长最脆 |
| 差异（Differential） | 距上次**全量**的变化 | 全量+最新差异 | 折中，链条最多两节 |

生产常用组合：**周日全量 + 每日增量**（或差异），保留 4-8 周。

## 4. 动手：Linux 备份脚本（WSL2 可练）

```bash
#!/bin/bash
# /opt/scripts/backup-app.sh — 全量打包 + 校验 + 清理过期备份
set -euo pipefail

SRC="/var/www/myapp"
DEST="/backup"
STAMP=$(date +%F)
ARCHIVE="$DEST/myapp-$STAMP.tar.gz"

# 1. 打包（-p 保留权限）
tar -czpf "$ARCHIVE" -C "$(dirname "$SRC")" "$(basename "$SRC")"

# 2. 校验和 —— 备份完整性的"封条"
sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"

# 3. 只保留 14 天
find "$DEST" -name "myapp-*.tar.gz*" -mtime +14 -delete

echo "[$(date)] 备份完成: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"
```

配合 systemd timer（阶段2 学过）每日 2 点执行：

```ini
# /etc/systemd/system/backup-app.timer
[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now backup-app.timer
systemctl list-timers | grep backup
```

## 5. 恢复演练（大多数事故的痛点）

备份必须**定期抽检恢复**：

```bash
# 验证校验和
sha256sum -c /backup/myapp-2026-10-12.tar.gz.sha256

# 恢复到隔离目录（不要直接覆盖生产！）
mkdir /tmp/restore-test
tar -xzpf /backup/myapp-2026-10-12.tar.gz -C /tmp/restore-test
diff -r /var/www/myapp /tmp/restore-test/myapp | head
```

**数据库的特殊性**：直接拷贝运行中的数据库文件=备份到"半开状态"。要用数据库原生工具（`mysqldump --single-transaction`、`pg_dump`、Redis `BGSAVE` 后复制 rdb），或先快照再备份。

## 常见误区

1. **备份和源在同一块盘/同一台机器**——盘毁全毁，不算 3-2-1
2. **从不验证恢复**——sha256 对得上 ≠ 能跑起来；至少每季度做一次真实恢复演练
3. **脚本没有 `set -euo pipefail` 和告警**——备份静默失败半年无人知（配合阶段7 的监控做告警）
4. **没有文档化的恢复步骤**——出事当晚的你不记得命令顺序

## 小结

- RPO 定频率、RTO 定方案；3-2-1 + 不可变存储
- 周期：全量+增量；执行：tar/systemd timer；底线：定期真恢复

## 练习

1. 在 WSL2 给自己的目录做"周日全量+每日差异"脚本（提示：`find -newer` 找变化文件）
2. 故意篡改备份文件一个字节，验证 sha256 校验能发现
3. 给自己负责的某个真实数据源回答：RPO/RTO 各是多少？现在是多少？差距就是风险

👉 下一章：[RAID 与单机冗余](./02-raid-ha)
