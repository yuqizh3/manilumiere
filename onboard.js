/* ══════════════════════════════════════════════
   LUMIÈRE 新手引导
   每个板块首次进入时弹一张卡片，说明「是什么 + 怎么用」
   看过就不再弹（localStorage 记录）；可「不再显示」
   中英文跟随 window.LUMI_LANG
   用法：window.Onboard.show('welcome')  /  Onboard.reset()
   ══════════════════════════════════════════════ */
(function () {
  var SEEN_KEY = 'lumiere_onboard_seen';
  var OFF_KEY = 'lumiere_onboard_off';

  function lang() { return window.LUMI_LANG === 'en' ? 'en' : 'zh'; }
  function seen() { try { return (localStorage.getItem(SEEN_KEY) || '').split(','); } catch (e) { return []; } }
  function markSeen(k) { var s = seen(); if (s.indexOf(k) < 0) { s.push(k); try { localStorage.setItem(SEEN_KEY, s.filter(Boolean).join(',')); } catch (e) {} } }
  function isOff() { try { return localStorage.getItem(OFF_KEY) === '1'; } catch (e) { return false; } }

  // ── 各板块引导文案 ──
  var G = {
    welcome: {
      zh: { tag: '欢迎', title: '欢迎来到 LUMIÈRE', body: '这是一个「显化 × 自我疗愈」的空间。显化不是干等愿望成真，而是先遇见一个更清晰的自己。上方每个板块，都是一种照见自己的方式。', tip: '先从「每日显化」开始：选一个意图，读一句属于你的肯定语。' },
      en: { tag: 'Welcome', title: 'Welcome to LUMIÈRE', body: 'A space for manifestation and self-healing. Manifestation isn’t about waiting for wishes to come true — it begins with meeting a clearer version of yourself. Each tab above is a way to see yourself.', tip: 'Start with “Daily”: pick an intention and read an affirmation made for you.' }
    },
    cultivation: {
      zh: { tag: '光之修习', title: '两条读懂自己的路', body: '这里有两个深入自我的练习：「30天自我探索」每天一个问题，走完给你一份专属自我画像；「爱情显影室」在你情绪起伏时随手记录，帮你看清自己。', tip: '不知从哪开始，就走 30 天；正在为感情烦恼，就进爱情显影室。' },
      en: { tag: 'Cultivation', title: 'Two paths to know yourself', body: 'Two practices for going inward: “30-Day Self-Discovery” gives you one question a day and a personal portrait at the end; “The Shadow Room” lets you jot down feelings in emotional moments to see yourself clearly.', tip: 'Not sure where to begin? Walk the 30 days. Aching over love? Enter the Shadow Room.' }
    },
    xianying: {
      zh: { tag: '爱情显影室', title: '记录的是你，不是他', body: '失恋、思念、求不得的时候，来记下你自己的感受。荣格说，亲密关系是自我的投射——你在他身上追逐的，往往是你自己的一部分。', tip: '每次记一条（30 秒即可）。记满 3 次，AI 会为你冲洗出一份「显影报告」。' },
      en: { tag: 'The Shadow Room', title: 'Record yourself, not him', body: 'In moments of heartbreak, longing or wanting, note down your own feelings. As Jung said, intimacy is a projection of the self — what you chase in another is often a part of you.', tip: 'One entry at a time (30 seconds). After 3 entries, AI develops a “Reflection Report” for you.' }
    },
    days30: {
      zh: { tag: '30天自我探索', title: '每天几个问题，慢慢照见自己', body: '星座、MBTI 都测过，却还是没真正读懂自己？用 30 天，每天回答几个只属于你的问题，由浅入深。', tip: '每答一关得积分与一句咨商师的回响；记满一定天数，解锁完整自我画像报告。' },
      en: { tag: '30-Day Self-Discovery', title: 'A few questions a day, seeing yourself slowly', body: 'Tried astrology and MBTI but still haven’t truly understood yourself? Over 30 days, answer a few questions that are yours alone, going deeper each time.', tip: 'Each level earns credits and a counselor’s reflection; reach enough days to unlock your full self-portrait report.' }
    },
    god: {
      zh: { tag: '与神对话', title: '问出你最深的问题', body: '把心里最深的困惑说出来。这里以《与神对话》的灵性视角回应你——不是宗教，是陪你把问题看得更清楚。', tip: '直接输入你的问题，或点下方的示例问题开始。' },
      en: { tag: 'Dialogue', title: 'Ask your deepest question', body: 'Speak the confusion in your heart. This responds from the spiritual perspective of “Conversations with God” — not religion, but a companion to help you see your question clearly.', tip: 'Type your question, or tap one of the example questions to start.' }
    },
    journey: {
      zh: { tag: '显化旅程', title: '7 分钟，走进未来的自己', body: '跟着 4 步引导，进入一个「你已经拥有了渴望的一切」的未来场景，最后带走一句专属的显化宣言。', tip: '找个安静的时刻，慢慢跟着走一遍，效果最好。' },
      en: { tag: 'Journey', title: '7 minutes into your future self', body: 'Follow 4 guided steps into a scene where “you already have all you long for,” and leave with a personal manifestation declaration.', tip: 'Find a quiet moment and move through it slowly for the best effect.' }
    },
    akashic: {
      zh: { tag: '阿卡西记录', title: '一次深度的灵魂解读', body: '选一个想探索的主题——前世今生、天赋才华、梦境、财富卡点……回答几个问题，AI 会为你做一次深度解读。', tip: '选一个板块，如实回答问题，越具体解读越准。' },
      en: { tag: 'Akashic', title: 'A deep soul reading', body: 'Choose a theme to explore — past lives, gifts, dreams, wealth blocks… Answer a few questions and AI gives you a deep reading.', tip: 'Pick a module and answer honestly — the more specific, the more accurate.' }
    },
    custom: {
      zh: { tag: '定制肯定语', title: '为你量身生成', body: '告诉 AI 你想显化什么、喜欢什么语气，它为你生成一组专属肯定语，还能做成手机壁纸每天看。', tip: '选主题 + 语气，点「生成」；喜欢的可以做成壁纸下载。' },
      en: { tag: 'Custom', title: 'Made just for you', body: 'Tell AI what you want to manifest and your preferred tone, and it crafts a set of affirmations — even as a phone wallpaper to see daily.', tip: 'Pick a theme + tone, tap “Generate”; turn favorites into a wallpaper.' }
    },
    account: {
      zh: { tag: '个人中心', title: '你的显化数据看板', body: '积分、连续签到、笔记、30 天进度，都在这里。你的记录和成长都被好好存着。', tip: '每天记得点「签到」攒积分——连续签到还能多加分。' },
      en: { tag: 'Account', title: 'Your manifestation dashboard', body: 'Credits, check-in streak, notes, 30-day progress — all here. Your records and growth are kept safe.', tip: 'Remember to “Check in” daily for credits — a streak earns bonus points.' }
    }
  };

  var GOT = { zh: '知道了 ✦', en: 'Got it ✦' };
  var SKIP = { zh: '不再显示引导', en: 'Don’t show guides' };
  var HOW = { zh: '怎么用', en: 'How to use' };

  function injectStyle() {
    if (document.getElementById('ob-style')) return;
    var st = document.createElement('style');
    st.id = 'ob-style';
    st.textContent =
      '.ob-overlay{position:fixed;inset:0;background:rgba(26,21,16,0.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:10000;font-family:"LXGW WenKai TC","Noto Serif SC",serif;}' +
      '.ob-card{background:#faf6f0;border:1px solid rgba(201,169,110,0.4);border-radius:20px;max-width:400px;width:100%;padding:30px 28px 24px;box-shadow:0 24px 70px rgba(0,0,0,.28);animation:obRise .45s cubic-bezier(.2,.8,.2,1);position:relative;}' +
      '@keyframes obRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}' +
      '.ob-tag{font-size:11px;letter-spacing:0.18em;color:#c9a96e;text-transform:uppercase;margin-bottom:12px;}' +
      '.ob-title{font-family:"Cormorant Garamond","LXGW WenKai TC","Noto Serif SC",serif;font-size:25px;font-weight:400;color:#1a1510;margin:0 0 14px;line-height:1.35;}' +
      '.ob-body{font-size:14.5px;line-height:1.95;color:#4a3f35;margin:0 0 16px;}' +
      '.ob-tip{font-size:13.5px;line-height:1.85;color:#8a7560;background:rgba(201,169,110,0.1);border-left:3px solid #c9a96e;border-radius:8px;padding:11px 14px;margin-bottom:22px;}' +
      '.ob-tip b{color:#c9a96e;font-weight:400;}' +
      '.ob-btn{display:block;width:100%;padding:14px;border:none;border-radius:10px;background:#c9a96e;color:#fff;font-family:inherit;font-size:14px;font-weight:500;letter-spacing:0.1em;cursor:pointer;transition:background .3s;}' +
      '.ob-btn:hover{background:#b8975d;}' +
      '.ob-skip{text-align:center;margin-top:12px;font-size:12.5px;color:#a89a86;cursor:pointer;}' +
      '.ob-skip:hover{color:#8a7560;}' +
      '.ob-en .ob-title{font-family:"Cormorant Garamond",Georgia,serif;}' +
      '.ob-en .ob-body,.ob-en .ob-tip,.ob-en .ob-tag,.ob-en .ob-btn,.ob-en .ob-skip{font-family:Georgia,serif;}';
    document.head.appendChild(st);
  }

  function close() {
    var o = document.getElementById('ob-overlay');
    if (o) o.remove();
  }

  function render(key, g) {
    injectStyle();
    close();
    var l = lang();
    var ov = document.createElement('div');
    ov.id = 'ob-overlay';
    ov.className = 'ob-overlay' + (l === 'en' ? ' ob-en' : '');
    var card = document.createElement('div');
    card.className = 'ob-card';
    card.innerHTML =
      '<div class="ob-tag">' + g.tag + '</div>' +
      '<h3 class="ob-title">' + g.title + '</h3>' +
      '<p class="ob-body">' + g.body + '</p>' +
      '<div class="ob-tip"><b>▸ ' + HOW[l] + (l === 'en' ? ': ' : '：') + '</b>' + g.tip + '</div>' +
      '<button class="ob-btn" id="ob-got">' + GOT[l] + '</button>' +
      '<div class="ob-skip" id="ob-skip">' + SKIP[l] + '</div>';
    ov.appendChild(card);
    // 点遮罩空白也可关闭
    ov.addEventListener('click', function (e) { if (e.target === ov) { markSeen(key); close(); } });
    document.body.appendChild(ov);
    card.querySelector('#ob-got').onclick = function () { markSeen(key); close(); };
    card.querySelector('#ob-skip').onclick = function () { try { localStorage.setItem(OFF_KEY, '1'); } catch (e) {} close(); };
  }

  window.Onboard = {
    // show(key)：首次才弹；show(key,true)：强制弹（用于"重新查看引导"）
    show: function (key, force) {
      var g = G[key] && G[key][lang()];
      if (!g) return;
      if (!force) {
        if (isOff()) return;
        if (seen().indexOf(key) >= 0) return;
      }
      // 稍延迟，等页面内容渲染出来更自然
      setTimeout(function () { render(key, g); }, force ? 0 : 700);
    },
    reset: function () { try { localStorage.removeItem(SEEN_KEY); localStorage.removeItem(OFF_KEY); } catch (e) {} }
  };
})();
