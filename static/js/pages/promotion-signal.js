(function () {
  'use strict';
  var box = document.querySelector('.promo-signal');
  var canvas = box && box.querySelector('.promo-signal-canvas');
  if (!canvas || !canvas.getContext) return;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var ctx = canvas.getContext('2d');
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0, particles = [], rings = [];
  var mouse = { x: -9999, y: -9999, on: false };
  var rafId = null, visible = true, lastWave = 0;
  var PALETTE = ['#a0e860', '#14b391', '#49c5b6', '#d8b26a', '#d7f5b8'];
  var WAVE_EVERY = 3200;
  var WAVE_SPEED = 0.085;
  var BAND = 26;

  function size() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function seed() {
    particles = [];
    var n = Math.max(30, Math.min(80, Math.round(W * H / 14000)));
    for (var i = 0; i < n; i++) {
      var big = Math.random() < 0.16;
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: big ? 3 + Math.random() * 2 : 1.1 + Math.random() * 1.3,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
        pulse: Math.random() * Math.PI * 2,
        big: big
      });
    }
  }

  function hub() {
    var h = box.querySelector('.promo-hub img') || box.querySelector('.promo-hub');
    var b = box.getBoundingClientRect(), r = h.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
  }

  function addRing(x, y, max, t) { rings.push({ x: x, y: y, max: max, t0: t }); }

  var STEP = 0.01;
  function buckets(rgb, maxAlpha) {
    var n = Math.ceil(maxAlpha / STEP), b = { style: [], lines: [] };
    for (var k = 0; k < n; k++) {
      b.style.push('rgba(' + rgb + ',' + ((k + 0.5) * STEP).toFixed(3) + ')');
      b.lines.push([]);
    }
    return b;
  }
  var BONDS = buckets('20,179,145', 0.3);
  var POINTER = buckets('160,232,96', 0.5);
  function addLine(b, alpha, x1, y1, x2, y2) {
    if (alpha <= 0) return;
    b.lines[Math.min(b.lines.length - 1, (alpha / STEP) | 0)].push(x1, y1, x2, y2);
  }
  function strokeAll(b) {
    for (var k = 0; k < b.lines.length; k++) {
      var l = b.lines[k];
      if (!l.length) continue;
      ctx.strokeStyle = b.style[k];
      ctx.beginPath();
      for (var m = 0; m < l.length; m += 4) { ctx.moveTo(l[m], l[m + 1]); ctx.lineTo(l[m + 2], l[m + 3]); }
      ctx.stroke();
      l.length = 0;
    }
  }

  function draw(t) {
    var i, j, p, q, dx, dy, d2;
    ctx.clearRect(0, 0, W, H);

    if (!reduce && t - lastWave > WAVE_EVERY) {
      var h = hub();
      addRing(h.x, h.y, Math.hypot(W, H) * 0.6, t);
      lastWave = t;
    }
    rings = rings.filter(function (r) { return Math.max(0, t - r.t0) * WAVE_SPEED < r.max; });

    ctx.lineWidth = 1;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        dx = p.x - q.x; dy = p.y - q.y; d2 = dx * dx + dy * dy;
        if (d2 < 15000) addLine(BONDS, (1 - d2 / 15000) * 0.3, p.x, p.y, q.x, q.y);
      }
      if (mouse.on) {
        dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 22000) {
          var d = Math.sqrt(d2) || 1, f = (1 - d / 148) * 0.05;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
          addLine(POINTER, 0.5 * (1 - d / 148), p.x, p.y, mouse.x, mouse.y);
        }
      }
    }
    strokeAll(BONDS);
    strokeAll(POINTER);

    for (i = 0; i < rings.length; i++) {
      var rg = rings[i], rad = Math.max(0, t - rg.t0) * WAVE_SPEED, fade = 1 - rad / rg.max;
      ctx.strokeStyle = 'rgba(184,245,126,' + (0.42 * fade).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(rg.x, rg.y, rad, 0, 7); ctx.stroke();
    }

    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      if (!reduce) {
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx + Math.sin((t / 2600) + p.pulse) * 0.12;
        p.y += p.vy + Math.cos((t / 3100) + p.pulse) * 0.12;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
      }

      var lit = 0;
      for (j = 0; j < rings.length; j++) {
        var rr0 = Math.max(0, t - rings[j].t0) * WAVE_SPEED;
        var dist = Math.abs(Math.hypot(p.x - rings[j].x, p.y - rings[j].y) - rr0);
        if (dist < BAND) lit = Math.max(lit, (1 - dist / BAND) * (1 - rr0 / rings[j].max));
      }

      var rr = p.big ? p.r + Math.sin(t / 700 + p.pulse) * 0.6 : p.r;
      if (p.big || lit > 0.05) {
        var glow = rr * (p.big ? 3.2 : 4) * (1 + lit);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
        g.addColorStop(0, 'rgba(160,232,96,' + (0.28 + 0.5 * lit).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(160,232,96,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, glow, 0, 7); ctx.fill();
      }
      ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.min(1, (p.big ? 0.95 : 0.7) + lit * 0.3);
      ctx.beginPath(); ctx.arc(p.x, p.y, rr * (1 + lit * 0.6), 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function frame(t) {
    rafId = requestAnimationFrame(frame);
    draw(t);
  }
  function start() { if (!rafId && !reduce && visible && !document.hidden) rafId = requestAnimationFrame(frame); }
  function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  size(); seed();
  if (reduce) draw(0); else start();

  box.querySelectorAll('.promo-node a').forEach(function (a) {
    function pulse() {
      if (reduce) return;
      var d = a.querySelector('.promo-disc').getBoundingClientRect(), b = box.getBoundingClientRect();
      addRing(d.left - b.left + d.width / 2, d.top - b.top + d.height / 2, 190, performance.now());
    }
    a.addEventListener('pointerenter', pulse);
    a.addEventListener('focus', pulse);
  });

  box.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
  });
  box.addEventListener('pointerleave', function () { mouse.on = false; mouse.x = mouse.y = -9999; });

  var rsT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () { size(); seed(); if (reduce) draw(0); }, 180);
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { rootMargin: '80px 0px' }).observe(box);
  }
})();
