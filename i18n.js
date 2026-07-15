/* ══════════════════════════════════════════════
   LUMIÈRE 轻量国际化引擎（零侵入）
   做法：中文原文 → 英文 词典 + DOM 文本替换 + MutationObserver
   - 不需要改动各页大量 JS 渲染逻辑
   - 动态生成的内容也会被自动翻译
   - 未收录的中文保持原样（渐进补词条）
   - AI 生成内容：读取 window.LUMI_LANG，让接口直接输出英文
   ══════════════════════════════════════════════ */
(function () {
  var STORE_KEY = 'lumiere_lang';

  // ── 界面文案词典（中文原文 → English）──
  // 只收录界面 chrome / 标签；肯定语库、AI 内容不在此（由 AI 原生英文处理）
  var DICT = {
    // 导航
    '每日显化': 'Daily',
    '与神对话': 'Dialogue',
    '显化旅程': 'Journey',
    '阿卡西记录': 'Akashic',
    '定制肯定语': 'Custom',
    '光之修习': 'Cultivation',
    '我的数据': 'My Space',

    // 首页 Hero
    '你的意念': 'Your Intention',
    '创造现实': 'Creates Reality',
    '每一句肯定语，都是种下宇宙的种子': 'Every affirmation plants a seed in the universe',
    '选择你的意图，开始今天的显化之旅': 'Choose your intention and begin today’s manifestation',

    // 光之修习 卡片
    '主打体验': 'Signature',
    '光之修习': 'Light Cultivation',
    '显化，从来不是干等世界改变，而是先遇见一个更清晰的自己。这里有两条路：用「30天自我探索」由浅入深读懂自己；在失恋、思念、求不得的时候，走进「爱情显影室」，把散落的情绪，慢慢冲洗成一张你看得见的、正在走出来的自己。':
      'Manifestation is never about waiting for the world to change — it begins with meeting a clearer version of yourself. Two paths await: “30-Day Self-Discovery” to understand yourself layer by layer; and “The Shadow Room” for the moments of heartbreak, longing and wanting — where scattered feelings are slowly developed, like film, into a self you can see: one that is finding its way out.',
    '进入光之修习 →': 'Enter Cultivation →',

    // 意图领域
    '— 选择你的意图领域 —': '— Choose Your Intention —',
    '爱与关系': 'Love & Relationships',
    '丰盛财富': 'Abundance',
    '健康活力': 'Health & Vitality',
    '自信力量': 'Confidence',
    '事业成功': 'Career',
    '内心平静': 'Inner Peace',
    '吸引力与魅力': 'Charm & Magnetism',
    '创造力与灵感': 'Creativity',
    '家庭与亲子': 'Family',
    '保护与边界': 'Boundaries',
    '灵性成长': 'Spiritual Growth',
    '放下与疗愈': 'Release & Healing',
    '阿卡西': 'Akashic',

    // 肯定语卡片按钮
    '换一张 ↻': 'Another ↻',
    '收藏 ✦': 'Save ✦',

    // 阿卡西模块
    '前世今生': 'Past Lives',
    '探索灵魂的旅程': 'Explore your soul’s journey',
    '重大事件的真相': 'Truth of Pivotal Events',
    '三维度深度解读你的经历': 'A three-dimensional reading of your experience',
    '挑战与困扰的根源': 'Roots of Your Struggles',
    '找到深层模式': 'Find the deeper pattern',
    '身体疾病的实相': 'The Body’s Message',
    '倾听身体的灵魂信号': 'Listen to your body’s soul signals',
    '财富卡点与指引': 'Wealth Blocks & Guidance',
    '找到阻碍丰盛的根源': 'Find what blocks your abundance',
    '天赋与才华': 'Gifts & Talents',
    '发现灵魂的独特礼物': 'Discover your soul’s unique gift',
    '梦境解读': 'Dream Interpretation',
    '解读潜意识的信息': 'Decode your subconscious',
    '和宠物对话': 'Talk with Your Pet',
    '连接宠物的灵魂语言': 'Connect with your pet’s soul language',
    '和高维度对话': 'Dialogue with the Higher',
    '连接守护天使、高我或宇宙意识': 'Connect with guardian angels, higher self or cosmic consciousness',

    // 登录 / 弹窗
    '加入光居': 'Join LUMIÈRE',
    '登录，解锁你的旅程': 'Sign in to unlock your journey',
    '登录 / 注册 →': 'Sign in / Register →',
    '先随便看看': 'Just browsing',
    '今日邀请': 'Today’s Invitation',
    '继续你的自我探索': 'Continue your self-discovery',
    '进入探索 →': 'Enter →',
    '稍后再说': 'Later',
    '还是没真正读懂自己？': 'Still haven’t truly understood yourself?',
    '登出': 'Sign out',
    '花几分钟，回答几个只属于你的问题。': 'Take a few minutes for a few questions that are yours alone.',
    '每一次，都让你更认识自己一点。': 'Each time, you know yourself a little more.',

    // 与神对话
    '— 灵感来源《与神对话》尼尔·唐纳德·沃尔什 —': '— Inspired by “Conversations with God” by Neale Donald Walsch —',
    '我的生命目的是什么？': 'What is my life’s purpose?',
    '如何吸引真爱？': 'How do I attract true love?',
    '为什么我总感到恐惧？': 'Why do I always feel afraid?',
    '灵魂死后去哪里？': 'Where does the soul go after death?',
    '金钱与爱有什么关系？': 'How are money and love connected?',
    '如何找到内心的平静？': 'How do I find inner peace?',
    '提出你内心最深处的问题': 'Ask the deepest question in your heart',
    '神在聆听': 'The Divine is listening',
    '提问 ✦': 'Ask ✦',
    '✦ 以灵性视角回应，非宗教建议 · 由 AI 驱动': '✦ A spiritual perspective, not religious advice · Powered by AI',

    // 显化旅程
    '你的显化旅程': 'Your Manifestation Journey',
    '从此刻开始': 'Begins Now',
    '我们将用7分钟，带你进入未来的自己。': 'In 7 minutes, we’ll guide you into your future self.',
    '在那里，你已经拥有了一切你渴望的。': 'There, you already have all that you long for.',
    '开始旅程 ✧': 'Begin the Journey ✧',
    '第一步 · 播下种子': 'Step One · Plant the Seed',
    '你最渴望显化的是什么？': 'What do you most long to manifest?',
    '不需要完美，只需要真实。': 'It needn’t be perfect — only true.',
    '深爱我的伴侣': 'A partner who loves me deeply',
    '财务自由与丰盛': 'Financial freedom & abundance',
    '理想的事业与使命': 'My ideal career & calling',
    '健康有活力的身体': 'A healthy, vibrant body',
    '内心的平静与自信': 'Inner peace & confidence',
    '继续 →': 'Continue →',
    '第二步 · 具象化': 'Step Two · Visualize',
    '宇宙正在聆听…': 'The universe is listening…',
    '问题 1 / 3': 'Question 1 / 3',
    '问题 2 / 3': 'Question 2 / 3',
    '问题 3 / 3': 'Question 3 / 3',
    '第三步 · 进入未来': 'Step Three · Enter the Future',
    '你的未来场景正在展开…': 'Your future scene is unfolding…',
    '闭上眼睛，感受这个画面': 'Close your eyes and feel this image',
    '我感受到了，继续 ✧': 'I feel it — continue ✧',
    '第四步 · 锚定频率': 'Step Four · Anchor the Frequency',
    '你的专属显化宣言': 'Your Personal Manifestation Declaration',
    '开启新旅程 ✧': 'Start a New Journey ✧',
    '回到每日显化': 'Back to Daily',

    // 阿卡西首页
    'AKASHIC RECORDS · 阿卡西记录': 'AKASHIC RECORDS',
    '连接你的': 'Connect to Your',
    '灵魂智慧': 'Soul Wisdom',
    '阿卡西记录储存着每个灵魂所有生命的经历与真相。': 'The Akashic Records hold the experiences and truths of every soul, across all its lifetimes.',
    '选择你想探索的方向，让宇宙为你解读。': 'Choose a direction to explore, and let the universe read it for you.',
    '← 返回全部板块': '← Back to all modules',
    '阿卡西正在为你打开…': 'The Akashic Records are opening for you…',
    '重新开始 ↻': 'Start Over ↻',
    '探索其他板块 →': 'Explore other modules →',

    // 定制肯定语
    'FREE · 专属定制': 'FREE · Personalized',
    '定制你的肯定语': 'Craft Your Affirmations',
    '— 告诉我你的风格，AI 为你量身生成 —': '— Tell me your style, and AI will craft them for you —',
    '你想显化什么？': 'What do you want to manifest?',
    '财富丰盛': 'Wealth & Abundance',
    '身心健康': 'Mind & Body',
    '家庭和谐': 'Family Harmony',
    '语言风格': 'Tone & Style',
    '诗意优美': 'Poetic',
    '「爱如晨光，温柔漫过我」': '“Love, like morning light, drifts gently over me”',
    '简洁有力': 'Bold & Simple',
    '「我就是丰盛本身」': '“I am abundance itself”',
    '温柔关怀': 'Gentle & Caring',
    '「我值得被温柔对待」': '“I deserve to be treated tenderly”',
    '神圣灵性': 'Sacred & Spiritual',
    '「宇宙通过我显化光」': '“The universe manifests light through me”',
    '积极励志': 'Uplifting',
    '「我每天都在进化」': '“I evolve a little more each day”',
    '古典东方': 'Eastern Classical',
    '「静水流深，万物归心」': '“Still waters run deep; all things return to the heart”',
    '生成数量': 'How many',
    '3条': '3',
    '5条': '5',
    '10条': '10',
    '每条长度': 'Length',
    '简短': 'Short',
    '适中': 'Medium',
    '深度': 'Deep',
    '还有什么想告诉AI的？（可选）': 'Anything else to tell the AI? (optional)',
    '✦ 生成我的专属肯定语': '✦ Generate My Affirmations',
    '— 你的专属肯定语 —': '— Your Affirmations —',
    '重新生成 ↻': 'Regenerate ↻',

    // 壁纸（会员）
    '✦ MEMBER · 会员专属': '✦ MEMBER',
    '生成肯定语壁纸': 'Create an Affirmation Wallpaper',
    '选择肯定语': 'Choose an affirmation',
    '背景花纹': 'Background pattern',
    '玫瑰': 'Rose',
    '植物藤蔓': 'Vines',
    '孔雀羽': 'Peacock feather',
    '星尘': 'Stardust',
    '极简线条': 'Minimal lines',
    '无花纹': 'None',
    '设计风格': 'Design style',
    '清新': 'Fresh',
    '莫兰迪': 'Morandi',
    '艳丽': 'Vivid',
    '深邃': 'Deep',
    '文字排版': 'Text layout',
    '居中': 'Center',
    '左对齐': 'Left',
    '底部': 'Bottom',
    '预览壁纸 ✦': 'Preview ✦',
    '下载壁纸 ↓': 'Download ↓',
    '手机预览': 'Phone preview',
    '9:19.5 壁纸比例': '9:19.5 wallpaper ratio',

    // 主打卡标签（混排整段）
    '✷ 主打体验 · LIGHT CULTIVATION': '✷ SIGNATURE · LIGHT CULTIVATION',
    '— 她们通过阿卡西找到了答案 —': '— They found their answers through the Akashic Records —',

    // 输入框 placeholder
    '你有什么想问的？...': 'What would you like to ask?...',
    '例如：我想要一段深深爱我的关系…': 'e.g. I want a relationship that loves me deeply…',
    '例如：我最近在经历一段感情…': 'e.g. I’ve been going through something in a relationship…',
    '或者自己写…': 'Or write your own…',
    '用心感受，写下你的答案…': 'Feel it in your heart, and write your answer…',

    // ── 通用 ──
    '← 返回': '← Back',
    '30天自我探索': '30-Day Self-Discovery',
    '取消': 'Cancel',
    '分享': 'Share',
    '再试一次': 'Try again',
    '生成失败': 'Generation failed',
    '提交失败': 'Submission failed',
    '网络错误，请稍后再试': 'Network error, please try again later',
    '网络错误，请重试': 'Network error, please try again',

    // ── 光之修习 hub (xiuxi) ──
    '显化，从来不是等待外面的世界改变，': 'Manifestation is never about waiting for the outer world to change,',
    '而是先在这里，遇见一个更清晰的自己。': 'but about meeting, right here, a clearer version of yourself.',
    '引导式旅程 · 30 天': 'Guided Journey · 30 Days',
    '每天一个问题，像一门与自己对话的课。走完 30 天，你会收到一份': 'One question a day — like a course in conversation with yourself. Complete the 30 days and you’ll receive a',
    '专属的自我画像': 'personal self-portrait',
    '——不知道从何开始时，就从这里走。': '— when you don’t know where to begin, begin here.',
    '有节奏 · 有终点 · 有等级': 'Paced · Finite · Leveled',
    '开始 →': 'Begin →',
    '陪伴式镜子 · 随时': 'A Companion Mirror · Anytime',
    '爱情显影室': 'The Shadow Room',
    '痛的时候、想念的时候、求不得的时候，随手记下': 'In moments of pain, of longing, of wanting — simply note down',
    '你自己的感受': 'your own feelings',
    '。时间会把这些散落的情绪，冲洗成一张你看得见的、正在走出来的自己。': '. Time develops these scattered emotions, like film, into a self you can see — one finding its way out.',
    '随时记 · 有曲线 · 有报告': 'Log anytime · Mood curve · Reports',
    '进入 →': 'Enter →',
    '两条路，最终都通向同一个地方——': 'Both paths lead, in the end, to the same place —',
    '你更懂自己，光就会照进来。': 'the better you know yourself, the more the light gets in.',

    // ── 爱情显影室 (xianying) ──
    '← 光之修习': '← Cultivation',
    '把此刻模糊的情绪丢进来，让时间为你冲洗出一张清晰的自己': 'Drop in this moment’s blurred feelings, and let time develop a clearer you',
    '荣格说，': 'Jung said that ',
    '亲密关系是自我的投射': 'intimacy is a projection of the self',
    '。你在他身上追逐、害怕、思念的，往往是你自己内在的某一部分。': '. What you chase, fear or miss in another is often a part of your own inner world.',
    '所以这里记录的从来不是"他做了什么"，而是': 'So what you record here is never “what he did,” but ',
    '你自己': 'yourself',
    '——你的情绪、你的反应、你的渴望。记得越多，你就越清晰。': '— your emotions, your reactions, your longings. The more you record, the clearer you become.',
    '记录一次': 'New Entry',
    '我的显影': 'My Reflections',
    '此刻，你是什么感觉？': 'How do you feel right now?',
    '痛苦': 'Pain', '思念': 'Longing', '愤怒': 'Anger', '焦虑': 'Anxiety', '委屈': 'Hurt',
    '空虚': 'Emptiness', '嫉妒': 'Jealousy', '不安': 'Unease', '平静': 'Calm', '迷茫': 'Lost',
    '疲惫': 'Weary', '释然': 'Relief', '麻木': 'Numb', '清醒': 'Clarity', '自在': 'Ease',
    '感恩': 'Gratitude', '有力量': 'Strength', '期待': 'Hope',
    '此刻，你离平静有多近？': 'How close to peace are you right now?',
    '很痛，几乎撑不住': 'In pain, barely holding on',
    '很平静，风浪已过': 'At peace, the storm has passed',
    '发生了什么？': 'What happened?',
    '一句话就好，客观地说发生的事。': 'Just one line — state the fact of what happened.',
    '你的第一反应是什么？': 'What was your first reaction?',
    '身体的、冲动的那个反应——想联系他？想消失？愤怒？': 'The bodily, impulsive one — to reach out? to disappear? to rage?',
    '照见自己': 'See Yourself',
    '镜子提问': 'Mirror Question',
    '↻ 换一个问题': '↻ Another question',
    '显影 ✦': 'Develop ✦',
    '正在显影…': 'Developing…',
    '已显影 ✦ 你又多认识了自己一点': 'Developed ✦ You know yourself a little more',
    '先选一个此刻的情绪吧': 'Please pick how you feel first',
    '保存失败，请稍后再试': 'Save failed, please try again later',
    '你还没有任何记录。': 'You don’t have any entries yet.',
    '回到「记录一次」，写下此刻的感受——': 'Go to “New Entry” and write how you feel right now —',
    '哪怕只是一句话，也是显影的开始。': 'even a single line is the beginning of developing yourself.',
    '你的情绪曲线': 'Your Mood Curve',
    '纵轴是「离平静有多近」，越往上，风浪越平息。这就是你的显影之路。': 'The axis is “how close to peace” — the higher, the calmer the seas. This is your path of developing.',
    '次显影': 'entries',
    '平静度变化': 'Calm change',
    '最常出现': 'Most frequent',
    '显影报告': 'Reflection Report',
    '把散落的记录，冲洗成一面清晰的镜子（需至少 3 次记录）。': 'Develop your scattered entries into a clear mirror (at least 3 entries needed).',
    '为我显影这段时间 ✦': 'Develop this chapter for me ✦',
    '记录回廊': 'Your Entries',
    '随时翻看，你会看见那个正在慢慢走出来的自己。': 'Look back anytime, and you’ll see the self that is slowly finding its way out.',
    '正在为你显影……这需要一点时间': 'Developing for you… this takes a moment',
    '正在读取你的记录…': 'Reading your entries…',
    '镜子对你说': 'The mirror says',
    '例如：他一整天没有回我消息': 'e.g. He didn’t reply to me all day',
    '我立刻拿起手机，想问他是不是不在乎我了……': 'I grabbed my phone at once, wanting to ask if he still cares…',
    '慢慢来，把心里的话写给自己……': 'Take your time — write to yourself what’s on your heart…',
    // 镜子提问（8 条）
    '他哪一个举动最刺痛你？这份刺痛，让你想起过去的谁？': 'Which of his actions stung you most? Who from your past does that sting recall?',
    '你此刻最怕失去的，是他，还是他让你感觉到的那个自己？': 'What do you fear losing most right now — him, or the self he let you feel?',
    '你希望他为你做的那件事，你能不能先自己为自己做到？': 'The thing you wish he would do for you — could you first do it for yourself?',
    '如果这份感觉会说话，它最想要的到底是什么？': 'If this feeling could speak, what would it want most of all?',
    '此刻的你最需要听到哪一句话？那句话，本该由谁对你说？': 'What one sentence do you most need to hear now? Who should have said it to you?',
    '你在他身上寻找的，是不是你从未从自己那里得到过的东西？': 'Is what you seek in him something you never gave yourself?',
    '如果这件事发生在你最好的朋友身上，你会怎样安慰她？': 'If this happened to your best friend, how would you comfort her?',
    '这份情绪，你以前在什么时候也曾经历过？那时的你多大？': 'When have you felt this emotion before? How old were you then?',

    // ── dashboard ──
    '欢迎，': 'Welcome, ',
    '欢迎回来，': 'Welcome back, ',
    '你的显化之旅正在展开': 'Your manifestation journey is unfolding',
    '显化应用': 'App',
    '今日签到': 'Check In',
    '我的笔记': 'My Notes',
    '写日记': 'Journal',
    '连续签到': 'Check-in Streak',
    '🔥 天': 'days',
    '本月显化': 'This Month',
    '次操作': 'actions',
    '积分余额': 'Credits',
    '✦ 可用积分': '✦ available',
    '30天自我认识计划': '30-Day Self-Discovery Plan',
    '进行中': 'In progress',
    '已记录': 'Recorded',
    '/ 30 天（需要至少10天触发报告）': '/ 30 days (10+ days unlocks the report)',
    '下一步：': 'Next: ',
    '继续每日回答30天问题，30天内至少记录10天，就能获得专属的自我分析报告，如同宇宙送给你的礼物✨': 'Keep answering the daily questions — log at least 10 days within 30, and receive a personal self-analysis report, like a gift from the universe.',
    '今天的问题': 'Today’s Question',
    '查看报告 🎁': 'View Report',
    '✨ 你的专属显化日记本': 'Your Manifestation Journal',
    '写下你想显化的内容，AI会帮你生成一张专属的显化图片，你可以下载保存作为每天的提醒和激励。': 'Write what you wish to manifest, and AI will create a personal image you can save as a daily reminder and inspiration.',
    '开始写日记': 'Start Journaling',
    '最近的笔记': 'Recent Notes',
    '还没有笔记，': 'No notes yet — ',
    '创建第一条': 'create your first',
    '30天自我认识': '30-Day Self-Discovery',
    '第 1 天': 'Day 1',
    '今天有哪一个瞬间，让你觉得自己「真的在过今天」？': 'What moment today made you feel you were “truly living today”?',
    '稍后再答': 'Later',
    '保存 ✦': 'Save ✦',
    '笔记标题': 'Note title',
    '内容': 'Content',
    '标签（用逗号分隔）': 'Tags (comma-separated)',
    '保存笔记': 'Save Note',
    '显化日记本': 'Manifestation Journal',
    '日记标题': 'Journal title',
    '我想显化的是…': 'What I want to manifest is…',
    '今天的想法（可选）': 'Today’s thoughts (optional)',
    '保存并生成图片': 'Save & Generate Image',
    '你的30天礼物 🎁': 'Your 30-Day Gift',
    '分享这份报告': 'Share this report',
    '给这条笔记取个标题': 'Give this note a title',
    '记下你的想法…': 'Note your thoughts…',
    '例如：爱情,显化,心得': 'e.g. love, manifestation, insight',
    '今天的显化主题': 'Today’s theme',
    '写下你最想显化的事，越详细越好。这将成为你的显化图片的核心…': 'Write what you most want to manifest, in detail — this becomes the heart of your image…',
    '记下你的感受…': 'Note how you feel…',

    // ── auth ──
    '欢迎回家': 'Welcome Home',
    '继续你的显化之旅': 'Continue your manifestation journey',
    '使用 Google 登录': 'Sign in with Google',
    '或用邮箱': 'or with email',
    '邮箱': 'Email',
    '密码': 'Password',
    '记住我': 'Remember me',
    '登陆': 'Sign in',
    '登陆中...': 'Signing in...',
    '还没有账户？': 'No account yet?',
    '立即注册': 'Sign up',
    '设置密码': 'Set a password',
    '确认密码': 'Confirm password',
    '注册': 'Register',
    '注册中...': 'Registering...',
    '已有账户？': 'Already have an account?',
    '你的邮箱': 'Your email',
    '输入密码': 'Enter password',
    '至少8位': 'At least 8 characters',
    '重复密码': 'Repeat password',

    // ── discovery（静态 + 非插值）──
    '每一次登录，都是一次与自己的深度对话': 'Every visit is a deep conversation with yourself',
    '加载失败，请刷新重试': 'Loading failed, please refresh',
    '加载失败，请重试': 'Loading failed, please try again',
    '生成失败，请稍后再试': 'Generation failed, please try again later',
    '正在为你梳理这段旅程…': 'Piecing together your journey…',
    '正在翻开你的档案…': 'Opening your file…',
    '还没有记录，去完成第一关吧 ✦': 'No entries yet — complete your first level ✦',
    '← 返回探索': '← Back to exploration',
    '咨商师的回响': 'The Counselor’s Echo',
    '— 咨商师的回响 —': '— The Counselor’s Echo —',
    '下载报告为图片': 'Download report as image',
    '也可以先休息，下次登录我们继续 ✦': 'You can rest for now — we’ll continue next time ✦',
    '你对自己的了解，又深了一层。': 'You understand yourself one layer deeper.',
    '你已经完成了整段自我探索之旅。': 'You’ve completed the entire journey of self-discovery.',
    '你走完了这30天': 'You’ve walked these 30 days',
    '完成后可获得积分，并解锁 AI 为你写下的洞察 ✦': 'Complete it to earn credits and unlock the insight AI writes for you ✦',
    '完成这一关': 'Complete this level',
    '我的30天自我画像': 'My 30-Day Self-Portrait',
    '是时候回望这一路，看看你为自己描绘出了怎样的画像。': 'It’s time to look back and see the portrait you’ve painted of yourself.',
    '正在为你准备今天的探索…': 'Preparing today’s exploration…',
    '正在生成你的画像…（约需20秒）': 'Creating your portrait… (about 20s)',
    '正在聆听你的回答…': 'Listening to your answer…',
    '生成我的完整报告': 'Generate my full report',
    '继续下一关': 'Continue to next level',
    '查看我的完整报告 →': 'View my full report →',
    '至少写下一个答案，再完成这一关吧': 'Write at least one answer before completing this level',
    '陪你把自己看得更清楚': 'Helping you see yourself more clearly',
    '3 个问题': '3 questions',
    '30 段': '30 stages'
  };

  // 记录被翻译过的节点，切回中文时还原原文（不做反查，避免"10"→"10条"这类误伤）
  var CHANGED = [];

  function detect() {
    var saved = localStorage.getItem(STORE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
    return 'zh'; // 默认中文（主市场）；用户可切换
  }

  var lang = detect();
  window.LUMI_LANG = lang;

  // ── 仅正向：中文原文 → 英文，返回替换后的字符串或 null ──
  function enOf(t) {
    var key = t.trim();
    if (!key) return null;
    if (DICT.hasOwnProperty(key)) return t.replace(key, DICT[key]);
    return null;
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };

  // 只在英文态翻译；每次翻译都记录原文，便于还原
  function walk(node) {
    if (!node || lang !== 'en') return;
    if (node.nodeType === 3) {
      var out = enOf(node.nodeValue);
      if (out !== null && out !== node.nodeValue) {
        CHANGED.push({ n: node, t: 'text', zh: node.nodeValue });
        node.nodeValue = out;
      }
      return;
    }
    if (node.nodeType !== 1) return;
    // placeholder 属性（textarea/input 也要处理，故放在 SKIP 之前）
    if (node.hasAttribute && node.hasAttribute('placeholder')) {
      var p = enOf(node.getAttribute('placeholder'));
      if (p !== null) {
        CHANGED.push({ n: node, t: 'ph', zh: node.getAttribute('placeholder') });
        node.setAttribute('placeholder', p);
      }
    }
    if (SKIP[node.tagName]) return; // 跳过其子节点（不翻 textarea 内的用户文本）
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  // 还原为中文原文
  function restoreZh() {
    for (var i = 0; i < CHANGED.length; i++) {
      var c = CHANGED[i];
      try {
        if (c.t === 'text') c.n.nodeValue = c.zh;
        else c.n.setAttribute('placeholder', c.zh);
      } catch (e) {}
    }
    CHANGED = [];
  }

  // 英文态：优先拉丁衬线（避免中文字体把 ' " 渲染成全角）
  function injectEnFont() {
    if (document.getElementById('lumi-en-font')) return;
    var st = document.createElement('style');
    st.id = 'lumi-en-font';
    st.textContent =
      "html.lang-en, html.lang-en *{font-family:Georgia,'LXGW WenKai TC','Noto Serif SC',serif !important;}" +
      "html.lang-en :is(.logo,.nav-logo,.hero-title,.card-title,.stage-title,.card-cat,.finished-card h2,.report h2,.report h3,h1,h2,h3,em,i){font-family:'Cormorant Garamond',Georgia,serif !important;}";
    document.head.appendChild(st);
  }

  var applying = false;
  function applyLang() {
    applying = true;
    if (lang === 'en') { injectEnFont(); walk(document.body); }
    else { restoreZh(); }
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
    document.documentElement.classList.toggle('lang-en', lang === 'en');
    updateToggle();
    applying = false;
  }

  // ── 语言切换按钮 ──
  function buildToggle() {
    if (document.getElementById('langToggle')) return;
    var nav = document.querySelector('.nav-tabs') || document.querySelector('.topbar') || document.querySelector('.header') || document.querySelector('nav');
    var btn = document.createElement('button');
    btn.id = 'langToggle';
    btn.type = 'button';
    btn.style.cssText = 'margin-left:14px;padding:5px 12px;border:1px solid rgba(201,169,110,0.5);background:transparent;color:#c9a96e;border-radius:20px;cursor:pointer;font-size:11px;letter-spacing:0.08em;font-family:inherit;white-space:nowrap;flex:none;transition:all .3s;';
    btn.onmouseover = function () { btn.style.background = 'rgba(201,169,110,0.1)'; };
    btn.onmouseout = function () { btn.style.background = 'transparent'; };
    btn.onclick = toggleLang;
    if (nav) {
      // 尽量放在导航栏内或其后
      if (nav.classList && nav.classList.contains('nav-tabs')) nav.parentNode.appendChild(btn);
      else nav.appendChild(btn);
    } else {
      btn.style.cssText += 'position:fixed;top:16px;right:16px;z-index:9999;';
      document.body.appendChild(btn);
    }
    updateToggle();
  }
  function updateToggle() {
    var b = document.getElementById('langToggle');
    if (b) b.textContent = (lang === 'en') ? '中文' : 'EN';
  }

  function toggleLang() {
    lang = (lang === 'en') ? 'zh' : 'en';
    localStorage.setItem(STORE_KEY, lang);
    window.LUMI_LANG = lang;
    applyLang();
    try { window.dispatchEvent(new CustomEvent('lumi-lang', { detail: lang })); } catch (e) {}
  }
  window.LUMI_setLang = function (l) { if (l !== lang) toggleLang(); };

  // ── 观察动态渲染，自动翻译 ──
  function observe() {
    var mo = new MutationObserver(function (muts) {
      if (applying) return;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'childList') {
          m.addedNodes.forEach(function (n) { walk(n); });
        } else if (m.type === 'characterData') {
          walk(m.target);
        } else if (m.type === 'attributes' && m.attributeName === 'placeholder' && lang === 'en' && m.target.getAttribute) {
          var p = enOf(m.target.getAttribute('placeholder'));
          if (p !== null) { applying = true; CHANGED.push({ n: m.target, t: 'ph', zh: m.target.getAttribute('placeholder') }); m.target.setAttribute('placeholder', p); applying = false; }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
  }

  function boot() {
    buildToggle();
    if (lang === 'en') applyLang();
    observe();
    // 通知页面当前语言（让肯定语等内容按语言重渲染）
    try { window.dispatchEvent(new CustomEvent('lumi-lang', { detail: lang })); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
