---
title: "诊断工具速查表"
description: "IT工程师必备的Windows命令、免费工具和排障脚本完整速查"
difficulty: beginner
estimatedTime: 60
---

# 05 - 诊断工具速查表

> 📋 **使用说明**：此章节作为速查卡使用。遇到问题时快速查找对应的工具和命令，不需要从头到尾阅读。

---

## 一、Windows 内置命令行工具

### 网络诊断

| 命令 | 用途 | 常用参数 |
|------|------|---------|
| `ping` | 测试连通性 | `-t` 持续, `-n` 次数, `-l` 包大小 |
| `tracert` | 路由追踪 | `-d` 不解析主机名, `-h` 最大跳数 |
| `pathping` | 路由+丢包分析 | 结合 ping 和 tracert |
| `nslookup` | DNS 查询 | `-type=mx` 邮件记录 |
| `ipconfig` | IP 配置 | `/all` 完整, `/release` 释放, `/renew` 更新 |
| `netstat` | 连接与端口 | `-ano` 含PID, `-b` 含程序名 |
| `route` | 路由表管理 | `print` 查看, `add` 添加, `delete` 删除 |
| `arp` | ARP 表管理 | `-a` 查看, `-d` 清除 |
| `telnet` | 端口连通性 | `telnet IP 端口` |
| `netsh` | 网络配置 | `int ip reset` 重置TCP/IP |
| `curl` | HTTP 请求 | `-v` 详细信息, `-I` 仅头部 |

### 系统诊断

| 命令 | 用途 | 常用参数 |
|------|------|---------|
| `sfc` | 系统文件检查 | `/scannow` 立即扫描修复 |
| `DISM` | 系统映像修复 | `/RestoreHealth` 在线修复 |
| `chkdsk` | 磁盘检查 | `/f` 修复, `/r` 坏扇区 |
| `tasklist` | 进程列表 | `/v` 详细信息, `/svc` 服务 |
| `taskkill` | 结束进程 | `/F` 强制, `/IM` 按名, `/PID` 按号 |
| `systeminfo` | 系统信息 | 硬件/OS/更新 |
| `wmic` | WMI 查询 | `cpu get`, `diskdrive get` |
| `driverquery` | 驱动列表 | `/v` 详细信息 |
| `gpupdate` | 刷新组策略 | `/force` 强制 |
| `gpresult` | 组策略结果 | `/r` 概要, `/h` 导出HTML |

### 进程/服务管理

| 命令 | 用途 |
|------|------|
| `net start` | 查看已启动的服务 |
| `net start 服务名` | 启动服务 |
| `net stop 服务名` | 停止服务 |
| `sc query 服务名` | 查看服务详细状态 |
| `sc config 服务名 start= auto` | 设置服务自动启动 |

### 系统快捷命令（运行 → 输入）

| 命令 | 打开 |
|------|------|
| `cmd` | 命令提示符 |
| `powershell` | PowerShell |
| `devmgmt.msc` | 设备管理器 |
| `diskmgmt.msc` | 磁盘管理 |
| `services.msc` | 服务管理器 |
| `eventvwr.msc` | 事件查看器 |
| `resmon` | 资源监视器 |
| `perfmon` | 性能监视器 |
| `msconfig` | 系统配置（启动项等）|
| `regedit` | 注册表编辑器 |
| `gpedit.msc` | 本地组策略编辑器 |
| `inetcpl.cpl` | Internet 选项 |
| `appwiz.cpl` | 程序和功能 |
| `sysdm.cpl` | 系统属性 |
| `ncpa.cpl` | 网络连接 |
| `mdsched` | Windows 内存诊断 |
| `msinfo32` | 系统信息 |
| `cleanmgr` | 磁盘清理 |
| `mstsc` | 远程桌面连接 |

---

## 二、推荐免费工具清单

### 🔧 硬件诊断

