/* ══════════════════════════════════════════════
   LUMIÈRE 轻量埋点：页面浏览 / 停留时长 / 点击
   事件发往 /api/lumiere?action=track，用 sendBeacon 不阻塞
   ══════════════════════════════════════════════ */
(function () {
  var API = '/api/lumiere?action=track';

  function pageName() {
    var p = (location.pathname || '/').replace(/^\//, '').replace(/\.html$/, '');
    return p || 'index';
  }
  function uid() { try { return localStorage.getItem('lumiere_user_id') || null; } catch (e) { return null; } }

  function send(type, label, value) {
    try {
      var body = JSON.stringify({
        user_id: uid(),
        type: type,
        page: pageName(),
        label: label || null,
        value: (value != null ? value : null)
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
      }
    } catch (e) {}
  }

  // 页面浏览
  send('page_view');

  // 停留时长（离开/切走时上报一次）
  var t0 = Date.now(), dwellSent = false;
  function reportDwell() {
    if (dwellSent) return;
    var sec = Math.round((Date.now() - t0) / 1000);
    if (sec > 0 && sec < 7200) { dwellSent = true; send('dwell', null, sec); }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') reportDwell();
  });
  window.addEventListener('pagehide', reportDwell);

  // 点击（导航、按钮、卡片等主要交互）
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('button,a,.nav-tab,.tab,.cat-btn,.quick-btn,.card,.chip');
    if (!el) return;
    var label = (el.getAttribute('data-track') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    send('click', label);
  }, true);
})();
