# ============================================================
# IT 基础设施培训助手 — 一键安装所有配套软件
# 用法：右键此文件 → "使用 PowerShell 运行"（需要管理员权限）
# 或在管理员 PowerShell 中运行: .\scripts\install-all.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IT 基础设施工程师培训助手" -ForegroundColor Cyan
Write-Host "  配套软件一键安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "[!] 请以管理员身份运行此脚本！" -ForegroundColor Red
    Write-Host "    右键 install-all.ps1 → 使用 PowerShell 运行" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按 Enter 键退出"
    exit 1
}

$totalSteps = 5
$currentStep = 0

# ============================================================
# 1. WSL2 + Ubuntu
# ============================================================
$currentStep++
Write-Host "[$currentStep/$totalSteps] 正在安装 WSL2 + Ubuntu..." -ForegroundColor Green
Write-Host "  这可能需要几分钟，并且需要重启电脑。" -ForegroundColor Gray

$wslStatus = wsl --status 2>&1
if ($wslStatus -match "默认版本") {
    Write-Host "  [✓] WSL2 已安装" -ForegroundColor Green
} else {
    Write-Host "  正在启用 WSL..." -ForegroundColor Yellow
    wsl --install --no-distribution
    Write-Host "  [✓] WSL2 基础安装完成" -ForegroundColor Green
}

# 安装 Ubuntu 发行版
$distros = wsl --list --quiet 2>&1
if ($distros -match "Ubuntu") {
    Write-Host "  [✓] Ubuntu 已安装" -ForegroundColor Green
} else {
    Write-Host "  正在安装 Ubuntu..." -ForegroundColor Yellow
    wsl --install -d Ubuntu
    Write-Host "  [✓] Ubuntu 安装完成" -ForegroundColor Green
}

# ============================================================
# 2. Visual Studio Code
# ============================================================
$currentStep++
Write-Host "[$currentStep/$totalSteps] 正在安装 Visual Studio Code..." -ForegroundColor Green

$vscodePath = "${env:ProgramFiles}\Microsoft VS Code\Code.exe"
$vscodeUserPath = "${env:LOCALAPPDATA}\Programs\Microsoft VS Code\Code.exe"
if ((Test-Path $vscodePath) -or (Test-Path $vscodeUserPath)) {
    Write-Host "  [✓] VS Code 已安装" -ForegroundColor Green
} else {
    winget install --id Microsoft.VisualStudioCode --accept-package-agreements --accept-source-agreements
    Write-Host "  [✓] VS Code 安装完成" -ForegroundColor Green
}

# ============================================================
# 3. Git
# ============================================================
$currentStep++
Write-Host "[$currentStep/$totalSteps] 正在检查 Git..." -ForegroundColor Green

$gitStatus = git --version 2>&1
if ($gitStatus -match "git version") {
    Write-Host "  [✓] Git 已安装: $gitStatus" -ForegroundColor Green
} else {
    Write-Host "  正在安装 Git..." -ForegroundColor Yellow
    winget install --id Git.Git --accept-package-agreements
    Write-Host "  [✓] Git 安装完成" -ForegroundColor Green
}

# ============================================================
# 4. Docker Desktop
# ============================================================
$currentStep++
Write-Host "[$currentStep/$totalSteps] 正在安装 Docker Desktop..." -ForegroundColor Green

$dockerStatus = docker --version 2>&1
if ($dockerStatus -match "Docker version") {
    Write-Host "  [✓] Docker Desktop 已安装" -ForegroundColor Green
} else {
    Write-Host "  正在下载 Docker Desktop（约 600MB，请耐心等待）..." -ForegroundColor Yellow
    winget install --id Docker.DockerDesktop --accept-package-agreements
    Write-Host "  [✓] Docker Desktop 安装完成" -ForegroundColor Green
    Write-Host "  [!] 安装后可能需要重启电脑，之后运行 Docker Desktop 完成初始设置" -ForegroundColor Yellow
}

# ============================================================
# 5. VirtualBox
# ============================================================
$currentStep++
Write-Host "[$currentStep/$totalSteps] 正在安装 VirtualBox..." -ForegroundColor Green

$vboxStatus = VBoxManage --version 2>&1
if ($vboxStatus -match "\d+\.\d+") {
    Write-Host "  [✓] VirtualBox 已安装" -ForegroundColor Green
} else {
    winget install --id Oracle.VirtualBox --accept-package-agreements
    Write-Host "  [✓] VirtualBox 安装完成" -ForegroundColor Green
}

# ============================================================
# 完成
# ============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "已安装的软件：" -ForegroundColor White
Write-Host "  [✓] WSL2 + Ubuntu" -ForegroundColor Green
Write-Host "  [✓] Visual Studio Code" -ForegroundColor Green
Write-Host "  [✓] Git" -ForegroundColor Green
Write-Host "  [✓] Docker Desktop" -ForegroundColor Green
Write-Host "  [✓] VirtualBox" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "  1. 重启电脑（WSL2 和 Docker 需要）" -ForegroundColor White
Write-Host "  2. 从开始菜单打开 Ubuntu，设置用户名和密码" -ForegroundColor White
Write-Host "  3. 运行 Docker Desktop 完成初始设置" -ForegroundColor White
Write-Host "  4. 回到项目目录运行: npm run docs:dev" -ForegroundColor White
Write-Host ""
Read-Host "按 Enter 键退出"
