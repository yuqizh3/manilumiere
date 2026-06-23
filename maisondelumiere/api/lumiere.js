// 完整的后端API - 放在 .netlify/functions/lumiere.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// ── 数据库帮助函数 ──
async function dbGet(table, filters = {}, select = '*', order = '') {
  let qs = Object.entries(filters)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
    .join('&');
  if (order) qs += '&order=' + order;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}&select=${select}`, { headers: H });
  return r.json();
}

async function dbInsert(table, row) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=representation' },
    body: JSON.stringify(row)
  });
  return { data: await r.json(), ok: r.ok, status: r.status };
}

async function dbUpdate(table, filters, updates) {
  const qs = Object.entries(filters)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
    .join('&');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: { ...H, Prefer: 'return=representation' },
    body: JSON.stringify(updates)
  });
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const body = req.body || {};
  const user_id = body.user_id || req.query.user_id;

  try {
    // ── 用户认证和初始化 ──
    if (action === 'init_user' && req.method === 'POST') {
      const { email } = body;
      let users = await dbGet('users', { email });
      let userId;

      if (users?.length === 0) {
        const result = await dbInsert('users', { email });
        userId = result.data[0]?.id;
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await dbInsert('user_profiles', {
          id: userId,
          credits: 100,
          total_earned: 100,
          total_spent: 0,
          invite_code: inviteCode,
          first_login: true
        });
        await dbInsert('transactions', {
          user_id: userId,
          amount: 100,
          type: 'signup_bonus',
          description: '注册奖励'
        });
        return res.status(200).json({ ok: true, user_id: userId, is_new: true });
      } else {
        userId = users[0].id;
        return res.status(200).json({ ok: true, user_id: userId, is_new: false });
      }
    }

    // ── 每日签到 ──
    if (action === 'checkin' && req.method === 'POST') {
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const today = new Date().toISOString().slice(0, 10);

      const existing = await dbGet('check_ins', { user_id, checked_at: today });
      if (existing?.length > 0) {
        const profile = (await dbGet('user_profiles', { id: user_id }))[0];
        return res.status(200).json({
          already_checked: true,
          credits: profile?.credits,
          streak: existing[0].streak_count
        });
      }

      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const lastCheckins = await dbGet('check_ins', { user_id });
      const last = lastCheckins?.sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))[0];
      let streak = 1;
      if (last?.checked_at === yesterday) {
        streak = (last.streak_count || 1) + 1;
      }

      const reward = 5;

      await dbInsert('check_ins', {
        user_id,
        checked_at: today,
        streak_count: streak,
        reward_amount: reward
      });

      const profile = (await dbGet('user_profiles', { id: user_id }))[0];
      const newCredits = (profile?.credits ?? 100) + reward;
      const newEarned = (profile?.total_earned ?? 100) + reward;
      await dbUpdate('user_profiles', { id: user_id }, {
        credits: newCredits,
        total_earned: newEarned
      });

      await dbInsert('transactions', {
        user_id,
        amount: reward,
        type: 'daily_checkin',
        description: `第${streak}天连续签到`
      });

      return res.status(200).json({
        ok: true,
        credits: newCredits,
        reward,
        streak,
        total_earned: newEarned
      });
    }

    // ── 获取签到信息 ──
    if (action === 'get_checkin_info' && req.method === 'GET') {
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const today = new Date().toISOString().slice(0, 10);
      const todayCheckin = (await dbGet('check_ins', { user_id, checked_at: today }))[0];
      const profile = (await dbGet('user_profiles', { id: user_id }))[0];

      return res.status(200).json({
        ok: true,
        streak: todayCheckin?.streak_count || 0,
        credits: profile?.credits || 100,
        today_checked: !!todayCheckin
      });
    }

    // ── 扣积分 ──
    if (action === 'deduct_credits' && req.method === 'POST') {
      const { amount = 5, description = 'AI功能' } = body;
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const profile = (await dbGet('user_profiles', { id: user_id }))[0];
      const currentCredits = profile?.credits ?? 0;

      if (currentCredits < amount) {
        return res.status(402).json({ error: '积分不足', credits: currentCredits });
      }

      const newCredits = currentCredits - amount;
      const newSpent = (profile.total_spent ?? 0) + amount;
      await dbUpdate('user_profiles', { id: user_id }, {
        credits: newCredits,
        total_spent: newSpent
      });

      await dbInsert('transactions', {
        user_id,
        amount: -amount,
        type: 'usage_cost',
        description
      });

      return res.status(200).json({ ok: true, credits: newCredits });
    }

    // ── 记录显化日志 ──
    if (action === 'log_manifestation' && req.method === 'POST') {
      const { category, affirmation_text, notes } = body;
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      await dbInsert('manifestation_logs', {
        user_id,
        category,
        affirmation_text,
        custom_notes: notes,
        created_at: new Date().toISOString()
      });

      return res.status(200).json({ ok: true });
    }

    // ── 获取显化次数 ──
    if (action === 'get_manifestation_count' && req.method === 'GET') {
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

      const logs = await dbGet('manifestation_logs', { user_id });
      const monthLogs = logs?.filter(l => l.created_at >= monthStart) || [];

      return res.status(200).json({ ok: true, count: monthLogs.length });
    }

    // ── 获取30天发现问题 ──
    if (action === 'get_discovery_question' && req.method === 'GET') {
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const user = (await dbGet('users', { id: user_id }))[0];
      const createdAt = new Date(user.created_at);
      const today = new Date();
      const daysPassed = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
      const currentDay = Math.min(daysPassed + 1, 30);

      const entry = (await dbGet('self_discovery_entries', { user_id, day: currentDay }))[0];
      const questions = generateDiscoveryQuestions(currentDay);
      const question = questions[Math.floor(Math.random() * questions.length)];

      return res.status(200).json({
        ok: true,
        day: currentDay,
        question,
        answered: !!entry?.answer
      });
    }

    // ── 保存30天回答 ──
    if (action === 'save_discovery_answer' && req.method === 'POST') {
      const { day, question, answer } = body;
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      let existing = (await dbGet('self_discovery_entries', { user_id, day }))[0];

      if (existing) {
        await dbUpdate('self_discovery_entries', { user_id, day }, { question, answer });
      } else {
        await dbInsert('self_discovery_entries', {
          user_id,
          day,
          question,
          answer,
          created_at: new Date().toISOString()
        });
      }

      const allEntries = await dbGet('self_discovery_entries', { user_id });
      const count = allEntries?.length ?? 0;

      return res.status(200).json({ ok: true, days_recorded: count });
    }

    // ── 获取30天进度 ──
    if (action === 'get_discovery_progress' && req.method === 'GET') {
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const entries = await dbGet('self_discovery_entries', { user_id });
      const daysRecorded = entries?.length ?? 0;
      const canGenerateReport = daysRecorded >= 10;

      return res.status(200).json({
        ok: true,
        daysRecorded,
        canGenerateReport
      });
    }

    // ── 生成30天报告 ──
    if (action === 'generate_discovery_report' && req.method === 'POST') {
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const entries = await dbGet('self_discovery_entries', { user_id });

      if ((entries?.length ?? 0) < 10) {
        return res.status(400).json({ error: '需要至少10天的记录' });
      }

      const conversations = entries
        .map(e => `【${e.question}】\n${e.answer}`)
        .join('\n\n');

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            system: `你是一位资深的存在主义心理咨商师。请分析用户30天的自我访谈记录，输出以下5件核心发现（用中文）：