| 工具 | 用途 | 下载 |
|------|------|------|
| **CPU-Z** | CPU/主板/内存详细信息 | cpuid.com |
| **HWiNFO64** | 全面的硬件传感器监控 | hwinfo.com |
| **CrystalDiskInfo** | 硬盘 S.M.A.R.T. 健康检查 | crystalmark.info |
| **GPU-Z** | 显卡详细信息 | techpowerup.com |
| **MemTest86** | 内存深度诊断（启动盘）| memtest86.com |
| **Core Temp** | CPU 温度监控 | alcpu.com |

### 🌐 网络工具

| 工具 | 用途 | 下载 |
|------|------|------|
| **Wireshark** | 网络抓包分析 | wireshark.org |
| **Advanced IP Scanner** | 局域网 IP 扫描 | advanced-ip-scanner.com |
| **WiFi Analyzer** | WiFi 信道分析 (Microsoft Store) | 微软商店 |
| **PuTTY** | SSH/Telnet 客户端 | putty.org |
| **MobaXterm** | 全能远程连接工具 | mobaxterm.mobatek.net |
| **nmap** | 端口扫描和安全审计 | nmap.org |
| **iperf3** | 网络带宽测试 | iperf.fr |

### 💻 系统工具

| 工具 | 用途 | 下载 |
|------|------|------|
| **Process Explorer** | 增强版任务管理器（微软出品）| docs.microsoft.com/sysinternals |
| **Autoruns** | 管理所有自启动项（微软出品）| docs.microsoft.com/sysinternals |
| **TCPView** | 图形化网络连接查看（微软出品）| docs.microsoft.com/sysinternals |
| **BlueScreenView** | 蓝屏转储分析 | nirsoft.net |
| **WizTree** | 磁盘空间分析（超快）| diskanalyzer.com |
| **7-Zip** | 压缩/解压（支持各种格式）| 7-zip.org |
| **Everything** | 文件搜索（秒级全盘搜索）| voidtools.com |
| **Rufus** | 制作启动 U盘 | rufus.ie |
| **Dism++** | 系统优化和清理 | github.com/Chuyu-Team |

### 🖨️ 外设工具

| 工具 | 用途 |
|------|------|
| **USBDeview** | USB 设备管理/历史记录 |
| **设备管理器** | Windows 内置 |

---

## 三、常用排障 PowerShell 脚本

### 一键网络诊断

```powershell
# 保存为 network-check.ps1
Write-Host "=== 网络适配器信息 ===" -ForegroundColor Cyan
Get-NetAdapter | Format-Table Name, Status, LinkSpeed

Write-Host "=== IP 配置 ===" -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 | Format-Table InterfaceAlias, IPAddress, PrefixLength

Write-Host "=== DNS 服务器 ===" -ForegroundColor Cyan
Get-DnsClientServerAddress -AddressFamily IPv4 | Format-Table

Write-Host "=== 默认网关 ===" -ForegroundColor Cyan
Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Format-Table

Write-Host "=== 测试连通性 ===" -ForegroundColor Cyan
Test-Connection -ComputerName 8.8.8.8 -Count 2 | Format-Table
Test-Connection -ComputerName baidu.com -Count 2 | Format-Table

Write-Host "完成！" -ForegroundColor Green
```

### 一键系统健康检查

```powershell
# 保存为 system-health.ps1
Write-Host "=== CPU ===" -ForegroundColor Cyan
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, MaxClockSpeed

Write-Host "=== 内存 ===" -ForegroundColor Cyan
$mem = Get-CimInstance Win32_ComputerSystem
$totalGB = [math]::Round($mem.TotalPhysicalMemory / 1GB, 1)
Write-Host "总内存: $totalGB GB"

Write-Host "=== 磁盘 ===" -ForegroundColor Cyan
Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
    $freeGB = [math]::Round($_.FreeSpace / 1GB, 1)
    $totalGB = [math]::Round($_.Size / 1GB, 1)
    $usedPercent = [math]::Round(($_.Size - $_.FreeSpace) / $_.Size * 100, 1)
    Write-Host "  $($_.DeviceID) 已用: $usedPercent% (剩余: $freeGB GB / 总计: $totalGB GB)"
}

Write-Host "=== 系统运行时间 ===" -ForegroundColor Cyan
$uptime = (Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
Write-Host "已运行: $($uptime.Days) 天 $($uptime.Hours) 小时 $($uptime.Minutes) 分钟"

Write-Host "=== 最近错误事件 ===" -ForegroundColor Cyan
Get-EventLog -LogName System -EntryType Error -Newest 5 | Format-Table TimeGenerated, Source, Message -Wrap

Write-Host "完成！" -ForegroundColor Green
```

