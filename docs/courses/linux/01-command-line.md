---
title: "Linux入门与命令行"
description: "掌握Linux文件系统结构和最常用的20个命令"
difficulty: beginner
estimatedTime: 120
prerequisites: []
---

# Linux入门与命令行

## Linux 文件系统结构

Linux 的一切都是文件——目录是文件、硬盘是文件、甚至进程也是文件。文件系统是一棵倒置的树，根是 `/`。

```
/                          根目录（一切从这里开始）
├── /bin                   基本命令（ls, cp, mv, cat...）
├── /boot                  启动文件（内核、grub）
├── /dev                   设备文件（硬盘、键盘、鼠标...）
├── /etc                   系统配置文件 ⭐ 非常重要
│   ├── /passwd            用户账户信息
│   ├── /shadow            用户密码（加密）
│   ├── /hostname          主机名
│   ├── /hosts             静态主机名映射
│   ├── /nginx/            Nginx 配置
│   └── /ssh/              SSH 配置
├── /home                  用户主目录（你的文件放这里）
│   └── /username          ~ = 当前用户主目录
├── /lib                   共享库文件
├── /media                 挂载的可移动设备（U盘等）
├── /mnt                   临时挂载点
├── /opt                   第三方软件（自己安装的放这）
├── /proc                  进程和系统信息（虚拟文件系统）
│   └── /cpuinfo           CPU信息
├── /root                  root用户主目录
├── /run                   运行时数据（重启后清空）
├── /sbin                  系统管理命令（需要root权限）
├── /tmp                   临时文件（所有用户可读写，重启可能清空）
├── /usr                   用户程序和数据
│   ├── /bin               更多用户命令
│   ├── /lib               更多库文件
│   ├── /local             本地编译安装的软件
│   └── /share             共享数据（文档、图标...）
└── /var                   可变数据 ⭐ 重要
    ├── /log               日志文件⭐（排查问题必看）
    ├── /lib               应用状态数据（数据库文件等）
    └── /spool             队列（打印队列、邮件队列）
```

**必须记住的目录**：`/etc`（配置）、`/var/log`（日志）、`/home`（用户数据）、`/tmp`（临时文件）

## 基本命令速成

### 文件和目录操作

```bash
# 导航
pwd                       # 显示当前目录 (Print Working Directory)
ls                        # 列出文件
ls -l                     # 详细列表（权限、大小、时间）
ls -la                    # 包括隐藏文件（.开头的文件）
ls -lh                    # 人类可读的文件大小（1K, 234M, 2G）
cd /path/to/dir           # 切换目录 (Change Directory)
cd ~                      # 回到主目录
cd -                      # 回到上一个目录
cd ..                     # 上一级目录

# 文件操作
cat file.txt              # 显示文件全部内容
less file.txt             # 分页查看（q退出，/搜索）
head -n 20 file.txt       # 看前20行
tail -n 20 file.txt       # 看后20行
tail -f /var/log/syslog   # 实时追踪日志（Ctrl+C退出）⭐
touch newfile.txt         # 创建空文件 / 更新文件时间戳

# 目录和文件管理
mkdir newdir              # 创建目录
mkdir -p a/b/c/d          # 创建多级目录
cp source dest            # 复制文件
cp -r source/ dest/       # 复制目录（递归）
mv source dest            # 移动/重命名文件
rm file.txt               # 删除文件（小心！没有回收站）
rm -r dir/                # 删除目录（递归）
rm -rf dir/               # 强制删除目录（非常危险！）⚠️

# 查找
find /path -name "*.log"  # 按文件名查找
find /path -type f -mtime -7  # 查找7天内修改的文件
grep "error" file.log     # 在文件中搜索文本
grep -r "error" /var/log/ # 递归搜索目录 ⭐
grep -i "error" file.log  # 忽略大小写
grep -v "debug" file.log  # 排除匹配的行
```

### 管道和重定向 ⭐ 核心概念

这是 Linux 命令行的精髓——把简单命令组合成强大的数据处理流水线。

```bash
# > 重定向输出（覆盖）
echo "hello" > file.txt       # 把输出写进文件（覆盖原内容）

# >> 重定向输出（追加）
echo "world" >> file.txt      # 追加到文件末尾

# < 重定向输入
sort < file.txt               # 把文件内容作为sort的输入

# | 管道：把一个命令的输出传给另一个命令 ⭐
cat /var/log/syslog | grep error                    # 找到含error的行
cat /var/log/syslog | grep error | wc -l            # 统计error行数
cat /var/log/syslog | grep error | sort | uniq -c   # 统计每种error出现次数
ps aux | grep nginx | awk '{print $2}'              # 获取nginx的进程ID

# 常用管道组合
history | grep ssh                    # 查找历史上用过的ssh命令
ls -l | sort -k5 -n                  # 按文件大小排序
du -sh * | sort -h                   # 查看哪个目录占用空间最大⭐
cat access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10
# ↑ 分析日志：TOP10访问最多的IP
```

### 文本处理三剑客

