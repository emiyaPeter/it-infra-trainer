@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title IT 基础设施培训助手（原版）

cd /d "%~dp0"

echo.
echo ╔══════════════════════════════════════╗
echo ║  🖥️  IT 基础设施工程师培训助手      ║
echo ║  原版 · Node.js + VitePress         ║
echo ╚══════════════════════════════════════╝
echo.

:: 检查 Node.js
node --version > nul 2>&1
if !errorlevel! neq 0 (
    echo   [错误] 未找到 Node.js，请先安装 Node.js
    echo   下载地址: https://nodejs.org/
    echo   安装 LTS 版本即可
    echo.
    pause
    exit /b 1
)

:: 检查 node_modules
if not exist "node_modules\" (
    echo   [提示] 首次运行，正在安装依赖...
    echo.
    call npm install
    if !errorlevel! neq 0 (
        echo   [错误] 依赖安装失败，请检查网络后重试
        pause
        exit /b 1
    )
)

:: 检查数据库是否初始化
if not exist "data\it-trainer.db" (
    echo   [提示] 正在初始化数据库...
    node scripts/init-db.js
)

echo   正在启动服务...
echo.
echo   🔐 认证服务: http://localhost:3456
echo   📚 课程文档: http://localhost:5173
echo.
echo   ⚠️  关闭本窗口将停止所有服务
echo ══════════════════════════════════════
echo.

:: 启动浏览器
timeout /t 2 /nobreak > nul
start "" "http://localhost:5173"

:: 一键启动
npm run dev

echo.
echo   服务已停止。
pause
