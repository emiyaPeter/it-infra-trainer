// ============================================================
// 认证 API 服务器 — 处理 Web 端注册/登录/切换
// 启动: node src/server/auth-server.js
// 默认端口: 3456
// ============================================================

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { getDb, getAllUsers, getActiveUserId, setActiveUser, exportUsersToJson } from '../cli/utils/db.js';
import { getConfig } from '../cli/utils/config.js';
import path from 'node:path';
import fs from 'node:fs';

const app = express();
const PORT = process.env.AUTH_PORT || 3456;
const SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());

// ============================================================
// 确保 users 表有 password_hash 列
// ============================================================
function ensurePasswordColumn() {
  const db = getDb();
  try {
    const cols = db.prepare("PRAGMA table_info(users)").all();
    if (!cols.some(c => c.name === 'password_hash')) {
      db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
      console.log('[auth-server] 已添加 password_hash 列');
    }
  } catch (e) {
    console.error('[auth-server] 迁移失败:', e.message);
  }
}

// ============================================================
// 同步桥接文件到 public/data/
// ============================================================
function syncBridgeFiles() {
  const config = getConfig();
  const publicDir = path.join(config.projectRoot, 'docs', 'public', 'data');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // active-user.json
  const bridgePath = config.currentUserFile;
  if (fs.existsSync(bridgePath)) {
    fs.copyFileSync(bridgePath, path.join(publicDir, 'active-user.json'));
  }

  // users.json（不含密码哈希）
  const allUsers = getDb().prepare('SELECT id, name, phone, created_at, last_active_at FROM users ORDER BY name').all();
  const activeId = getActiveUserId();
  fs.writeFileSync(path.join(publicDir, 'users.json'), JSON.stringify({
    activeUserId: activeId,
    users: allUsers,
  }, null, 2));
}

// ============================================================
// API 端点
// ============================================================

// 注册
app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: '姓名、手机号和密码不能为空' });
    }
    if (!/^\d{6,15}$/.test(phone)) {
      return res.status(400).json({ error: '手机号格式无效（6-15位数字）' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 位' });
    }

    const db = getDb();

    // 检查是否已存在
    const existing = db.prepare('SELECT id FROM users WHERE name = ? AND phone = ?').get(name, phone);
    if (existing) {
      return res.status(409).json({ error: `用户 "${name}" (${phone}) 已存在，请直接登录` });
    }

    // 检查同名不同号
    const sameName = db.prepare('SELECT id, phone FROM users WHERE name = ?').get(name);
    if (sameName) {
      return res.status(409).json({ error: `"${name}" 已存在（手机号: ${sameName.phone}），请换一个名字或使用已有账户` });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const info = db.prepare('INSERT INTO users (name, phone, password_hash) VALUES (?, ?, ?)').run(name, phone, passwordHash);
    const newId = String(info.lastInsertRowid);

    setActiveUser(newId);
    syncBridgeFiles();

    res.json({ success: true, id: newId, name, message: '注册成功！已自动登录。' });
  } catch (e) {
    res.status(500).json({ error: '服务器错误: ' + e.message });
  }
});

// 登录/切换
app.post('/api/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: '姓名和密码不能为空' });
    }

    const db = getDb();
    const users = db.prepare('SELECT id, name, phone, password_hash FROM users WHERE name = ?').all(name);

    if (users.length === 0) {
      return res.status(401).json({ error: `未找到用户 "${name}"，请先注册` });
    }

    // 尝试每个匹配用户的密码
    let matchedUser = null;
    for (const u of users) {
      if (!u.password_hash) continue; // 无密码的老用户
      const valid = await bcrypt.compare(password, u.password_hash);
      if (valid) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      // 检查是否是老用户（还没有设置密码）
      const oldUser = users.find(u => !u.password_hash);
      if (oldUser) {
        return res.status(403).json({ error: `用户 "${name}" 尚未设置密码。请在终端运行: npm run cli -- user set-password ${name}` });
      }
      return res.status(401).json({ error: '密码错误' });
    }

    setActiveUser(matchedUser.id);
    syncBridgeFiles();

    res.json({ success: true, id: String(matchedUser.id), name: matchedUser.name, phone: matchedUser.phone, message: '登录成功' });
  } catch (e) {
    res.status(500).json({ error: '服务器错误: ' + e.message });
  }
});

// 获取用户列表（不含密码）
app.get('/api/users', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, name, phone, created_at, last_active_at FROM users ORDER BY name').all();
    const activeId = getActiveUserId();
    res.json({ activeUserId: activeId, users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 获取当前用户
app.get('/api/current-user', (req, res) => {
  try {
    const activeId = getActiveUserId();
    const db = getDb();
    const user = db.prepare('SELECT id, name, phone, created_at FROM users WHERE id = ?').get(Number(activeId));
    if (user) {
      res.json({ id: String(user.id), name: user.name, phone: user.phone });
    } else {
      res.json(null);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// 启动
// ============================================================
ensurePasswordColumn();
syncBridgeFiles();

app.listen(PORT, () => {
  console.log(`🔐 认证服务已启动: http://localhost:${PORT}`);
  console.log(`   API: POST /api/register  — 注册`);
  console.log(`   API: POST /api/login     — 登录/切换`);
  console.log(`   API: GET  /api/users     — 用户列表`);
  console.log(`   API: GET  /api/current-user — 当前用户`);
});
