# AGENTS.md — AI 结对开发须知

本项目采用 AI 结对开发：需求与架构人工主导，实现由 AI 辅助，全部产出经人工 review 并通过自检护栏。

## 技术栈

- Node.js 20+ ESM（`"type": "module"`，import 语法）
- Web：VitePress 1.x + Vue 3（`docs/`，主题在 `docs/.vitepress/theme/`）
- CLI：commander + inquirer + chalk（`src/cli/`）
- 数据：better-sqlite3（WAL 模式，`data/data.db`）；Web 侧 localStorage
- 跨平台：实操检查经 `src/cli/utils/bash.js`（Windows 自动走 WSL）

## 验证命令（改动后必跑）

```bash
npm test              # 21 项语法 + 5 项 CLI 冒烟 + 生产构建（必须全绿）
SKIP_BUILD=1 npm test # 秒级快检（只做语法+冒烟）
npm run dev           # 启动站点人工验证
```

## 红线（违反即事故）

1. **`data/` 目录是用户真实学习数据**——任何命令不得删除/覆盖/清空
2. **`启动学习助手.bat` 必须保持 GBK 编码**——UTF-8 会导致 cmd 代码页切换错位而闪退（见 docs/retrospective.md 坑 1）
3. **`.env` 与任何密钥/个人信息不得写入代码或提交 git**
4. **`docs/public/` 不得放置用户数据**（v2.2 已整改 PII 外发问题）
5. 修改 SQLite 相关逻辑时，备份相关代码必须保留 WAL 检查点语义

## 已知约定

- 中文注释；新命令遵循 `src/cli/commands/` 现有结构（动态 import 注册到 index.js）
- Web 进度的模块章节数是 `theme/utils/progress.js` 的 PHASE_CATALOG 常量——**新增课程章节后必须同步更新**
- 课程内容 frontmatter：title/description/difficulty/estimatedTime/prerequisites
- 提交粒度：一个逻辑任务一个 commit，信息说清"做了什么+为什么"
- **站内链接一律用 `withBase()`**（或相对路径）——站点部署在子路径 `/it-infra-trainer/`，硬编码根路径会在生产 404
- **上线/改版验收必须真截图走查，且覆盖桌面+移动两个断点**——断言不止"无重叠"，还要"无横向溢出、关键交互元素在视口内"；HTTP 200 不等于页面正确（坑 7/9）
- **Git Bash 下带 `/` 开头的环境变量赋值（如 `BASE_PATH=/xx/`）必须加 `MSYS_NO_PATHCONV=1`**，否则被 MSYS 隐式转换成 Windows 路径写进产物（坑 8）；子路径构建后必须 grep 产物确认无 `Program Files` 字样
- AI 相关：CLI 密钥只经 `npm run set-key` 进 `.env`；Web 端为 BYOK 模式（访客密钥存本机 localStorage `it-trainer-ai-config`，站点代码/仓库零密钥，见 ADR-008 修订版）；判分分层——选择题必本地判，填空题本地优先、AI 只判本地未命中的，AI 判错自动跑对抗审计
- 题库约定：`quizzes/*.json` 构建时经 `import.meta.glob` 自动进 Web 测验页（新增文件零代码）；顶层 `module` 字段声明对应的 `courses/` 目录名（测验 ≥80 分自动点亮该模块章节）；填空题用 `accepts[]` 列可接受写法；无模块映射的题库为纯练习。**题型**：multiple-choice / fill-blank（本地判分）+ short-answer / coding（主观题：`reference` 必填字符串参考要点，AI 判卷三档，无密钥转自评不计分，见 ADR-010）；题目可带 `chapter` 字段（`courses/<mod>/<file>.md`）联动章节页"本章小测"入口与错题回读。**结构错误由 `npm test` 第 3 步题库校验拦截**（scripts/validate-quizzes.js）
- 章节数/模块名**全部自动**：`theme/utils/chapters.js` 从 config.ts sidebar 反解（加章节只需改 sidebar——本来就要改）；不要再手工维护章节数常量

## 排障速查

- 构建产物在 `docs/.vitepress/dist/`；构建判定看退出码+产物，别匹配日志文本
- CLI 交互命令在非 TTY 管道下会报 ExitPromptError——属预期（见 docs/retrospective.md）
- WSL 未安装时 bash.js 返回 wslMissing 提示，不是故障
