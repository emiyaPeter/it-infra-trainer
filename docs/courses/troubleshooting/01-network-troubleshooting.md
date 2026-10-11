---
title: "网络连通性异常排查"
description: "系统化排查网络不通、间歇性断网、IP冲突、DNS故障等常见网络问题"
difficulty: beginner
estimatedTime: 120
---

# 01 - 网络连通性异常排查

## 场景一：完全无法上网

### 排查流程图

```
用户报告：完全上不了网
        │
        ▼
┌─ 第1步：检查物理连接 ──────────────────────┐
│  网线两端都插好了吗？                        │
│  网口灯亮吗？（绿色常亮=链路正常，橙色/闪烁=有数据）│
│  WiFi 连上了吗？信号几格？                    │
│  有没有误开飞行模式？                        │
└────────────────┬───────────────────────────┘
                 │ 物理连接正常
                 ▼
┌─ 第2步：检查 IP 地址 ──────────────────────┐
│  ipconfig /all                              │
│  IP 是 169.254.x.x 吗？→ DHCP 获取失败！     │
│  IP 是正常内网地址吗？（192.168.x / 10.x）    │
│  子网掩码和网关正确吗？                       │
└────────────────┬───────────────────────────┘
                 │ IP 正常
                 ▼
┌─ 第3步：测试连通性 ────────────────────────┐
│  ping 127.0.0.1     → 测试本机 TCP/IP 协议栈 │
│  ping 本机IP        → 测试网卡              │
│  ping 网关           → 测试到路由器连通性    │
│  ping 8.8.8.8       → 测试互联网连通性      │
│  ping baidu.com     → 测试 DNS 解析         │
└────────────────┬───────────────────────────┘
                 │
                 ▼
         根据哪一步失败定位问题
```

### 各步骤失败的处理

#### ping 127.0.0.1 失败 → TCP/IP 协议栈损坏

```powershell
# 重置 TCP/IP 协议栈
netsh int ip reset
netsh winsock reset

# 重启电脑
shutdown /r /t 0
```

#### ping 网关失败 → 局域网连接问题

```powershell
# 1. 确认网关 IP（通常是 192.168.1.1 或 192.168.0.1）
ipconfig | findstr "Default Gateway"

# 2. 检查 ARP 表
arp -a
# 看网关 IP 对应的 MAC 地址是否正常（不是 00-00-00-00-00-00）

# 3. 清除 ARP 缓存重试
arp -d *
ping 网关IP

# 4. 如果还不行：
#    - 检查网线是否插在正确的端口
#    - 换一根网线试试
#    - 换一个路由器端口试试
#    - 检查路由器是否死机（重启路由器）
```

#### ping 8.8.8.8 成功但 ping baidu.com 失败 → DNS 问题

