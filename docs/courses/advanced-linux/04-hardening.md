---
title: 安全加固清单 — 从默认到堪战
description: SSH 三板斧加固、fail2ban 防爆破、服务最小化与权限收口、可审计的加固流程
difficulty: advanced
estimatedTime: 90
prerequisites:
  - 03-journald-logs
  - ../security/03-system-hardening.md
---

# 安全加固清单

[安全课程](../security/)讲了"为什么"，本章给 Linux 主机的"怎么做"：一份**可勾选、可审计**的加固清单——新机交付前过一遍，老机每季度复查一遍。

## 1. SSH：暴露面第一名的三板斧

### ① 密钥登录，禁用密码

```bash
# 本机生成密钥对（一路回车；或加口令更稳）
ssh-keygen -t ed25519
ssh-copy-id user@服务器IP     # 把公钥装到服务器
# 验证：能免密登录后，再进行下一步（顺序错了会把自己锁外面！）
```

### ② 收紧 sshd 配置

```ini
# /etc/ssh/sshd_config
PermitRootLogin no          # 禁 root 直连
PasswordAuthentication no   # 只允许密钥（确认密钥可用后再改！）
MaxAuthTries 3
```

```bash
sudo sshd -t                # 语法检查（改配置必跑，防止服务起不来）
sudo systemctl reload ssh
```

### ③ fail2ban：自动拉黑爆破者

```bash
sudo apt install fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd    # 看 sshd 监狱：已拉黑多少 IP
```

默认规则：10 分钟内失败 5 次 → 封 10 分钟（配置在 `/etc/fail2ban/jail.local` 可调）。配合上一章的 journalctl，可以完整复盘每次爆破。

::: warning 改 SSH 前的保命动作
保持现有会话不退出，另开新终端验证新配置能登录——全部通过后再关旧会话。"把自己锁在门外"是加固操作的第一大事故。
:::

## 2. 服务最小化：关掉不开的门窗

```bash
# 盘点：本机在监听什么端口、跑着什么服务
sudo ss -tlnp                        # 0.0.0.0 = 对外，127.0.0.1 = 仅本机
systemctl list-units --type=service --state=running
# 没用的：停用 + 禁止自启
sudo systemctl disable --now avahi-daemon cups
```

判据一句话：**说不出"谁在用它"的服务，就关掉**——需要时再开是被允许的，一直开着没人认领是漏洞温床。

## 3. 系统与权限收口

```bash
# 1) 自动安全更新（Ubuntu）
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 2) 账户口径：谁能登录？谁能 sudo？
cat /etc/passwd | grep -E ':/bin/(bash|sh)$'   # 有 shell 的真实用户
getent group sudo                              # sudo 组成员清单（应个位数）

# 3) 关键文件权限复核
sudo chmod 640 /etc/shadow      # 默认即如此，改动过就纠回
sudo chmod 600 ~/.ssh/authorized_keys

# 4) 定时任务排查（入侵持久化的最爱）
sudo ls -la /etc/cron* /var/spool/cron/crontabs/
crontab -l
```

## 4. 审计与留痕：让动作可追溯

```bash
# 谁在何时登录过（含失败）——与 fail2ban 联动复盘
last -a | head
sudo lastb | head                # 失败记录

# sudo 使用记录（默认 syslog）
sudo journalctl -t sudo --since today

# 进阶（选装）：auditd 记录敏感文件访问
sudo apt install auditd
sudo auditctl -w /etc/passwd -p wa -k identity_change   # 改动即记录
sudo ausearch -k identity_change
```

## 5. 一页纸加固清单（打印版）

```
□ SSH 密钥可用并验证（新终端能登录）
□ PermitRootLogin no / PasswordAuthentication no（sshd -t 后 reload）
□ fail2ban 运行中（client status 有计数）
□ 监听端口逐个有主（ss -tlnp 复查，无主端口关闭）
□ 无用服务 disable --now
□ 自动安全更新开启
□ sudo 组成员个位数且都有名有姓
□ 计划任务逐条能说清来路
□ journald 持久化已开（上一章）
□ last/lastb 留痕正常
```

## 常见误区

1. **加固一次终身有效** —— 软件在装、规则在变；清单要周期性复查（挂到日历）
2. **只防外不查内** —— 入侵后第一件事是"删日志、加定时任务、开反弹端口"；第 3、4 节的排查就是为这个准备的
3. **工具代替制度** —— fail2ban/auditd 都好，但没人看告警等于没装；最小可行情径：每周扫一眼 fail2ban 计数和 lastb 增量

## 小结

- SSH 三板斧顺序不能错：先装密钥验证可用，再禁密码，再上 fail2ban
- 服务最小化判据：说不出谁在用就关；审计让一切动作留痕
- 清单化 + 周期复查 + 每周扫一眼留痕——安全是动词

## 练习（结业）

1. 在 VirtualBox 虚拟机上完成整页清单，每项勾选时截图存档
2. 用另一台机器故意错误密码 5 次，复盘 fail2ban 的拦截全过程（journalctl）
3. 写你的《新机交付 SOP》：把清单扩成带命令的 30 分钟流程

👉 恭喜完成 Linux 进阶！回到 [课程目录](/courses/)，或用 `npm run cli -- quiz linux` 检验基础
