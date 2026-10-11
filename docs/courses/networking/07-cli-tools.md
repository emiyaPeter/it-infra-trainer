---
title: "命令行网络工具"
description: "掌握ping、tracert、nslookup、curl等日常网络排查工具"
difficulty: beginner
estimatedTime: 60
prerequisites: ["02-osi-model", "03-tcp-ip"]
---

# 命令行网络工具

IT 基础设施工程师的日常：**80% 的时间在排查问题，20% 在搭建新东西。** 而排查网络问题，这些命令行工具是你的第一武器。

## ping — 网络连通性测试

`ping` 发送 ICMP Echo Request，等待 ICMP Echo Reply。这是最基础的网络测试。

```bash
# 基本用法
ping 8.8.8.8              # Linux (持续ping，Ctrl+C停止)
ping -n 4 8.8.8.8         # Windows (ping 4次)
ping -c 4 8.8.8.8         # Linux (ping 4次)

# 指定包大小
ping -s 1024 8.8.8.8      # Linux (1024字节)
ping -l 1024 8.8.8.8      # Windows
```

**ping 结果解读**：
```
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=35.2 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=34.8 ms
--- 8.8.8.8 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 34.8/35.0/35.2/0.2 ms
```

关键指标：
- **丢包率 (packet loss)**：> 1% 说明网络有问题
- **延迟 (time)**：< 1ms = 局域网，10-50ms = 同城，> 100ms = 跨省或跨国
- **TTL**：可以粗略判断对方操作系统（64=Linux, 128=Windows）

**排查思路**：从近到远逐级 ping
```
1. ping 127.0.0.1        → 测试 TCP/IP 协议栈是否正常
2. ping 本机IP           → 测试网卡是否正常
3. ping 网关IP           → 测试局域网是否正常
4. ping 8.8.8.8          → 测试外网是否正常
5. ping google.com       → 测试 DNS 是否正常
```

## tracert / traceroute — 路由追踪

显示数据包经过的每一跳路由器。

```bash
tracert google.com       # Windows（ICMP）
traceroute google.com    # Linux（UDP，可能需要 sudo）
```

**输出解读**：
```
 1  router.local (192.168.1.1)  1.2ms  0.8ms  1.1ms      ← 你的路由器
 2  10.0.0.1  5.2ms  4.8ms  5.1ms                         ← ISP第一跳
 3  172.16.0.1  12.3ms  11.8ms  12.1ms                    ← ISP骨干网
 4  *  *  *                                                ← 超时（可能是防火墙）
```

- `* * *` 表示这一跳不响应（可能是防火墙禁了 ICMP），不代表网络不通
- 如果某个跳之后全是 `*` 且最终不通，问题就在那个节点
- 延迟突然跳跃增大 = 跨地域/跨国了

## nslookup / dig — DNS 查询

```bash
# Windows
nslookup google.com
nslookup google.com 8.8.8.8    # 指定DNS服务器查询

# Linux
dig google.com                 # 详细查询
dig google.com +short          # 只显示结果
dig @8.8.8.8 google.com        # 指定DNS服务器
dig google.com MX              # 查询邮件记录
dig google.com ANY             # 查询所有记录
```

**DNS 记录类型**：

| 类型 | 用途 | 示例 |
|------|------|------|
| **A** | 域名 → IPv4 | google.com → 142.250.80.46 |
| **AAAA** | 域名 → IPv6 | google.com → 2404:6800:4005:802::200e |
| **CNAME** | 别名 | www → google.com |
| **MX** | 邮件服务器 | 邮件该发给谁 |
| **NS** | DNS 服务器 | 这个域名由谁解析 |
| **TXT** | 文本记录 | SPF/DKIM（邮件验证）|
| **PTR** | 反向解析 | IP → 域名 |

## curl — HTTP 请求神器

`curl` 是测试 Web 服务和 API 的必备工具。

```bash
# 基本 GET 请求
curl http://example.com

# 显示响应头
curl -I http://example.com

# 显示详细过程（包括 TCP 连接、TLS 握手）
curl -v https://example.com

# POST 请求（发送 JSON 数据）
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "张三", "email": "zhang@example.com"}'

# 下载文件
curl -O https://example.com/file.tar.gz

# 跟随重定向
curl -L http://example.com

# 只显示 HTTP 状态码
curl -o /dev/null -s -w "%{http_code}\n" https://example.com
```

**curl 排查思路**：
```
1. curl -v (连接是否成功？DNS 解析是否正常？)
2. curl -I (HTTP 状态码是什么？200/301/404/500？)
3. curl -w (想看具体哪个环节花了多长时间？)
```

## netstat / ss — 连接状态查看

```bash
# Linux (推荐 ss，比 netstat 更快)
ss -tlnp              # 查看所有监听的 TCP 端口
ss -t state established  # 查看所有已建立的连接
ss -s                 # 统计摘要

# Windows
netstat -ano          # 查看所有连接（含 PID）
netstat -ano | findstr "LISTENING"  # 只看监听的端口
netstat -ano | findstr "ESTABLISHED"  # 只看已建立的连接
```

## ip / ifconfig — 网络接口配置

```bash
# Linux (推荐 ip 命令)
ip addr show          # 查看所有网络接口
ip link show          # 查看链路状态
ip route show         # 查看路由表
ip neigh show         # 查看 ARP 表

# Windows
ipconfig /all         # 查看所有网络配置
ipconfig /displaydns  # 查看 DNS 缓存
ipconfig /flushdns    # 清除 DNS 缓存
```

## 综合排查示例

**场景：用户报告"网站打不开"**

```bash
# 1. 确认网络通不通
ping google.com
# 能通 → 网络没问题，继续

# 2. 确认 DNS 是否正常
nslookup 目标网站.com
# 能解析 → DNS 没问题，继续

# 3. 确认端口是否开放
curl -I https://目标网站.com
# Connection refused → 服务没启动或端口被封
# timeout → 防火墙拦截
# 200 OK → 服务正常，可能是前端问题

# 4. 如果 curl 超时，测试 TCP 连接
telnet 目标网站.com 443
# 或者
nc -zv 目标网站.com 443

# 5. 路由追踪看看卡在哪
traceroute 目标网站.com
```

## 课后练习

1. 用 `ping` 测试到 `baidu.com` 的延迟，看看丢包率
2. 用 `tracert baidu.com` 看看数据经过了多少跳
3. 用 `nslookup github.com` 查询 GitHub 的 IP 地址
4. 用 `curl -v https://api.github.com` 查看完整的 HTTP 交互过程
5. 用 `netstat -ano` 看看你的电脑现在有哪些连接