见本章 [DNS 故障专题](#dns-故障专题)

#### 169.254.x.x 地址 → DHCP 获取失败

```
169.254.x.x 是 Windows 在无法获取 DHCP 地址时自动配置的 APIPA 地址
（Automatic Private IP Addressing）

出现这个地址 = 电脑和 DHCP 服务器（通常是路由器）之间通信有问题

处理：
1. 先试 ipconfig /release && ipconfig /renew
2. 检查路由器 DHCP 服务是否开启
3. 检查网线是否插好（不要小看这步！）
4. 路由器 DHCP 地址池是否已满？
5. 重启路由器
```

---

## 场景二：间歇性断网

### 分类排查

```
间歇性断网 = 有时候能上网，有时候不能

WHEN 维度分析：
├── 特定时间段断？→ 可能是带宽被占用（有人在下载/看视频）
├── 特定操作后断？→ VPN连接？大文件传输？特定软件？
└── 随机断？→ 继续排查

物理层排查：
├── 换一根网线试试（最常见的问题！）
├── 换个交换机/路由器端口
├── WiFi：检查信道干扰（用 WiFi Analyzer）
└── WiFi：检查是否在微波炉/蓝牙设备旁边（2.4GHz干扰）

数据链路层排查：
└── 查看是否有 IP 冲突（见下一节）

网络层排查：
├── 持续 ping 网关 -t，观察丢包规律
│   ping 192.168.1.1 -t
│   断网时是否丢包？→ 局域网问题
│   从不断包？→ 外网/ISP 问题
└── 持续 ping 8.8.8.8 -t，对比确认
```

### 实战：持续监控网络

```powershell
# 持续 ping 并记录结果到文件（包含时间戳）
ping -t 8.8.8.8 | ForEach {"{0} - {1}" -f (Get-Date),$_} > ping-log.txt

# 或使用 pathping 做更详细的分析
pathping 8.8.8.8
```

---

## 场景三：IP 地址冲突

### 症状

```
- Windows 右下角弹出"IP 地址冲突"提示
- 网络时通时断
- 同一网络下两人同时掉线（互相抢 IP）
- 网络连接显示正常但无法访问任何资源
```

### 排查与处理

```powershell
# 1. 查看本机 IP 和 MAC
ipconfig /all

# 2. 查看局域网内所有设备的 IP 和 MAC
arp -a

# 3. 找冲突源：
#    方法一：用 arp -a 找到重复 IP 对应的 MAC 地址
#    方法二：用 Advanced IP Scanner 扫描局域网（免费工具）

# 4. 解决方法：
#    临时：ipconfig /release && ipconfig /renew（获取新IP）
#    根本：找到冲突设备，修改为不同的静态IP
#          或在路由器上做 IP-MAC 绑定（DHCP 预留）
```

### 防止 IP 冲突的最佳实践

```
家庭/小型网络：
✅ 对固定设备（打印机、NAS）使用 DHCP 地址预留（MAC 绑定）
✅ 大部分设备使用 DHCP 自动获取
✅ 避免手动设置静态 IP（除非有明确需求）

企业网络：
✅ DHCP 地址池之外设置静态 IP 范围
✅ IP 地址管理表（记录哪些 IP 已分配）
✅ 部署 IPAM（IP 地址管理）工具
```

---

## DNS 故障专题

### DNS 问题典型症状

```
✅ ping 8.8.8.8 通 → 网络连通性没问题
❌ ping baidu.com 不通 → DNS 解析有问题

✅ QQ/微信能上 → 进一步确认是 DNS 问题（QQ 直接用 IP）
❌ 网页打不开 → DNS 可能是罪魁祸首
```

### DNS 排查步骤

```powershell
# 1. 查看当前 DNS 服务器
ipconfig /all | findstr "DNS Servers"

# 2. 测试 DNS 查询
nslookup baidu.com
# 正常会返回 IP 地址
# 超时或返回错误 → DNS 服务器有问题

# 3. 指定其他 DNS 服务器测试
nslookup baidu.com 8.8.8.8
nslookup baidu.com 114.114.114.114

# 4. 如果指定其他 DNS 正常 → 是原 DNS 服务器的问题
#    如果都不正常 → 可能是 DNS 端口(UDP 53)被防火墙拦截

# 5. 清除 DNS 缓存
ipconfig /flushdns

# 6. 查看 DNS 缓存
ipconfig /displaydns
```

### 常见 DNS 问题速查

| 问题 | 原因 | 处理 |
|------|------|------|
| 解析结果不对（被劫持） | DNS 污染/劫持 | 换 DNS 服务器 (8.8.8.8 / 114.114.114.114) |
| 解析非常慢 | DNS 服务器响应慢 | 换 DNS 或检查网络延迟 |
| 部分网站能解析，部分不能 | CDN 节点问题或 DNS 缓存 | `ipconfig /flushdns` |
| hosts 文件被篡改 | 恶意软件/软件修改 | 检查 `C:\Windows\System32\drivers\etc\hosts` |
| 所有域名解析都失败 | DNS 服务器不可达 | 换 DNS / 重启路由器 |

### 推荐 DNS 服务器

| DNS 服务器 | 主 DNS | 备 DNS | 特点 |
|-----------|--------|--------|------|
| 114DNS | 114.114.114.114 | 114.114.115.115 | 国内最快，纯净 |
| 阿里 DNS | 223.5.5.5 | 223.6.6.6 | 稳定、快 |
| Google DNS | 8.8.8.8 | 8.8.4.4 | 国际通用 |
| Cloudflare | 1.1.1.1 | 1.0.0.1 | 隐私保护、快 |
| DNSPod | 119.29.29.29 | 182.254.116.116 | 腾讯出品 |

---

## 网络诊断命令大全

```powershell
# === IP 配置相关 ===
ipconfig /all              # 查看完整网络配置
ipconfig /release          # 释放 DHCP 获取的 IP
ipconfig /renew            # 重新获取 DHCP IP
ipconfig /flushdns         # 清除 DNS 缓存
ipconfig /registerdns      # 重新注册 DNS 记录

# === 连通性测试 ===
ping 目标IP               # 测试连通性（4次）
ping -t 目标IP            # 持续 ping（Ctrl+C 停止）
ping -n 100 目标IP        # 发送 100 个包
ping -l 1500 目标IP       # 指定数据包大小（测试 MTU）

# === 路径追踪 ===
tracert 目标              # 追踪路由路径
tracert -d 目标           # 不解析主机名（速度快）
pathping 目标             # 更详细的路由分析

# === DNS 查询 ===
nslookup 域名             # 简单 DNS 查询
nslookup 域名 DNS服务器    # 指定 DNS 服务器查询
nslookup -type=MX 域名    # 查询邮件记录
nslookup -type=NS 域名    # 查询域名服务器

# === 端口与连接 ===
netstat -ano              # 查看所有连接和端口 (含PID)
netstat -anob             # 显示每个连接对应的程序名(需管理员)
netstat -s                # 网络统计信息
telnet IP 端口            # 测试端口连通性

# === 路由 ===
route print               # 查看路由表
route add 目标网络 mask 掩码 网关  # 添加路由
route delete 目标网络      # 删除路由

# === 网络重置 ===
netsh int ip reset        # 重置 TCP/IP 协议栈
netsh winsock reset       # 重置 Winsock 目录
netsh int ipv4 reset      # 重置 IPv4
netsh int ipv6 reset      # 重置 IPv6
```

---

## 实战案例

### 案例1：单台电脑上不了网

```
场景：办公室一台电脑突然上不了网，其他电脑正常

排查：
1. 检查网线 → 网口灯不亮！→ 网线松了
2. 重新插紧网线 → 灯亮了
3. ipconfig → 获取到 169.254.x.x → DHCP 还是不行
4. 换了一根网线 → 正常获取到 192.168.1.105
5. 上网恢复正常

结论：网线损坏（内部断裂，外观正常）
教训：不要因为网线"看起来好的"就跳过物理层检查
```

### 案例2：全公司间歇性断网

```
场景：某公司反映每天下午 2-3 点网络非常慢

排查：
1. 在核心交换机上做端口镜像，用 Wireshark 抓包
2. 发现某台电脑在大量发送广播包
3. 追踪 IP 定位到具体电脑
4. 检查发现该电脑中了 ARP 病毒，每天定时发作

处理：
1. 隔离中毒电脑
2. 全网杀毒
3. 在交换机上配置端口安全限制广播包速率

结论：网络安全问题表现为网络性能问题
```

---

## 自测题

1. 获取到 169.254.x.x 的 IP 地址意味着什么？
2. ping 8.8.8.8 通但 ping baidu.com 不通，问题出在哪里？
3. 如何判断是网线问题还是网卡问题？
4. `ipconfig /release` 和 `ipconfig /renew` 的作用是什么？
5. 局域网内两台电脑都用同一个 IP 会怎样？

<details>
<summary>点击查看答案</summary>

1. **DHCP 获取失败**。169.254.x.x 是 APIPA（自动专用 IP 地址），Windows 在没有 DHCP 服务器或 DHCP 通信异常时自动分配的。此时只能和同一网段的 APIPA 设备通信，无法上网
2. **DNS 解析有问题**。网络连通性正常（能 ping 通互联网 IP），但域名解析失败。检查 DNS 服务器设置、清除 DNS 缓存、尝试换 DNS 服务器
3. **替换法**：换一根确定正常的网线 → 如果能上网 = 网线问题；换到确定正常的交换机端口 → 如果能上网 = 原端口问题；如果以上都不行 = 网卡可能有问题 → 用 USB 网卡测试
4. **`ipconfig /release`** = 释放当前 DHCP 获取的 IP 地址。**`ipconfig /renew`** = 重新向 DHCP 服务器请求 IP 地址。配合使用相当于"刷新 IP"
5. **IP 地址冲突**。两个设备网络都会时断时续。后连入的设备通常会收到 IP 冲突警告，Windows 会弹出提示。两台设备的网络通信都可能不正常，表现为间歇性断网
</details>
