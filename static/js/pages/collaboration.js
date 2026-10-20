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
  var mouse = { x: -9999, y: -9999, on: false };
  var rafId = null, running = false, lastT = 0, lastMeasure = 0;
  var spin = 0;

  var SPIN_RATE = Math.PI * 2 / 110000;
  var EASE_STEP = 0.016;
  var DRAG_KILL = 0.9;

  var PALETTE = ['#a0e860', '#14b391', '#2edbb4', '#d8b26a', '#d7f5b8'];
  var LINE = 'rgba(20,179,145,';
  var LIME = 'rgba(160,232,96,';

  var nodes = [];

  function pct(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  function buildNodes() {
    nodes = [];
    stage.querySelectorAll('.rx-node').forEach(function (el) {
      var nx = pct(el.style.getPropertyValue('--nx'), 50);
      var ny = pct(el.style.getPropertyValue('--ny'), 50);
      var dx = nx - 50, dy = ny - 50;
      nodes.push({
        el: el,
        r: Math.sqrt(dx * dx + dy * dy),
        phi: Math.atan2(dy, dx),
        swayR: 0.10 + Math.random() * 0.08,
        fR: 0.00006 + Math.random() * 0.00009,
        phR: Math.random() * Math.PI * 2,
        swayP: (0.24 + Math.random() * 0.16),
        fP: 0.00005 + Math.random() * 0.00008,
        phP: Math.random() * Math.PI * 2,
        x: nx, y: ny,
        homeX: nx, homeY: ny,
        ang: Math.atan2(dy, dx),
        drag: false,
        homing: false
      });
    });
  }

  function clockOrder() {
    var idx = [];
    for (var i = 0; i < nodes.length; i++) idx.push(i);
    idx.sort(function (a, b) { return nodes[a].ang - nodes[b].ang; });
    return idx;
  }

  function size() {
    W = Math.max(80, stage.clientWidth); H = Math.max(80, stage.clientHeight);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
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

  function discCenter(n) {
    var extra;
    if (n.h != null) extra = (n.h - (n.discH || 0)) / 2;
    else {
      var disc = n.el.querySelector('.rx-node-disc');
      extra = (n.el.offsetHeight - (disc ? disc.offsetHeight : 0)) / 2;
    }
    return { x: n.x / 100 * W, y: n.y / 100 * H - extra };
  }

  function place(n) {
    n.el.style.transform = 'translate3d(' + (n.x / 100 * W).toFixed(1) + 'px,' +
                           (n.y / 100 * H).toFixed(1) + 'px,0) translate(-50%,-50%)';
  }

  function measureAll() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var disc = n.el.querySelector('.rx-node-disc');
      n.w = n.el.offsetWidth || 90;
      n.h = n.el.offsetHeight || 90;
      n.discW = (disc && disc.offsetWidth) || 80;
      n.discH = (disc && disc.offsetHeight) || 80;
      n.hx = (n.w / 2 + 4) / W * 100;
      n.hy = (n.h / 2 + 4) / H * 100;
    }
  }
  function clampNode(n) {
    n.x = Math.max(n.hx, Math.min(100 - n.hx, n.x));
    n.y = Math.max(n.hy, Math.min(100 - n.hy, n.y));
  }

  function setMag(n, on) {
    if (!!n.locked === !!on) return;
    n.locked = !!on;
    n.el.classList.toggle('rx-magnet', !!on);
  }
  function magnetPass() {
    var i, n, dx, dy, rx, ry, d, dp, R, best = -1, bestD = 1e9;
    if (!mouse.on) {
      for (i = 0; i < nodes.length; i++) setMag(nodes[i], false);
      return;
    }
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n.drag || !n.hx) { if (n.drag) setMag(n, false); continue; }
      dx = mouse.x - n.x / 100 * W; dy = mouse.y - n.y / 100 * H;
      rx = n.w / 2 + 10; ry = n.h / 2 + 10;
      d = Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
      if (n.locked) {
        if (d > 1.55) setMag(n, false);
        continue;
      }
      if (d <= 1) { setMag(n, true); continue; }
      R = (n.discW || 80) / 2 + 130;
      dp = Math.sqrt(dx * dx + dy * dy);
      if (dp < R && dp < bestD) { bestD = dp; best = i; }
    }
    if (best >= 0) {
      n = nodes[best];
      R = (n.discW || 80) / 2 + 130;
      dx = mouse.x - n.x / 100 * W; dy = mouse.y - n.y / 100 * H;
      var k = 0.20 * Math.pow(1 - bestD / R, 1.25) * 0.3;
      n.x += (dx / W) * 100 * k;
      n.y += (dy / H) * 100 * k;
    }
  }

  function separate() {
    var i, j, a, b, dx, dy, rx, ry, d, ov, sx, sy;
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        a = nodes[i]; b = nodes[j];
        if (!a.hx || !b.hx) continue;
        dx = (b.x - a.x) / 100 * W;
        dy = (b.y - a.y) / 100 * H;
        rx = (a.discW + b.discW) / 2 + Math.max(30, Math.min(90, (a.w + b.w) / 4));
        ry = (a.discH + b.discH) / 2 + 26;
        d = Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
        if (d >= 1) continue;
        if (d < 0.0001) { dx = rx * 0.5; dy = 1; d = 0.5; }
        ov = 1 - d;
        sx = (dx / rx) / d * ov * rx / W * 100;
        sy = (dy / ry) / d * ov * ry / H * 100;
        if ((a.drag || a.locked) && (b.drag || b.locked)) continue;
        if (a.drag || a.locked)   { b.x += sx * 0.16; b.y += sy * 0.16; }
        else if (b.drag || b.locked) { a.x -= sx * 0.16; a.y -= sy * 0.16; }
        else             { a.x -= sx * 0.08; a.y -= sy * 0.08;
                           b.x += sx * 0.08; b.y += sy * 0.08; }
      }
    }
  }



  var dashPhase = 0;
  function tethers(t, order) {
    var i, a, b;
    ctx.save();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = LINE + '0.20)';
    ctx.beginPath();
    for (i = 0; i < order.length; i++) {
      a = discCenter(nodes[order[i]]);
      b = discCenter(nodes[order[(i + 1) % order.length]]);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 10]);
    ctx.lineDashOffset = -dashPhase;
    ctx.strokeStyle = LINE + '0.55)';
    ctx.shadowColor = 'rgba(20,179,145,0.35)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (i = 0; i < order.length; i++) {
      a = discCenter(nodes[order[i]]);
      b = discCenter(nodes[order[(i + 1) % order.length]]);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.restore();
    var span = 5600;
    for (i = 0; i < order.length; i++) {
      a = discCenter(nodes[order[i]]);
      b = discCenter(nodes[order[(i + 1) % order.length]]);
      var ph = ((t / span) + i / order.length) % 1;
      var ex = a.x + (b.x - a.x) * ph;
      var ey = a.y + (b.y - a.y) * ph;
      var g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 9);
      g.addColorStop(0, LIME + '0.9)');
      g.addColorStop(1, LIME + '0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8ffaa';
      ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, 7); ctx.fill();
    }
  }

  function web(a) {
    var i, j, dx, dy, d;
    ctx.lineWidth = 1;
    for (i = 0; i < a.length; i++) {
      for (j = i + 1; j < a.length; j++) {
        dx = a[i].x - a[j].x; dy = a[i].y - a[j].y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < W * 0.55) {
          ctx.strokeStyle = LINE + (0.14 * (1 - d / (W * 0.55)) + 0.04).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a[i].x, a[i].y);
          ctx.lineTo(a[j].x, a[j].y);
          ctx.stroke();
        }
      }
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

  function frame(t) {
    if (!running) { rafId = null; return; }
    rafId = requestAnimationFrame(frame);
    var dt = Math.min(50, t - (lastT || t)); lastT = t;

    spin += SPIN_RATE * dt;
    dashPhase += dt * 0.028;

    var i, n, hx, hy, k, rr, pp;
    var ease = 1 - Math.pow(1 - EASE_STEP, dt / 16.7);
    if (t - lastMeasure > 400) { lastMeasure = t; measureAll(); }
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      rr = n.r * (1 + n.swayR * Math.sin(t * n.fR + n.phR));
      pp = n.phi + spin + n.swayP * Math.sin(t * n.fP + n.phP);
      n.ang = pp;
      hx = 50 + rr * Math.cos(pp);
      hy = 50 + rr * Math.sin(pp);
      if (hx < n.hx) hx = 2 * n.hx - hx;
      if (hx > 100 - n.hx) hx = 2 * (100 - n.hx) - hx;
      if (hy < n.hy) hy = 2 * n.hy - hy;
      if (hy > 100 - n.hy) hy = 2 * (100 - n.hy) - hy;
      if (n.drag) {
        n.x += (hx - n.x) * DRAG_KILL * ease * 0.12;
        n.y += (hy - n.y) * DRAG_KILL * ease * 0.12;
      } else if (n.locked) {
      } else {
        n.x += (hx - n.x) * ease;
        n.y += (hy - n.y) * ease;
      }
      clampNode(n);
      var off = Math.abs(n.x - hx) + Math.abs(n.y - hy);
      var homing = !n.drag && !n.locked && off > 3.5;
      if (homing !== n.homing) {
        n.homing = homing;
        n.el.classList.toggle('rx-homing', homing);
      }
    }
    separate();
    magnetPass();
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n.hx) clampNode(n);
      place(n);
    }

    var p;
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

    var anchors = [];
    for (i = 0; i < nodes.length; i++) anchors.push(discCenter(nodes[i]));
    ctx.clearRect(0, 0, W, H);
    web(anchors); links(); dots();
    tethers(t, clockOrder());
  }

  function staticPaint() {
    var anchors = [];
    for (var i = 0; i < nodes.length; i++) anchors.push(discCenter(nodes[i]));
    ctx.clearRect(0, 0, W, H);
    web(anchors); links(); dots();
    var order = clockOrder(), a, b;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = LINE + '0.28)';
    ctx.beginPath();
    for (i = 0; i < order.length; i++) {
      a = discCenter(nodes[order[i]]);
      b = discCenter(nodes[order[(i + 1) % order.length]]);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  }

  function start() { if (!rafId && !reduce && running) rafId = requestAnimationFrame(frame); }
  function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  nodes = [];
  function bindDrag() {
    nodes.forEach(function (n) {
      var el = n.el;
      el.addEventListener('pointerdown', function (e) {
        if (reduce) return;
        if (e.button && e.button !== 0) return;
        n.drag = true;
        n.moved = false;
        n.startX = e.clientX; n.startY = e.clientY;
        el.classList.add('rx-dragging');
        el.setPointerCapture && el.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      el.addEventListener('pointermove', function (e) {
        if (!n.drag) return;
        var dx = e.clientX - n.startX, dy = e.clientY - n.startY;
        if (!n.moved && (dx * dx + dy * dy) < 25) return;
        n.moved = true;
        var r = stage.getBoundingClientRect();
        var W2 = Math.max(80, r.width), H2 = Math.max(80, r.height);
        n.x = (e.clientX - r.left) / W2 * 100;
        n.y = (e.clientY - r.top) / H2 * 100;
        clampNode(n);
        place(n);
      });
      function end(e) {
        if (!n.drag) return;
        n.drag = false;
        el.classList.remove('rx-dragging');
        var moved = n.moved;
        if (moved) {
          el.addEventListener('click', function sup(ev) {
            ev.preventDefault();
            el.removeEventListener('click', sup, true);
          }, true);
        }
      }
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('click', function (ev) {
        if (n.moved) { n.moved = false; return; }
        var a = el.querySelector('.rx-node-link');
        var href = a && a.getAttribute('href');
        if (!href || href.charAt(0) !== '#') return;
        var target = document.getElementById(href.slice(1));
        if (!target) return;
        ev.preventDefault();
        var y = target.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  }

  var retargetTimer = null;
  function retarget() {
    if (!running) return;
    var picks = [];
    var pool = nodes.slice();
    var k = 1 + (Math.random() < 0.55 ? 1 : 0);
    for (var i = 0; i < k && pool.length; i++) {
      picks.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
    }
    picks.forEach(function (n) {
      n.phP = Math.random() * Math.PI * 2;
      n.phR = Math.random() * Math.PI * 2;
      n.swayP = 0.24 + Math.random() * 0.16;
      n.swayR = 0.10 + Math.random() * 0.08;
    });
    retargetTimer = setTimeout(retarget, 9000 + Math.random() * 5000);
  }

  function init() {
    buildNodes();
    size(); measureAll(); seed();
    if (reduce) {
      staticPaint();
      return;
    }
    nodes.forEach(function (n) { n.el.style.left = '0'; n.el.style.top = '0'; place(n); });
    bindDrag();
    running = true; start();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!document.hidden) { running = true; lastT = 0; start(); } }
        else { running = false; stop(); }
      }, { rootMargin: '120px 0px' }).observe(stage);
    }
    clearTimeout(retargetTimer);
    retargetTimer = setTimeout(retarget, 6000 + Math.random() * 4000);
  }

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
    rsT = setTimeout(function () {
      size(); measureAll(); seed();
      if (reduce || !running) staticPaint();
    }, 200);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else { running = true; lastT = 0; start(); }
  });
})();
