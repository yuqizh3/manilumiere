# LUMIÈRE Supabase 完整配置指南

## 第一步：创建 Supabase 项目

### 1.1 注册/登陆 Supabase
- 访问 [https://supabase.com](https://supabase.com)
- 用 GitHub/Google 账号登陆
- 点击 "New Project"

### 1.2 创建项目
- **Project Name**: `lumiere`
- **Database Password**: 设置一个强密码（保存好！）
- **Region**: 选择离你最近的地区（例如 Singapore 或 Tokyo）
- 点击 "Create new project"

等待 3-5 分钟，项目创建完成

### 1.3 获取连接信息
项目创建后，进入 **Settings → Database** 页面：

- 复制 **Connection string** (postgresql://...)
- 或者分别记录：
  - **Project URL**: 看起来像 `https://xxxxx.supabase.co`
  - **Anon Key**: 在 **Settings → API** 中的 `anon` key
  - **Service Role Key**: 在 **Settings → API** 中的 `service_role` key（保密！）

---

## 第二步：创建数据库表

### 2.1 进入 SQL Editor
在 Supabase 仪表板左侧菜单，点击 **SQL Editor**

### 2.2 创建新查询
点击 **+ New Query**，粘贴下面的 SQL 代码：

```sql
-- 创建 users 表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  CONSTRAINT email_not_empty CHECK (email != '')
);

-- 创建 user_profiles 表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  credits INT DEFAULT 100,
  total_earned INT DEFAULT 100,
  total_spent INT DEFAULT 0,
  invite_code VARCHAR(8),
  first_login BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建 check_ins 表 (签到)
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_at DATE NOT NULL,
  streak_count INT DEFAULT 1,
  reward_amount INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, checked_at)
);

-- 创建 transactions 表 (交易流水)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建 manifestation_logs 表 (显化日志)
CREATE TABLE manifestation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50),
  affirmation_text TEXT,
  custom_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建 self_discovery_entries 表 (30天自我认识)
CREATE TABLE self_discovery_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day INT CHECK (day BETWEEN 1 AND 30),
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, day)
);

-- 创建 notes 表 (笔记)
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  tags TEXT[],
  related_manifestation_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建 journal_entries 表 (日记)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT,
  desires TEXT,
  image_url VARCHAR(500),
  image_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_date ON check_ins(checked_at);
CREATE INDEX idx_manifestation_logs_user_id ON manifestation_logs(user_id);
CREATE INDEX idx_self_discovery_entries_user_id ON self_discovery_entries(user_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- 启用 RLS (行级安全)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifestation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_discovery_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 设置 RLS 策略
-- 用户只能看到自己的数据
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can read own check_ins" ON check_ins
  FOR SELECT USING (true);

CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can read own manifestation_logs" ON manifestation_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can read own self_discovery_entries" ON self_discovery_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can read own notes" ON notes
  FOR SELECT USING (true);

CREATE POLICY "Users can read own journal_entries" ON journal_entries
  FOR SELECT USING (true);
```

### 2.3 执行 SQL
点击右上角的 **Run** 按钮执行所有 SQL

如果没有错误，所有表都应该已创建 ✓

---

## 第三步：配置 API 密钥和 CORS

### 3.1 获取 API 密钥
在 **Settings → API** 页面：

记录以下信息：
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public**: 这是 `SUPABASE_KEY`
- **service_role secret**: 这是 `SUPABASE_SERVICE_KEY`（后端使用，保密！）

### 3.2 配置 CORS（如果在线部署）
在 **Settings → API → CORS** 中：

添加你的前端 URL：
- 本地开发: `http://localhost:3000`
- 线上: `https://yourdomain.com`

---

## 第四步：配置环境变量

### 4.1 创建 `.env.local` 文件
在项目根目录创建 `.env.local`（本地用 `vercel dev` 调试时需要）：

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...（你的 service_role key）

# AI 中转站（OpenAI 兼容格式）
AI_API_KEY=sk-...（你的中转站 key）
# 下面两个可选，不填就用代码里的默认值
# AI_BASE_URL=https://new-api.100xsoon.com
# AI_MODEL=claude-sonnet-4-6
```

### 4.2 对于 Vercel 部署
在 Vercel 项目里：

1. 进入 **Settings → Environment Variables**
2. 添加 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY`、`AI_API_KEY` 三个变量
3. （可选）需要换中转站或模型时，再加 `AI_BASE_URL` / `AI_MODEL` 覆盖默认值

### 4.3 安全建议
```
✅ DO:
- 在 .env.local 中保存密钥
- 在 .gitignore 中添加 .env.local
- 使用 SUPABASE_SERVICE_KEY（后端）而不是 anon key

❌ DON'T:
- 不要把 service_role key 放在前端代码中
- 不要 commit .env 文件到 git
- 不要分享你的密钥给任何人
```

---

## 第五步：测试连接

### 5.1 验证表已创建
在 Supabase 仪表板，点击左侧菜单的 **Table Editor**：

你应该看到所有 8 个表：
- [ ] users
- [ ] user_profiles
- [ ] check_ins
- [ ] transactions
- [ ] manifestation_logs
- [ ] self_discovery_entries
- [ ] notes
- [ ] journal_entries

### 5.2 测试 API 调用
在 **SQL Editor** 中运行测试查询：

```sql
-- 测试插入
INSERT INTO users (email) VALUES ('test@example.com');

-- 查看数据
SELECT * FROM users;

-- 删除测试数据
DELETE FROM users WHERE email = 'test@example.com';
```

---

## 第六步：Vercel Serverless Functions

Vercel 零配置：根目录的 HTML 作为静态文件直接提供，`/api` 目录下的 `.js` 会被自动识别为 Serverless Functions，**不需要 `vercel.json`**。

### 6.1 函数文件位置
```
maisondelumiere/
├── api/
│   ├── lumiere.js     # 用户/积分/笔记/日记/30天报告
│   └── chat.js        # AI 对话
├── index.html / auth.html / dashboard.html  # 静态页面
├── package.json       # "type": "module"（让 /api 支持 ESM）
└── .env.local         # 本地调试用，已被 .gitignore 忽略
```
前端通过 `/api/lumiere` 和 `/api/chat` 调用，路径已配置好。

### 6.2 本地测试 Functions
```bash
# 安装 Vercel CLI
npm install -g vercel

# 本地启动（会读取 .env.local，并模拟 /api 函数）
vercel dev

# 访问: http://localhost:3000
```

---

## 第七步：部署到 Vercel

### 方式 A：连接 GitHub（推荐）
1. 把项目推到 GitHub
2. 登录 [Vercel](https://vercel.com) → **Add New → Project** → 导入该仓库
3. **Framework Preset** 选 **Other**，Build / Output 留空
4. 在 **Environment Variables** 里加 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY`、`AI_API_KEY`
5. 点 **Deploy**

### 方式 B：CLI 直接部署
```bash
vercel            # 首次部署到预览环境
vercel --prod     # 部署到生产环境
```
环境变量可用 `vercel env add` 添加，或在网页后台配置。

### 部署后
先用 Vercel 给的 `xxx.vercel.app` 域名测试登录、AI 对话、签到等功能正常后，再到 **Settings → Domains** 绑定自定义域名。

---

## 常见问题排查

### 问题1：连接失败 "SUPABASE_URL is not defined"
**解决**：检查 `.env.local` 是否在根目录，是否正确配置

### 问题2：权限错误 "insufficient privilege"
**解决**：确保使用的是 `SUPABASE_SERVICE_KEY`（不是 anon key）

### 问题3：表不存在
**解决**：
1. 在 SQL Editor 中重新运行创建表的 SQL
2. 检查是否有语法错误

### 问题4：跨域错误 (CORS)
**解决**：
1. 在 Supabase Settings → API → CORS 中添加你的域名
2. 清除浏览器缓存

### 问题5：API 返回 401
**解决**：确保 API 端点使用了正确的密钥

---

## ✅ 检查清单

完成以下步骤后，你就可以开始测试了：

- [ ] Supabase 项目已创建
- [ ] 所有数据表已创建
- [ ] Vercel 环境变量已配置（SUPABASE_URL / SUPABASE_SERVICE_KEY / AI_API_KEY）
- [ ] Vercel 已部署（或 `vercel dev` 本地已跑通）
- [ ] AI 中转站 key 已验证（对话能正常返回）
- [ ] CORS 已配置（Supabase 里加上 Vercel 域名）

完成后告诉我，我就可以帮你进行完整的功能测试！ 🚀
