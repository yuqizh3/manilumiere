// 日记图片生成模块 - 添加到 dashboard.html 的 <script> 前
<script>
// ── 生成日记图片的 Canvas 工具 ──
function generateJournalImageCanvas(desires, title) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext('2d');

  // ── 背景渐变 ──
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#faf6f0');
  gradient.addColorStop(0.5, '#f5f0e8');
  gradient.addColorStop(1, '#ede5dc');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── 装饰元素：顶部线条 ──
  ctx.strokeStyle = 'rgba(201,169,110,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(980, 100);
  ctx.stroke();

  // ── 装饰元素：星号 ──
  ctx.fillStyle = 'rgba(201,169,110,0.6)';
  ctx.font = 'italic 32px Cormorant Garamond, serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦', 540, 160);

  // ── 标题 ──
  ctx.fillStyle = 'rgba(26,21,16,0.9)';
  ctx.font = 'bold 48px Noto Serif SC, serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 1;

  // 绘制带换行的标题
  const titleLines = wrapText(ctx, title, 900, 48);
  let titleY = 240;
  titleLines.forEach(line => {
    ctx.fillText(line, 540, titleY);
    titleY += 60;
  });

  // ── 装饰线 ──
  ctx.strokeStyle = 'rgba(201,169,110,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(300, titleY + 40);
  ctx.lineTo(780, titleY + 40);
  ctx.stroke();

  // ── 显化内容 ──
  ctx.fillStyle = 'rgba(26,21,16,0.85)';
  ctx.font = 'italic 36px Cormorant Garamond, serif';
  ctx.textAlign = 'center';

  const desireLines = wrapText(ctx, desires, 900, 36);
  let desireY = titleY + 120;

  desireLines.forEach((line, idx) => {
    ctx.globalAlpha = 1 - (idx * 0.05); // 逐行淡化
    ctx.fillText(line, 540, desireY);
    desireY += 50;
    ctx.globalAlpha = 1;
  });

  // ── 底部装饰 ──
  ctx.strokeStyle = 'rgba(201,169,110,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, canvas.height - 180);
  ctx.lineTo(980, canvas.height - 180);
  ctx.stroke();

  // ── 底部文字 ──
  ctx.fillStyle = 'rgba(201,169,110,0.6)';
  ctx.font = '14px Noto Serif SC, serif';
  ctx.textAlign = 'center';
  const date = new Date().toLocaleDateString('zh-CN');
  ctx.fillText('LUMIÈRE · ' + date + ' · 显化圣所', 540, canvas.height - 120);

  // ── 底部装饰符号 ──
  ctx.fillStyle = 'rgba(201,169,110,0.4)';
  ctx.font = 'italic 20px Cormorant Garamond, serif';
  ctx.fillText('✦ ✧ ✦', 540, canvas.height - 60);

  return canvas;
}

// ── 文本换行工具 ──
function wrapText(ctx, text, maxWidth, fontSize) {
  const lines = [];
  const chars = text.split('');
  let currentLine = '';

  chars.forEach(char => {
    const testLine = currentLine + char;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

// ── 下载 Canvas 为图片 ──
function downloadCanvasAsImage(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png', 0.95);
  link.download = filename || 'lumiere-journal.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── 在保存日记时调用 ──
const originalSaveJournal = saveJournal;
async function saveJournal(e) {
  e.preventDefault();
  const title = document.getElementById('journalTitle').value;
  const desires = document.getElementById('journalDesires').value;
  const content = document.getElementById('journalContent').value;

  try {
    // 先保存日记
    const res = await fetch(`${API_BASE}?action=save_journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        title,
        content,
        desires
      })
    });

    const data = await res.json();

    if (data.ok) {
      // 生成图片
      const canvas = generateJournalImageCanvas(desires, title);

      // 显示预览模态框
      showImagePreview(canvas, title);

      closeModal('journalModal');
      document.getElementById('journalTitle').value = '';
      document.getElementById('journalDesires').value = '';
      document.getElementById('journalContent').value = '';
    }
  } catch (err) {
    console.error('保存失败:', err);
    alert('保存失败，请稍后重试');
  }
}

// ── 显示图片预览 ──
function showImagePreview(canvas, title) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.id = 'previewModal';
  modal.innerHTML = `
    <div class="modal-panel" style="max-width:600px;">
      <button class="modal-close" onclick="closeModal('previewModal')">×</button>
      <h2 class="modal-title">你的显化图片已生成 ✨</h2>
      <div class="modal-divider"></div>
      <div style="margin-bottom:20px;">
        <img id="previewImage" src="${canvas.toDataURL('image/png')}" style="width:100%;border-radius:10px;border:1px solid rgba(201,169,110,0.35);">
      </div>
      <div style="display:flex;gap:10px;">
        <button onclick="downloadPreviewImage('${title}')" style="flex:1;padding:12px;background:var(--dark);color:var(--cream);border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">下载图片 ↓</button>
        <button onclick="sharePreviewImage()" style="flex:1;padding:12px;background:transparent;border:1px solid var(--gold);color:var(--gold);border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">分享</button>
        <button onclick="closeModal('previewModal')" style="flex:1;padding:12px;background:transparent;border:1px solid var(--gold);color:var(--gold);border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">关闭</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 保存 canvas 引用用于下载
  window._previewCanvas = canvas;
}

// ── 下载预览图片 ──
function downloadPreviewImage(title) {
  if (window._previewCanvas) {
    downloadCanvasAsImage(window._previewCanvas, `lumiere-${title}-${Date.now()}.png`);
    alert('图片已下载！');
  }
}

// ── 分享预览图片 ──
function sharePreviewImage() {
  if (window._previewCanvas) {
    const imageUrl = window._previewCanvas.toDataURL('image/png');
    if (navigator.share) {
      navigator.share({
        title: 'LUMIÈRE 显化圣所',
        text: '我正在用 LUMIÈRE 显化我的梦想✨',
        url: window.location.href
      });
    } else {
      alert('分享链接：' + window.location.href);
    }
  }
}
</script>