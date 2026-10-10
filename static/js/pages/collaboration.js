/* ============================================================
   COLLABORATION — 方皿分子網絡 v4（nexus 色系／六邊形牽引陣）
   - 六節點以六邊形陣位順時針緩旋（~110 秒／圈，方位角恆定遞增）
   - 節點可拖曳；放開後以慢速指數緩動「牽回」自己的旋轉陣位
     （不是彈跳：每幀朝目標補一小步，越遠拉力越溫柔）
   - 牽引線：六邊形六邊＝淡色底線＋流動虛線動畫＋跑動螢光電子；
     任意兩節點間另有距離衰減的弱鍵結線，拖開時全網即時變形
   - canvas 底層仍保留浮游粒子＋近鄰鍵結，質感與舊版一致
   - 分頁不可見暫停；reduced-motion：靜態六邊、不拖不自旋
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
  var mouse = { x: -9999, y: -9999, on: false };
  var rafId = null, running = false, lastT = 0, lastMeasure = 0;
  var spin = 0;                 /* 整組陣列目前轉過的弧度（順時針正向） */

  /* 順時針自轉：2π / 110s —— 慢到 dibaca 為「活著的盤」而不是風車 */
  var SPIN_RATE = Math.PI * 2 / 110000;
  /* 歸位緩動：每 16.7ms 補近目標的 1.6% → 時間常數 ~1 秒，遠端回落約 5–6 秒 */
  var EASE_STEP = 0.016;
  var DRAG_KILL = 0.9;         /* 拖曳中仍然極輕地朝陣位靠在，放手不暴衝 */

  var PALETTE = ['#a0e860', '#14b391', '#2edbb4', '#d8b26a', '#d7f5b8'];
  var LINE = 'rgba(20,179,145,';      /* home teal */
  var LIME = 'rgba(160,232,96,';      /* lime */

  /* ---- 節點模型：_html 的 --nx/--ny 就是初始（未旋轉）陣位______
     存極坐標(半徑 r、初始方位 φ)，順時針 = φ + spin。
     陣位不再固定：每顆另帶兩條不同週期的正弦——徑向「呼吸」swayR、
     方位「擺盪」swayP——合成出永不重複的不規則軌跡；整組仍被 spin
     帶著順時針走，牽引線依方位角排序連結，變形時全網即時跟隨。
     每 9–14 秒挑 1–2 顆換擺盪相位／振幅：目標位整個跳走，
     由歸位緩動牽成一段優雅滑行，看起來就是「自己換位置」。
     x/y 是目前實際位置（%），拖曳直接改它，每幀再朝陣位緩歸。 */
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
        /* 自行變動參數：徑向 ±14%、方位 ±22°，週期各自不同（永不共輪） */
        swayR: 0.10 + Math.random() * 0.08,
        fR: 0.00006 + Math.random() * 0.00009,
        phR: Math.random() * Math.PI * 2,
        swayP: (0.24 + Math.random() * 0.16),
        fP: 0.00005 + Math.random() * 0.00008,
        phP: Math.random() * Math.PI * 2,
        x: nx, y: ny,
        homeX: nx, homeY: ny,
        ang: Math.atan2(dy, dx),             /* 目前實際方位角，靜態時＝phi */
        drag: false,
        homing: false
      });
    });
  }

  /* 順時針周遊順序：依目前實際方位角遞增（螢幕 y 向下＝atan2 正向即順時針）；
     節點自行擺盪時，連線順序跟著即時調整，六邊形永遠不交叉打結 */
  function clockOrder() {
    var idx = [];
    for (var i = 0; i < nodes.length; i++) idx.push(i);
    idx.sort(function (a, b) { return nodes[a].ang - nodes[b].ang; });
    return idx;
  }

  function size() {
    var r = stage.getBoundingClientRect();
    W = Math.max(80, r.width); H = Math.max(80, r.height);
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

  /* 節點 logo 圓盤的視覺中心（節點含名字標籤、disc 置頂）——每次回呼讀一次高度 */
  function discCenter(n) {
    var extra;
    if (n.h != null) extra = (n.h - (n.discH || 0)) / 2;      /* measureAll() 的快取 */
    else {
      var disc = n.el.querySelector('.rx-node-disc');
      extra = (n.el.offsetHeight - (disc ? disc.offsetHeight : 0)) / 2;
    }
    return { x: n.x / 100 * W, y: n.y / 100 * H - extra };
  }

  /* 節點位置用 transform 寫：合成器就能搬，不必每幀重排版、重畫。
     left/top 在動畫開始時歸零一次（init），之後只動 transform。 */
  function place(n) {
    n.el.style.transform = 'translate3d(' + (n.x / 100 * W).toFixed(1) + 'px,' +
                           (n.y / 100 * H).toFixed(1) + 'px,0) translate(-50%,-50%)';
  }

  /* ---- 尺寸量測：節點框含名字標籤；盤徑另存做碰撞橢圓用。
         每 ~400ms 重抓一次（縮放／轉屏後自動跟上），不逐幀讀 DOM。 ---- */
  function measureAll() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var disc = n.el.querySelector('.rx-node-disc');
      n.w = n.el.offsetWidth || 90;
      n.h = n.el.offsetHeight || 90;
      n.discW = (disc && disc.offsetWidth) || 80;
      n.discH = (disc && disc.offsetHeight) || 80;
      /* 邊界安全半幅（%）：節點中心到邊的最小距離＝自身半寬／半高 */
      n.hx = (n.w / 2 + 4) / W * 100;
      n.hy = (n.h / 2 + 4) / H * 100;
    }
  }
  /* 軟邊界：超出即貼邊（連名字標籤一起算在框內，不會露出去） */
  function clampNode(n) {
    n.x = Math.max(n.hx, Math.min(100 - n.hx, n.x));
    n.y = Math.max(n.hy, Math.min(100 - n.hy, n.y));
  }

  /* ---- 磁鐵吸住＝定身：游標靠進 logo（盤＋名牌範圍）→ 吸住、
         亮起螢光、而且**完全不動**（不回陣位、不呼吸擺盪、不被推擠），
         讓使用者安心點擊。只有兩種情況會再動：
         ① 使用者按住拖曳它；② 游標離開範圍 → 解鎖，歸位緩動接手。
         外圈（盤緣外 ~130px）仍有 ×0.3 的輕柔前置吸力，濃縮「靠過去
         時被磁鐵輕輕拉近」的感覺，一旦貼上就立刻凍結。 ---- */
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
      /* 節點框（盤＋名牌）幾何中心＝錨點 (x%, y%) */
      dx = mouse.x - n.x / 100 * W; dy = mouse.y - n.y / 100 * H;
      rx = n.w / 2 + 10; ry = n.h / 2 + 10;
      d = Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
      if (n.locked) {
        if (d > 1.55) setMag(n, false);   /* 滯回：走遠了才放手 */
        continue;                          /* 吸住中：完全不位移 */
      }
      if (d <= 1) { setMag(n, true); continue; }   /* 進入範圍：吸住定身 */
      /* 外圈前置吸力候選（像素距離）：只挑最近的一顆輕拉近 */
      R = (n.discW || 80) / 2 + 130;
      dp = Math.sqrt(dx * dx + dy * dy);
      if (dp < R && dp < bestD) { bestD = dp; best = i; }
    }
    if (best >= 0) {
      n = nodes[best];
      R = (n.discW || 80) / 2 + 130;
      dx = mouse.x - n.x / 100 * W; dy = mouse.y - n.y / 100 * H;
      var k = 0.20 * Math.pow(1 - bestD / R, 1.25) * 0.3;   /* ×0.3 輕柔 */
      n.x += (dx / W) * 100 * k;
      n.y += (dy / H) * 100 * k;
    }
  }

  /* ---- 相碰彈開：兩節點以「盤＋標籤」包絡的橢圓相切判定；
         重疊量每幀只吐出一小截 → 視覺是溫柔滑開，不是撞飛。
         拖曳中的那顆是「推人者」：自己不動，對方吃分離量。 ---- */
  function separate() {
    var i, j, a, b, dx, dy, rx, ry, d, ov, sx, sy;
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        a = nodes[i]; b = nodes[j];
        if (!a.hx || !b.hx) continue;
        dx = (b.x - a.x) / 100 * W;
        dy = (b.y - a.y) / 100 * H;
        /* 接觸半徑＝兩盤半徑和＋標籤留白（橫向多留名字寬度） */
        rx = (a.discW + b.discW) / 2 + Math.max(30, Math.min(90, (a.w + b.w) / 4));
        ry = (a.discH + b.discH) / 2 + 26;
        d = Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
        if (d >= 1) continue;
        if (d < 0.0001) { dx = rx * 0.5; dy = 1; d = 0.5; }  /* 完全重合：隨機一支撐開 */
        ov = 1 - d;
        sx = (dx / rx) / d * ov * rx / W * 100;
        sy = (dy / ry) / d * ov * ry / H * 100;
        if ((a.drag || a.locked) && (b.drag || b.locked)) continue;  /* 兩顆都不能動：作罷 */
        if (a.drag || a.locked)   { b.x += sx * 0.16; b.y += sy * 0.16; }
        else if (b.drag || b.locked) { a.x -= sx * 0.16; a.y -= sy * 0.16; }
        else             { a.x -= sx * 0.08; a.y -= sy * 0.08;
                           b.x += sx * 0.08; b.y += sy * 0.08; }
      }
    }
  }



  /* ---- 牽引線：六邊形六邊，底線＋流動虛線＋螢光電子沿邊順時針跑 ---- */
  var dashPhase = 0;
  function tethers(t, order) {
    var i, a, b;
    /* 底層：實淡線，保證「彼此牽著」這件事一直看得見 */
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
    /* 上層：流動虛線（dashOffset 逆推 → 視覺上朝順時針流動） */
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
    /* 螢光電子：每個邊一顆，沿順時針循環跑 */
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

  /* 任意兩節點間弱鍵結（拖開時全網跟著變形） */
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

  /* 歸位判定的殘留清乾淨：inline 位置一直由 rAF 驅動即可 */

  function frame(t) {
    if (!running) { rafId = null; return; }
    rafId = requestAnimationFrame(frame);
    var dt = Math.min(50, t - (lastT || t)); lastT = t;

    /* 整組順時針緩旋 */
    spin += SPIN_RATE * dt;
    dashPhase += dt * 0.028;

    var i, n, hx, hy, k, rr, pp;
    var ease = 1 - Math.pow(1 - EASE_STEP, dt / 16.7);   /* 穩定 60fps 感知 */
    if (t - lastMeasure > 400) { lastMeasure = t; measureAll(); }  /* 字體/縮放變化跟上 */
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      /* 動態陣位：半徑呼吸＋方位擺盪，疊在整體順時針自轉之上 */
      rr = n.r * (1 + n.swayR * Math.sin(t * n.fR + n.phR));
      pp = n.phi + spin + n.swayP * Math.sin(t * n.fP + n.phP);
      n.ang = pp;                              /* 給 clockOrder 即時排序用 */
      hx = 50 + rr * Math.cos(pp);
      hy = 50 + rr * Math.sin(pp);
      /* 碰壁回彈：目標若跑出安全區，就沿邊「鏡射」折回——節點會在
         觸邊前先被拉轉方向，畫面上看到的是自然彈開而非硬卡住。 */
      if (hx < n.hx) hx = 2 * n.hx - hx;
      if (hx > 100 - n.hx) hx = 2 * (100 - n.hx) - hx;
      if (hy < n.hy) hy = 2 * n.hy - hy;
      if (hy > 100 - n.hy) hy = 2 * (100 - n.hy) - hy;
      if (n.drag) {
        /* 拖曳中：跟隨指針之外，仍有極輕的向心力，放手手感有「重量」 */
        n.x += (hx - n.x) * DRAG_KILL * ease * 0.12;
        n.y += (hy - n.y) * DRAG_KILL * ease * 0.12;
      } else if (n.locked) {
        /* 磁鐵吸住＝定身：不回陣位、不擺盪，原地等點擊 */
      } else {
        n.x += (hx - n.x) * ease;
        n.y += (hy - n.y) * ease;
      }
      clampNode(n);                           /* 絕對不出界（含名字標籤） */
      /* 歸位途中亮起張力光暈；拖曳／吸住中不亮 */
      var off = Math.abs(n.x - hx) + Math.abs(n.y - hy);
      var homing = !n.drag && !n.locked && off > 3.5;
      if (homing !== n.homing) {
        n.homing = homing;
        n.el.classList.toggle('rx-homing', homing);
      }
    }
    separate();                              /* 彼此相碰：溫柔彈開，不重疊 */
    magnetPass();                            /* 磁鐵相吸：最近的一顆吸向游標 */
    for (i = 0; i < nodes.length; i++) {    /* 彈開／吸附後再收一次邊界，然後就位（每幀只寫一次） */
      n = nodes[i];
      if (n.hx) clampNode(n);
      place(n);
    }

    /* 粒子（原質感保留） */
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

    /* 畫布：弱網 → 底粒子 → 牽引線＋電子 */
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

  /* ---- 拖曳：跟手，放開後由緩動牽回旋轉中的陣位 ---- */
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
        if (!n.moved && (dx * dx + dy * dy) < 25) return;  /* 5px 內還算點擊 */
        n.moved = true;
        var r = stage.getBoundingClientRect();
        var W2 = Math.max(80, r.width), H2 = Math.max(80, r.height);
        n.x = (e.clientX - r.left) / W2 * 100;
        n.y = (e.clientY - r.top) / H2 * 100;
        clampNode(n);                          /* 拖到邊也被框住（含標籤） */
        place(n);
      });
      function end(e) {
        if (!n.drag) return;
        n.drag = false;
        el.classList.remove('rx-dragging');
        var moved = n.moved;
        if (moved) {
          /* 拖曳後擋掉這一下點擊導航；歸位期間再點才通行無阻 */
          el.addEventListener('click', function sup(ev) {
            ev.preventDefault();
            el.removeEventListener('click', sup, true);
          }, true);
        }
      }
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      /* 點擊（非拖曳）：平滑導引到下方對應學校的介紹區塊。
         自己算偏移 scrollTo 比原生錨點可靠：導航列是 fixed，原生跳轉
         會被蓋住頂端標題；這裡留 120px 讓 section 標題完整露出。 */
      el.addEventListener('click', function (ev) {
        if (n.moved) { n.moved = false; return; }   /* 剛拖曳完：不算點擊 */
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

  /* ---- 自行變動：每 9–14 秒挑 1–2 顆重設擺盪相位／振幅。
     目標陣位整個換掉，歸位緩動把移動拉成一段約 5 秒的優雅滑行；
     連帶 clockOrder 即時重排，牽引線在滑行途中持續跟手重繪。 ---- */
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
    /* 開場：節點緊貼初始六邊形（仍細微順時針推進中）。從這裡起位置交給 transform */
    nodes.forEach(function (n) { n.el.style.left = '0'; n.el.style.top = '0'; place(n); });
    bindDrag();
    running = true; start();
    /* 畫面外就停：舞台捲出視窗後不再每幀計算、重畫 */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!document.hidden) { running = true; lastT = 0; start(); } }
        else { running = false; stop(); }
      }, { rootMargin: '120px 0px' }).observe(stage);
    }
    clearTimeout(retargetTimer);
    retargetTimer = setTimeout(retarget, 6000 + Math.random() * 4000);
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
