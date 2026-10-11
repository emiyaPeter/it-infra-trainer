---
title: Linux 存储与文件系统 — 运维实战
description: 掌握磁盘分区、LVM、文件系统管理、存储故障排查
difficulty: intermediate
estimatedTime: 120
prerequisites:
  - 01-command-line
  - 02-file-permissions
---

# Linux 存储与文件系统

磁盘满了、I/O 慢了、分区不够了——这些都是运维最常见的问题。本节从 lsblk 到 LVM 扩容，覆盖生产环境的存储管理。

## 1. 磁盘与分区速查

```bash
lsblk               # 以树形显示块设备（最常用）
lsblk -f            # 显示文件系统类型和 UUID
fdisk -l            # 查看分区表
df -h               # 查看挂载和使用量
du -sh /var/log/*   # 查看目录占用
du -h --max-depth=1 / | sort -hr | head -10  # 根目录占用 Top 10

# 查看磁盘详细信息
smartctl -a /dev/sda     # SMART 健康信息
hdparm -I /dev/sda       # 磁盘参数
```

## 2. 磁盘空间分析

```bash
# 磁盘满了，找到谁占的
df -h | grep -E '^/dev|Use%'

# 找出大文件（>100M）
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null

# 找出大目录
du -h --max-depth=1 /var | sort -hr

# 找已删除但仍占用空间的文件（常见于日志）
lsof | grep deleted             # 进程还持有文件的句柄
lsof +L1                        # 找 unlinked 但还在用的文件

# inode 耗尽检查（小文件太多）
df -i                           # inode 使用率
find / -type f | wc -l          # 总文件数
```

## 3. LVM 逻辑卷管理

LVM 是 Linux 磁盘管理的核心技能。它允许你动态调整分区大小而无需重启。

```
物理层:     /dev/sda (SSD 256G)    /dev/sdb (HDD 1T)
              │                       │
              ▼                       ▼
PV:       /dev/sda1 (250G PV)    /dev/sdb1 (1T PV)
              │                       │
              └─────────┬─────────────┘
                        ▼
VG:              vg_data (1.25T 卷组)
                        │
               ┌────────┼────────┐
               ▼        ▼        ▼
LV:       lv_root  lv_home  lv_data
            50G      200G     可选动态扩展
```

### LVM 创建流程

```bash
# 1. 创建 Physical Volume
pvcreate /dev/sdb1
pvdisplay                    # 查看 PV

# 2. 创建 Volume Group
vgcreate vg_data /dev/sdb1
vgextend vg_data /dev/sdc1   # 扩容 VG（加新盘）
vgdisplay

# 3. 创建 Logical Volume
lvcreate -L 100G -n lv_mysql vg_data
lvcreate -l 100%FREE -n lv_logs vg_data  # 用光剩余空间

# 4. 格式化并挂载
mkfs.ext4 /dev/vg_data/lv_mysql
mkdir /var/lib/mysql
mount /dev/vg_data/lv_mysql /var/lib/mysql

# 5. 永久挂载
echo '/dev/vg_data/lv_mysql /var/lib/mysql ext4 defaults 0 2' >> /etc/fstab
```

### LVM 在线扩容（运维高频操作）

```bash
# 场景：数据库磁盘快满了，在线扩容
# 0. 先确认有空间
vgdisplay vg_data | grep Free

# 1. 扩容 LV
lvextend -L +50G /dev/vg_data/lv_mysql     # 加 50G
# 或扩展到总容量的 100%
lvextend -l +100%FREE /dev/vg_data/lv_mysql

# 2. 扩展文件系统（ext4）
resize2fs /dev/vg_data/lv_mysql

# 对于 xfs
xfs_growfs /var/lib/mysql

# 3. 验证
df -h /var/lib/mysql
```

## 4. 文件系统类型选择

| 文件系统 | 特点 | 适用场景 |
|----------|------|----------|
| ext4 | 稳定、成熟，不支持快照 | 通用、系统盘 |
| xfs | 高性能、支持大文件 | 数据库、大文件存储 |
| btrfs | 快照、压缩、COW | 容器宿主机 |
| zfs | 数据完整性、快照、去重 | 存储服务器（需额外安装） |
| tmpfs | 内存文件系统 | /tmp, /run |

## 5. /etc/fstab 详解

```bash
# 设备             挂载点       类型   选项               dump  fsck
/dev/vg/lv_root    /            ext4   defaults            0     1
UUID=abc123...     /boot        ext4   defaults            0     2
UUID=def456...     swap         swap   sw                  0     0
tmpfs              /tmp         tmpfs  defaults,size=2G    0     0
//nas/backup       /mnt/backup  cifs   credentials=/etc/.nascred,vers=3.0  0 0
```

**挂载后用 `mount -a` 验证，重启前必须测试！**

```bash
mount -a          # 测试 fstab 配置（不重启）
findmnt --verify  # 检查挂载
```

## 6. 自测

<details>
<summary>1. df 显示磁盘使用率 100%，但 du 统计却远小于分区大小？</summary>

这是已删除但仍被进程占用的文件导致的：
- `lsof | grep deleted` 找到这些文件
- 重启占用进程释放文件句柄（或 `cat /dev/null > /proc/PID/fd/N`）
- 最常见：日志文件被删但服务没重启，日志还在往已删除的 fd 写
</details>

<details>
<summary>2. LVM 扩容的三个步骤是什么？</summary>

1. `lvextend -L +SIZE /dev/vg/lv` — 扩展逻辑卷
2. `resize2fs /dev/vg/lv` (ext4) 或 `xfs_growfs /mountpoint` (xfs) — 扩展文件系统
3. `df -h` — 验证

**全过程不需要卸载、不需要重启、服务不受影响（前提是有 Free PE）。**
</details>

<details>
<summary>3. 如何安全地替换故障磁盘？</summary>

```bash
# 如果做了 LVM 镜像 (mirror)/RAID
# 1. 标记 PV 为 failed
pvmove /dev/sdc     # 迁移数据到其他 PV
vgreduce vg_data /dev/sdc  # 从 VG 移除
# 2. 物理更换磁盘
# 3. 创建新 PV 并加入 VG
pvcreate /dev/sdd
vgextend vg_data /dev/sdd
```
</details>
