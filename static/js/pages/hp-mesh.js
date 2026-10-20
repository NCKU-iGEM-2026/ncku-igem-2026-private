(function () {
  'use strict';
  if (window.__hpMeshMounted) return;
  window.__hpMeshMounted = true;
  var body = document.body;
  var rootEl = document.documentElement;
  var exclude = /(^|\s)(engineering-page|board-game-page)(\s|$)/.test(body.className);
  if (exclude) return;
  function darkNow () { return rootEl.getAttribute('data-theme') !== 'light'; }

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var canvas = document.createElement('canvas');
  canvas.className = 'hp-mesh';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;width:100%;height:100%;pointer-events:none;display:block;opacity:0;transition:opacity 0.6s ease';
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var DPR = 1;
  var W = 0, H = 0;
  var pts = [];
  var rafId = null, running = false;
  var morphTimer = null;

  function size() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function seed() {
    pts = [];
    var cell = 150;
    var cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        pts.push({
          hx: (c + (Math.random() - 0.5) * 0.76) * cell,
          hy: (r + (Math.random() - 0.5) * 0.76) * cell,
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

  var ALPHA_STEPS = 12;
  var lineBuckets = [];
  for (var bk = 0; bk < ALPHA_STEPS; bk++) lineBuckets.push([]);
  var BUCKET_STYLE = lineBuckets.map(function (_, j) {
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
      var nb = [right ? i + 1 : -1,
                down ? i + cols : -1,
                right && down ? i + cols + 1 : -1];
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

  function pathSeed() {
    var s = (location.pathname || '/') + '|nexus';
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  var SEED = pathSeed();
  function dna(t) {
    var band = 120, phase = reduce ? 0 : t * 0.00035;
    var bands = (SEED % 3 === 0) ? 2 : 1;
    var xs = [0.82, 0.16];
    var rot = [0.22, -0.17];
    var bi, b;
    for (bi = 0; bi < bands; bi++) {
      b = bi === 0 ? SEED % 2 : (SEED >> 2) % 2;
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
    if (!darkNow()) return;
    mesh(t); dna(t);
  }

  var FRAME_MS = 1000 / 20, sleep = null;
  function frame(t) {
    rafId = null;
    if (!running) return;
    paint(t);
    sleep = setTimeout(function () {
      sleep = null;
      if (running) rafId = requestAnimationFrame(frame);
    }, FRAME_MS - 8);
  }

  var scrolling = false, scrollT = null;
  function start() { if (!rafId && !sleep && !reduce && running && !scrolling) rafId = requestAnimationFrame(frame); }
  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (sleep) { clearTimeout(sleep); sleep = null; }
  }

  function init() { size(); seed(); paint(0); if (!reduce && darkNow()) { running = true; start(); scheduleMorph(); } }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      init(); io.disconnect();
    }, { threshold: 0 });
    io.observe(canvas);
  } else { init(); }

  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      canvas.style.opacity = darkNow() ? '1' : '0';
      if (darkNow()) { paint(performance.now()); if (!reduce) { running = true; start(); scheduleMorph(); } }
      else { running = false; stop(); clearTimeout(morphTimer); ctx.clearRect(0, 0, W, H); }
    }).observe(rootEl, { attributes: true, attributeFilter: ['data-theme'] });
    canvas.style.opacity = darkNow() ? '1' : '0';
  }

  window.addEventListener('scroll', function () {
    if (!scrolling) { scrolling = true; stop(); }
    clearTimeout(scrollT);
    scrollT = setTimeout(function () { scrolling = false; start(); }, 150);
  }, { passive: true });

  var rsT = null, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () {
      var reseed = window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 120;
      size();
      if (reseed) { seed(); lastW = W; lastH = H; }
      paint(performance.now());
    }, 220);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); clearTimeout(morphTimer); }
    else { running = true; start(); scheduleMorph(); }
  });
})();
