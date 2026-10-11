// ============================================================
// user 命令 — 用户管理（创建/切换/删除/列表）
// ============================================================

import chalk from 'chalk';
import inquirer from 'inquirer';
import bcrypt from 'bcryptjs';
import {
  getDb,
  createUser,
  getAllUsers,
  getUserByName,
  getActiveUserId,
  getActiveUserName,
  setActiveUser,
  deleteUser,
  renameUser,
  exportUsersToJson,
} from '../utils/db.js';
import { getConfig } from '../utils/config.js';
import path from 'node:path';

/**
 * 列出所有用户
 */
async function listUsers() {
  const users = getAllUsers();
  const activeId = getActiveUserId();

  console.log('');
  console.log(chalk.bold.cyan('👤 用户列表'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('');

  if (users.length === 0) {
    console.log(chalk.gray('  暂无用户。运行 user create 创建你的账户。'));
    console.log('');
    return;
  }

  for (const u of users) {
    const isActive = String(u.id) === activeId;
    const marker = isActive ? chalk.green(' ● 当前') : '   ';
    const displayPhone = u.phone !== '00000000000' ? u.phone : '—';
    const lastActive = u.last_active_at ? u.last_active_at.slice(0, 16) : '从未';
    console.log(`${marker} ${chalk.bold(u.name)}  📱 ${displayPhone}  🕐 ${lastActive}`);
  }

  console.log('');
  console.log(chalk.gray(`  共 ${users.length} 位用户`));
  console.log(chalk.gray('  运行 it-trainer user switch <姓名> 切换用户'));
  console.log('');
}

/**
 * 创建新用户
 */
async function createUserCmd(name, phone) {
  // 交互式输入（如果参数不足）
  if (!name || !phone) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '姓名:',
        validate: (v) => v.trim() ? true : '姓名不能为空',
      },
      {
        type: 'input',
        name: 'phone',
        message: '手机号:',
        validate: (v) => /^\d{6,15}$/.test(v.trim()) ? true : '请输入有效手机号（6-15位数字）',
      },
    ]);
    name = answers.name.trim();
    phone = answers.phone.trim();
  }

  // 验证手机号格式
  if (!/^\d{6,15}$/.test(phone)) {
    console.log(chalk.red(`\n  ❌ 手机号格式无效: ${phone}（需要 6-15 位数字）\n`));
    return;
  }

  const result = createUser(name, phone);

  console.log('');
  if (result.existed) {
    console.log(chalk.yellow(`  ⚠️ 用户已存在: ${name} (${phone})`));
    // 询问是否切换
    const { switchNow } = await inquirer.prompt([{
      type: 'confirm',
      name: 'switchNow',
      message: '是否切换到该用户？',
      default: true,
    }]);
    if (switchNow) {
      setActiveUser(result.id);
      console.log(chalk.green(`  ✅ 已切换到: ${name}`));
    }
  } else {
    console.log(chalk.green(`  ✅ 用户创建成功: ${name} (${phone})`));
    console.log(chalk.green(`  ✅ 已自动切换为当前用户`));
  }
  console.log('');
}

/**
 * 切换活跃用户
 */
async function switchUser(name) {
  if (!name) {
    const users = getAllUsers().filter(u => u.name !== 'default');
    if (users.length === 0) {
      console.log(chalk.yellow('\n  暂无用户，请先创建: it-trainer user create <姓名> <手机号>\n'));
      return;
    }
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: '选择要切换的用户:',
      choices: users.map(u => ({
        name: `${u.name} (${u.phone})`,
        value: u.id,
      })),
    }]);
    setActiveUser(selected);
    const user = users.find(u => u.id === selected);
    console.log('');
    console.log(chalk.green(`  ✅ 已切换到: ${user.name}`));
    console.log('');
    return;
  }

  const matches = getUserByName(name);

  if (matches.length === 0) {
    console.log(chalk.red(`\n  ❌ 未找到用户: ${name}`));
    console.log(chalk.gray('  运行 it-trainer user list 查看所有用户'));
    console.log(chalk.gray('  运行 it-trainer user create <姓名> <手机号> 创建新用户\n'));
    return;
  }

  if (matches.length === 1) {
    setActiveUser(matches[0].id);
    console.log('');
    console.log(chalk.green(`  ✅ 已切换到: ${matches[0].name} (${matches[0].phone})`));
    console.log('');
  } else {
    // 同名用户，通过手机号区分
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: `找到 ${matches.length} 位"${name}"，请选择:`,
      choices: matches.map(u => ({
        name: `${u.name} — ${u.phone}`,
        value: u.id,
      })),
    }]);
    setActiveUser(selected);
    const user = matches.find(u => u.id === selected);
    console.log('');
    console.log(chalk.green(`  ✅ 已切换到: ${user.name} (${user.phone})`));
    console.log('');
  }
}

