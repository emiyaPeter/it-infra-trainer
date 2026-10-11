---
title: "Shell 脚本编程"
description: "从零到能写自动化脚本——变量、条件、循环、函数、实战项目"
difficulty: intermediate
estimatedTime: 180
prerequisites: ["01-command-line", "02-file-permissions"]
---

# Shell 脚本编程

Shell 脚本是 IT 基础设施工程师的自动化利器。从备份脚本到批量部署，从监控到日志分析，一切重复性工作都应该脚本化。

## 第一个脚本

```bash
#!/bin/bash
# 这是我的第一个脚本
echo "Hello, IT Engineer!"
echo "当前时间: $(date)"
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"
```

```bash
# 保存为 hello.sh，然后：
chmod +x hello.sh
./hello.sh
```

**重要约定**：
- `#!/bin/bash` — 指定解释器（shebang）
- 使用 `set -e` 让脚本在出错时立即退出
- 使用 `set -u` 让脚本在使用未定义变量时报错
- 使用 `set -o pipefail` 让管道中任何命令失败都导致脚本失败

```bash
#!/bin/bash
set -euo pipefail  # 安全的脚本从这里开始
```

## 变量

```bash
#!/bin/bash
# 变量赋值（等号两边不能有空格！）
name="张三"
age=25
current_dir=$(pwd)      # 命令替换
files_count=$(ls | wc -l)

# 使用变量
echo "你好, $name"
echo "年龄: ${age}岁"    # {} 用于区分变量边界
echo "当前目录: ${current_dir}"
echo "文件数: $files_count"

# 特殊变量
echo "脚本名: $0"
echo "第一个参数: $1"
echo "所有参数: $@"
echo "参数个数: $#"
echo "脚本进程ID: $$"
echo "上一条命令退出码: $?"
```

## 条件判断

```bash
#!/bin/bash
# if 语句

read -p "输入一个数字: " num

if [ "$num" -gt 10 ]; then
    echo "大于 10"
elif [ "$num" -eq 10 ]; then
    echo "等于 10"
else
    echo "小于 10"
fi

# 常用测试条件
# [ -f file ]  文件存在且是普通文件
# [ -d dir  ]  目录存在
# [ -z str  ]  字符串为空
# [ -n str  ]  字符串非空
# [ str1 = str2 ]  字符串相等
# [ num1 -eq num2 ] 数字相等
# [ num1 -gt num2 ] 大于
# [ num1 -lt num2 ] 小于

# 实际例子：检查服务状态
if systemctl is-active --quiet nginx; then
    echo "Nginx 正在运行"
else
    echo "Nginx 未运行，尝试启动..."
    sudo systemctl start nginx
fi
```

## 循环

```bash
#!/bin/bash

# for 循环
echo "=== 批量创建文件 ==="
for i in {1..5}; do
    touch "file_${i}.txt"
    echo "创建 file_${i}.txt"
done

# 遍历列表
echo "=== 检查服务 ==="
services=("nginx" "mysql" "redis")
for svc in "${services[@]}"; do
    if systemctl is-active --quiet "$svc"; then
        echo "✅ $svc 运行中"
    else
        echo "❌ $svc 未运行"
    fi
done

# while 循环
echo "=== 倒计时 ==="
count=5
while [ $count -gt 0 ]; do
    echo "$count..."
    sleep 1
    ((count--))
done
echo "开始!"

# 读取文件每一行
echo "=== 处理日志 ==="
while IFS= read -r line; do
    if echo "$line" | grep -q "ERROR"; then
        echo "发现错误: $line"
    fi
done < /var/log/syslog 2>/dev/null || echo "(需要 sudo 权限)"
```

## 函数

```bash
#!/bin/bash

# 定义函数
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2
}

check_disk_usage() {
    local threshold=${1:-80}  # 默认阈值 80%，local=局部变量
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ "$usage" -gt "$threshold" ]; then
        log_error "磁盘使用率 ${usage}% 超过阈值 ${threshold}%"
        return 1
    else
        log_info "磁盘使用率 ${usage}%，正常"
        return 0
    fi
}

# 使用函数
log_info "开始系统检查..."
check_disk_usage 90
```

