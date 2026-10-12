---
title: 负载均衡与故障转移
description: 理解 L4/L7 负载均衡与调度算法，动手配置 Nginx 反向代理健康检查，掌握 VRRP/Keepalived 双机热备与故障转移集群概念
difficulty: advanced
estimatedTime: 110
prerequisites:
  - 02-raid-ha
---

# 负载均衡与故障转移

单机冗余（上一章）解决"部件坏"，本章解决"**整台机器坏**"：负载均衡分摊流量并自动剔除故障节点，故障转移让备份机器顶上。

## 1. 负载均衡分层

| 层 | 工作在 | 依据 | 代表 |
|----|--------|------|------|
| **L4（传输层）** | IP:端口 | 只看地址，性能高 | LVS、云 SLB、HAProxy(tcp) |
| **L7（应用层）** | HTTP 内容 | URL、Cookie、Header，可玩性高 | Nginx、HAProxy(http)、Traefik |

**常用调度算法**：

- **轮询（round robin）**：依次分配——默认
- **最少连接（least_conn）**：给当前连接最少的——请求耗时不均时更公平
- **源地址哈希（ip_hash）**：同一客户端固定到同一后端——会话保持的土办法
- **权重（weight）**：机器性能不均时按比例分

## 2. 动手：Nginx 反向代理 + 健康检查

实验拓扑（VirtualBox 两台 Linux VM 或两台小容器均可）：

```
客户端 ──> Nginx(80) ──┬──> web1:8081
                       └──> web2:8082
```

Nginx 端核心配置：

```nginx
# /etc/nginx/conf.d/lb.conf
upstream myapp {
    least_conn;                       # 最少连接
    server 192.168.56.11:8081 max_fails=3 fail_timeout=30s;
    server 192.168.56.12:8082 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    location / {
        proxy_pass http://myapp;
        proxy_set_header Host $host;              # 透传真实主机名
        proxy_set_header X-Real-IP $remote_addr;  # 透传客户端 IP（后端日志才有真实来源）
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
# 压测验证分发
for i in $(seq 10); do curl -s http://192.168.56.10/ ; echo; done
```

**被动健康检查**：`max_fails=3 fail_timeout=30s` = 30 秒内失败 3 次则摘除 30 秒。主动探活需开源版 plus 或结合 keepalived/consul（了解即可）。

## 3. 故障转移（Failover）两种形态

### 形态一：主备热备（VRRP/Keepalived）

两台机器共用一个**虚拟 IP（VIP）**，客户端只认 VIP；主机活着时 VIP 在主机上，主机挂了备机秒级接管：

```text
        VIP: 192.168.56.100（漂移）
       ┌─────────┐   ┌─────────┐
CLIENT │ MASTER  │   │ BACKUP  │   ← Keepalived 互相探测（优先级+通告）
       └─────────┘   └─────────┘
```

```bash
sudo apt install keepalived
# /etc/keepalived/keepalived.conf（主节点）
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100            # 备机设 90，大者为主
    advert_int 1
    virtual_ipaddress {
        192.168.56.100/24
    }
}
```

验证：`ping 192.168.56.100`，关掉主机，观察丢 1-3 个包后 VIP 漂移到备机继续通——这就是"故障转移"的体感。

### 形态二：集群软件（了解概念）

- **Windows 故障转移集群（WSFC）**：共享存储 + 心跳，SQL Server/文件服务器经典方案
- **数据库自带**：MySQL 主从+MHA、PostgreSQL 流复制、Redis Sentinel
- **编排层**：K8s 的 liveness 探针自动重启/摘除（阶段5 内容，此处知道有这条路）

::: tip 脑裂（Split-Brain）
主备之间心跳断了但都活着 → 两边都认为自己是主 → VIP 冲突、数据双写。防线：双心跳链路、仲裁盘/仲裁节点、奇数节点。这是 HA 面试必问。
:::

## 4. 会话与数据——LB 身后的隐藏问题

- **会话粘性**：登录态在后端内存里，轮询会把用户转飞 → 解法：ip_hash 粘住 / 会话外置到 Redis（正解）
- **数据一致性**：请求打到任何一台结果都一样吗？→ 无状态服务 + 共享数据库/存储
- **共享存储**：多机写同一文件 → NFS/分布式存储/对象存储（按场景）

**核心心法：把状态从计算层抽走**（无状态化），LB 与故障转移才有自由调度的空间。

## 常见误区

1. **以为 Nginx 就是负载均衡器本身高可用**——Nginx 单点挂了一切白搭，前面还要 VIP/多层 LB
2. **ip_hash 当万能会话方案**——换 IP（移动网络）就失效，会话外置才是正解
3. **只做 LB 不做探测**——后端"假活"（进程在但不响应）照样接流量，健康检查必须真实打业务路径

## 小结

- L4 快、L7 智；算法按业务选；后端无状态化是前提
- Nginx upstream + 被动健康检查起步；Keepalived VIP 实现秒级主备接管
- 脑裂是 HA 第一考题：多心跳 + 仲裁

## 练习

1. 搭好后 kill 掉 web1 的服务，curl 观察流量全到 web2，再拉起恢复
2. 停掉 keepalived 主节点，秒表计时 VIP 漂移耗时
3. 思考：为什么"会话放 Redis"优于"ip_hash"？（提示：扩容、缩容、故障时）

👉 下一章：[灾备规划与演练](./04-dr-plan)
