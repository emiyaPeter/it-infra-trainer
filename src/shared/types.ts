// ============================================================
// IT 基础设施培训助手 — 共享类型定义
// ============================================================

// --- 学习进度 ---

export type ProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'quiz_passed'
  | 'lab_done';

export interface ProgressRecord {
  courseSlug: string;       // e.g., "networking"
  pageSlug: string;         // e.g., "02-osi-model"
  status: ProgressStatus;
  quizScore: number | null;  // 0-100
  completedAt: string | null; // ISO date
  timeSpentMin: number;      // total minutes spent
}

// --- 测验 ---

export type QuizType = 'multiple-choice' | 'fill-blank' | 'command-simulation';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: string[];         // for multiple-choice
  correct: number | string;   // index (0-based) for MC, answer string for fill-blank
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  quizId: string;
  score: number;              // 0-100
  answers: string[];          // user's selected answers
  attemptedAt: string;
}

// --- 实验 ---

export type StepCheckType =
  | 'file-exists'
  | 'permission-check'
  | 'command-output'
  | 'regex-match';

export interface LabStep {
  id: string;
  instruction: string;        // markdown-formatted instruction
  check: {
    type: StepCheckType;
    path?: string;
    command?: string;
    expected?: string;
    pattern?: string;
  };
  hint: string;
}

export interface Lab {
  id: string;
  title: string;
  prerequisites: string[];
  estimatedTime: number;       // minutes
  environment: {
    type: 'wsl2' | 'docker' | 'vm' | 'local';
    requirements: string[];
  };
  steps: LabStep[];
}

export interface LabCompletion {
  labId: string;
  completedSteps: number;
  totalSteps: number;
  completedAt: string | null;
  status: 'in_progress' | 'completed';
}

// --- 课程 ---

export interface CourseMetadata {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;       // minutes
  prerequisites: string[];
}

export interface PhaseInfo {
  id: number;
  title: string;
  duration: string;           // e.g., "1-3个月"
  topics: string[];
  courseCategory: string;     // corresponding docs/courses/ folder
}

// --- 学习路径 ---

export const LEARNING_PATH: PhaseInfo[] = [
  {
    id: 1, title: '基础入门', duration: '1-3个月',
    topics: ['硬件基础', 'OSI模型', 'TCP/IP', '子网划分', '命令行入门'],
    courseCategory: 'networking',
  },
  {
    id: 2, title: 'Linux系统管理', duration: '4-8个月',
    topics: ['命令行精通', '权限管理', '进程/服务', 'Shell脚本', '存储'],
    courseCategory: 'linux',
  },
  {
    id: 3, title: 'Windows Server', duration: '9-10个月',
    topics: ['AD域控制器', '组策略', 'DNS/DHCP', 'PowerShell'],
    courseCategory: 'windows-server',
  },
  {
    id: 4, title: '虚拟化技术', duration: '11-12个月',
    topics: ['VirtualBox', 'VMware概念', 'KVM/QEMU', 'Hyper-V'],
    courseCategory: 'virtualization',
  },
  {
    id: 5, title: '容器技术', duration: '13-16个月',
    topics: ['Docker核心', 'Docker Compose', 'Kubernetes基础'],
    courseCategory: 'docker',
  },
  {
    id: 6, title: '自动化运维', duration: '17-20个月',
    topics: ['Ansible', 'Terraform', 'CI/CD', '基础设施即代码'],
    courseCategory: 'ansible',
  },
  {
    id: 7, title: '监控与日志', duration: '21-22个月',
    topics: ['Prometheus', 'Grafana', 'ELK Stack', '告警'],
    courseCategory: 'monitoring',
  },
  {
    id: 8, title: '云计算基础', duration: '23-25个月',
    topics: ['AWS核心', 'Azure基础', '混合云'],
    courseCategory: 'cloud',
  },
  {
    id: 9, title: '安全基础', duration: '25-26个月',
    topics: ['防火墙', 'IAM', '证书管理', '合规'],
    courseCategory: 'security',
  },
  {
    id: 10, title: '灾备与高可用', duration: '27-28个月',
    topics: ['备份策略', '负载均衡', '故障转移', 'DR规划'],
    courseCategory: 'dr-backup',
  },
];

// --- 工具检测 ---

export interface ToolRequirement {
  name: string;
  displayName: string;
  checkCommand: string;       // command to verify installation
  expectedOutput: string;     // if output contains this, tool is installed
  installUrl: string;         // where to download
  required: boolean;          // is it mandatory?
  phase: number;              // which phase needs this tool?
}

export const TOOL_REQUIREMENTS: ToolRequirement[] = [
  {
    name: 'node', displayName: 'Node.js',
    checkCommand: 'node --version',
    expectedOutput: 'v',
    installUrl: 'https://nodejs.org',
    required: true, phase: 1,
  },
  {
    name: 'wsl2', displayName: 'WSL2 (Ubuntu)',
    checkCommand: 'wsl --list --quiet',
    expectedOutput: 'Ubuntu',
    installUrl: '在管理员PowerShell中运行: wsl --install -d Ubuntu',
    required: true, phase: 1,
  },
  {
    name: 'git', displayName: 'Git',
    checkCommand: 'git --version',
    expectedOutput: 'git version',
    installUrl: 'https://git-scm.com/download/win',
    required: true, phase: 1,
  },
  {
    name: 'vscode', displayName: 'VS Code',
    checkCommand: 'code --version',
    expectedOutput: '.',
    installUrl: 'https://code.visualstudio.com',
    required: false, phase: 1,
  },
  {
    name: 'docker', displayName: 'Docker Desktop',
    checkCommand: 'docker --version',
    expectedOutput: 'Docker version',
    installUrl: 'https://www.docker.com/products/docker-desktop',
    required: false, phase: 5,
  },
  {
    name: 'virtualbox', displayName: 'VirtualBox',
    checkCommand: 'VBoxManage --version',
    expectedOutput: '.',
    installUrl: 'https://www.virtualbox.org',
    required: false, phase: 4,
  },
];

// --- 学习统计 ---

export interface StudySession {
  id: number;
  date: string;
  durationMin: number;
  topic: string;
}

export interface LearningStats {
  totalPagesCompleted: number;
  totalQuizzesPassed: number;
  totalLabsCompleted: number;
  totalTimeSpentMin: number;
  phaseProgress: Record<number, number>;  // phase id -> percentage
  overallProgress: number;               // 0-100
  streak: number;                        // consecutive study days
}
