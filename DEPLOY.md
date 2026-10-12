# 三步上线（GitHub Pages，全免费）

推送到 GitHub 后，`deploy.yml` 会自动构建并发布网站，`ci.yml` 会跑全量自检并在 README 顶部显示绿色徽章。

## 方式 A：命令行（推荐，装一次 gh 以后都省事）

```powershell
# 1. 安装 GitHub CLI 并登录（浏览器里点一次授权）
winget install GitHub.cli
gh auth login

# 2. 在项目目录创建仓库并推送（--public 求职作品需要公开可访问）
cd C:\Users\孙清渺\Desktop\test\it-infra-trainer
gh repo create it-infra-trainer --public --source=. --push

# 3. 开启 Pages（来源选 GitHub Actions 工作流）
gh api -X POST repos/{owner}/it-infra-trainer/pages -f build_type=workflow
```

约 2 分钟后访问：`https://<你的用户名>.github.io/it-infra-trainer/`

## 方式 B：网页方式（不想装命令行工具）

1. GitHub 网页新建空仓库 `it-infra-trainer`（Public）
2. 本项目目录执行：

```bash
git remote add origin https://github.com/<你的用户名>/it-infra-trainer.git
git push -u origin main
```

3. 仓库页面 → Settings → Pages → Build and deployment → Source 选 **GitHub Actions**

## 上线后的两个动作

- 把访问地址填进 `README.md` 的「在线体验」一节（替换占位文字），再 push 一次
- 打开网站点「一键载入演示数据」确认演示效果

## 常见问题

- **部署失败看哪**：仓库 Actions 标签页 → Deploy Pages 工作流的日志
- **网站开了但样式乱**：说明 Pages 来源没选 "GitHub Actions"（重做第 3 步）
- **课程站子路径**：站点部署在 `/it-infra-trainer/` 子路径下，构建时已通过 `BASE_PATH` 环境变量自动处理，本地开发不受影响