### 打印机快速修复

```powershell
# 保存为 printer-fix.ps1（需要管理员权限）
Write-Host "正在停止打印服务..." -ForegroundColor Yellow
net stop spooler

Write-Host "正在清理打印队列..." -ForegroundColor Yellow
Remove-Item -Path "C:\Windows\System32\spool\PRINTERS\*" -Force -ErrorAction SilentlyContinue

Write-Host "正在重启打印服务..." -ForegroundColor Yellow
net start spooler

Write-Host "打印服务已重置！" -ForegroundColor Green
```

---

## 四、排障组合命令

### 场景对应的命令组合

```
场景：用户说"网速很慢"
────────────────────────────────
1. ping -n 100 网关IP         → 看局域网延迟和丢包
2. ping -n 100 8.8.8.8        → 看互联网延迟和丢包
3. tracert -d 8.8.8.8         → 看哪一跳延迟大
4. netstat -s                 → 看 TCP 重传率
5. 资源监视器 → 网络           → 看哪个进程在占用带宽
6. speedtest.cn 测速          → 看实际带宽

场景：用户说"电脑很卡"
────────────────────────────────
1. 任务管理器 → 性能           → 看哪个资源到瓶颈
2. resmon                     → 详细资源分析
3. 任务管理器 → 启动           → 启动项管理
4. CrystalDiskInfo            → 检查硬盘健康
5. HWiNFO64                   → 检查温度和降频
6. eventvwr → 系统日志        → 查看错误事件

场景：用户说"打印机用不了"
────────────────────────────────
1. 检查物理连接和电源
2. 打印机属性 → 查看状态
3. net stop spooler && del C:\Windows\System32\spool\PRINTERS\* && net start spooler
4. 打印测试页
5. 检查驱动和端口

场景：用户说"网页打不开"
────────────────────────────────
1. ping 8.8.8.8              → 检查互联网连通性
2. nslookup baidu.com        → 检查 DNS
3. ipconfig /flushdns        → 清除 DNS 缓存
4. 换个浏览器试试
5. 检查代理设置
6. 检查 hosts 文件
```

---

## 五、常用 Linux 对应命令（WSL2）

| Windows 命令 | Linux 命令 | 用途 |
|-------------|-----------|------|
| `ipconfig /all` | `ip addr show` | 查看 IP 配置 |
| `ping` | `ping` | 测试连通性 |
| `tracert` | `traceroute` | 路由追踪 |
| `nslookup` | `dig` / `nslookup` | DNS 查询 |
| `netstat -ano` | `ss -tlnp` | 查看端口 |
| `route print` | `ip route show` | 路由表 |
| `arp -a` | `ip neigh show` | ARP 表 |
| `tasklist` | `ps aux` | 进程列表 |
| `taskkill /F /PID` | `kill -9 PID` | 结束进程 |
| `chkdsk` | `fsck` | 磁盘检查 |
| `telnet IP 端口` | `nc -zv IP 端口` | 端口测试 |
| `curl` | `curl` | HTTP 请求 |

---

## 六、在线工具推荐

| 工具 | 用途 | 网址 |
|------|------|------|
| Speedtest | 测速 | speedtest.net |
| 多地 Ping | 从全国多地 ping 你的网站 | ping.pe / itdog.cn |
| DNS 查询 | DNS 解析查询 | digwebinterface.com |
| MXToolbox | 邮件/DNS/黑名单检测 | mxtoolbox.com |
| SSL Labs | SSL/TLS 配置检测 | ssllabs.com |
| DownDetector | 查看某网站是否大面积宕机 | downdetector.com |

---

此章节持续更新，随着你的经验积累，把常用的命令和工具记录下来。
