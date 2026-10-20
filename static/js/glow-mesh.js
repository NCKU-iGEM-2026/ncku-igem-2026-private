(function () {
  'use strict';
  if (window.__glowMeshMounted) return;
  window.__glowMeshMounted = true;
  var rootEl = document.documentElement;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function darkNow () { return rootEl.getAttribute('data-theme') !== 'light'; }

  var instances = [];
  var masterRaf = null;
  var pageHidden = false;
  var FRAME_MS = 1000 / 20, sleep = null;
  function masterTick (t) {
    masterRaf = null;
    if (pageHidden) return;
    var any = false;
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].running) { instances[i].paint(t); any = true; }
    }
    if (any && !reduce) sleep = setTimeout(function () { sleep = null; heartbeat(); }, FRAME_MS - 8);
  }
  function heartbeat () { if (!masterRaf && !sleep && !reduce && !pageHidden) masterRaf = requestAnimationFrame(masterTick); }
  document.addEventListener('visibilitychange', function () {
    pageHidden = document.hidden;
    if (!pageHidden) heartbeat();
  });

  var PRESETS = {
    mesh:   { cell: 130, jitter: 0.72, morph: [9000, 6000], dna: false },
    '':     { cell: 130, jitter: 0.72, morph: [9000, 6000], dna: true  },
    fine:   { cell: 74,  jitter: 0.62, morph: [11000, 5000], dna: false },
    dense:  { cell: 210, jitter: 0.8,  morph: [8000, 6000], dna: true  },
    dna:    { cell: 0,   jitter: 0,    morph: [0, 0],        dna: true  }
  };

  function seededRand (str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return function () {
      h = (h * 1103515245 + 12345) | 0;
      return ((h >>> 8) & 0x7fffffff) / 0x7fffffff;
    };
  }

  function makeGlow (el) {
    if (el.dataset.glowReady) return;
    el.dataset.glowReady = '1';

    var cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';

    var canvas = document.createElement('canvas');
    canvas.className = 'glow-mesh-layer';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;z-index:0;width:100%;height:100%;'
      + 'pointer-events:none;display:block;border-radius:inherit;opacity:0;transition:opacity .6s ease';
    el.insertBefore(canvas, el.firstChild);

    Array.prototype.forEach.call(el.children, function (c) {
      if (c === canvas) return;
      var z = getComputedStyle(c).zIndex;
      if (z === 'auto' || z === '' || +z < 1) c.style.position = c.style.position === 'static' ? 'relative' : c.style.position;
      if (+getComputedStyle(c).zIndex < 1) c.style.zIndex = '1';
    });

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var mode = PRESETS[el.dataset.glow] !== undefined ? PRESETS[el.dataset.glow] : PRESETS[''];
    var rand = seededRand(location.pathname + '|' + (el.className || '') + '|' + mode.cell);
    var DPR = 1;
    var W = 0, H = 0, pts = [], rafId = null, running = false, morphT = null;

    function size () {
      W = el.clientWidth || el.getBoundingClientRect().width;
      H = el.clientHeight || el.getBoundingClientRect().height;
      if (W < 2 || H < 2) { return false; }
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      return true;
    }

    function seed () {
      pts = [];
      if (!mode.cell) return;
      var cols = Math.ceil(W / mode.cell) + 1, rows = Math.ceil(H / mode.cell) + 1;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          pts.push({
            hx: (c + (rand() - 0.5) * mode.jitter * 2) * mode.cell,
            hy: (r + (rand() - 0.5) * mode.jitter * 2) * mode.cell,
            ax: 5 + rand() * 12, ay: 5 + rand() * 12,
            fx: 0.00022 + rand() * 0.00032, fy: 0.00022 + rand() * 0.00032,
            ph: rand() * Math.PI * 2, c: c, r: r
          });
        }
      }
    }

    function pos (p, t) {
      if (reduce) return { x: p.hx, y: p.hy };
      return {
        x: p.hx + Math.sin(t * p.fx + p.ph) * p.ax,
        y: p.hy + Math.cos(t * p.fy * 1.3 + p.ph) * p.ay
      };
    }

    function mesh (t) {
      if (!pts.length) return;
      var cols = Math.ceil(W / mode.cell) + 1;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], neigh = [];
        if (p.c + 1 < cols) neigh.push(pts[i + 1]);
        if (i + cols < pts.length) {
          neigh.push(pts[i + cols]);
          if (p.c + 1 < cols) neigh.push(pts[i + cols + 1]);
        }
        var a = pos(p, t);
        for (var k = 0; k < neigh.length; k++) {
          var b = pos(neigh[k], t);
          var d = Math.hypot(a.x - b.x, a.y - b.y);
          ctx.strokeStyle = 'rgba(20,179,145,' + (0.13 - 0.075 * Math.min(1, d / (mode.cell * 1.5))).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.fillStyle = (i % 6 === 0) ? 'rgba(160,232,96,0.34)' : 'rgba(20,179,145,0.18)';
        ctx.beginPath(); ctx.arc(a.x, a.y, (i % 6 === 0) ? 2.0 : 1.2, 0, 7); ctx.fill();
      }
    }

    var dnaX0 = 0, dnaTilt = 0;
    function anchorDna () {
      dnaX0 = W * (0.5 + (rand() - 0.5) * 0.7);
      dnaTilt = (rand() - 0.5) * 0.5;
    }

    function dna (t) {
      var band = mode.cell ? Math.max(70, mode.cell * 0.85) : 118;
      var phase = reduce ? 0 : t * 0.00038;
      var swing = Math.min(34, band * 0.3);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      ctx.translate(dnaX0, 0); ctx.rotate(dnaTilt);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(20,179,145,0.11)';
      var strand = function (off) {
        ctx.beginPath();
        for (var y = -40; y < H + 40; y += 6) {
          var xx = Math.sin(y / band + phase + off) * swing;
          if (y === -40) ctx.moveTo(xx, y); else ctx.lineTo(xx, y);
        }
        ctx.stroke();
      };
      strand(0); strand(Math.PI);
      for (var y = -40; y < H + 40; y += 24) {
        var s1 = Math.sin(y / band + phase) * swing;
        var s2 = Math.sin(y / band + phase + Math.PI) * swing;
        if (Math.abs(s1 - s2) < 12) continue;
        ctx.strokeStyle = 'rgba(160,232,96,0.09)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(s1, y); ctx.lineTo(s2, y); ctx.stroke();
      }
      ctx.restore();
    }

    function scheduleMorph () {
      if (reduce || !mode.morph[0]) return;
      clearTimeout(morphT);
      morphT = setTimeout(function () {
        if (!document.hidden && running) {
          for (var k = 0; k < 5 && pts.length; k++) {
            var p = pts[(rand() * pts.length) | 0];
            p.hx = (p.c + (rand() - 0.5) * mode.jitter * 2) * mode.cell;
            p.hy = (p.r + (rand() - 0.5) * mode.jitter * 2) * mode.cell;
            p.ax = 5 + rand() * 12; p.ay = 5 + rand() * 12;
          }
        }
        scheduleMorph();
      }, mode.morph[0] + rand() * mode.morph[1]);
    }

    function paint (t) {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      if (!darkNow()) return;
      mesh(t); if (mode.dna) dna(t);
    }

    var inst = { paint: paint, get running () { return running; } };
    instances.push(inst);
    function start () { heartbeat(); }
    function stop () { }

    function init () {
      if (!size()) { setTimeout(init, 320); return; }
      seed(); anchorDna(); paint(0);
      canvas.style.opacity = darkNow() ? '1' : '0';
      if (darkNow()) { running = true; start(); scheduleMorph(); }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) {
          if (!W) { init(); return; }
          if (darkNow()) { running = true; start(); scheduleMorph(); }
        } else { running = false; stop(); clearTimeout(morphT); }
      }, { threshold: 0 }).observe(el);
    } else { init(); }

    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        canvas.style.opacity = darkNow() ? '1' : '0';
        if (darkNow()) { if (!W) { init(); return; } paint(performance.now()); if (!reduce) { running = true; start(); scheduleMorph(); } }
        else { running = false; stop(); clearTimeout(morphT); ctx.clearRect(0, 0, W, H); }
      }).observe(rootEl, { attributes: true, attributeFilter: ['data-theme'] });
    }

    if ('ResizeObserver' in window) {
      var rT = null;
      new ResizeObserver(function () {
        clearTimeout(rT);
        rT = setTimeout(function () { if (size()) { seed(); anchorDna(); paint(performance.now()); } }, 220);
      }).observe(el);
    }
  }

  function isPaperWorld () { return /(^|\s)(engineering-page|board-game-page)(\s|$)/.test(document.body.className); }
  function lumOf (r, g, b) {
    function f (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function autoScan () {
    if (isPaperWorld()) return;
    var nodes = document.body.querySelectorAll('section, aside, article, .card, .row, .container-fluid, .container');
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.hasAttribute('data-glow')) return;
      if (el.closest('footer')) return;
      var st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity < 0.05) return;
      if (st.position === 'fixed') return;
      if (/url\(/i.test(st.backgroundImage)) return;
      if (el.querySelector('img, video, picture, iframe, canvas')) return;
      var m = st.backgroundColor.match(/[\d.]+/g);
      if (!m) return;
      var a = m.length > 3 ? +m[3] : 1;
      if (a < 0.4) return;
      if (lumOf(+m[0], +m[1], +m[2]) > 0.16) return;
      var r = el.getBoundingClientRect();
      if (r.width < 420 || r.height < 260) return;
      if (el.querySelector('canvas')) return;
      if (/navbar|dish|swiper|carousel|toc|toggler/i.test(el.className || '')) return;
      if (el.parentElement && el.parentElement.closest('[data-glow]:not([data-glow="off"])')) return;
      el.setAttribute('data-glow', r.height >= 430 ? '' : 'fine');
      makeGlow(el);
    });
  }

  function mount () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-glow]:not([data-glow="off"])'), makeGlow);
    autoScan();
    setTimeout(autoScan, 1600);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }
})();
