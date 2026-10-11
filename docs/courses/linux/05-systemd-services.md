---
title: Linux 服务管理 (systemd) — 运维核心
description: 掌握 systemd 服务编写、管理、排查，覆盖 90% 的运维日常
difficulty: intermediate
estimatedTime: 90
prerequisites:
  - 01-command-line
  - 04-process-management
---

# Linux 服务管理 (systemd)

systemd 是现代 Linux（Ubuntu 16.04+、CentOS 7+、Debian 8+）的标准初始化系统。编写和管理 systemd 服务是运维工程师的日常基本功。

## 1. systemctl 核心命令

```bash
# 服务状态
systemctl status nginx
systemctl is-active nginx
systemctl is-enabled nginx
systemctl list-units --state=failed    # 查看失败的单元

# 启停控制
systemctl start nginx
systemctl stop nginx
systemctl restart nginx
systemctl reload nginx        # 重载配置（不中断服务）
systemctl daemon-reload       # 重新加载所有 unit 文件

# 开机自启
systemctl enable nginx
systemctl disable nginx
systemctl list-unit-files | grep enabled

# 查看日志
journalctl -u nginx            # nginx 的全部日志
journalctl -u nginx -f         # follow 模式
journalctl -u nginx --since "10 minutes ago"
journalctl -u nginx -p err     # 仅错误级别
```

## 2. 编写 systemd Service 文件

一个生产级的 service 文件：

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application Service
Documentation=https://docs.myapp.com
After=network.target
Requires=postgresql.service      # 依赖（PG 挂了也停）

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/server --config /etc/myapp/config.yaml
ExecStop=/bin/kill -SIGTERM $MAINPID
ExecReload=/bin/kill -SIGHUP $MAINPID
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536
LimitNPROC=4096
NoNewPrivileges=true              # 安全：禁止提权
PrivateTmp=true                   # 安全：隔离 /tmp
ProtectSystem=strict              # 安全：只读系统目录
ReadWritePaths=/var/log/myapp     # 允许写入的路径

# 环境变量
Environment="NODE_ENV=production"
EnvironmentFile=-/etc/myapp/env   # - 表示文件不存在也不报错

# 日志
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Type 类型选择：**

| Type | 何时用 | 示例 |
|------|--------|------|
| simple | 进程常驻前台（默认） | Node.js, Python |
| forking | 进程自己 fork 到后台 | Nginx, PHP-FPM |
| oneshot | 运行一次就退出 | 初始化脚本 |
| notify | 进程就绪后发信号 | 支持 sd_notify 的进程 |

## 3. Timer — 替代 Cron

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily Backup Timer

[Timer]
OnCalendar=daily           # 每天执行
OnCalendar=*-*-* 02:00:00  # 每天凌晨 2 点
Persistent=true            # 如果错过了开机后补跑

[Install]
WantedBy=timers.target
```

```bash
# 查看所有 timer
systemctl list-timers
systemctl start backup.timer
systemctl enable backup.timer
```

## 4. 故障排查

```bash
# Service 启动失败的标准排查路径
systemctl status myapp          # 看状态和最后几行日志
journalctl -u myapp -n 50       # 看完整日志
journalctl -xe                  # 看系统级错误

# 手动测试启动命令（排除 systemd 问题）
sudo -u myapp /opt/myapp/bin/server --config /etc/myapp/config.yaml

# 检查配置语法
systemd-analyze verify /etc/systemd/system/myapp.service

# 查看服务的依赖链
systemctl list-dependencies myapp
systemctl list-dependencies --reverse myapp

# 查看启动耗时分析
systemd-analyze blame
systemd-analyze critical-chain
```

## 5. 生产环境最佳实践

```bash
# 1. 用户隔离：每个服务用独立用户
useradd -r -s /sbin/nologin -d /opt/myapp myapp

# 2. 资源限制：防止单个服务耗尽系统资源
# 在 service 文件中
MemoryMax=512M
CPUQuota=200%       # 最多 2 个核心

# 3. 日志管理：防止日志爆盘
# /etc/systemd/journald.conf
SystemMaxUse=500M
MaxRetentionSec=2week

# 4. 监控告警
# 设置自动重启 + 监控失败状态
systemctl list-units --state=failed
```

## 6. 自测

<details>
<summary>1. systemctl restart 和 reload 的区别？</summary>

- `restart`: 完全停掉进程再启动（有服务中断）
- `reload`: 发送 SIGHUP 信号，进程重读配置不中断服务
- 不是所有服务都支持 reload（需要在 service 文件中定义 ExecReload）
</details>

<details>
<summary>2. 你写了一个 service 但是 start 失败，排查步骤？</summary>

1. `systemctl status xxx` 看报错信息
2. `journalctl -u xxx -n 50` 看详细日志
3. `systemd-analyze verify /path/to/xxx.service` 检查语法
4. 手动运行 ExecStart 命令测试
5. 检查权限、路径、依赖服务是否就绪
</details>

<details>
<summary>3. Type=forking 和 Type=simple 的区别？</summary>

- simple: systemd 假设 ExecStart 启动的进程就是服务主进程
- forking: 父进程 fork 子进程后退出，子进程继续运行。systemd 等待父进程退出后才知道服务就绪。必须同时设置 PIDFile
- 如果 forking 进程不指定 PIDFile，systemd 不知道谁是主进程，可能误杀
</details>
