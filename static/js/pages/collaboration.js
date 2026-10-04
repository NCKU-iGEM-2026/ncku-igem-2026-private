/* ============================================================
   COLLABORATION — 方皿分子網絡引擎 v2
   使用者回饋照辦：位置固定不晃、連線做首頁底色那套分子動畫。
   - Canvas（方盤內、節點下）：慢速浮游粒子＋近鄰鍵結線
     ＋六節點間固定鍵結線，線上跑動螢光電子（科技感）
   - 游標進入盤面：附近粒子被牽引、連出螢光線（互動感）
   - 節點本身零位移；只有環形脈衝與 hover 光（CSS 負責）
   - 分頁不可見暫停；reduced-motion 只画一次靜態鍵結
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
  var nodes = [];
  var mouse = { x: -9999, y: -9999, on: false };
  var rafId = null, running = false;

  var PALETTE = ['#a0e860', '#14b391', '#49c5b6', '#d8b26a', '#d7f5b8'];

  function size() {
    var r = stage.getBoundingClientRect();
    W = Math.max(80, r.width); H = Math.max(80, r.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* 節點錨點：讀各 .rx-node 的 --nx/--ny（%，與盤面同基） */
  function nodeAnchors() {
    nodes = [];
    stage.querySelectorAll('.rx-node').forEach(function (el) {
      var st = getComputedStyle(el);
      var nx = parseFloat(st.getPropertyValue('--nx')) / 100;
      var ny = parseFloat(st.getPropertyValue('--ny')) / 100;
      if (isFinite(nx) && isFinite(ny)) nodes.push({ nx: nx, ny: ny });
    });
  }

  /* 粒子：慢速浮游（速度約首頁的 1/3，盤面才安穩） */
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

  /* 固定鍵結：六節點彼此連線，距離越近線越實（結構感） */
  function nodeLines() {
    var i, j, a, b, dx, dy, d;
    ctx.lineWidth = 1.2;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = (a.nx - b.nx) * W; dy = (a.ny - b.ny) * H;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < W * 0.55) {
          var al = 0.18 * (1 - d / (W * 0.55)) + 0.05;
          ctx.strokeStyle = 'rgba(20,179,145,' + al.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.nx * W, a.ny * H);
          ctx.lineTo(b.nx * W, b.ny * H);
          ctx.stroke();
        }
      }
    }
  }

  /* 螢光電子：沿六邊形相鄰鍵結循環跑（科技感心跳） */
  var electronPairs = [[0,1],[1,2],[2,4],[4,5],[5,3],[3,0]];
  function electrons(t) {
    var span = 5600;
    for (var k = 0; k < electronPairs.length; k++) {
      var A = nodes[electronPairs[k][0]], B = nodes[electronPairs[k][1]];
      if (!A || !B) continue;
      var ph = ((t / span) + k / electronPairs.length) % 1;
      var ex = (A.nx + (B.nx - A.nx) * ph) * W;
      var ey = (A.ny + (B.ny - A.ny) * ph) * H;
      var g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 9);
      g.addColorStop(0, 'rgba(160,232,96,0.9)');
      g.addColorStop(1, 'rgba(160,232,96,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8ffaa';
      ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, 7); ctx.fill();
    }
  }

  /* 粒子鍵結線（首頁同款：近鄰連線＋游標牽線） */
  function links() {
    var i, j, p, q, dx, dy, d2;
    ctx.lineWidth = 1;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        dx = p.x - q.x; dy = p.y - q.y; d2 = dx * dx + dy * dy;
        if (d2 < 11000) {
          ctx.strokeStyle = 'rgba(20,179,145,' + ((1 - d2 / 11000) * 0.22).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      if (mouse.on) {
        dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 18000) {
          ctx.strokeStyle = 'rgba(160,232,96,' + (0.42 * (1 - Math.sqrt(d2) / 134)).toFixed(3) + ')';
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

  /* reduced-motion：只畫一次靜態鍵結 */
  function still() {
    ctx.clearRect(0, 0, W, H);
    nodeLines(); links(); dots();
  }

  function frame(t) {
    if (!running) { rafId = null; return; }
    rafId = requestAnimationFrame(frame);
    var i, p;
    ctx.clearRect(0, 0, W, H);
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      p.x += p.vx + Math.sin(t / 3400 + p.pulse) * 0.05;
      p.y += p.vy + Math.cos(t / 4100 + p.pulse) * 0.05;
      if (mouse.on) {
        var dx = mouse.x - p.x, dy = mouse.y - p.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 18000 && d2 > 1) {
          p.vx += dx * 0.00012; p.vy += dy * 0.00012;
        }
      }
      p.vx *= 0.992; p.vy *= 0.992;
      if (p.x < -6) p.x = W + 6; if (p.x > W + 6) p.x = -6;
      if (p.y < -6) p.y = H + 6; if (p.y > H + 6) p.y = -6;
      p.pulse += 0.02;
    }
    nodeLines(); links(); dots(); electrons(t);
  }

  function start() { if (!rafId && !reduce && running) rafId = requestAnimationFrame(frame); }
  function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  function init() {
    size(); nodeAnchors(); seed();
    if (reduce) { still(); return; }
    running = true; start();
  }

  /* 進場：整皿浮現（CSS 靠 .rx-in）＋啟動畫布 */
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
    rsT = setTimeout(function () { size(); nodeAnchors(); seed(); if (reduce) still(); }, 200);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else { running = true; start(); }
  });
})();