/**
 * 删除用户及所有数据
 */
async function deleteUserCmd(name) {
  if (!name) {
    // 交互式选择
    const users = getAllUsers().filter(u => u.name !== 'default');
    if (users.length === 0) {
      console.log(chalk.yellow('\n  暂无用户可删除\n'));
      return;
    }
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: '选择要删除的用户:',
      choices: users.map(u => ({
        name: `${u.name} (${u.phone})`,
        value: u.id,
      })),
    }]);
    const confirmed = await confirmDelete(users.find(u => u.id === selected));
    if (confirmed) {
      deleteUser(selected);
      console.log(chalk.green('\n  ✅ 用户及所有数据已删除\n'));
    } else {
      console.log(chalk.gray('\n  已取消\n'));
    }
    return;
  }

  const matches = getUserByName(name);
  if (matches.length === 0) {
    console.log(chalk.red(`\n  ❌ 未找到用户: ${name}\n`));
    return;
  }

  let target;
  if (matches.length === 1) {
    target = matches[0];
  } else {
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: `找到 ${matches.length} 位"${name}"，选择要删除的:`,
      choices: matches.map(u => ({
        name: `${u.name} — ${u.phone}`,
        value: u.id,
      })),
    }]);
    target = matches.find(u => u.id === selected);
  }

  if (target.name === 'default') {
    console.log(chalk.yellow('\n  ⚠️ 不能删除默认用户\n'));
    return;
  }

  const confirmed = await confirmDelete(target);
  if (confirmed) {
    deleteUser(target.id);
    console.log(chalk.green('\n  ✅ 用户及所有关联数据已删除\n'));
  } else {
    console.log(chalk.gray('\n  已取消\n'));
  }
}

async function confirmDelete(user) {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: chalk.red(`确认删除用户 "${user.name} (${user.phone})" 及其所有学习数据？此操作不可撤销！`),
    default: false,
  }]);
  return confirm;
}

/**
 * 显示当前用户
 */
async function currentUser() {
  const name = getActiveUserName();
  const users = getAllUsers();
  const activeId = getActiveUserId();
  const active = users.find(u => String(u.id) === activeId);

  console.log('');
  console.log(chalk.bold.cyan('👤 当前用户'));
  console.log(chalk.gray('─'.repeat(30)));
  if (active) {
    console.log(`  姓名: ${chalk.bold(active.name)}`);
    console.log(`  手机: ${active.phone !== '00000000000' ? active.phone : '未设置'}`);
    console.log(`  创建: ${active.created_at?.slice(0, 10) || '—'}`);
    console.log(`  最近: ${active.last_active_at?.slice(0, 16) || '—'}`);
  } else {
    console.log(chalk.gray('  未设置'));
  }
  console.log('');
}

/**
 * 重命名用户
 */
async function renameUserCmd(oldName, newName) {
  if (!oldName || !newName) {
    console.log(chalk.red('\n  ❌ 用法: it-trainer user rename <旧名称> <新名称>\n'));
    return;
  }

  const matches = getUserByName(oldName);
  if (matches.length === 0) {
    console.log(chalk.red(`\n  ❌ 未找到用户: ${oldName}\n`));
    return;
  }
  if (matches.length > 1) {
    console.log(chalk.yellow(`\n  ⚠️ 找到 ${matches.length} 位同名用户"${oldName}"，请使用更精确的标识\n`));
    return;
  }

  const result = renameUser(matches[0].id, newName);
  if (result.conflict) {
    console.log(chalk.red(`\n  ❌ 名称"${newName}"已存在，请使用其他名称\n`));
  } else {
    console.log(chalk.green(`\n  ✅ 已重命名: ${oldName} → ${newName}\n`));
  }
}

