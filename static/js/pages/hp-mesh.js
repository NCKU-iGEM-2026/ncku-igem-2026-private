/* ============================================================
   HP-NEXUS — 全站背景引擎：不對稱多邊形網格＋不定時變形＋DNA
   原本只掛 nexus 系三頁；現在全站深色模式都跑（Collaboration 同款
   動畫底圖），置換各頁平平的靜態綠底：
   - 不規則多邊形網格：節點以不平均間距撒點，近鄰連線成網
   - 不定時變形：節點常數慢漂＋每 8–14 秒挑幾點跳到新位置（形狀自己變換）
   - DNA 元素：低透明度雙螺旋帶斜跨版面，鹼基橫桿隨相位推進
   - DNA 帶位置／數量依頁面路徑 hash 變 seed——每頁各自長相，不copy 同張底
   - 淺色模式自動收起（漸回紙白）；主題切換即時啟停
   - reduced-motion：只畫一次靜態網；分頁不可見暫停
   ============================================================ */
(function () {
  'use strict';
  if (window.__hpMeshMounted) return;   /* 防重複載入：全站 layout 掛一次就夠 */
  window.__hpMeshMounted = true;
  var body = document.body;
  var rootEl = document.documentElement;
  /* engineering（DBTL 白紙世界）與 board-game（桌遊紙世界）有自己的視覺，不打攪 */
  var exclude = /(^|\s)(engineering-page|board-game-page)(\s|$)/.test(body.className);
  if (exclude) return;
  function darkNow () { return rootEl.getAttribute('data-theme') !== 'light'; }

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var canvas = document.createElement('canvas');
  canvas.className = 'hp-mesh';
  canvas.setAttribute('aria-hidden', 'true');
  /* 直接內聯定位：不依賴頁面載入哪份 CSS，一律固定在最底層 */
  canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;width:100%;height:100%;pointer-events:none;display:block;opacity:0;transition:opacity 0.6s ease';
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* Drawn at CSS pixels: faint lines on a dark ground look the same, and a
     2x screen would otherwise fill four times the pixels every frame. */
  var DPR = 1;
  var W = 0, H = 0;
  var pts = [];        /* 網格節點 */
  var rafId = null, running = false;
  var morphTimer = null;

  function size() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* 不對稱撒點：~150px 基準格、每點加 ±38% 抖動（不做整齊方格） */
  function seed() {
    pts = [];
    var cell = 150;
    var cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        pts.push({
          hx: (c + (Math.random() - 0.5) * 0.76) * cell,
          hy: (r + (Math.random() - 0.5) * 0.76) * cell,
          /* 漂移：各自頻率/相位的正弦微動（不規則感） */
          ax: 6 + Math.random() * 14, ay: 6 + Math.random() * 14,
          fx: 0.00022 + Math.random() * 0.00035, fy: 0.00022 + Math.random() * 0.00035,
          ph: Math.random() * Math.PI * 2,
          c: c, r: r
        });
      }
    }
  }

  function pos(p, t) {
    if (reduce) return { x: p.hx, y: p.hy };
    return {
      x: p.hx + Math.sin(t * p.fx + p.ph) * p.ax,
      y: p.hy + Math.cos(t * p.fy * 1.3 + p.ph) * p.ay
    };
  }

  /* 網格鍵結：右、下、右下三向鄰居 → 不規則多邊形拼貼
     效能：節點位置每幀只算一次；線依透明度分成 ALPHA_STEPS 桶、網點分兩色，
     每桶合成一條 path 一次 stroke/fill（原本每條線各 stroke 一次，約兩百次
     draw call）。分桶後透明度差 < 0.004，肉眼看不出差別。 */
  var ALPHA_STEPS = 12;
  var lineBuckets = [];
  for (var bk = 0; bk < ALPHA_STEPS; bk++) lineBuckets.push([]);
  var BUCKET_STYLE = lineBuckets.map(function (_, j) {
    /* 淡：0.045～0.105，線越短越清楚（網格像活的一樣呼吸） */
    return 'rgba(20,179,145,' + (0.105 - 0.06 * (j + 0.5) / ALPHA_STEPS).toFixed(3) + ')';
  });
  var xs = [], ys = [];

  function mesh(t) {
    var cols = Math.ceil(W / 150) + 1;
    var n = pts.length, i, j, k, p, q, d;
    for (i = 0; i < n; i++) { p = pos(pts[i], t); xs[i] = p.x; ys[i] = p.y; }
    for (j = 0; j < ALPHA_STEPS; j++) lineBuckets[j].length = 0;

    for (i = 0; i < n; i++) {
      p = pts[i];
      var right = p.c + 1 < cols, down = i + cols < n;
      var nb = [right ? i + 1 : -1,                      /* 右 */
                down ? i + cols : -1,                    /* 下 */
                right && down ? i + cols + 1 : -1];      /* 右下（產生三角形） */
      for (k = 0; k < 3; k++) {
        q = nb[k];
        if (q < 0) continue;
        d = Math.hypot(xs[i] - xs[q], ys[i] - ys[q]);
        j = Math.min(ALPHA_STEPS - 1, (Math.min(1, d / 220) * ALPHA_STEPS) | 0);
        lineBuckets[j].push(i, q);
      }
    }
    ctx.lineWidth = 1;
    for (j = 0; j < ALPHA_STEPS; j++) {
      var bucket = lineBuckets[j];
      if (!bucket.length) continue;
      ctx.strokeStyle = BUCKET_STYLE[j];
      ctx.beginPath();
      for (k = 0; k < bucket.length; k += 2) {
        ctx.moveTo(xs[bucket[k]], ys[bucket[k]]);
        ctx.lineTo(xs[bucket[k + 1]], ys[bucket[k + 1]]);
      }
      ctx.stroke();
    }

    /* 網點：更大膽幾顆螢光（定錨視覺） */
    for (var bright = 0; bright < 2; bright++) {
      ctx.fillStyle = bright ? 'rgba(160,232,96,0.30)' : 'rgba(20,179,145,0.16)';
      var r = bright ? 2.1 : 1.3;
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        if ((i % 7 === 0) !== !!bright) continue;
        ctx.moveTo(xs[i] + r, ys[i]);
        ctx.arc(xs[i], ys[i], r, 0, 7);
      }
      ctx.fill();
    }
  }

  /* DNA 雙螺旋帶：斜跨版面；位置／數量依頁面路徑 hash——每頁不 identically */
  function pathSeed() {
    var s = (location.pathname || '/') + '|nexus';
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  var SEED = pathSeed();
  function dna(t) {
    var band = 120, phase = reduce ? 0 : t * 0.00035;
    /* 依 seed 決定帶數（1–2 條）與起點（右半／左半都有機會） */
    var bands = (SEED % 3 === 0) ? 2 : 1;
    var xs = [0.82, 0.16];
    var rot = [0.22, -0.17];
    var bi, b;
    for (bi = 0; bi < bands; bi++) {
      b = bi === 0 ? SEED % 2 : (SEED >> 2) % 2;   /* 0=右 1=左（兩條則左右各一） */
      var x0 = W * (bands === 2 ? xs[bi] : xs[b]);
      var y0 = -60, slope = H + 120;
      ctx.save();
      ctx.translate(x0, 0);
      ctx.rotate(bands === 2 ? rot[bi] : rot[b]);
      var i, y, sw;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(20,179,145,0.10)';
      ctx.beginPath();
      for (y = y0; y < slope; y += 6) {
        var xx = Math.sin(y / band + phase) * 34;
        if (y === y0) ctx.moveTo(xx, y); else ctx.lineTo(xx, y);
      }
      ctx.stroke();
      ctx.beginPath();
      for (y = y0; y < slope; y += 6) {
        var xx2 = Math.sin(y / band + phase + Math.PI) * 34;
        if (y === y0) ctx.moveTo(xx2, y); else ctx.lineTo(xx2, y);
      }
      ctx.stroke();
      /* 鹼基橫桿：只在兩股交會附近成對出現 */
      for (y = y0; y < slope; y += 26) {
        var s1 = Math.sin(y / band + phase) * 34;
        var s2 = Math.sin(y / band + phase + Math.PI) * 34;
        sw = Math.abs(s1 - s2);
        if (sw < 14) continue;
        ctx.strokeStyle = 'rgba(160,232,96,0.085)';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(s1, y); ctx.lineTo(s2, y); ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* 不定時跳點：每 8–14 秒挑 6 顆節點跳向新抖動位置（形狀自己變換） */
  function scheduleMorph() {
    if (reduce) return;
    clearTimeout(morphTimer);
    morphTimer = setTimeout(function () {
      if (!document.hidden) {
        for (var k = 0; k < 6 && pts.length; k++) {
          var p = pts[(Math.random() * pts.length) | 0];
          var cell = 150;
          p.hx = (p.c + (Math.random() - 0.5) * 0.76) * cell;
          p.hy = (p.r + (Math.random() - 0.5) * 0.76) * cell;
          p.ax = 6 + Math.random() * 14; p.ay = 6 + Math.random() * 14;
        }
      }
      scheduleMorph();
    }, 8000 + Math.random() * 6000);
  }

  function paint(t) {
    ctx.clearRect(0, 0, W, H);
    if (!darkNow()) return;            /* 淺色模式：底圖收起，還原紙白 */
    mesh(t); dna(t);
  }

  /* 節點每秒只漂幾個像素，30fps 跟 60fps 看不出差別，但重畫成本減半，
     把主執行緒留給捲動與頁面上其他動畫 */
  var FRAME_MS = 1000 / 20, lastPaint = 0;     /* 節點每秒只漂幾像素，20fps 看不出差別 */
  function frame(t) {
    if (!running) { rafId = null; return; }
    rafId = requestAnimationFrame(frame);
    if (t - lastPaint < FRAME_MS - 2) return;
    lastPaint = t;
    paint(t);
  }

  function start() { if (!rafId && !reduce && running) rafId = requestAnimationFrame(frame); }
  function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  function init() { size(); seed(); paint(0); if (!reduce && darkNow()) { running = true; start(); scheduleMorph(); } }

  if ('IntersectionObserver' in window) {
    /* 頁面本身就看得到，等首屏再啟動即可 */
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      init(); io.disconnect();
    }, { threshold: 0 });
    io.observe(canvas);
  } else { init(); }

  /* 導覽列深淺色切換：即時啟停＋淡入淡出 */
  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      canvas.style.opacity = darkNow() ? '1' : '0';
      if (darkNow()) { paint(performance.now()); if (!reduce) { running = true; start(); scheduleMorph(); } }
      else { running = false; stop(); clearTimeout(morphTimer); ctx.clearRect(0, 0, W, H); }
    }).observe(rootEl, { attributes: true, attributeFilter: ['data-theme'] });
    canvas.style.opacity = darkNow() ? '1' : '0';
  }

  var rsT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () { size(); seed(); paint(0); }, 220);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); clearTimeout(morphTimer); }
    else { running = true; start(); scheduleMorph(); }
  });
})();
