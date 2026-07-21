/* ══════════════════════════════════════════════
   LUMIÈRE 背景音乐 + 静音按钮
   - 优先播放本地文件 /bgm.mp3（循环）；没有文件时，自动用 Web Audio 生成柔和的疗愈氛围音（无需素材）
   - 左下角浮动按钮可静音/开启；状态记在 localStorage，跨页面记住
   - 遵守浏览器自动播放策略：首次交互后才真正出声
   ══════════════════════════════════════════════ */
(function () {
  var KEY = 'lumiere_music';                 // 'on' | 'off'
  var state = (function(){ try{ return localStorage.getItem(KEY) || 'off'; }catch(e){ return 'off'; } })();
  var TARGET = 0.085;                          // 背景音量（很轻）

  var audio = null, useFile = false;          // mp3 模式
  var ctx = null, master = null, built = false; // Web Audio 模式
  var playing = false;

  // ── 尝试用本地 mp3 ──
  function tryFile(cb){
    var a = new Audio();
    a.src = '/bgm.mp3'; a.loop = true; a.preload = 'auto'; a.volume = TARGET;
    var done = false;
    a.addEventListener('canplaythrough', function(){ if(done) return; done=true; audio=a; useFile=true; cb(true); }, {once:true});
    a.addEventListener('error', function(){ if(done) return; done=true; cb(false); }, {once:true});
    // 兜底：1.2s 内没成功就走 Web Audio
    setTimeout(function(){ if(done) return; done=true; cb(false); }, 1200);
  }

  // ── Web Audio 柔和氛围垫（无需素材）──
  function buildAmbient(){
    if (built) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      var filter = ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=760; filter.Q.value=0.4; filter.connect(master);
      // Cmaj9 低八度，温柔铺底
      var freqs = [130.81, 164.81, 196.00, 246.94];
      freqs.forEach(function(f, i){
        var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        var g = ctx.createGain(); g.gain.value = i===0 ? 0.10 : 0.06;
        o.connect(g); g.connect(filter); o.start();
        var lfo = ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value = 0.04 + i*0.013;
        var lg = ctx.createGain(); lg.gain.value = 2.2; lfo.connect(lg); lg.connect(o.detune); lfo.start();
      });
      // 呼吸般的缓慢起伏
      var mLfo = ctx.createOscillator(); mLfo.type='sine'; mLfo.frequency.value = 0.05;
      var mg = ctx.createGain(); mg.gain.value = 0.025; mLfo.connect(mg); mg.connect(master.gain); mLfo.start();
      built = true;
    } catch(e) { built = false; }
  }
  function fade(param, to){
    if(!ctx) return;
    try{ param.cancelScheduledValues(ctx.currentTime); param.setValueAtTime(param.value, ctx.currentTime); param.linearRampToValueAtTime(to, ctx.currentTime + 1.6); }catch(e){}
  }

  function play(){
    if (useFile && audio){ audio.volume = TARGET; var p = audio.play(); if(p&&p.catch) p.catch(function(){}); playing = true; return; }
    buildAmbient();
    if (ctx){ if (ctx.state === 'suspended') ctx.resume(); fade(master.gain, TARGET); playing = true; }
  }
  function stop(){
    if (useFile && audio){ audio.pause(); playing = false; return; }
    if (ctx){ fade(master.gain, 0); playing = false; }
  }

  // ── 按钮 ──
  function icon(on){
    var col = on ? '#c9a96e' : '#a89a86';
    var note = '<path d="M9 17.5 V7 L18 5 V15.5" fill="none" stroke="'+col+'" stroke-width="1.6" stroke-linecap="round"/><circle cx="6.5" cy="17.5" r="2.5" fill="'+col+'"/><circle cx="15.5" cy="15.5" r="2.5" fill="'+col+'"/>';
    var slash = on ? '' : '<line x1="3" y1="21" x2="21" y2="3" stroke="#a89a86" stroke-width="1.6" stroke-linecap="round"/>';
    return '<svg width="22" height="22" viewBox="0 0 24 24">'+note+slash+'</svg>';
  }
  var btn;
  function buildBtn(){
    btn = document.createElement('button'); btn.id = 'luMusicBtn'; btn.setAttribute('aria-label','music');
    btn.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9998;width:42px;height:42px;border-radius:50%;border:1px solid rgba(201,169,110,0.5);background:rgba(250,246,240,0.92);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.1);transition:all .3s;';
    btn.onclick = toggle;
    document.body.appendChild(btn);
    updateBtn();
  }
  function updateBtn(){ if(btn) { btn.innerHTML = icon(state==='on'); btn.style.opacity = state==='on' ? '1' : '0.7'; } }

  function toggle(){
    state = (state === 'on') ? 'off' : 'on';
    try{ localStorage.setItem(KEY, state); }catch(e){}
    if (state === 'on') play(); else stop();
    updateBtn();
  }

  // ── 启动 ──
  function boot(){
    buildBtn();
    tryFile(function(ok){ /* useFile 已在回调内设置；未 ok 则用 Web Audio */ });
    if (state === 'on'){
      // 首次用户交互后开始（自动播放策略）
      var startOnce = function(){ if (state === 'on' && !playing) play(); };
      ['pointerdown','touchstart','keydown'].forEach(function(ev){ document.addEventListener(ev, startOnce, {once:true, passive:true}); });
      // 也试一次直接播放（部分浏览器允许）
      setTimeout(function(){ if (state==='on' && !playing) play(); }, 600);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
