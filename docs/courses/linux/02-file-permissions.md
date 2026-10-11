---
title: Linux 文件系统与权限 — 生产实战
description: 掌握文件权限、ACL、特殊权限位，理解真实运维场景中的权限管理
difficulty: beginner
estimatedTime: 120
prerequisites:
  - 01-command-line
---

# Linux 文件系统与权限

文件权限是 Linux 安全的第一道防线。本节不只是讲 rwx，更要让你理解生产环境中的最佳实践。

## 1. Linux 文件系统结构

```
/          # 根目录，一切从这里开始
├── bin    # 基础命令 (/usr/bin 的链接)
├── boot   # 内核和引导文件
├── dev    # 设备文件
├── etc    # 配置文件 ⭐ 运维重点
├── home   # 用户主目录
├── lib    # 共享库
├── mnt    # 临时挂载
├── opt    # 第三方软件
├── proc   # 进程/内核信息 (虚拟文件系统)
├── root   # root 用户主目录
├── run    # 运行时数据 (tmpfs)
├── sbin   # 系统管理命令
├── sys    # 内核信息 (虚拟文件系统)
├── tmp    # 临时文件
├── usr    # 用户程序和数据
└── var    # 可变数据 (日志、缓存) ⭐ 运维重点
    ├── log    # 日志文件 → /var/log/syslog
    ├── lib    # 数据库文件 (MySQL/PG)
    └── www    # Web 根目录
```

## 2. 基本权限 (rwx)

```bash
$ ls -l
-rwxr-xr-x 1 root root 1234 Jan 1 12:00 script.sh
│└┬┘└┬┘└┬┘
│ │  │  └── Other (其他人)  r-x = 读+执行
│ │  └───── Group  (组)     r-x = 读+执行
│ └──────── Owner  (所有者) rwx = 读+写+执行
└────────── 类型: -文件 d目录 l链接
```

**权限数字速查：**

| 数字 | 权限 | 含义 |
|------|------|------|
| 0 | --- | 无权限 |
| 1 | --x | 执行 |
| 2 | -w- | 写 |
| 3 | -wx | 写+执行 |
| 4 | r-- | 读 |
| 5 | r-x | 读+执行 |
| 6 | rw- | 读+写 |
| 7 | rwx | 读+写+执行 |

**目录权限的特殊含义：**
- **r**: 可以 `ls` 列出文件名
- **w**: 可以创建/删除文件
- **x**: 可以 `cd` 进入，访问目录内文件

```bash
# 常见权限组合
chmod 755 script.sh    # rwxr-xr-x  — 所有人都能执行
chmod 644 config.txt   # rw-r--r--  — 所有人可读，仅 owner 可写
chmod 600 id_rsa       # rw-------  — 仅 owner 可读写 (私钥)
chmod 750 /home/user   # rwxr-x---  — owner 和 group，其他人无
chmod 700 ~/.ssh       # rwx------  — 仅 owner
```

## 3. 特殊权限位

### 3.1 SUID (Set User ID) — 数字 4

```bash
# passwd 命令可以修改 /etc/shadow（只有 root 可写）
# 因为 passwd 有 SUID 位，执行时以 root 身份运行
$ ls -l /usr/bin/passwd
-rwsr-xr-x 1 root root ... /usr/bin/passwd
     ↑ s = SUID

# 设置 SUID
chmod 4755 program   # 或 chmod u+s program
```

**⚠️ SUID 是安全审计重点：**

```bash
# 查找系统中所有 SUID 文件（安全巡检必须）
find / -perm -4000 -type f 2>/dev/null
```

### 3.2 SGID (Set Group ID) — 数字 2

```bash
# 目录设置 SGID 后，目录内新建文件自动继承目录的组
chmod 2775 /shared/project   # 或 chmod g+s /shared/project
ls -ld /shared/project
# drwxrwsr-x  →  s 在组权限位
```

### 3.3 Sticky Bit — 数字 1

```bash
# /tmp 目录：任何人都可以创建文件，但只能删除自己的文件
ls -ld /tmp
# drwxrwxrwt  →  t 代表 sticky bit

chmod 1777 /shared/public   # 或 chmod +t /shared/public
```

## 4. ACL (访问控制列表) — 精细权限

基础权限只有 owner/group/other 三维，ACL 允许为任意用户/组设置权限。

```bash
# 查看 ACL
getfacl file.txt

# 给特定用户加权限
setfacl -m u:alice:rwx file.txt
setfacl -m u:bob:r-- file.txt

# 给特定组加权限
setfacl -m g:devops:rwx file.txt

# 设置默认 ACL（目录内新文件自动继承）
setfacl -d -m u:alice:rwx /project

# 删除 ACL
setfacl -x u:alice file.txt

# 删除所有 ACL
setfacl -b file.txt
```

**ls -l 中 ACL 标记：** 权限末尾出现 `+` 号
```bash
$ ls -l
-rwxrwxr-x+ 1 root root ... file.txt  # ← + 表示有 ACL
```

## 5. 生产环境权限最佳实践

### Web 服务器 (Nginx/Apache)

```bash
# 网站目录 — owner 是部署用户，group 是 web 服务
chown -R deploy:www-data /var/www/html
find /var/www/html -type d -exec chmod 750 {} \;
find /var/www/html -type f -exec chmod 640 {} \;

# 上传目录需要 web 服务可写
chmod 770 /var/www/html/uploads
chown deploy:www-data /var/www/html/uploads
```

### SSH 安全配置

```bash
chmod 700 ~/.ssh           # 仅 owner
chmod 600 ~/.ssh/id_rsa    # 私钥
chmod 644 ~/.ssh/id_rsa.pub # 公钥
chmod 600 ~/.ssh/authorized_keys

# 如果权限太宽松，SSH 会拒绝使用
```

### 数据库目录

```bash
chown -R mysql:mysql /var/lib/mysql
chmod 750 /var/lib/mysql
# NEVER chmod 777 in production!
```

## 6. 审计与排查

```bash
# 查找权限过松的文件
find /var/www -type f -perm /o+w  # 检查是否有文件 others 可写

# 查找最近修改权限的文件
find /etc -type f -mtime -1 -ls

# 检查无主文件（用户已删除）
find / -nouser -o -nogroup 2>/dev/null

# 审计日志（auditd 记录权限变更）
ausearch -m chmod -ts recent
```

## 7. 自测

<details>
<summary>1. 某用户说能 ls 目录但 cd 不进去，什么原因？</summary>

目录有 r 权限但缺少 **x** 权限。目录需要 r+x 才能正常使用：
- r: 列出文件名
- x: 进入目录、访问文件
- 实际需要: `chmod +x /path/to/dir`
</details>

<details>
<summary>2. umask 是什么？默认值 022 意味着什么？</summary>

umask 是从默认权限中"减去"的掩码。默认文件权限 666、目录 777。
- umask 022 → 文件: 666-022=**644**，目录: 777-022=**755**
- umask 027 → 文件: **640**，目录: **750**（更安全，推荐生产环境用 027）
- 配置: `/etc/profile` 或 `~/.bashrc`
</details>

<details>
<summary>3. 为什么 /tmp 需要 sticky bit？</summary>

/tmp 是所有人共享的临时目录，如果没有 sticky bit，用户 A 可以删除用户 B 创建的文件。sticky bit 确保"只有文件 owner 可以删除自己的文件"，这是多用户系统的基本安全措施。
</details>
