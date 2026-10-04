/* ============================================================
   HOME.JS — 首頁專屬：分子粒子 hero（Canvas 2D）
   - 氟光分子在培養皿中遊動，滑鼠靠近會排斥＋牽連出鍵結線
   - 分頁不可見時暫停（rAF 停）
   - prefers-reduced-motion / 無 canvas → 靜態漸層背景（CSS 已有）
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('rxHeroCanvas');
  var stage = document.getElementById('rxHeroStage');
  if (!canvas || !canvas.getContext) return;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) return;  /* 留 CSS 漸層做靜態封面 */

  var ctx = canvas.getContext('2d');
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0, particles = [], mouse = { x: -9999, y: -9999, on: false };
  var running = true, rafId = null;

  var PALETTE = ['#a0e860', '#14b391', '#49c5b6', '#d8b26a', '#d7f5b8'];

  function size() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function seed() {
    particles = [];
    var n = Math.max(36, Math.min(86, Math.round(W * H / 26000)));
    for (var i = 0; i < n; i++) {
      var big = Math.random() < 0.18;
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: big ? 3.4 + Math.random() * 2.2 : 1.2 + Math.random() * 1.4,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
        pulse: Math.random() * Math.PI * 2,
        big: big
      });
    }
  }

  function frame(t) {
    if (!running) { rafId = null; return; }
    rafId = requestAnimationFrame(frame);
    ctx.clearRect(0, 0, W, H);

    var i, j, p, q, dx, dy, d2;
    /* 連線：近邻鍵結 */
    ctx.lineWidth = 1;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        dx = p.x - q.x; dy = p.y - q.y; d2 = dx * dx + dy * dy;
        if (d2 < 15000) {
          var a = (1 - d2 / 15000) * 0.34;
          ctx.strokeStyle = 'rgba(20,179,145,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      /* 滑鼠：牽連 + 輕排斥 */
      if (mouse.on) {
        dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 22000) {
          var d = Math.sqrt(d2) || 1, f = (1 - d / 148) * 0.05;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
          ctx.strokeStyle = 'rgba(160,232,96,' + (0.5 * (1 - d / 148)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    /* 遊走 + 阻尼 + 音符呼吸 */
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx + Math.sin((t / 2600) + p.pulse) * 0.12;
      p.y += p.vy + Math.cos((t / 3100) + p.pulse) * 0.12;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;

      var rr = p.big ? p.r + Math.sin(t / 700 + p.pulse) * 0.7 : p.r;
      if (p.big) {
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 3.4);
        g.addColorStop(0, 'rgba(160,232,96,0.30)');
        g.addColorStop(1, 'rgba(160,232,96,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr * 3.4, 0, 7); ctx.fill();
      }
      ctx.fillStyle = p.c;
      ctx.globalAlpha = p.big ? 0.95 : 0.7;
      ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function start() { if (!rafId) rafId = requestAnimationFrame(frame); }
  function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  var rootTheme = document.documentElement.getAttribute('data-theme');
  function paint() {
    /* 深淺色：亮色下画布節點減淡，以免在深綠 hero 上過亮刺眼 */
    canvas.style.opacity = (rootTheme === 'light') ? '0.55' : '0.9';
  }

  size(); seed(); paint(); start();

  canvas.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
  });
  canvas.addEventListener('pointerleave', function () { mouse.on = false; mouse.x = mouse.y = -9999; });

  var rsT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () { size(); seed(); }, 180);
  });

  /* 分頁不可见 → 暂停；回來 → 重啟 */
  document.addEventListener('visibilitychange', function () {
    rootTheme = document.documentElement.getAttribute('data-theme');
    paint();
    if (document.hidden) stop(); else start();
  });

  /* 主题切換時同步亮度 */
  new MutationObserver(function () {
    rootTheme = document.documentElement.getAttribute('data-theme');
    paint();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