## 5件核心发现

1. **最常出现的情绪词**
   这代表什么含义

2. **自我描述的角度**
   你主要从哪个维度看待自己（成就、关系、痛苦、好奇等）

3. **口头禅式的自我设限**
   列举你发现的2-3个设限，以及如何破除

4. **真正想要的生活样子**
   从这30天看出来，你潜意识里渴望什么样的生活

5. **你是谁**
   用1句话总结这个人

用温暖、深刻、充满洞察力的语言写作，如同一位明智的朋友。`,
            messages: [
              {
                role: 'user',
                content: `以下是我30天的自我访谈记录，请帮我整理出5件重要发现：\n\n${conversations}`
              }
            ]
          })
        });

        const data = await response.json();
        const report = data.content[0]?.text || '无法生成报告';

        return res.status(200).json({ ok: true, report });
      } catch (error) {
        console.error('报告生成失败:', error);
        return res.status(500).json({ error: '报告生成失败' });
      }
    }

    // ── 保存笔记 ──
    if (action === 'save_note' && req.method === 'POST') {
      const { title, content, tags = [] } = body;
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const result = await dbInsert('notes', {
        user_id,
        title,
        content,
        tags,
        created_at: new Date().toISOString()
      });

      return res.status(200).json({ ok: true, data: result.data[0] });
    }

    // ── 获取笔记列表 ──
    if (action === 'get_notes' && req.method === 'GET') {
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const notes = await dbGet('notes', { user_id });
      return res.status(200).json({ ok: true, data: notes ?? [] });
    }

    // ── 保存日记 ──
    if (action === 'save_journal' && req.method === 'POST') {
      const { title, content, desires } = body;
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      const result = await dbInsert('journal_entries', {
        user_id,
        title,
        content,
        desires,
        created_at: new Date().toISOString()
      });

      return res.status(200).json({ ok: true, data: result.data[0] });
    }

    // ── 生成日记图片 ──
    if (action === 'generate_journal_image' && req.method === 'POST') {
      const { journal_id, desires } = body;
      if (!user_id || !journal_id) return res.status(400).json({ error: 'missing params' });

      try {
        // 这里调用图片生成服务
        // 可以用 html2canvas 或 canvas-based 的库生成
        const imageUrl = `/generated-journals/${journal_id}-${Date.now()}.png`;

        await dbUpdate('journal_entries', { id: journal_id }, {
          image_url: imageUrl,
          image_generated_at: new Date().toISOString()
        });

        return res.status(200).json({ ok: true, image_url: imageUrl });
      } catch (error) {
        console.error('图片生成失败:', error);
        return res.status(500).json({ error: '图片生成失败' });
      }
    }

    // ── 本地数据迁移 ──
    if (action === 'migrate_local_data' && req.method === 'POST') {
      const { manifestations = [], affirmations = [] } = body;
      if (!user_id) return res.status(400).json({ error: 'missing user_id' });

      for (const m of manifestations) {
        await dbInsert('manifestation_logs', {
          user_id,
          category: m.category,
          affirmation_text: m.text,
          custom_notes: m.notes,
          created_at: new Date().toISOString()
        });
      }

      for (const a of affirmations) {
        await dbInsert('notes', {
          user_id,
          title: '收藏的肯定语',
          content: a,
          tags: ['affirmation', 'saved'],
          created_at: new Date().toISOString()
        });
      }

      await dbUpdate('user_profiles', { id: user_id }, { first_login: false });

      return res.status(200).json({ ok: true, migrated: manifestations.length + affirmations.length });
    }

    return res.status(404).json({ error: 'unknown action' });

  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── 生成30天发现问题 ──
function generateDiscoveryQuestions(day) {
  if (day <= 7) {
    return [
      '今天有哪一个瞬间，让你觉得自己「真的在过今天」？',
      '最近这几天，你最常出现的一种情绪是什么？它通常在什么时候冒出来？',
      '今天你和谁说过话之后，心情产生了变化？变好了、变差了，还是只是更疲惫？',
      '如果把你最近的生活想象成一个空间，它更像是：拥挤的、空荡的、凌乱的、规整的，还是别的什么？',
      '今天有没有哪一个时刻，你其实不太想面对自己，所以刻意让自己分心了？'
    ];
  } else if (day <= 14) {
    return [
      '你最近一周内重复出现的行为模式是什么？你怎么看待这个模式？',
      '什么样的情况下，你会陷入自己熟悉的"防御模式"？',
      '在关系中，你通常扮演什么角色？这个角色从何而来？',
      '你有什么事情是想做但总是拖延的？为什么？',
      '哪些时刻你会感到自己在重复过去？'
    ];
  } else if (day <= 21) {
    return [
      '生活中什么东西对你来说最重要？为什么？',
      '你愿意为什么付出时间和精力？这代表了什么？',
      '如果没有他人的期许，你最想做的事是什么？',
      '你什么时候感到最充实？那时发生了什么？',
      '你内心真正在乎的是什么，即使没有人知道？'
    ];
  } else {
    return [
      '你最害怕的是什么？这个害怕从何而来？',
      '你不敢让别人看到自己的哪一面？为什么？',
      '如果失败了，你最担心会发生什么？',
      '在亲密关系中，你最害怕被看穿什么？',
      '你深层的恐惧是什么，即使你从未明确说出来？'
    ];
  }
}
