// ============================================================
// roadmap 命令 — 显示学习路线图
// ============================================================

import chalk from 'chalk';

const PHASES = [
  {
    id: 1,
    title: '基础入门',
    duration: '1-3个月',
    difficulty: '⭐ 入门',
    topics: ['计算机硬件基础', 'OSI七层模型', 'TCP/IP协议栈', 'IP地址与子网划分', 'DNS/DHCP', '命令行工具入门'],
    tools: ['WSL2 + Ubuntu', 'VS Code', 'Git', 'Node.js'],
    courses: 'networking',
    highlight: '⭐ 核心基础',
  },
  {
    id: 2,
    title: 'Linux 系统管理',
    duration: '4-8个月',
    difficulty: '⭐⭐ 基础',
    topics: ['命令行精通', '用户与权限管理', '进程与服务管理 (systemd)', '存储与文件系统', 'Shell脚本编程', 'Linux网络配置'],
    tools: ['WSL2 Ubuntu', 'VirtualBox (用于LAMP搭建)'],
    courses: 'linux',
    highlight: '⭐ 最重要阶段',
  },
  {
    id: 3,
    title: 'Windows Server 管理',
    duration: '9-10个月',
    difficulty: '⭐⭐ 基础',
    topics: ['AD域控制器', '组策略管理 (GPO)', 'DNS/DHCP服务', 'PowerShell自动化', '文件服务器'],
    tools: ['VirtualBox', 'Windows Server 2022 Eval (180天免费)'],
    courses: 'windows-server',
    highlight: '',
  },
  {
    id: 4,
    title: '虚拟化技术',
    duration: '11-12个月',
    difficulty: '⭐⭐ 基础',
    topics: ['虚拟化原理', 'VirtualBox精通', 'VMware/ESXi概念', 'KVM/QEMU', 'Hyper-V'],
    tools: ['VirtualBox', 'Hyper-V (Win11 Pro)'],
    courses: 'virtualization',
    highlight: '',
  },
  {
    id: 5,
    title: '容器技术',
    duration: '13-16个月',
    difficulty: '⭐⭐⭐ 中级',
    topics: ['Docker核心 (镜像/容器/网络/存储)', 'Dockerfile编写', 'Docker Compose', 'Kubernetes基础'],
    tools: ['Docker Desktop', 'Minikube'],
    courses: 'docker',
    highlight: '🔥 行业必备',
  },
  {
    id: 6,
    title: '自动化运维',
    duration: '17-20个月',
    difficulty: '⭐⭐⭐ 中级',
    topics: ['Ansible配置管理', 'Terraform基础设施即代码', 'CI/CD流水线概念', 'Git高级用法'],
    tools: ['Docker (作为Ansible目标)', 'Terraform CLI'],
    courses: 'ansible',
    highlight: '',
  },
  {
    id: 7,
    title: '监控与日志',
    duration: '21-22个月',
    difficulty: '⭐⭐⭐ 中级',
    topics: ['Prometheus指标收集', 'Grafana可视化', 'ELK Stack日志分析', '告警规则配置'],
    tools: ['Docker Desktop'],
    courses: 'monitoring',
    highlight: '',
  },
  {
    id: 8,
    title: '云计算基础',
    duration: '23-25个月',
    difficulty: '⭐⭐⭐ 中级',
    topics: ['云计算概念 (IaaS/PaaS/SaaS)', 'AWS核心服务 (EC2/S3/VPC/IAM)', 'Azure基础', '混合云架构'],
    tools: ['AWS免费账户', 'Azure免费账户'],
    courses: 'cloud',
    highlight: '',
  },
  {
    id: 9,
    title: '安全基础',
    duration: '25-26个月',
    difficulty: '⭐⭐⭐⭐ 进阶',
    topics: ['网络安全 (防火墙/IDS/IPS)', 'IAM身份与访问管理', 'PKI与证书', '安全合规基础'],
    tools: ['WSL2 + iptables', 'OpenSSL'],
    courses: 'security',
    highlight: '',
  },
  {
    id: 10,
    title: '灾备与高可用',
    duration: '27-28个月',
    difficulty: '⭐⭐⭐⭐ 进阶',
    topics: ['备份策略 (3-2-1规则)', '负载均衡 (HAProxy/Nginx)', '故障转移与集群', 'DR规划与演练'],
    tools: ['Docker Desktop'],
    courses: 'dr-backup',
    highlight: '',
  },
];

export async function showRoadmap(options) {
  const phaseNum = options.phase ? parseInt(options.phase, 10) : null;

  if (phaseNum) {
    // Show single phase detail
    const phase = PHASES.find((p) => p.id === phaseNum);
    if (!phase) {
      console.log(chalk.red(`\n  未找到阶段 ${phaseNum}。有效范围: 1-${PHASES.length}\n`));
      return;
    }

    console.log('');
    console.log(chalk.bold.cyan(`📌 阶段${phase.id}：${phase.title}`));
    console.log(chalk.gray('─'.repeat(55)));
    console.log('');
    console.log(`  ${chalk.yellow('⏱  时长')}: ${phase.duration}`);
    console.log(`  ${chalk.yellow('📊 难度')}: ${phase.difficulty}`);
    console.log('');

    console.log(chalk.bold('  📚 学习内容:'));
    for (const t of phase.topics) {
      console.log(`    ${chalk.green('▸')} ${t}`);
    }
    console.log('');

    console.log(chalk.bold('  🛠️  需要的工具:'));
    for (const t of phase.tools) {
      console.log(`    ${chalk.blue('▸')} ${t}`);
    }
    console.log('');

    if (phase.highlight) {
      console.log(`  ${chalk.magenta('💡 ' + phase.highlight)}`);
      console.log('');
    }

    const prevPhase = phaseNum > 1 ? phaseNum - 1 : null;
    const nextPhase = phaseNum < PHASES.length ? phaseNum + 1 : null;

    if (prevPhase || nextPhase) {
      console.log(chalk.gray('  导航:'));
      if (prevPhase) console.log(`    ${chalk.gray('←')} it-trainer roadmap -p ${prevPhase}  ${PHASES[prevPhase - 1]?.title}`);
      if (nextPhase) console.log(`    ${chalk.gray('→')} it-trainer roadmap -p ${nextPhase}  ${PHASES[nextPhase - 1]?.title}`);
      console.log('');
    }
  } else {
    // Show all phases overview
    console.log('');
    console.log(chalk.bold.cyan('🗺️  IT 基础设施工程师 — 3年学习路线图'));
    console.log(chalk.gray('─'.repeat(80)));
    console.log('');

    for (const phase of PHASES) {
      const phaseStr = `阶段${String(phase.id).padStart(2)}`;
      const bar = '█'.repeat(Math.max(1, Math.ceil(phase.id / 2))) + '░'.repeat(Math.max(0, 5 - Math.ceil(phase.id / 2)));

      console.log(`  ${chalk.cyan(phaseStr)} ${chalk.bold(phase.title.padEnd(18))} ${chalk.gray('|')} ${chalk.yellow(phase.duration.padEnd(10))} ${chalk.gray('|')} ${chalk.white(phase.difficulty)}`);
      console.log(`       ${chalk.gray(bar)}`);
      if (phase.highlight) {
        console.log(`       ${chalk.magenta(phase.highlight)}`);
      }
      console.log('');
    }

    console.log(chalk.gray('─'.repeat(80)));
    console.log(chalk.gray('  使用 it-trainer roadmap -p <编号> 查看阶段详情'));
    console.log(chalk.gray('  使用 it-trainer progress 查看你的学习进度'));
    console.log('');
  }
}
