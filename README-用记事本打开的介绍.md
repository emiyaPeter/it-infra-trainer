# 🖥️ IT 基础设施工程师培训助手

> **零基础 → 3年经验水平 · 在家自学 · 完全免费**

欢迎使用 IT 基础设施工程师培训助手！本系统融合了**交互式网页课程**、**结构化 Markdown 文档**、**CLI 命令行实验**三大学习方式，帮助你在家自学成为一名称职的 IT 基础设施工程师。

---

## 🆕 首次使用（一次性环境搭建）

仅在第一次使用时需要执行以下步骤（约 15 分钟）。

### 前提条件

- Windows 10/11
- 网络连接（仅安装环节需要联网下载工具）

### 第一步：安装 WSL2 + Ubuntu

```powershell
# 在管理员 PowerShell 中运行：
wsl --install -d Ubuntu
```

重启电脑后，从开始菜单打开 Ubuntu，设置用户名和密码。

### 第二步：安装 Node.js

从 [nodejs.org](https://nodejs.org) 下载 LTS 版本并安装。

### 第三步：安装项目依赖

```bash
cd it-infra-trainer
npm install
```

### 第四步：初始化

```bash
npm run init-db          # 初始化数据库
npm run cli -- env-check # 检查环境
```

✅ 环境搭建完成！下面进入日常使用。

---

## 🔁 再次使用（日常启动）

每次学习时，打开终端执行以下命令：


cd it-infra-trainer                                （把整个文件夹放到哪里就 cd 到哪里，例如 cd C:\Users\<用户名>\Desktop\test\it-infra-trainer）
npm run dev


启动后会先看到服务就绪提示，然后**自动打开浏览器**：

```
  📚 课程文档: http://localhost:5173/
  ➜  Local:   http://localhost:5173/         ← 本机访问
  ➜  Network: http://10.105.12.220:5173/     ← 局域网地址（每台电脑不同）
```

> 💡 `npm run docs:dev` 与 `npm run dev` 等效，只是不自动打开浏览器。也可以直接双击项目里的「启动学习助手.bat」。

### 本机访问

浏览器打开 **`http://localhost:5173/`**，这是最稳定的方式，**有无网络都能用**。

### 局域网内其他设备访问

同一 WiFi/局域网下的**手机、平板、其他电脑**也能访问。使用终端显示的 Network 地址：

```
http://10.105.12.220:5173/    ← 你的实际 IP 会不同，以终端显示为准
```

> ℹ️ 局域网 IP 每台电脑不同（`10.x.x.x` 是企业/校园网，`192.168.x.x` 是家庭网），以你终端显示的 Network 那一行为准。

### 无网络 / 网络不稳定时

```bash
npm run docs:static
```

浏览器打开 `http://localhost:4173/`。这是纯静态构建，功能完全一致，**零网络依赖，任何极端环境都能用**。

> 💡 `docs:dev` 和 `docs:static` 的区别：前者有热更新（改课程内容自动刷新），后者是预构建版（更稳定但不自动刷新）。日常学习推荐 `docs:dev`。

---

## 📚 学习方式

### 方式一：Web 文档（推荐）

启动方式见上方「再次使用」章节。在浏览器中浏览结构化课程，包含：
- 📖 理论讲解（带图表和示例）
- ✅ 内嵌测验
- 🔬 实验入口
- 📊 学习仪表盘（进度追踪 + 番茄钟）
- 👤 多用户支持（注册/登录/切换账户，数据存本地）

### 方式二：CLI 命令行

```bash
# 查看学习路线图
npm run cli -- roadmap

# 查看指定阶段详情
npm run cli -- roadmap -p 2

# 做测验
npm run cli -- quiz networking

# 做实验
npm run cli -- lab linux-file-permissions

# 列出所有实验
npm run cli -- lab --list

# 查看学习进度
npm run cli -- progress

# 查看学习统计
npm run cli -- stats

# 搜索课程内容
npm run cli -- search "子网划分"

# 检查环境
npm run cli -- env-check
```

---

## 🗺️ 学习路线图（10个阶段）

| 阶段 | 内容 | 时长 | 难度 |
|------|------|------|------|
| 1 | 基础入门（硬件/网络/命令行） | 1-3月 | ⭐ |
| 2 | Linux 系统管理 ⭐最重要 | 4-8月 | ⭐⭐ |
| 3 | Windows Server 管理 | 9-10月 | ⭐⭐ |
| 4 | 虚拟化技术 | 11-12月 | ⭐⭐ |
| 5 | 容器技术 (Docker/K8s) 🔥 | 13-16月 | ⭐⭐⭐ |
| 6 | 自动化运维 (Ansible/Terraform) | 17-20月 | ⭐⭐⭐ |
| 7 | 监控与日志 (Prometheus/Grafana) | 21-22月 | ⭐⭐⭐ |
| 8 | 云计算基础 (AWS/Azure) | 23-25月 | ⭐⭐⭐ |
| 9 | 安全基础 | 25-26月 | ⭐⭐⭐⭐ |
| 10 | 灾备与高可用 | 27-28月 | ⭐⭐⭐⭐ |
| 🎯 | 终期项目 | 29-36月 | ⭐⭐⭐⭐⭐ |

---

## 🛠️ 所有工具免费

| 工具 | 用途 | 获取 |
|------|------|------|
| **WSL2 + Ubuntu** | Linux 实验环境 | Windows 自带，`wsl --install` |
| **VS Code** | 代码编辑器 | [免费下载](https://code.visualstudio.com) |
| **Git** | 版本控制 | [免费下载](https://git-scm.com) |
| **VirtualBox** | 虚拟化实验 | [免费下载](https://virtualbox.org) |
| **Docker Desktop** | 容器实验 | [个人免费](https://docker.com) |
| **Minikube** | K8s 实验 | [免费下载](https://minikube.sigs.k8s.io) |
| **Node.js** | 运行培训系统 | [免费下载](https://nodejs.org) |
| **Windows Server 2022 Eval** | AD域实验 | [180天免费试用](https://www.microsoft.com/en-us/evalcenter/) |
| **AWS/Azure Free Tier** | 云实验 | 官网注册免费层 |

---

## 📂 项目结构

```
it-infra-trainer/
├── docs/                    # 📚 课程文档 (VitePress)
│   ├── index.md             # 首页
│   ├── roadmap/             # 学习路线图（10个阶段）
│   └── courses/             # 课程内容
│       ├── networking/      # 网络基础（7章）
│       ├── linux/           # Linux系统管理（8章）
│       └── ...              # 更多课程
├── src/
│   ├── cli/                 # 🖥️ CLI 培训工具
│   │   ├── index.js         # 入口文件
│   │   ├── commands/        # 命令实现
│   │   └── utils/db.js      # 数据库操作
│   └── shared/              # 共享代码
├── quizzes/                 # ✅ 测验定义
├── labs/                    # 🔬 实验定义
├── scripts/                 # 🛠️ 工具脚本
└── meta/                    # 📊 元数据
```

---

## ❓ 常见问题

**Q: 我完全没有IT基础，能学吗？**
A: 当然！阶段1就是为零基础设计的。从计算机硬件是什么开始讲起。

**Q: 每天要学多久？**
A: 建议每天1-2小时。关键是坚持，不要三天打鱼两天晒网。

**Q: 学完真的能达到3年经验水平吗？**
A: 课程内容覆盖了3年IT基础设施工程师的核心技能树。实际"经验"需要在工作中积累，但知识体系是完整的。

**Q: 需要买什么付费软件吗？**
A: 不需要！本培训系统使用的所有工具都是免费的。

**Q: 断网了还能用吗？**
A: 能。两种方式：(1) `npm run docs:dev` + `http://localhost:5173/` 断网不受影响；(2) `npm run docs:static` 纯静态版，零网络依赖。

**Q: 能不能用手机/平板访问？**
A: 能。手机和电脑连同一个 WiFi，手机浏览器打开终端显示的 Network 地址（如 `http://10.105.12.220:5173/`）即可。注册登录功能在局域网 IP 下也能正常使用。

**Q: 学习进度保存在哪？会丢吗？**
A: 分两处：Web 端（网页上注册的账户和进度）保存在浏览器 `localStorage` 中，学完一页课程点右下角「标记已完成」即可累计进度；CLI 命令行的进度和成绩保存在项目 `data/data.db`（SQLite 数据库）。两套数据相互独立。Web 端换浏览器/换电脑时，用首页仪表盘的「导出备份 / 导入备份」迁移；CLI 端每次启动自动快照到 `data/backups/`（保留 7 份），也可手动 `npm run backup`。

**Q: Web 注册/登录需要额外的认证服务吗？**
A: 不需要。v2.2 起网页账户完全存于浏览器本地，`npm run dev`、`npm run docs:dev`、甚至纯静态的 `npm run docs:static` 模式下都可以注册、登录、切换账户。

---

## 📝 许可

MIT License — 仅供个人学习使用。
