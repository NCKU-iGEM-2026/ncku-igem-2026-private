/* ============================================================
   COLLABORATION — 星座皿引擎（logo 牆動態布點與漂移）
   - 進入視窗時：所有 logo 由皿心爆發、彈跳到各自的家位（組裝）
   - 穩態：各碟受彈簧牵引向家位＋兩兩碰撞分離＋全域緩旋，
     像培養皿裡緩慢漂移的菌落；滑鼠靠近會被推开
   - 分頁不可見暫停；reduced-motion 直接摆在家位不跑迴圈
   - JS 沒跑／載入失敗：HTML 原樣是舊 flex 牆，自動降級
   ============================================================ */
(function () {
  'use strict';
  var wall = document.querySelector('.collab-wall');
  if (!wall) return;
  var inner = wall.querySelector('.collab-wall-inner');
  var bubbles = [].slice.call(wall.querySelectorAll('.collab-bubble'));
  if (!inner || !bubbles.length) return;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---- 裝飾：三條橢圓軌道環＋皿心 ---- */
  var rings = [0.93, 0.64, 0.36].map(function () {
    var d = document.createElement('div');
    d.className = 'rx-ring';
    wall.appendChild(d);
    return d;
  });
  var core = document.createElement('span');
  core.className = 'rx-orbit-core';
  wall.appendChild(core);

  var W = 0, H = 0;
  var mouse = { x: -9999, y: -9999, on: false };
  var rafId = null, assembled = false;

  var parts = bubbles.map(function (el, i) {
    return { el: el, i: i, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, r: 30, hw: 60, hh: 60 };
  });

  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  function visible(p) {
    return p.el.offsetParent !== null || getComputedStyle(p.el).display !== 'none';
  }

  function measure() {
    var r = inner.getBoundingClientRect();
    W = Math.max(320, r.width);
    var tall = W < 768 ? 640 : (W < 1200 ? 560 : 660);
    inner.style.height = tall + 'px';
    inner.style.position = 'relative';
    H = tall;
    /* 軌道環跟皿同橢圓 */
    rings.forEach(function (d, k) {
      var f = [0.93, 0.64, 0.36][k];
      var rw = (W - 90) * f, rh = (H - 90) * f;
      d.style.width = rw + 'px';
      d.style.height = rh + 'px';
    });
  }

  /* 家位：黃金角螺旋均勻鋪在橢圓場內（面積均勻、不疊） */
  function assignHomes() {
    var cx = W / 2, cy = H / 2;
    var roomX = W / 2 - 46, roomY = H / 2 - 46;
    var vis = parts.filter(visible);
    vis.forEach(function (p, k) {
      var disc = p.el.querySelector('.collab-bubble-disc');
      p.hw = disc ? disc.offsetWidth : 64;
      p.r = p.hw / 2 + 2;
      var ang = k * 2.39996322;
      var rad = Math.sqrt((k + 0.7) / (vis.length + 0.7));
      var j = (rnd(p.i) - 0.5) * 0.16;
      p.hx = cx + Math.cos(ang) * rad * roomX * (1 + j);
      p.hy = cy + Math.sin(ang) * rad * roomY * (1 + j * 1.4);
    });
    return vis;
  }

  /* 爆發：全部從皿心給一記向外初速 */
  function explode() {
    var cx = W / 2, cy = H / 2;
    parts.forEach(function (p, i) {
      var a = i * 2.39996322 + (rnd(i + 7) - 0.5) * 0.9;
      p.x = cx + Math.cos(a) * 4;
      p.y = cy + Math.sin(a) * 4;
      var kick = 2.4 + rnd(i + 3) * 3.8;
      p.vx = Math.cos(a) * kick;
      p.vy = Math.sin(a) * kick * 0.8;
      var disc = p.el.querySelector('.collab-bubble-disc');
      p.hw = disc ? disc.offsetWidth : 64;
      p.r = p.hw / 2 + 2;
    });
  }

  function place(p, s) {
    p.el.style.transform = 'translate3d(' + (p.x - p.hw / 2).toFixed(1) + 'px,' +
      (p.y - p.hw / 2).toFixed(1) + 'px,0) scale(' + s + ')';
  }

  /* ---- 物理：彈簧回家长＋碰撞分離＋緩旋＋鼠斥＋橢圓壁 ---- */
  function step(t) {
    rafId = requestAnimationFrame(step);
    var dt = Math.min(2.2, Math.max(0.5, (t - (step.last || t)) / 16.667));
    step.last = t;
    var cx = W / 2, cy = H / 2;
    var vis = parts.filter(visible);
    var i, j, p, q;

    for (i = 0; i < vis.length; i++) {
      p = vis[i];
      /* 彈簧向家 */
      p.vx += (p.hx - p.x) * 0.018 * dt;
      p.vy += (p.hy - p.y) * 0.018 * dt;
      /* 全域緩旋（半徑越大越慢，近開普勒） */
      var dx = p.x - cx, dy = p.y - cy;
      var rr = Math.sqrt(dx * dx + dy * dy) + 30;
      var w = 0.055 / Math.sqrt(rr / 60) * dt;
      p.vx += -dy * w * 0.06; p.vy += dx * w * 0.06;
      /* 滑鼠斥力 */
      if (mouse.on) {
        var mx = p.x - mouse.x, my = p.y - mouse.y;
        var md = Math.sqrt(mx * mx + my * my);
        if (md < 170 && md > 0.1) {
          var f = (1 - md / 170) * 0.9 * dt;
          p.vx += mx / md * f; p.vy += my / md * f;
        }
      }
      p.vx *= Math.pow(0.94, dt); p.vy *= Math.pow(0.94, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
    }

    /* 碰撞分離（兩次疊代，菌落不相疊） */
    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < vis.length; i++) {
        p = vis[i];
        for (j = i + 1; j < vis.length; j++) {
          q = vis[j];
          var ox = p.x - q.x, oy = p.y - q.y;
          var need = p.r + q.r;
          var od = Math.sqrt(ox * ox + oy * oy);
          if (od < need && od > 0.01) {
            var push = (need - od) / 2 * 0.55;
            var nx = ox / od, ny = oy / od;
            p.x += nx * push; p.y += ny * push;
            q.x -= nx * push; q.y -= ny * push;
          }
        }
      }
    }

    /* 橢圓壁：_out_of dish → 推回並吸能 */
    for (i = 0; i < vis.length; i++) {
      p = vis[i];
      var rx = W / 2 - p.r - 8, ry = H / 2 - p.r - 8;
      var ex = (p.x - cx) / rx, ey = (p.y - cy) / ry;
      var m2 = ex * ex + ey * ey;
      if (m2 > 1) {
        var back = 1 - 1 / Math.sqrt(m2);
        p.x -= (p.x - cx) * back * 0.8;
        p.y -= (p.y - cy) * back * 0.8;
        p.vx *= 0.6; p.vy *= 0.6;
      }
      place(p, 1);
    }
  }

  /* ---- 亮色模式：皿盤內碟保留白底，曝光壓暗 --------------------------------
     （CSS 已經把 wall 改成深夜；亮色下保持同樣深色—這是設計意圖） */

  function startLoop() {
    if (rafId || reduce) return;
    rafId = requestAnimationFrame(step);
  }
  function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  function assemble() {
    if (assembled) return;
    assembled = true;
    wall.classList.add('rx-orbital');
    inner.classList.add('rx-orbital');
    measure();
    assignHomes();
    if (reduce) {
      parts.forEach(function (p) { p.x = p.hx; p.y = p.hy; place(p, 1); });
      return;
    }
    explode();
    /* 進入/boot：先隱藏 CSS 淡入由 reveal 動畫負責，這裡直接開跑物理 */
    startLoop();
  }

  /* ---- 觸發：進視窗才組裝（首次載入更有戲劇性）---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        assemble();
        io.disconnect();
      });
    }, { threshold: 0.12 });
    io.observe(wall);
  } else {
    assemble();
  }

  /* ---- 游標：斥力＋聚光燈 ---- */
  wall.addEventListener('pointermove', function (e) {
    var r = wall.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
    wall.style.setProperty('--sx', mouse.x + 'px');
    wall.style.setProperty('--sy', mouse.y + 'px');
  });
  wall.addEventListener('pointerleave', function () { mouse.on = false; });

  /* ---- 尺寸變動：重算家位，位置保留（不重新爆發）---- */
  var rsT = null;
  window.addEventListener('resize', function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () {
      if (!assembled) return;
      measure(); assignHomes();
    }, 220);
  });

  /* ---- 分頁不可見暫停 ---- */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopLoop();
    else if (assembled && !reduce) startLoop();
  });
})();