```bash
# grep — 文本搜索
grep "ERROR" app.log                     # 搜索ERROR行
grep -B 2 -A 5 "ERROR" app.log          # 显示匹配行的前2行和后5行
grep -E "(error|warning|critical)" app.log  # 正则匹配多个关键词

# sed — 流编辑器（查找替换）
sed 's/foo/bar/' file.txt               # 替换每行第一个foo为bar
sed 's/foo/bar/g' file.txt              # 替换所有foo为bar
sed -i 's/foo/bar/g' file.txt           # 直接修改文件（小心！）
sed -n '10,20p' file.txt                # 显示第10到20行

# awk — 文本分析工具
awk '{print $1}' file.txt               # 打印第1列
awk '{print $1, $NF}' file.txt          # 打印第1列和最后1列
awk -F: '{print $1, $3}' /etc/passwd   # 用:分割，打印第1和第3列
awk '$3 > 1000 {print $1}' /etc/passwd  # UID大于1000的用户
```

### 权限相关

```bash
chmod 755 file.sh           # 修改权限（详见下一章）
chown user:group file.txt   # 修改所有者
sudo command                # 以root身份执行命令（Super User DO）
```

### 进程和服务

```bash
ps aux                     # 查看所有进程
ps aux | grep nginx        # 查找nginx进程
top                        # 实时进程监控（q退出）
htop                       # 更好看的top（可能需要安装）
kill 1234                  # 终止进程（PID=1234）
kill -9 1234               # 强制终止（最后手段）⚠️
pkill nginx                # 按名称终止进程
systemctl status nginx     # 查看服务状态
systemctl start/stop/restart nginx  # 管理服务
journalctl -u nginx -f     # 查看服务日志
```

### 网络

```bash
ip addr                    # 查看IP地址
ip route                   # 查看路由表
ping -c 4 google.com       # 测试连通性
curl http://example.com    # HTTP请求
curl -I http://example.com # 只看响应头
wget https://example.com/file.tar.gz  # 下载文件
ss -tlnp                   # 查看监听端口
```

### 其他实用命令

```bash
echo "hello"               # 输出文本
which command              # 查看命令的路径
whereis command            # 查找命令的二进制、源码和手册
date                       # 显示日期时间
history                    # 命令历史
!123                       # 执行历史中编号123的命令
!!                         # 重复上一条命令（常用于sudo !!）
sudo !!                    # 以sudo重复上一条命令⭐
man command                # 查看命令手册（Manual，q退出）
command --help             # 快速查看命令帮助
alias ll='ls -la'          # 创建命令别名
df -h                      # 磁盘使用情况
du -sh *                   # 当前目录各文件夹大小
free -h                    # 内存使用情况
uptime                     # 系统运行时间和负载
```

## 动手实验

打开 WSL2 Ubuntu 终端，完成以下任务：

```bash
# 1. 探索文件系统
ls /
ls /etc
ls /var/log

# 2. 创建目录和文件
mkdir -p ~/labs/linux-basics
cd ~/labs/linux-basics
echo "Hello Linux" > hello.txt
echo "Hello World" >> hello.txt
cat hello.txt

# 3. 练习管道
cat hello.txt | grep World
ls -la /etc | wc -l          # /etc 下有多少文件？

# 4. 查看系统信息
df -h                        # 磁盘使用
free -h                      # 内存使用
uptime                       # 运行时间
cat /proc/cpuinfo | grep "model name" | head -1  # CPU型号

# 5. 创建命令别名
alias ll='ls -la'
ll ~/
```

## 自测题

1. `/etc`、`/var/log`、`/home` 分别存放什么？
2. `>` 和 `|` 有什么区别？
3. 如何找到一个正在使用 8080 端口的进程并杀掉它？

<details>
<summary>点击查看答案</summary>

1. `/etc` = 系统配置文件；`/var/log` = 日志文件；`/home` = 用户个人文件和目录
2. `>` 把输出重定向到文件；`|` 把输出传给另一个命令作为输入
3. `ss -tlnp | grep 8080` 找到进程PID，然后 `kill <PID>`。或者一条命令：`kill $(lsof -t -i:8080)`
</details>

## 📺 免费配套资源

**视频：**
- [Linux入门 (freeCodeCamp 6小时)](https://www.youtube.com/watch?v=sWbUDq4S6Y8) — 覆盖本章全部内容
- [韩顺平Linux一周入门](https://www.bilibili.com/video/BV1Sv411r7vd) — 中文最佳零基础课
- [最常用50条Linux命令](https://www.bilibili.com/video/BV1d4411d7qk) — 快速过一遍

**在线练习（强烈推荐）：**
- [linuxjourney.com](https://linuxjourney.com/) — 交互式分步学习，无痛入门
- [overthewire.org/bandit](https://overthewire.org/wargames/bandit/) — 游戏闯关，从Level 0开始
- [explainshell.com](https://explainshell.com/) — 粘贴任何命令，逐参数解释

**电子书：**
- [The Linux Command Line (免费PDF)](https://linuxcommand.org/tlcl.php) — 共500页，本章覆盖前4章内容