## 实战：系统监控脚本

```bash
#!/bin/bash
set -euo pipefail

# ============================================
# 系统监控脚本
# 检查：磁盘、内存、CPU负载、关键服务
# ============================================

LOG_FILE="/var/log/system-check.log"
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_MEM=90

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 磁盘检查
check_disk() {
    log "检查磁盘使用率..."
    df -h | grep -vE '^Filesystem|tmpfs|devtmpfs' | while read -r line; do
        usage=$(echo "$line" | awk '{print $5}' | sed 's/%//')
        mount=$(echo "$line" | awk '{print $6}')
        if [ "$usage" -gt "$ALERT_THRESHOLD_DISK" ]; then
            log "⚠️  警告: $mount 使用率 ${usage}%"
        fi
    done
}

# 内存检查
check_memory() {
    log "检查内存使用率..."
    total=$(free -m | awk '/^Mem:/{print $2}')
    used=$(free -m | awk '/^Mem:/{print $3}')
    usage=$(( used * 100 / total ))
    log "内存: ${used}MB / ${total}MB (${usage}%)"
    if [ "$usage" -gt "$ALERT_THRESHOLD_MEM" ]; then
        log "⚠️  警告: 内存使用率 ${usage}%"
    fi
}

# 服务检查
check_services() {
    log "检查关键服务..."
    for svc in nginx mysql docker; do
        if systemctl is-active --quiet "$svc" 2>/dev/null; then
            log "  ✅ $svc"
        else
            log "  ⚠️  $svc 未运行或未安装"
        fi
    done
}

# CPU负载
check_load() {
    log "检查CPU负载..."
    load=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
    cores=$(nproc)
    log "负载: $load (CPU核心数: $cores)"
}

# 主流程
main() {
    log "========== 系统检查开始 =========="
    check_disk
    check_memory
    check_load
    check_services
    log "========== 系统检查完成 =========="
}

main
```

## 脚本调试技巧

```bash
# 方法1：运行时开启调试
bash -x script.sh       # 打印每条执行的命令
bash -n script.sh       # 语法检查（不执行）

# 方法2：脚本内开启
#!/bin/bash
set -x   # 开启调试
# ... 需要调试的代码 ...
set +x   # 关闭调试

# 方法3：打印变量值
echo "DEBUG: variable=$variable"
echo "DEBUG: $(declare -p variable)"  # 打印变量类型和值
```

## 动手实验

创建一个实用的备份脚本：

```bash
#!/bin/bash
# 需求：备份 /etc 目录到 ~/backups/，文件名含日期
# 保留最近 7 天的备份，自动删除旧的

BACKUP_DIR="$HOME/backups"
SOURCE="/etc"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

FILENAME="etc-backup-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "正在备份 $SOURCE 到 $BACKUP_DIR/$FILENAME ..."
sudo tar -czf "$BACKUP_DIR/$FILENAME" "$SOURCE" 2>/dev/null

echo "清理 ${RETENTION_DAYS} 天前的旧备份..."
find "$BACKUP_DIR" -name "etc-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "当前备份列表:"
ls -lh "$BACKUP_DIR/"
```

## 自测题

1. `$@` 和 `$*` 有什么区别？
2. `set -e` 的作用是什么？为什么推荐使用？
3. 脚本中 `[ "$a" = "$b" ]` 和 `[[ $a == $b ]]` 有什么区别？

<details>
<summary>点击查看答案</summary>

1. `$@` 保留参数中的引号（"arg1" "arg2" with spaces），`$*` 把所有参数合并成一个字符串。几乎总是用 `$@`
2. `set -e` 让脚本在任何命令返回非零退出码时立即退出，防止错误被忽略导致更严重的问题
3. `[ ]` 是 POSIX 标准的 test 命令，`[[ ]]` 是 Bash 的扩展，支持 `&&`、`||`、正则匹配 (`=~`)，且不需要对变量加引号。推荐在 Bash 脚本中用 `[[ ]]`
</details>
