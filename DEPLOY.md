# LUMIÈRE 部署清单

本次改动涉及：**光之修习 / 爱情显影室**新功能、UI 升级（形状图标 + 霞鹜文楷字体）、**全站中英文切换**、AI 英文输出、以及若干 bug 修复。

---

## 1. 需要部署的文件

### 新增（4 个）
| 文件 | 作用 |
|---|---|
| `xiuxi.html` | 光之修习 hub（入口页，含 30天探索 + 爱情显影室 两张卡） |
| `xianying.html` | 爱情显影室（记录流程 + 情绪曲线 + 显影报告） |
| `i18n.js` | 中英文切换引擎（词典 + DOM 替换 + 语言按钮） |
| `affirmations-en.js` | 英文肯定语库（13 类 × 20 条） |

### 修改（6 个）
| 文件 | 改了什么 |
|---|---|
| `index.html` | 光之修习导航入口、emoji→治愈系形状图标、字体换霞鹜文楷、接入 i18n、肯定语英文、修复"换一张"递归 bug、手动签到改造 |
| `dashboard.html` | 加「光之修习」入口按钮、接入 i18n、30天报告改为 markdown 渲染、AI 调用带 lang |
| `discovery.html` | 接入 i18n、报告改为 markdown 渲染、AI 调用带 lang |
| `auth.html` | 接入 i18n |
| `api/lumiere.js` | 新增 3 个接口（save_shadow_entry / get_shadow_entries / generate_shadow_report）、所有 AI 动作支持 lang 英文输出 |
| `api/chat.js` | 支持 lang 英文输出 |

> 简单起见：**整个目录一起部署**最省心（下面步骤 3）。

---

## 2. Supabase 建表（爱情显影室需要）

在 Supabase → SQL Editor → New query，粘贴执行：

```sql
CREATE TABLE shadow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emotion VARCHAR(50),                      -- 情绪标签
  calm INT CHECK (calm BETWEEN 0 AND 10),   -- 平静度：0很痛 ↔ 10很平静（曲线数据源）
  event TEXT,                               -- 触发事件（一句话）
  reaction TEXT,                            -- 我的第一反应
  mirror_question TEXT,                     -- 镜子提问
  mirror_answer TEXT,                       -- 用户对镜子提问的回答
  ai_reflection TEXT,                       -- AI 即时回应
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_shadow_entries_user_id ON shadow_entries(user_id);
```

看到 **Success. No rows returned** 即成功。（此 SQL 也已写入 `supabase-setup.md`）

---

## 3. 环境变量（确认已配，无需新增）

Vercel 项目里这些应已存在，本次**没有新增**：
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `AI_API_KEY`
- `AI_BASE_URL`（默认 `https://new-api.100xsoon.com`）
- `AI_MODEL`（默认 `claude-sonnet-4-6`）

---

## 4. 部署

**如果连了 Git（GitHub → Vercel 自动部署）：**
```bash
git add .
git commit -m "光之修习/爱情显影室 + 中英文切换 + UI升级"
git push
```
Vercel 自动重新部署。

**如果用 Vercel CLI：**
```bash
vercel --prod
```

**顺序**：先做第 2 步建表，再部署。否则记录显影会因为表不存在而报错。

---

## 5. 上线后自测清单

- [ ] 首页导航第二个是「光之修习」（金色），点进去有两张卡
- [ ] 爱情显影室：能记录一次、能看到情绪曲线、记满 3 次能生成显影报告（英文/中文对应语言）
- [ ] 首页「换一张 / Another」能连续切换肯定语
- [ ] 右上角「EN / 中」能切换全站语言
- [ ] 切到 EN：肯定语、界面、AI 报告都是英文
- [ ] dashboard 手动「今日签到」能签到成功（不再"已签到过"）
- [ ] 30天报告 / 显影报告的 `##` 标题正常渲染成金色标题（不是原始符号）

---

## 6. 缓存提醒（重要）

- `i18n.js`、`affirmations-en.js` 已带 `?v=2` 版本号，浏览器会自动拉新版。
- **`index.html` 等页面本身**：你自己的浏览器可能缓存了旧版，上线后如发现"改动没生效"，用 **Cmd + Shift + R（Windows: Ctrl + Shift + R）强制刷新**一次即可。
- 以后再改 `i18n.js` / `affirmations-en.js`，记得把所有页面里的 `?v=2` 递增为 `?v=3`（否则用户拿到的是旧缓存）。

---

## 附：本次还未做（可选后续）
- discovery 页里带变量的动态文案（如「第X天」「恭喜晋升为『等级』」）的英文——需少量改页面代码
- 阿卡西 AI 输出格式里的 emoji（⭐🔮 等）清理
- dashboard / 爱情显影室的付费墙（等你测完报告效果再做）
