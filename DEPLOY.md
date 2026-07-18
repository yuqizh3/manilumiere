# LUMIÈRE 部署清单

一份上线用的完整清单。最省心的做法：**把整个文件夹一起部署**，再按下面把 Supabase 的表建好。

---

## 一、Supabase 要建的表（2 张）

打开 Supabase → SQL Editor → New query，分别执行：

### 1) 爱情显影室 · 显影记录
```sql
CREATE TABLE shadow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emotion VARCHAR(50),
  calm INT CHECK (calm BETWEEN 0 AND 10),
  event TEXT,
  reaction TEXT,
  mirror_question TEXT,
  mirror_answer TEXT,
  ai_reflection TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_shadow_entries_user_id ON shadow_entries(user_id);
```

### 2) 数据埋点 · 事件表（管理员后台用）
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  type VARCHAR(20) NOT NULL,
  page VARCHAR(40),
  label VARCHAR(60),
  value INT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created ON events(created_at);
```

> 若报 `already exists` = 已建过，跳过即可。其它基础表（users / check_ins / notes 等）之前已建，不用动。

---

## 二、环境变量（Vercel）

均已配置，**本次无新增**（可选加一个 ADMIN_EMAIL）：
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `AI_API_KEY`（+ 可选 `AI_BASE_URL` / `AI_MODEL`）
- 可选 `ADMIN_EMAIL` —— 不设则默认 `zhangyuqi2017er@gmail.com`

---

## 三、文件（整目录部署即可）

**新增的文件**
| 文件 | 作用 |
|---|---|
| `xiuxi.html` | 光之修习 hub |
| `xianying.html` | 爱情显影室（记录 + 曲线 + 报告 + 深夜急救 + 断联天数）|
| `i18n.js` | 中英文切换引擎 |
| `affirmations-en.js` | 英文肯定语库 |
| `onboard.js` | 新手引导卡 |
| `analytics.js` | 数据埋点（浏览/点击/停留）|
| `admin.html` | 管理员数据后台 |

**改过、需一并部署的**
`index.html`、`dashboard.html`、`discovery.html`、`auth.html`、`api/lumiere.js`、`api/chat.js`

**部署方式**
- Git：`git add . && git commit -m "更新" && git push`
- CLI：`vercel --prod`
- **顺序**：先建表（第一步），再部署。

---

## 四、管理员后台

- 地址：`你的域名/admin.html`
- **入口**：用管理员账号登录后，进「个人中心」右上角会出现金色 **「数据后台」** 按钮（其它账号看不到）。
- 能看到：总浏览量 / 注册用户（含邮箱名单）/ 签到量 / 总点击 / 平均停留 / 显化次数 / 近 14 天趋势 / 各应用分解。
- **前提**：① events 表已建；② 管理员邮箱 `zhangyuqi2017er@gmail.com` 已经注册过（在 users 表里）。
- 注意：埋点数据从**部署后**才开始积累，历史访问统计不到。

---

## 五、缓存（重要）

- `i18n.js` / `affirmations-en.js` 带 `?v=4`，`onboard.js` / `analytics.js` 带 `?v=1`，浏览器会自动拉新版。
- **HTML 页面本身**你自己的浏览器可能缓存旧版：上线后若"改动没生效"，按 **Cmd+Shift+R（Win: Ctrl+Shift+R）强刷** 一次。
- 以后再改 `i18n.js` / `affirmations-en.js` / `onboard.js` / `analytics.js`，记得把对应 `?v=` 数字 +1。

---

## 六、上线后自测

- [ ] 首页导航：每日显化 · **光之修习**(金) · 与神对话 · 显化旅程 · 阿卡西记录 · 定制肯定语 · **个人中心**
- [ ] 右上角签到按钮 + 积分条不重叠；点签到有结果 + 连续奖励提示
- [ ] 光之修习 → 两张卡；爱情显影室能记录、有情绪曲线、满 3 次出报告
- [ ] 爱情显影室：顶部有**断联天数**卡；底部**「忍不住想联系他？」**按钮 → 60 秒呼吸倒计时 + 飘浮爱心星星 + 三步流程
- [ ] 首页「换一张」能连续切换肯定语
- [ ] 右上角 **EN / 中** 全站切换；EN 下界面/肯定语/AI 报告都是英文
- [ ] 全站中文字体统一（霞鹜文楷），跳页不变
- [ ] 各板块首次进入弹**新手引导**卡
- [ ] 报告里的 `##` 标题渲染成金色标题（不是原始符号）
- [ ] 管理员账号登录 → 个人中心见「数据后台」→ 打开有数据

---

## 附：本次未做（可选后续）
- 情感安全兜底（写下自伤/绝望内容时给求助资源）——**建议尽早做**
- 「来自未来的你」每日一封信（每日拉回钩子）
- 断联天数跨设备同步（现存本地浏览器）
- 后台鉴权目前沿用 localStorage 弱校验，数据为聚合统计；如需严格权限要上正规登录 token
