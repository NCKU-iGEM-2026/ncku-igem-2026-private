/* ============================================================
   螢網（Glow Mesh）— 區塊級動態底圖引擎
   ------------------------------------------------------------
   「螢網」= 不對稱多邊形網格 ＋ 節點緩漂 ＋ 不定時跳點變形
             ＋（可選）DNA 雙螺旋帶，螢光綠低透明度畫在深色底上。
   全站底層由 pages/hp-mesh.js 負責；本檔負責「區塊內部」：
   任何加上 data-glow 的元素，都会在自身範圍内长出一层螢網，
   把平平的單色深底換成會呼吸、會變形的活底圖。

   用法（HTML）：
     <section data-glow>                    ← 標準螢網（網格＋DNA）
     <section data-glow="mesh">           ← 只要網格
     <section data-glow="dna">            ← 只要 DNA 帶
     <section data-glow="fine">          ← 細粒網格（小卡片用）
     <section data-glow="dense">         ← 粗粒大格（大片留白區用）

   規格：
   - 依元素實際尺寸畫，跟隨元素滾動（absolute 貼在元素内）
   - 元素 resize 自動重撒點
   - 淺色模式自動收起（透明度 0）；深淺切換即時啟停
   - prefers-reduced-motion：只畫一幀靜態網
   - 元素不可見（滾出視窗）時暫停，省 CPU
   ============================================================ */
(function () {
  'use strict';
  if (window.__glowMeshMounted) return;
  window.__glowMeshMounted = true;
  var rootEl = document.documentElement;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function darkNow () { return rootEl.getAttribute('data-theme') !== 'light'; }

  /* ---- 統一心跳：全站所有螢網共用一支 rAF，省 CPU ---- */
  var instances = [];
  var masterRaf = null;
  var pageHidden = false;
  function masterTick (t) {
    masterRaf = null;
    if (pageHidden) return;
    var any = false;
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].running) { instances[i].paint(t); any = true; }
    }
    if (any && !reduce) masterRaf = requestAnimationFrame(masterTick);
  }
  function heartbeat () { if (!masterRaf && !reduce && !pageHidden) masterRaf = requestAnimationFrame(masterTick); }
  document.addEventListener('visibilitychange', function () {
    pageHidden = document.hidden;
    if (!pageHidden) heartbeat();
  });

  var PRESETS = {
    /* 模式       格大小  抖動   跳點間隔   DNA */
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

  /* 一個螢網實例＝一個元素的 canvas ＋自己的節點群 */
  function makeGlow (el) {
    if (el.dataset.glowReady) return;
    el.dataset.glowReady = '1';

    /* 容器需要 relative 才能讓 absolute canvas 貼住它 */
    var cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';

    var canvas = document.createElement('canvas');
    canvas.className = 'glow-mesh-layer';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;z-index:0;width:100%;height:100%;'
      + 'pointer-events:none;display:block;border-radius:inherit;opacity:0;transition:opacity .6s ease';
    el.insertBefore(canvas, el.firstChild);

    /* 讓區塊内既有内容浮到螢網之上（不動 inline style 的互動元素） */
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
    var DPR = Math.min(2, window.devicePixelRatio || 1);
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

    /* DNA 帶位置＝开业时定轨一次（不能每帧 rand，否则满屏乱跳） */
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

    /* 掛進全站統一心跳（不各開各的 rAF） */
    var inst = { paint: paint, get running () { return running; } };
    instances.push(inst);
    function start () { heartbeat(); }
    function stop () { /* 心跳由其他實例維持；本實例只靠 running 標記熄火 */ }

    function init () {
      if (!size()) { setTimeout(init, 320); return; }
      seed(); anchorDna(); paint(0);
      canvas.style.opacity = darkNow() ? '1' : '0';
      if (darkNow()) { running = true; start(); scheduleMorph(); }
    }

    /* 滾出視窗就暫停（元素級省 CPU） */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) {
          if (!W) { init(); return; }
          if (darkNow()) { running = true; start(); scheduleMorph(); }
        } else { running = false; stop(); clearTimeout(morphT); }
      }, { threshold: 0 }).observe(el);
    } else { init(); }

    /* 深淺切換：即時啟停 */
    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        canvas.style.opacity = darkNow() ? '1' : '0';
        if (darkNow()) { if (!W) { init(); return; } paint(performance.now()); if (!reduce) { running = true; start(); scheduleMorph(); } }
        else { running = false; stop(); clearTimeout(morphT); ctx.clearRect(0, 0, W, H); }
      }).observe(rootEl, { attributes: true, attributeFilter: ['data-theme'] });
    }

    /* 元素尺寸變動 → 重撒點（内容載入後高度會長） */
    if ('ResizeObserver' in window) {
      var rT = null;
      new ResizeObserver(function () {
        clearTimeout(rT);
        rT = setTimeout(function () { if (size()) { seed(); anchorDna(); paint(performance.now()); } }, 220);
      }).observe(el);
    }
  }

  /* ---- 自動掃描：把全站「平坦單色深底」的大區塊自動掛上螢網 ----
     規則：沒有漸層/圖片底、純深綠系（L<0.16）、夠大（≥260×170）、
     不是 navbar／引擎自己的層／含動畫 canvas 的舞台；
     data-glow="off" 可手動排除，data-glow="..." 手動指定優先。 */
  function isPaperWorld () { return /(^|\s)(engineering-page|board-game-page)(\s|$)/.test(document.body.className); }
  function lumOf (r, g, b) {
    function f (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function autoScan () {
    if (isPaperWorld()) return;
    var nodes = document.body.querySelectorAll('section, aside, article, .card, .row, .container-fluid, .container');
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.hasAttribute('data-glow')) return;              /* 手動標記優先（含 off） */
      if (el.closest('footer')) return;                       /* footer 維持 dev 原樣，不掛螢網 */
      var st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity < 0.05) return;
      if (st.position === 'fixed') return;                    /* navbar／浮層不動 */
      if (/url\(/i.test(st.backgroundImage)) return;          /* 有圖片當底的已不是平坦單色 */
      /* 內容含照片者不掛（會跟照片打架） */
      if (el.querySelector('img, video, picture, iframe, canvas')) return;
      var m = st.backgroundColor.match(/[\d.]+/g);
      if (!m) return;
      var a = m.length > 3 ? +m[3] : 1;
      if (a < 0.4) return;                                    /* 透明底：全站 hp-mesh 已從底層透出，不重複疊 */
      if (lumOf(+m[0], +m[1], +m[2]) > 0.16) return;       /* 不夠深 */
      var r = el.getBoundingClientRect();
      if (r.width < 260 || r.height < 170) return;           /* 太小不是「底圖」 */
      if (el.querySelector('canvas')) return;                 /* 已有自己動畫的舞台（六邊形浮盤等）*/
      if (/navbar|dish|swiper|carousel|toc|toggler/i.test(el.className || '')) return;
      if (el.parentElement && el.parentElement.closest('[data-glow]:not([data-glow="off"])')) return;  /* 父層已掛，不雙層疊圖 */
      el.setAttribute('data-glow', r.height >= 430 ? '' : 'fine');
      makeGlow(el);
    });
  }

  function mount () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-glow]:not([data-glow="off"])'), makeGlow);
    autoScan();
    /* 晚到的内容（lazy 區塊長高後才有面積）補掃一次 */
    setTimeout(autoScan, 1600);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }
})();
