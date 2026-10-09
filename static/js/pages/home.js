/* ============================================================
   HOME.JS -- the home page's moving parts
   1. the dish in the banner: P. aeruginosa releasing AHL until it
      reaches quorum, and a pointer that is either the aptamer
      (Capture: it takes the signal away) or the biosensor (Detect:
      it glows where the signal is). An illustration, not a model.
   2. the hours slider in "The answer arrives too late"
   3. the two systems, step by step
   4. the tilt on the tool cards and the board-game card
   5. the panel that names the page being pointed at in the map

   The dish is the only thing that draws every frame. It draws from
   sprites made once, stops whenever the banner is off screen or the
   tab is hidden, and keeps to about 60 frames a second however fast
   the display is. With reduced motion it draws one still frame.
   ============================================================ */
(function () {
  'use strict';

  var reduce = false, coarse = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches; } catch (e) {}
  var now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };

  /* ------------------------------------------------------------------
     1. the dish
     ------------------------------------------------------------------ */
  (function dish() {
    var stage = document.getElementById('rxHeroStage');
    var canvas = document.getElementById('qsCanvas');
    if (!stage || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var hud = stage.querySelector('.qs-hud');
    var note = stage.querySelector('.qs-note');
    var fill = stage.querySelector('.qs-meter-fill');
    var stateEl = stage.querySelector('.qs-meter-state');
    var hint = stage.querySelector('.qs-hint');
    var modeBtns = Array.prototype.slice.call(stage.querySelectorAll('.qs-mode'));

    var DPR = Math.min(1.5, window.devicePixelRatio || 1);
    var W = 0, H = 0;
    var bugs = [], ahl = [], fx = [];
    var mode = 'capture';
    var ptr = { x: -1e4, y: -1e4, on: false, touch: false, until: 0 };

    /* the signal is the AHL in the dish over the count we call quorum; the
       population switches on above 1 and back off below QUIET (hysteresis) */
    var QUORUM_N = 125, QUIET = 0.9, MAX_AHL = 300;
    var R_CAPTURE = 160, R_SENSE = 120;
    var signal = 0, vir = 0, quorate = false, glow = 0, captured = 0, brokeAt = -1e9;

    /* ---- sprites, drawn once ---- */
    function sprite(w, h, draw) {
      var c = document.createElement('canvas');
      c.width = Math.ceil(w * DPR); c.height = Math.ceil(h * DPR);
      var g = c.getContext('2d');
      g.scale(DPR, DPR);
      draw(g, w, h);
      return c;
    }
    function capsule(g, x, y, w, h) {
      var r = h / 2;
      g.beginPath();
      g.moveTo(x + r, y);
      g.lineTo(x + w - r, y);
      g.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
      g.lineTo(x + r, y + h);
      g.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
      g.closePath();
    }
    function glowDot(size, stops) {
      return sprite(size, size, function (g, s) {
        var r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        stops.forEach(function (st) { r.addColorStop(st[0], st[1]); });
        g.fillStyle = r; g.fillRect(0, 0, s, s);
      });
    }
    var ROD_W = 84, ROD_H = 48, BODY_W = 46, BODY_H = 17;
    function rod(body, edge, halo, blur) {
      return sprite(ROD_W, ROD_H, function (g, w, h) {
        g.shadowColor = halo; g.shadowBlur = blur;
        capsule(g, (w - BODY_W) / 2, (h - BODY_H) / 2, BODY_W, BODY_H);
        g.fillStyle = body; g.fill();
        g.shadowBlur = 0;
        g.lineWidth = 1.6; g.strokeStyle = edge; g.stroke();
        /* a nucleoid smudge, so it reads as a cell and not a pill */
        g.fillStyle = 'rgba(255,255,255,0.10)';
        capsule(g, w / 2 - 12, h / 2 - 3, 24, 6); g.fill();
      });
    }
    var SP_AHL = glowDot(22, [[0, 'rgba(255,240,196,1)'], [0.26, 'rgba(238,203,134,0.95)'], [0.55, 'rgba(238,176,92,0.28)'], [1, 'rgba(238,176,92,0)']]);
    var SP_CALM = rod('rgba(46,219,180,0.20)', 'rgba(120,226,206,0.95)', 'rgba(46,219,180,0.55)', 10);
    var SP_VIR = rod('rgba(226,87,76,0.30)', 'rgba(255,150,120,0.98)', 'rgba(255,100,70,0.85)', 16);
    var SP_HAZE = glowDot(260, [[0, 'rgba(226,110,70,0.30)'], [0.5, 'rgba(226,110,70,0.10)'], [1, 'rgba(226,110,70,0)']]);
    var SP_SENSOR = rod('rgba(255,255,255,0.05)', 'rgba(215,245,184,0.65)', 'rgba(0,0,0,0)', 0);
    var SP_SENSOR_ON = rod('rgba(184,245,126,0.75)', 'rgba(232,255,212,1)', 'rgba(184,245,126,1)', 22);
    var SP_GFP = glowDot(260, [[0, 'rgba(184,245,126,0.55)'], [0.4, 'rgba(184,245,126,0.18)'], [1, 'rgba(184,245,126,0)']]);
    var SP_FLASH = glowDot(40, [[0, 'rgba(255,248,220,0.95)'], [0.4, 'rgba(238,203,134,0.45)'], [1, 'rgba(238,203,134,0)']]);

    /* ---- the world ---- */
    function size() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
    }
    function bugCount() { return Math.max(7, Math.min(16, Math.round(W * H / 85000))); }
    function newBug() {
      return {
        x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 80),
        a: Math.random() * Math.PI * 2, v: 14 + Math.random() * 12,
        s: 0.85 + Math.random() * 0.35, t: Math.random() * 10,
        next: Math.random() * 0.8
      };
    }
    function populate() {
      var n = bugCount();
      while (bugs.length < n) bugs.push(newBug());
      if (bugs.length > n) bugs.length = n;
      bugs.forEach(function (b) { b.x = Math.min(Math.max(b.x, 20), W - 20); b.y = Math.min(Math.max(b.y, 20), H - 20); });
    }
    function emit(b) {
      if (ahl.length >= MAX_AHL) return;
      var a = b.a + (Math.random() < 0.5 ? 0 : Math.PI);
      ahl.push({
        x: b.x + Math.cos(a) * 16, y: b.y + Math.sin(a) * 16,
        vx: Math.cos(a) * (18 + Math.random() * 22), vy: Math.sin(a) * (18 + Math.random() * 22),
        life: 6 + Math.random() * 3
      });
    }
    function ring(x, y, max, color, life) { if (fx.length < 40) fx.push({ x: x, y: y, r: 4, max: max, color: color, life: life, left: life }); }

    /* ---- one step of the dish ---- */
    function step(dt, t) {
      /* the total release rate is about 18 a second, so an untouched dish
         reaches quorum in eight or nine seconds */
      var rate = 18 / bugs.length;
      var speedUp = 1 + 1.8 * vir;                       /* swarming */
      for (var i = 0; i < bugs.length; i++) {
        var b = bugs[i];
        b.next -= dt;
        if (b.next <= 0) { emit(b); b.next = (0.6 + Math.random() * 0.8) / rate; }
        b.a += (Math.random() - 0.5) * (1.2 + 3 * vir) * dt * 2;
        /* turn back toward the dish when near its edge */
        var m = 50;
        if (b.x < m || b.x > W - m || b.y < m || b.y > H - m) {
          var to = Math.atan2(H / 2 - b.y, W / 2 - b.x), d = to - b.a;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          b.a += d * Math.min(1, dt * 2.5);
        }
        var v = b.v * speedUp;
        b.x += Math.cos(b.a) * v * dt; b.y += Math.sin(b.a) * v * dt;
        b.t += dt * (4 + 6 * vir);
      }

      var capturing = mode === 'capture' && ptr.on;
      var sensing = mode === 'detect' && ptr.on;
      var near = 0, R2 = R_SENSE * R_SENSE;
      for (var j = ahl.length - 1; j >= 0; j--) {
        var p = ahl[j];
        p.vx += (Math.random() - 0.5) * 140 * dt;
        p.vy += (Math.random() - 0.5) * 140 * dt;
        var damp = Math.max(0, 1 - 1.6 * dt);
        p.vx *= damp; p.vy *= damp;
        if (capturing) {
          var dx = ptr.x - p.x, dy = ptr.y - p.y, dd = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dd < R_CAPTURE) {
            /* inside the aptamer's reach the signal is drawn straight in,
               closer ones faster, so a sweep takes what it passes over */
            var k = Math.min(1, dt * (9 + 22 * (1 - dd / R_CAPTURE)));
            p.x += dx * k; p.y += dy * k;
            p.vx *= 0.5; p.vy *= 0.5;
            if (dd < 30) {
              ahl.splice(j, 1); captured++;
              if (Math.random() < 0.5) ring(ptr.x, ptr.y, 26, '238,203,134', 0.45);
              continue;
            }
          }
        }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); } else if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); } else if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }
        p.life -= dt;
        if (p.life <= 0) { ahl.splice(j, 1); continue; }
        if (sensing) { var ex = p.x - ptr.x, ey = p.y - ptr.y; if (ex * ex + ey * ey < R2) near++; }
      }

      signal += (ahl.length / QUORUM_N - signal) * Math.min(1, dt * 3);
      if (!quorate && signal >= 1) { quorate = true; ring(W / 2, H / 2, Math.max(W, H) * 0.75, '255,122,92', 1.6); }
      else if (quorate && signal < QUIET) { quorate = false; brokeAt = t; ring(W / 2, H / 2, Math.max(W, H) * 0.75, '184,245,126', 1.6); }
      vir += ((quorate ? 1 : 0) - vir) * Math.min(1, dt * (quorate ? 0.9 : 0.6));

      /* the sensor's response is switch-like: little until the signal is there */
      var target = sensing ? (near * near) / (near * near + 49) : 0;
      glow += (target - glow) * Math.min(1, dt * (target > glow ? 4 : 1.6));

      for (var k = fx.length - 1; k >= 0; k--) {
        var f = fx[k];
        f.left -= dt;
        if (f.left <= 0) { fx.splice(k, 1); continue; }
        f.r = 4 + (f.max - 4) * (1 - f.left / f.life);
      }
      if (ptr.touch && ptr.on && t > ptr.until) ptr.on = false;
    }

    /* ---- drawing ---- */
    function draw(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var i, b;

      /* the biofilm: a haze that gathers round the cells once they switch on */
      if (vir > 0.02) {
        ctx.globalAlpha = 0.65 * vir;
        for (i = 0; i < bugs.length; i++) {
          b = bugs[i];
          ctx.setTransform(DPR, 0, 0, DPR, DPR * b.x, DPR * b.y);
          ctx.drawImage(SP_HAZE, -130, -130, 260, 260);
        }
      }

      /* the signal */
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < ahl.length; i++) {
        var p = ahl[i];
        ctx.globalAlpha = Math.min(1, p.life / 1.4) * 0.95;
        ctx.setTransform(DPR, 0, 0, DPR, DPR * p.x, DPR * p.y);
        ctx.drawImage(SP_AHL, -11, -11, 22, 22);
      }
      ctx.globalCompositeOperation = 'source-over';

      /* the cells: calm teal crossing over to red as they switch on, each
         with a flagellum that beats faster when they swarm */
      for (i = 0; i < bugs.length; i++) {
        b = bugs[i];
        var c = Math.cos(b.a) * b.s, s = Math.sin(b.a) * b.s;
        ctx.setTransform(DPR * c, DPR * s, -DPR * s, DPR * c, DPR * b.x, DPR * b.y);
        ctx.globalAlpha = 0.75 + 0.25 * vir;
        ctx.beginPath();
        ctx.moveTo(-BODY_W / 2 + 1, 0);
        for (var q = 1; q <= 4; q++) {
          ctx.lineTo(-BODY_W / 2 - q * 6, Math.sin(b.t + q * 1.1) * (2.2 + q * 0.6));
        }
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = vir > 0.5 ? 'rgba(255,150,120,0.75)' : 'rgba(120,226,206,0.7)';
        ctx.stroke();
        ctx.globalAlpha = 1 - vir;
        if (vir < 0.98) ctx.drawImage(SP_CALM, -ROD_W / 2, -ROD_H / 2, ROD_W, ROD_H);
        if (vir > 0.02) { ctx.globalAlpha = vir; ctx.drawImage(SP_VIR, -ROD_W / 2, -ROD_H / 2, ROD_W, ROD_H); }
      }
      ctx.globalAlpha = 1;

      /* the pointer */
      if (ptr.on) {
        if (mode === 'capture') {
          ctx.setTransform(DPR, 0, 0, DPR, DPR * ptr.x, DPR * ptr.y);
          ctx.strokeStyle = 'rgba(238,203,134,0.18)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(0, 0, R_CAPTURE, 0, Math.PI * 2); ctx.stroke();
          /* the aptamer: a strand curled into a ring, turning */
          ctx.rotate(t / 900);
          ctx.strokeStyle = 'rgba(246,220,164,0.95)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
          ctx.beginPath();
          for (var a = 0; a <= 64; a++) {
            var ang = a / 64 * Math.PI * 2, rr = 22 + Math.sin(ang * 6) * 3.5;
            if (a === 0) ctx.moveTo(rr, 0); else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
          }
          ctx.stroke();
        } else {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = glow;
          ctx.setTransform(DPR, 0, 0, DPR, DPR * ptr.x, DPR * ptr.y);
          ctx.drawImage(SP_GFP, -130, -130, 260, 260);
          ctx.globalCompositeOperation = 'source-over';
          ctx.setTransform(DPR * 1.25, 0, 0, DPR * 1.25, DPR * ptr.x, DPR * ptr.y);
          ctx.globalAlpha = 1;
          ctx.drawImage(SP_SENSOR, -ROD_W / 2, -ROD_H / 2, ROD_W, ROD_H);
          if (glow > 0.02) { ctx.globalAlpha = glow; ctx.drawImage(SP_SENSOR_ON, -ROD_W / 2, -ROD_H / 2, ROD_W, ROD_H); }
          ctx.globalAlpha = 1;
          ctx.setTransform(DPR, 0, 0, DPR, DPR * ptr.x, DPR * ptr.y);
          ctx.strokeStyle = 'rgba(184,245,126,' + (0.12 + 0.3 * glow).toFixed(3) + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(0, 0, R_SENSE, 0, Math.PI * 2); ctx.stroke();
        }
      }

      /* flashes and the wave when the dish changes state */
      for (i = 0; i < fx.length; i++) {
        var f = fx[i], k = f.left / f.life;
        ctx.setTransform(DPR, 0, 0, DPR, DPR * f.x, DPR * f.y);
        if (f.max < 60) {
          ctx.globalAlpha = k;
          ctx.drawImage(SP_FLASH, -20, -20, 40, 40);
        }
        ctx.globalAlpha = k * 0.85;
        ctx.strokeStyle = 'rgba(' + f.color + ',1)';
        ctx.lineWidth = f.max < 60 ? 1.5 : 3;
        ctx.beginPath(); ctx.arc(0, 0, f.r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    /* ---- the readout, a few times a second rather than every frame ---- */
    var lastState = '', lastHud = 0;
    function hudUpdate(t, force) {
      if (!force && t - lastHud < 100) return;
      lastHud = t;
      fill.style.transform = 'scaleX(' + Math.min(1, signal / 1.5).toFixed(3) + ')';
      /* for a few seconds after the pointer has pulled the dish back out of
         quorum, say so; that is the moment the whole thing is about */
      var st = quorate ? 'Quorum reached' : (t - brokeAt < 3000 ? 'Quorum broken' : (signal > 0.5 ? 'Building' : 'Quiet'));
      if (st !== lastState) {
        lastState = st;
        stateEl.textContent = st;
        stage.classList.toggle('is-quorate', quorate);
        stage.classList.toggle('is-broken', st === 'Quorum broken');
      }
    }

    /* ---- the loop: only while the banner is on screen and the tab is shown ---- */
    var visible = true, rafId = null, last = 0, lastDraw = 0;
    function frame(t) {
      rafId = null;
      if (!visible || document.hidden) return;
      rafId = requestAnimationFrame(frame);
      if (t - lastDraw < 15.5) return;          /* about 60 a second, even on a 120 Hz screen */
      var dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t; lastDraw = t;
      step(dt, t);
      draw(t);
      hudUpdate(t);
    }
    function run() { if (!rafId && visible && !document.hidden) { last = 0; rafId = requestAnimationFrame(frame); } }

    /* ---- the controls ---- */
    function hintFor(m) {
      return hint.getAttribute('data-hint-' + (coarse ? 'touch-' : '') + m) || hint.getAttribute('data-hint-' + m);
    }
    function setMode(m) {
      mode = m;
      stage.setAttribute('data-mode', m);
      modeBtns.forEach(function (btn) {
        var on = btn.getAttribute('data-mode') === m;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      hint.textContent = hintFor(m);
      glow = 0;
    }
    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { setMode(btn.getAttribute('data-mode')); });
    });

    function at(e) {
      var r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
    }
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      at(e); ptr.on = true; ptr.touch = false;
    });
    stage.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') ptr.on = false; });
    /* on a touch screen a drag scrolls the page, so a tap puts the pointer
       down where it lands for a moment and a half */
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      if (e.target.closest('a, button')) return;
      at(e); ptr.on = true; ptr.touch = true; ptr.until = now() + 1500;
    });

    /* ---- start ---- */
    size(); populate();
    hint.textContent = hintFor('capture');

    if (reduce) {
      /* a still dish: let it run a few seconds out of sight, then draw it once */
      for (var w = 0; w < 120; w++) step(1 / 30, w * 33);
      fx.length = 0;
      draw(0);
      window.addEventListener('resize', function () { size(); populate(); draw(0); });
      return;
    }

    hud.hidden = false;
    if (note) note.hidden = false;
    hudUpdate(0, true);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; run(); }, { threshold: 0.02 }).observe(stage);
    }
    document.addEventListener('visibilitychange', run);
    var rs = null;
    window.addEventListener('resize', function () {
      clearTimeout(rs);
      rs = setTimeout(function () { size(); populate(); }, 120);
    });
    run();
  })();

  /* ------------------------------------------------------------------
     2. the hours after the sample
     ------------------------------------------------------------------ */
  (function wait() {
    var box = document.querySelector('.hx-wait');
    if (!box) return;
    var range = box.querySelector('.hx-wait-range');
    var out = box.querySelector('.hx-wait-out');
    if (!range || !out) return;
    var hours = out.querySelector('.hx-wait-hours');
    /* the sentence after the hours gets its own element, so only it changes */
    var said = document.createElement('span');
    while (hours.nextSibling) said.appendChild(hours.nextSibling);
    out.appendChild(said);
    var lines = { early: out.getAttribute('data-early'), wait: out.getAttribute('data-wait'), late: out.getAttribute('data-late') };
    var band = '';

    function render(h) {
      box.style.setProperty('--h', (h / 72).toFixed(4));
      hours.textContent = h + ' h';
      var b = h < 6 ? 'early' : (h < 48 ? 'wait' : 'late');
      if (b !== band) {
        band = b;
        box.setAttribute('data-band', b);
        said.textContent = ' ' + lines[b];
      }
      range.setAttribute('aria-valuetext', h + ' hours: ' + lines[b]);
    }
    var touched = false;
    range.addEventListener('input', function () { touched = true; render(+range.value); });
    render(+range.value);

    /* the first time it comes into view, the hours run once on their own */
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var t0 = null, DUR = 4600;
      (function tick(t) {
        if (touched) return;
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / DUR);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var h = Math.round(e * 72);
        range.value = h; render(h);
        if (k < 1) requestAnimationFrame(tick);
      })(now());
    }, { threshold: 0.6 });
    setTimeout(function () { io.observe(box); }, 400);
  })();

  /* ------------------------------------------------------------------
     3. two systems, one signal
     ------------------------------------------------------------------ */
  (function systems() {
    var root = document.querySelector('.hx-sys');
    if (!root) return;
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-sys-tab]'));
    var panels = {
      detect: document.getElementById('hxPanelDetect'),
      capture: document.getElementById('hxPanelCapture')
    };
    var sys = 'detect', stepAt = 1, inView = false, hovering = false, heldUntil = 0;

    function setStep(n) {
      stepAt = n;
      root.setAttribute('data-step', n);
      panels[sys].querySelectorAll('.hx-steps li').forEach(function (li) {
        var k = +li.getAttribute('data-step');
        li.classList.toggle('is-now', k === n);
        li.classList.toggle('is-past', k < n);
      });
    }
    function setSys(k, focus) {
      sys = k;
      root.setAttribute('data-sys', k);
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-sys-tab') === k;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.detect.hidden = k !== 'detect';
      panels.capture.hidden = k !== 'capture';
      setStep(reduce ? 4 : 1);
    }
    function hold() { heldUntil = now() + 9000; }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { hold(); setSys(t.getAttribute('data-sys-tab')); });
      t.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = tabs.length - 1;
        if (j === null) return;
        e.preventDefault(); hold();
        setSys(tabs[j].getAttribute('data-sys-tab'), true);
      });
    });
    Object.keys(panels).forEach(function (k) {
      panels[k].querySelectorAll('.hx-steps button').forEach(function (btn) {
        btn.addEventListener('click', function () { hold(); setStep(+btn.parentNode.getAttribute('data-step')); });
      });
    });
    root.addEventListener('pointerenter', function () { hovering = true; });
    root.addEventListener('pointerleave', function () { hovering = false; });
    root.addEventListener('focusin', hold);

    setSys('detect');
    if (reduce) return;

    /* the steps play on their own while the section is in view, and the
       other system follows when one is done */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.35 }).observe(root);
    } else { inView = true; }
    setInterval(function () {
      if (!inView || hovering || now() < heldUntil || document.hidden) return;
      if (stepAt < 4) setStep(stepAt + 1);
      else setSys(sys === 'detect' ? 'capture' : 'detect');
    }, 2600);
  })();

  /* ------------------------------------------------------------------
     4. cards that lean toward the pointer
     ------------------------------------------------------------------ */
  (function tilt() {
    if (reduce || coarse) return;
    document.querySelectorAll('.hx-stage > a, .hx-game-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        card.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 7).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  })();

  /* ------------------------------------------------------------------
     5. the map of the wiki: the panel names the page pointed at
     ------------------------------------------------------------------ */
  (function map() {
    var spot = document.querySelector('.hx-map-spot');
    if (!spot) return;
    var k = spot.querySelector('.hx-map-spot-k');
    var name = spot.querySelector('.hx-map-spot-name');
    var text = spot.querySelector('.hx-map-spot-text');
    var links = Array.prototype.slice.call(document.querySelectorAll('.hx-map-col a'));
    var current = null;
    function show(a) {
      if (a === current) return;
      if (current) current.classList.remove('is-on');
      current = a;
      a.classList.add('is-on');
      spot.className = 'hx-map-spot tone-' + a.getAttribute('data-map-tone');
      spot.href = a.href;
      k.textContent = a.getAttribute('data-map-section');
      name.textContent = a.querySelector('.hx-map-name').textContent;
      text.textContent = a.querySelector('.hx-map-desc').textContent;
      void spot.offsetWidth;          /* restart the swap animation */
      spot.classList.add('is-swap');
    }
    links.forEach(function (a) {
      a.addEventListener('pointerenter', function () { show(a); });
      a.addEventListener('focus', function () { show(a); });
    });
    if (links[0]) { links[0].classList.add('is-on'); current = links[0]; }
  })();
})();
