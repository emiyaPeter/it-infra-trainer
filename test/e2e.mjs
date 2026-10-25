// ============================================================
// E2E 旅程测试（Playwright headless）— 固化三条用户旅程断言：
//   1) 章节页手动标记完成 → 进度存储真实写入
//   2) 模块测验达标(≥80) → 全模块章节自动点亮 + 徽章 + 错题入本
//   3) 主观题无 AI 密钥 → 自评模式不计入总分（无密钥不惩罚）
// 运行前提：docs/.vitepress/dist 已按子路径构建（BASE_PATH=/it-infra-trainer/）
// 本地：E2E_CHANNEL=msedge npm run test:e2e（复用系统 Edge，免下载）
// CI：先 npx playwright install chromium --with-deps
// ============================================================
import { chromium } from 'playwright'
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'docs', '.vitepress', 'dist')
const PREFIX = '/it-infra-trainer/'
const PORT = Number(process.env.E2E_PORT || 8090)
const BASE = process.env.E2E_BASE || `http://localhost:${PORT}${PREFIX}`

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('❌ 未找到构建产物，请先构建：MSYS_NO_PATHCONV=1 BASE_PATH=/it-infra-trainer/ npm run docs:build')
  process.exit(1)
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length - 1)
  let file = path.join(DIST, p === '/' ? 'index.html' : p)
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!fs.existsSync(file)) { res.writeHead(404).end('404'); return }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(PORT, r))

const results = []
const check = (name, cond) => {
  results.push({ name, ok: !!cond })
  console.log((cond ? '  ✅ ' : '  ❌ ') + name)
}

const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL || undefined, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

// 预置一个干净账户（等价注册产物），隔离本机真实数据
const UID = 77001
await page.addInitScript((uid) => {
  localStorage.setItem('it-trainer-users', JSON.stringify([{
    id: uid, name: 'E2E测试', phone: '13700000001', password_hash: '', created_at: new Date().toISOString(),
  }]))
  localStorage.setItem('it-trainer-active-user-id', String(uid))
  localStorage.removeItem('it-trainer-ai-config')
  localStorage.removeItem('it-trainer-quiz-' + uid)
  localStorage.removeItem('it-trainer-wrongbook-' + uid)
  localStorage.removeItem('it-trainer-progress-' + uid)
}, UID)

const store = (key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)
const storeData = (key) => page.evaluate((k) => {
  const raw = JSON.parse(localStorage.getItem(k) || 'null')
  return raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw
}, key)

// ============ 旅程 1：章节页手动标记 → 进度真实写入 ============
console.log('\n[旅程1] 章节手动标记完成')
await page.goto(BASE + 'courses/networking/01-hardware-basics.html')
await page.waitForSelector('.done-fab', { timeout: 20000 })
await page.click('.done-fab')
await page.waitForTimeout(600)
let prog = await storeData('it-trainer-progress-' + UID)
check('标记后进度存储写入（courses/networking/01-hardware-basics.md = done）',
  prog && prog.pages && prog.pages['courses/networking/01-hardware-basics.md']
  && prog.pages['courses/networking/01-hardware-basics.md'].done === true)
check('按钮状态切换为已完成', (await page.textContent('.done-fab')).includes('已完成'))

// ============ 旅程 2：Docker 测验达标 → 模块点亮 + 徽章 + 错题入本 ============
console.log('\n[旅程2] 测验达标自动点亮模块')
await page.goto(BASE + 'quiz/')
await page.waitForSelector('.qw-card', { timeout: 20000 })
await page.evaluate(() => {
  const c = Array.from(document.querySelectorAll('.qw-card')).find((x) => x.textContent.includes('Docker'))
  c.click()
})
await page.waitForSelector('.qw-option', { timeout: 15000 })
const answers = [1, 1, 0, 2, 1, 0, 3, 1]
for (let i = 0; i < 8; i++) {
  await page.click(`.qw-option:nth-child(${answers[i] + 1})`)
  await page.waitForTimeout(250)
  await page.click('.qw-next')
  await page.waitForTimeout(200)
}
// 第 9 题主观题（自评"没答好"→ 记入错题本）
await page.waitForSelector('.qw-textarea', { timeout: 10000 })
await page.fill('.qw-textarea', 'docker run -d -p 3306:3306 mysql:8')
await page.click('.qw-subj-actions .qw-btn-primary')
await page.waitForSelector('.qw-feedback-self', { timeout: 10000 })
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('.qw-feedback-self .qw-self-actions button'))
    .find((x) => x.textContent.includes('没答好'))
  b.click()
})
await page.waitForTimeout(250)
await page.evaluate(() => document.querySelector('.qw-feedback-self .qw-next').click())
await page.waitForSelector('.qw-score-num', { timeout: 10000 })

const banner = await page.textContent('.qw-pass-banner, .qw-nopass-banner').catch(() => '')
check('达标横幅出现且包含"自动点亮"', banner.includes('自动点亮'))
prog = await storeData('it-trainer-progress-' + UID)
const dockerMarked = prog && prog.pages ? Object.keys(prog.pages).filter((s) => s.startsWith('courses/docker/') && prog.pages[s].done).length : 0
check('Docker 模块 4 章全部点亮', dockerMarked === 4)
const quiz = await storeData('it-trainer-quiz-' + UID)
check('verifiedModules 含 docker', quiz && Array.isArray(quiz.verifiedModules) && quiz.verifiedModules.includes('docker'))
check('attempts 记录成绩 100', quiz && quiz.attempts && quiz.attempts.some((a) => a.quizId === 'docker-01' && a.score === 100))
const wb = await storeData('it-trainer-wrongbook-' + UID)
check('主观题"没答好"进入错题本', Array.isArray(wb) && wb.some((x) => x.qid === 'q9' && x.quizId === 'docker-01'))

// ============ 旅程 3：主观题无密钥 → 自评不计分（无密钥不惩罚） ============
console.log('\n[旅程3] 无密钥自评不计分')
const scoreText = await page.textContent('.qw-score-num')
check('总分=100（8 道客观题全对，主观题被剔除出分母）', scoreText.trim() === '100')
const note = await page.textContent('.qw-note').catch(() => '')
check('结果页标注 1 道题自评未计入', note.includes('1 道问答/实操题') && note.includes('未计入分数'))

await browser.close()
server.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n${'─'.repeat(46)}\nE2E 结果：${results.length - failed.length}/${results.length} 通过`)
if (failed.length) {
  failed.forEach((f) => console.error('  ❌ ' + f.name))
  process.exit(1)
}
console.log('🎉 全部旅程通过')