/**
 * 导出用户数据为 JSON（供 Web 读取）
 */
/**
 * 设置/重置用户密码
 */
async function setPasswordCmd(name, password) {
  if (!name) {
    const users = getAllUsers().filter(u => u.name !== 'default');
    if (users.length === 0) {
      console.log(chalk.yellow('\n  暂无用户\n'));
      return;
    }
    const { selected } = await inquirer.prompt([{
      type: 'list', name: 'selected', message: '选择要设密码的用户:',
      choices: users.map(u => ({ name: `${u.name} (${u.phone})`, value: u.id })),
    }]);
    const { pwd } = await inquirer.prompt([{ type: 'password', name: 'pwd', message: '输入新密码:' }]);
    await doSetPassword(selected, pwd);
    return;
  }

  const matches = getUserByName(name);
  if (matches.length === 0) {
    console.log(chalk.red(`\n  ❌ 未找到用户: ${name}\n`));
    return;
  }
  let target = matches[0];
  if (matches.length > 1) {
    const { selected } = await inquirer.prompt([{
      type: 'list', name: 'selected', message: `找到 ${matches.length} 位"${name}"，请选择:`,
      choices: matches.map(u => ({ name: `${u.name} — ${u.phone}`, value: u.id })),
    }]);
    target = matches.find(u => u.id === selected);
  }

  let pwd = password;
  if (!pwd) {
    const resp = await inquirer.prompt([{ type: 'password', name: 'pwd', message: `为 ${target.name} 输入新密码:` }]);
    pwd = resp.pwd;
  }
  await doSetPassword(target.id, pwd);
}

async function doSetPassword(userId, password) {
  const db = getDb();
  const hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
  console.log(chalk.green(`\n  ✅ 密码已设置\n`));
}

async function exportJson() {
  const config = getConfig();
  const outputPath = path.join(config.dataDir, 'users.json');
  const ok = exportUsersToJson(outputPath);
  if (ok) {
    console.log(chalk.green(`\n  ✅ 用户数据已导出到: ${outputPath}\n`));
  } else {
    console.log(chalk.red('\n  ❌ 导出失败\n'));
  }
}

// ============================================================
// 命令入口
// ============================================================

export async function userCommand(subcommand, ...args) {
  switch (subcommand) {
    case 'create':
      await createUserCmd(args[0], args[1]);
      break;
    case 'switch':
    case 'login':
      await switchUser(args[0]);
      break;
    case 'list':
    case 'ls':
      await listUsers();
      break;
    case 'delete':
    case 'rm':
      await deleteUserCmd(args[0]);
      break;
    case 'current':
    case 'whoami':
      await currentUser();
      break;
    case 'rename':
      await renameUserCmd(args[0], args[1]);
      break;
    case 'export-json':
      await exportJson();
      break;
    case 'set-password':
    case 'passwd':
      await setPasswordCmd(args[0], args[1]);
      break;
    default:
      // 无子命令：显示帮助
      showHelp();
  }
}

function showHelp() {
  console.log('');
  console.log(chalk.bold.cyan('👤 用户管理'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('');
  console.log(chalk.bold('  子命令:'));
  console.log(`    ${chalk.green('create <姓名> <手机号>')}  — 创建新用户`);
  console.log(`    ${chalk.green('switch <姓名>')}          — 切换当前用户`);
  console.log(`    ${chalk.green('list')}                   — 列出所有用户`);
  console.log(`    ${chalk.green('delete <姓名>')}          — 删除用户及所有数据`);
  console.log(`    ${chalk.green('current')}                — 显示当前用户`);
  console.log(`    ${chalk.green('rename <旧名> <新名>')}  — 重命名用户`);
  console.log(`    ${chalk.green('export-json')}            — 导出用户数据供 Web 使用`);
  console.log(`    ${chalk.green('set-password <姓名> [密码]')} — 设置/重置用户密码`);
  console.log('');
  console.log(chalk.gray('  示例:'));
  console.log(chalk.gray('    it-trainer user create 张三 13800138000'));
  console.log(chalk.gray('    it-trainer user switch 张三'));
  console.log(chalk.gray('    it-trainer user list'));
  console.log('');
}
