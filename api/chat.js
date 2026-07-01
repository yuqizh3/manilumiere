// AI 对话 API (Vercel Serverless Function) —— 通过中转站调用（OpenAI 兼容格式）
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://new-api.100xsoon.com';
const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const AI_API_KEY = process.env.AI_API_KEY;
  if (!AI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const body = req.body || {};
    const response = await fetch(`${AI_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: body.max_tokens || 1500,
        messages: [
          { role: 'system', content: body.system || '' },
          ...(body.messages || [])
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'AI error' });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
