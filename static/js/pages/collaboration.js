/* ============================================================
   COLLABORATION — 方皿分子網絡 v3（nexus 色系）
   - Canvas：慢速浮游粒子＋近鄰鍵結線＋六節點固定鍵結＋跑動螢光電子
   - 節點可拖曳：pointer 捕獲、即時更新 --nx/--ny，連線即時跟隨
   - 不定時重組：每 9–16 秒隨機挑兩隊交換位置（CSS 彈跳曲線）
   - 色板改用 --nx-*（mint/lime，與 Hardware 同族）
   - 分頁不可見暫停；reduced-motion：靜態鍵結、不拖不自動換位
   ============================================================ */
(function () {
  'use strict';
  var stage = document.querySelector('.rx-dish-stage');
  var canvas = stage && stage.querySelector('.rx-dish-canvas');
  if (!canvas || !canvas.getContext) return;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var ctx = canvas.getContext('2d');
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0;
  var particles = [];
  var nodeEls = [];
  var mouse = { x: -9999, y: -9999, on: false };
  var rafId = null, running = false;
  var dragging = null;          /* { el, nx, ny, moved, offX, offY } */
  var swapTimer = null;

  var PALETTE = ['#a0e860', '#49c5b6', '#5fb3e0', '#e6b060', '#dbe9ee'];
  var LINE = 'rgba(73,197,182,';      /* mint */
  var LIME = 'rgba(160,232,96,';      /* lime */

  function size() {
    var r = stage.getBoundingClientRect();
    W = Math.max(80, r.width); H = Math.max(80, r.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* 節點錨點：每帧从 DOM 讀實際位置（拖曳／換位即時跟隨）。
     .rx-node 有 translate(-50%,-50%)：盤面視覺中心 = (offsetLeft, offsetTop)
     再補算 disc 視覺中心 y（節點含名字標籤、disc 置頂）。 */
  function readAnchors() {
    var out = [];
    for (var i = 0; i < nodeEls.length; i++) {
      var el = nodeEls[i];
      var disc = el.querySelector('.rx-node-disc');
      var cx = el.offsetLeft;
      var cy = el.offsetTop - (el.offsetHeight - disc.offsetHeight) / 2;
      out.push({ x: cx, y: cy });
    }
    return out;
  }

  function seed() {
    particles = [];
    var n = Math.round(Math.min(72, Math.max(34, W * H / 5200)));
    for (var i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.1,
        r: 1 + Math.random() * 1.5,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  /* 固定鍵結：六節點彼此連線（依當前實際位置） */
  function nodeLines(a) {
    var i, j, dx, dy, d;
    ctx.lineWidth = 1.2;
    for (i = 0; i < a.length; i++) {
      for (j = i + 1; j < a.length; j++) {
        dx = a[i].x - a[j].x; dy = a[i].y - a[j].y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < W * 0.55) {
          ctx.strokeStyle = LINE + (0.18 * (1 - d / (W * 0.55)) + 0.05).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a[i].x, a[i].y);
          ctx.lineTo(a[j].x, a[j].y);
          ctx.stroke();
        }
      }
    }
  }

  /* 螢光電子：沿六邊形相鄰鍵結循環跑 */
  var electronPairs = [[0,1],[1,2],[2,4],[4,5],[5,3],[3,0]];
  function electrons(t, a) {
    var span = 5600;
    for (var k = 0; k < electronPairs.length; k++) {
      var A = a[electronPairs[k][0]], B = a[electronPairs[k][1]];
      if (!A || !B) continue;
      var ph = ((t / span) + k / electronPairs.length) % 1;
      var ex = A.x + (B.x - A.x) * ph;
      var ey = A.y + (B.y - A.y) * ph;
      var g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 9);
      g.addColorStop(0, LIME + '0.9)');
      g.addColorStop(1, LIME + '0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8ffaa';
      ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, 7); ctx.fill();
    }
  }

  function links() {
    var i, j, p, q, dx, dy, d2;
    ctx.lineWidth = 1;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        dx = p.x - q.x; dy = p.y - q.y; d2 = dx * dx + dy * dy;
        if (d2 < 11000) {
          ctx.strokeStyle = LINE + ((1 - d2 / 11000) * 0.22).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      if (mouse.on) {
        dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 18000) {
          ctx.strokeStyle = LIME + (0.42 * (1 - Math.sqrt(d2) / 134)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
  }

  function dots() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = 0.5 + Math.sin(p.pulse) * 0.18;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paint(t) {
    var a = readAnchors();
    ctx.clearRect(0, 0, W, H);
    nodeLines(a); links(); dots();
    if (!reduce) electrons(t || 0, a);
  }

  function frame(t) {
    if (!running) { rafId = null; return; }
    rafId = requestAnimationFrame(frame);
    var i, p;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      p.x += p.vx + Math.sin(t / 3400 + p.pulse) * 0.05;
      p.y += p.vy + Math.cos(t / 4100 + p.pulse) * 0.05;
      if (mouse.on) {
        var dx = mouse.x - p.x, dy = mouse.y - p.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 18000 && d2 > 1) { p.vx += dx * 0.00012; p.vy += dy * 0.00012; }
      }
      p.vx *= 0.992; p.vy *= 0.992;
      if (p.x < -6) p.x = W + 6; if (p.x > W + 6) p.x = -6;
      if (p.y < -6) p.y = H + 6; if (p.y > H + 6) p.y = -6;
      p.pulse += 0.02;
    }
    paint(t);
  }

  function start() { if (!rafId && !reduce && running) rafId = requestAnimationFrame(frame); }
  function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  /* ---- 拖曳重組 ---- */
  function clampPct(v) { return Math.max(9, Math.min(91, v)); }

  stage.querySelectorAll('.rx-node').forEach(function (el) {
    el.addEventListener('pointerdown', function (e) {
      if (reduce) return;
      if (e.button && e.button !== 0) return;
      dragging = { el: el, startX: e.clientX, startY: e.clientY, moved: false };
      el.classList.add('rx-dragging');
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      pauseSwap();
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging || dragging.el !== el) return;
      var dx = e.clientX - dragging.startX, dy = e.clientY - dragging.startY;
      if (!dragging.moved && (dx * dx + dy * dy) < 25) return; /* 5px 以內還算點擊 */
      dragging.moved = true;
      var r = stage.getBoundingClientRect();
      el.style.setProperty('--nx', clampPct((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
      el.style.setProperty('--ny', clampPct((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
    });
    function end(e) {
      if (!dragging || dragging.el !== el) return;
      el.classList.remove('rx-dragging');
      var moved = dragging.moved;
      dragging = null;
      resumeSwap();
      if (moved) {
        /* 拖曳後 banh 掉這一下點擊導航 */
        el.addEventListener('click', function sup(ev) {
          ev.preventDefault();
          el.removeEventListener('click', sup, true);
        }, true);
      }
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  });

  /* ---- 不定時自動換位重組 ---- */
  function scheduleSwap() {
    if (reduce) return;
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      if (!document.hidden && !dragging) doSwap();
      scheduleSwap();
    }, 9000 + Math.random() * 7000);
  }
  function pauseSwap() { clearTimeout(swapTimer); }
  function resumeSwap() { scheduleSwap(); }

  function doSwap() {
    var nodes = stage.querySelectorAll('.rx-node');
    if (nodes.length < 2) return;
    var i = (Math.random() * nodes.length) | 0;
    var j = (Math.random() * (nodes.length - 1)) | 0;
    if (j >= i) j++;
    var a = nodes[i], b = nodes[j];
    var anx = a.style.getPropertyValue('--nx'), any = a.style.getPropertyValue('--ny');
    a.classList.add('rx-swap'); b.classList.add('rx-swap');
    a.style.setProperty('--nx', b.style.getPropertyValue('--nx'));
    a.style.setProperty('--ny', b.style.getPropertyValue('--ny'));
    b.style.setProperty('--nx', anx);
    b.style.setProperty('--ny', any);
    setTimeout(function () {
      a.classList.remove('rx-swap'); b.classList.remove('rx-swap');
    }, 1700);
  }

  function init() {
    nodeEls = Array.prototype.slice.call(stage.querySelectorAll('.rx-node'));
    size(); seed(); paint(0);
    if (reduce) return;
    running = true; start();
    scheduleSwap();
  }

  /* 進場：整皿浮現＋啟動 */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        stage.classList.add('rx-in');
        init();
        io.disconnect();
      });
    }, { threshold: 0.18 });
    io.observe(stage);
  } else {
    stage.classList.add('rx-in');
    init();
  }

  stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
  });
  stage.addEventListener('pointerleave', function () { mouse.on = false; mouse.x = mouse.y = -9999; });

  var rsT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () { size(); seed(); paint(0); }, 200);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); pauseSwap(); }
    else { running = true; start(); resumeSwap(); }
  });
})();
