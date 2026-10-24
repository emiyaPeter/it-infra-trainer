@echo off
setlocal enabledelayedexpansion
title AI 密钥配置

cd /d "%~dp0"

echo.
echo  ============================================
echo    AI 答疑密钥配置
echo    支持 DeepSeek / Kimi / 智谱 / 自定义
echo  ============================================
echo.

node --version > nul 2>&1
if !errorlevel! neq 0 (
    echo   [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

call npm run set-key

echo.
pause
