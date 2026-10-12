@echo off
setlocal enabledelayedexpansion
title IT 基础设施培训助手

cd /d "%~dp0"

echo.
echo  ============================================
echo    IT 基础设施工程师培训助手
echo    Node.js + VitePress · 离线可用
echo  ============================================
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

:: 检查数据库是否初始化（实际文件名为 data.db）
if not exist "data\data.db" (
    echo   [提示] 正在初始化数据库...
    node scripts\init-db.js
)

echo   正在启动课程网站，就绪后自动打开浏览器...
echo   （手机/平板：连同一 WiFi，用终端显示的 Network 地址访问）
echo.
echo   [注意] 关闭本窗口将停止服务
echo  ============================================
echo.

:: 一键启动（内部含端口就绪检测，就绪后才打开浏览器）
call npm run dev

echo.
echo   服务已停止。
pause
