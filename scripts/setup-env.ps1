# ============================================================
# IT 培训助手 — Windows 环境配置脚本
# 以管理员身份运行此脚本
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IT 基础设施工程师培训助手" -ForegroundColor Cyan
Write-Host "  环境配置脚本 (Windows 11)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  建议以管理员身份运行此脚本（部分功能需要管理员权限）" -ForegroundColor Yellow
    Write-Host "   右键 PowerShell → 以管理员身份运行，然后重新执行此脚本" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "是否继续？（y/n）"
    if ($continue -ne 'y') { exit }
}

# ---- WSL2 ----
Write-Host ""
Write-Host "[1/5] 检查 WSL2..." -ForegroundColor Yellow
try {
    $wsl = wsl --list --quiet 2>$null
    if ($wsl) {
        Write-Host "  ✅ WSL2 已安装" -ForegroundColor Green
        Write-Host "     已安装的发行版: $wsl"
    } else {
        Write-Host "  ⚠️  WSL2 未安装" -ForegroundColor Yellow
        Write-Host "  安装命令: wsl --install -d Ubuntu" -ForegroundColor Cyan
        $installWsl = Read-Host "是否现在安装？（y/n）"
        if ($installWsl -eq 'y') {
            wsl --install -d Ubuntu
        }
    }
} catch {
    Write-Host "  ❌ WSL2 未安装或不可用" -ForegroundColor Red
    Write-Host "  请在管理员PowerShell中运行: wsl --install -d Ubuntu" -ForegroundColor Cyan
}

# ---- Git ----
Write-Host ""
Write-Host "[2/5] 检查 Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host "  ✅ $gitVersion" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Git 未安装" -ForegroundColor Yellow
        Write-Host "  下载: https://git-scm.com/download/win" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ Git 未安装" -ForegroundColor Red
    Write-Host "  下载: https://git-scm.com/download/win" -ForegroundColor Cyan
}

# ---- VS Code ----
Write-Host ""
Write-Host "[3/5] 检查 VS Code..." -ForegroundColor Yellow
try {
    $codeVersion = code --version 2>$null
    if ($codeVersion) {
        Write-Host "  ✅ VS Code 已安装" -ForegroundColor Green
    } else {
        Write-Host "  💡 VS Code 未安装（可选）" -ForegroundColor Yellow
        Write-Host "  下载: https://code.visualstudio.com" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  💡 VS Code 未安装（可选）" -ForegroundColor Yellow
    Write-Host "  下载: https://code.visualstudio.com" -ForegroundColor Cyan
}

# ---- Docker Desktop ----
Write-Host ""
Write-Host "[4/5] 检查 Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "  ✅ $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "  💡 Docker Desktop 未安装（阶段5才需要）" -ForegroundColor Yellow
        Write-Host "  下载: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  💡 Docker Desktop 未安装（阶段5才需要）" -ForegroundColor Yellow
}

# ---- VirtualBox ----
Write-Host ""
Write-Host "[5/5] 检查 VirtualBox..." -ForegroundColor Yellow
try {
    $vbVersion = VBoxManage --version 2>$null
    if ($vbVersion) {
        Write-Host "  ✅ VirtualBox $vbVersion" -ForegroundColor Green
    } else {
        Write-Host "  💡 VirtualBox 未安装（阶段3-4才需要）" -ForegroundColor Yellow
        Write-Host "  下载: https://www.virtualbox.org" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  💡 VirtualBox 未安装（阶段3-4才需要）" -ForegroundColor Yellow
}

# ---- Summary ----
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  环境检查完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  接下来：" -ForegroundColor White
Write-Host "  1. 进入项目目录: cd it-infra-trainer" -ForegroundColor Gray
Write-Host "  2. 安装依赖: npm install" -ForegroundColor Gray
Write-Host "  3. 初始化数据库: npm run init-db" -ForegroundColor Gray
Write-Host "  4. 启动课程网站: npm run docs:dev" -ForegroundColor Gray
Write-Host "  5. 或运行CLI工具: npm run cli -- roadmap" -ForegroundColor Gray
Write-Host ""
