// ============================================================
// AI 调用层 — OpenAI 兼容 chat completions（DeepSeek/Kimi/GLM 等）
// 密钥来源：本地 .env（npm run set-key 配置），永不入库
// ============================================================

/**
 * 读取 AI 配置（兼容旧的 DEEPSEEK_* 键名）
 * @returns {{baseUrl, apiKey, model} | null} 未配置密钥时返回 null
 */
export function getAiConfig() {
  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return {
    baseUrl: (process.env.AI_BASE_URL || process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com').replace(/\/+$/, ''),
    apiKey,
    model: process.env.AI_MODEL || 'deepseek-chat',
  };
}

/**
 * 调用 chat completions
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>} 助手回复文本
 * @throws 带用户可读信息的 Error
 */
export async function chatCompletion(messages, { temperature = 0.7, timeoutMs = 60000 } = {}) {
  const cfg = getAiConfig();
  if (!cfg) {
    throw new Error('AI 密钥未配置。运行 npm run set-key 交互式配置（支持 DeepSeek/Kimi/智谱等，可随时更换）。');
  }

  let resp;
  try {
    resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ model: cfg.model, messages, temperature }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      throw new Error(`请求超时（${timeoutMs / 1000}s）。检查网络或稍后重试。`);
    }
    throw new Error(`网络错误：无法连接 ${cfg.baseUrl}（${e.message}）`);
  }

  if (resp.status === 401 || resp.status === 403) {
    throw new Error('密钥无效或已过期。重新运行 npm run set-key 更新密钥。');
  }
  if (!resp.ok) {
    const text = (await resp.text().catch(() => '')).slice(0, 200);
    throw new Error(`服务返回 ${resp.status}：${text || '无详情'}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('服务返回了空回复，请重试。');
  return content;
}

/** 最小连通性测试（用于配置后验证） */
export async function testConnection() {
  const reply = await chatCompletion(
    [{ role: 'user', content: '回复"OK"两个字母即可。' }],
    { temperature: 0, timeoutMs: 30000 },
  );
  return reply;
}
