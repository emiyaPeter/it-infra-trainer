// ============================================================
// env-check 命令 — 检查开发环境配置
// ============================================================

import { execSync } from 'node:child_process';
import chalk from 'chalk';

const TOOLS = [
  {
    name: 'Node.js',
    command: 'node --version',
    check: (out) => out.includes('v'),
    installUrl: 'https://nodejs.org',
    required: true,
    phase: 1,
    category: 'runtime',
  },
  {
    name: 'npm',
    command: 'npm --version',
    check: (out) => out.match(/^\d+\./),
    installUrl: '随 Node.js 自动安装',
    required: true,
    phase: 1,
    category: 'runtime',
  },
  {
    name: 'WSL2',
    command: 'wsl --list --quiet',
    check: (out) => out.trim().length > 0,
    installUrl: '管理员PowerShell运行: wsl --install -d Ubuntu',
    required: true,
    phase: 1,
    category: 'environment',
  },
  {
    name: 'Git',
    command: 'git --version',
    check: (out) => out.includes('git version'),
    installUrl: 'https://git-scm.com/download/win',
    required: true,
    phase: 1,
    category: 'tools',
  },
  {
    name: 'VS Code',
    command: 'code --version',
    check: (out) => out.length > 0,
    installUrl: 'https://code.visualstudio.com',
    required: false,
    phase: 1,
    category: 'tools',
  },
  {
    name: 'Docker Desktop',
    command: 'docker --version',
    check: (out) => out.includes('Docker version'),
    installUrl: 'https://www.docker.com/products/docker-desktop',
    required: false,
    phase: 5,
    category: 'containers',
  },
  {
    name: 'VirtualBox',
    command: 'VBoxManage --version',
    check: (out) => /^\d/.test(out.trim()),
    installUrl: 'https://www.virtualbox.org',
    required: false,
    phase: 3,
    category: 'virtualization',
  },
  {
    name: 'Python 3',
    command: 'python3 --version',
    check: (out) => out.includes('Python 3'),
    installUrl: 'https://www.python.org/downloads/',
    required: false,
    phase: 6,
    category: 'tools',
  },
];

function checkTool(tool) {
  try {
    const output = execSync(tool.command, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      ...tool,
      installed: tool.check(output),
      output: output.trim().split('\n')[0],
      error: null,
    };
  } catch (err) {
    return {
      ...tool,
      installed: false,
      output: null,
      error: err.message?.split('\n')[0] || '未找到',
    };
  }
}

export async function envCheck() {
  console.log('');
  console.log(chalk.bold.cyan('🔍 IT 培训助手 — 环境检查'));
  console.log(chalk.gray('─'.repeat(55)));
  console.log('');

  // Check all tools
  const spinner = ['|', '/', '—', '\\'];
  let i = 0;

  console.log(chalk.gray('  正在扫描已安装的工具...'));
  const results = TOOLS.map((tool) => {
    i++;
    process.stdout.write(`\r  ${chalk.gray(spinner[i % 4])} 检查 ${tool.name}...`);
    return checkTool(tool);
  });
  process.stdout.write('\r\x1b[K'); // Clear the spinner line

  console.log('');

  // Group by category
  const categories = {};
  for (const r of results) {
    if (!categories[r.category]) categories[r.category] = [];
    categories[r.category].push(r);
  }

  const catLabels = {
    runtime: '🔧 运行时环境',
    environment: '🐧 实验环境',
    tools: '🛠️  开发工具',
    containers: '🐳 容器相关 (阶段5)',
    virtualization: '💻 虚拟化 (阶段3-4)',
  };

  for (const [cat, tools] of Object.entries(categories)) {
    console.log(chalk.bold(`  ${catLabels[cat] || cat}:`));
    for (const t of tools) {
      const icon = t.installed ? chalk.green('✅') : t.required ? chalk.red('❌') : chalk.yellow('⚠️');
      const status = t.installed
        ? chalk.green(t.output)
        : chalk.red('未安装');
      const badge = t.required ? chalk.red('[必需]') : chalk.gray('[可选]');

      console.log(`    ${icon} ${chalk.white(t.name.padEnd(16))} ${badge} ${status}`);

      if (!t.installed) {
        console.log(`       ${chalk.gray('安装:')} ${chalk.blue(t.installUrl)}`);
      }
    }
    console.log('');
  }

  // Summary
  const installed = results.filter((r) => r.installed).length;
  const required = results.filter((r) => r.required && !r.installed).length;
  const optional = results.filter((r) => !r.required && !r.installed).length;

  console.log(chalk.gray('─'.repeat(55)));
  console.log(chalk.bold(`  统计: ${chalk.green(installed)}/${results.length} 已安装`));

  if (required === 0 && optional === 0) {
    console.log(chalk.green('\n  🎉 所有工具已就绪！运行 it-trainer roadmap 开始学习吧。'));
  } else {
    if (required > 0) {
      console.log(chalk.red(`\n  ⚠️  缺少 ${required} 个必需工具，请先安装后再开始学习。`));
    }
    if (optional > 0) {
      console.log(chalk.yellow(`  💡 还有 ${optional} 个可选工具未安装（学到对应阶段时再装即可）。`));
    }
  }

  // Phase readiness
  console.log('');
  console.log(chalk.bold('  阶段就绪状态:'));
  for (let phase = 1; phase <= 10; phase++) {
    const phaseTools = results.filter((r) => r.phase <= phase);
    const phaseRequired = phaseTools.filter((r) => r.required && !r.installed).length;

    if (phaseRequired === 0) {
      console.log(`    阶段 ${String(phase).padStart(2)}: ${chalk.green('✅ 就绪')}`);
    } else {
      console.log(`    阶段 ${String(phase).padStart(2)}: ${chalk.yellow(`⚠️  缺 ${phaseRequired} 个工具`)}`);
    }
  }

  console.log('');
}
