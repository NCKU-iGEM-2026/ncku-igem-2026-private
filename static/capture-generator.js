/*!
 * CAPTURE-Screen laser-cut drawing generator
 * Enter the board thickness t (and the slot fit offset f) to generate the full set of laser-cut parts as DXF / SVG.
 * Plain JavaScript with no external dependencies; drop it into the iGEM wiki static/ folder.
 *
 * Design rules (derived from the final drawing of 2026-10-03):
 *  - The optical layout is fixed: the 13 x 13 cuvette pocket, the light-hole positions and heights, and the inner
 *    size of every chamber do not change with board thickness. Thicker boards make walls grow outward
 *    (the L chamber moves left, the R chamber moves right and down).
 *  - Tabs (wall feet, roof tongues) are 8 wide and stick out by t; they are not adjusted.
 *  - Receiving openings (deck slots, wall-top notches, deck wire holes) shrink by f on each side (default 0.1).
 *  - Chamber wall height = 24 + t (24 mm inner optical height is fixed; the t-thick roof sits in the wall-top notches).
 *  - Enclosure inner size is fixed at 128 x 100 x 81; outer size = inner + 2t. Its finger joints use their own fit offset bf.
 * All units are mm. Deck coordinates start at the lower-left corner of the deck as drawn.
 *
 * Chambers: L = excitation (holds the LED), R = light trap (opposite the LED), T = detection (holds the sensor, at 90 deg).
 */
(function (root) {
  'use strict';

  // ───────────────────────── Fixed design constants (measured at t = 3) ─────────────────────────
  var K = {
    TAB: 8,                 // tab width
    T_MIN: 2.8, T_MAX: 3.2, // allowed board thickness range (mm)
    WALL_INNER_H: 24,       // chamber inner height (wall height = 24 + t)
    // cuvette pocket (deck coordinates)
    cuvL: 54.77, cuvR: 67.77, cuvBot: 33.2, cuvTop: 46.2, cuvY: 39.7,
    // L chamber (excitation) inner size
    L_W: 43, L_H: 29,
    // R chamber (light trap) inner size; its top outer edge sits 0.58 below the top of the cuvette pocket
    R_W: 34, R_H: 30, R_GAP: 0.58,
    // T chamber (detection) inner size: fixed x range, 42 up from the top of the cuvette pocket
    T_X0: 49.35, T_X1: 71.34, T_Y1: 88.2, T_CROSS: 79.96,
    // deck and enclosure
    DECK_W: 127.4, DECK_H: 99.4,
    BOX_IN: { x: 128, y: 100, z: 81 },
    BOX_N: { x: 13, y: 11, z: 9 },      // number of finger segments per edge (odd)
    RAIL_H: 12, RAIL_LONG_GAP: 5, RAIL_SHORTEN: 20,   // support rails each shortened by 20 (2026-10-06)
    WIRE_HOLE: { x: 17.13, y: 33.04, r: 3.5 },
    // light holes (position s in deck coordinates, height z above the deck surface)
    LED_HOLE: { s: 39.7, z: 3.7, r: 2 },   // raised from 3 by 0.7 (2026-10-06)
    // Opening from the cuvette into the R chamber (light trap), straight across from the LED.
    // It was labelled "sensor hole" in earlier drawings; the sensor sits in the T chamber at 90 deg.
    TRAP_HOLE: { s: 38.99, z: 6.6, r: 4 },
    // openings in the enclosure (coordinates from the inner corner of the box)
    LID_HOLE: { x: 53.27, y: 31.7, w: 16, h: 16 },
    FRONT_PORT: { x: 84.46, y: 6.74, w: 26, h: 14.69 },
    SIDE_PORT: { x: 37.57, y: 12.15, w: 25.99, h: 14.69 }
  };

  // ───────────────────────── Geometry helpers ─────────────────────────
  function key(x, y) { return x.toFixed(5) + ',' + y.toFixed(5); }
  function uniqSorted(a) {
    a = a.slice().sort(function (p, q) { return p - q; });
    var out = [];
    for (var i = 0; i < a.length; i++) if (!out.length || a[i] - out[out.length - 1] > 1e-7) out.push(a[i]);
    return out;
  }

  // Build a rectilinear outline from a list of rectangle add/subtract operations applied in order. ops: [x0,y0,x1,y1,+1|-1]
  function rectilinear(ops) {
    var xs = [], ys = [];
    ops.forEach(function (o) { xs.push(o[0], o[2]); ys.push(o[1], o[3]); });
    xs = uniqSorted(xs); ys = uniqSorted(ys);
    var nx = xs.length - 1, ny = ys.length - 1, cell = [];
    for (var i = 0; i < nx; i++) { cell.push([]); for (var j = 0; j < ny; j++) cell[i].push(false); }
    ops.forEach(function (o) {
      var x0 = Math.min(o[0], o[2]), x1 = Math.max(o[0], o[2]), y0 = Math.min(o[1], o[3]), y1 = Math.max(o[1], o[3]);
      for (var i = 0; i < nx; i++) {
        var cx = (xs[i] + xs[i + 1]) / 2; if (cx < x0 || cx > x1) continue;
        for (var j = 0; j < ny; j++) {
          var cy = (ys[j] + ys[j + 1]) / 2; if (cy < y0 || cy > y1) continue;
          cell[i][j] = o[4] > 0;
        }
      }
    });
    var f = function (i, j) { return i >= 0 && j >= 0 && i < nx && j < ny && cell[i][j]; };
    var edges = {}; // start key -> list of [x0,y0,x1,y1]
    function add(x0, y0, x1, y1) { var k = key(x0, y0); (edges[k] = edges[k] || []).push([x0, y0, x1, y1]); }
    for (var i2 = 0; i2 < nx; i2++) for (var j2 = 0; j2 < ny; j2++) {
      if (!cell[i2][j2]) continue;
      var X0 = xs[i2], X1 = xs[i2 + 1], Y0 = ys[j2], Y1 = ys[j2 + 1];
      if (!f(i2, j2 - 1)) add(X0, Y0, X1, Y0);
      if (!f(i2 + 1, j2)) add(X1, Y0, X1, Y1);
      if (!f(i2, j2 + 1)) add(X1, Y1, X0, Y1);
      if (!f(i2 - 1, j2)) add(X0, Y1, X0, Y0);
    }
    var loops = [];
    Object.keys(edges).forEach(function (k) {
      while (edges[k] && edges[k].length) {
        var e = edges[k].pop(), loop = [[e[0], e[1]]], cur = e;
        var guard = 0;
        while (guard++ < 100000) {
          var nk = key(cur[2], cur[3]);
          if (nk === k && (!edges[k] || true) && loop.length > 1 && Math.abs(cur[2] - loop[0][0]) < 1e-7 && Math.abs(cur[3] - loop[0][1]) < 1e-7) break;
          var nxt = edges[nk] && edges[nk].pop();
          if (!nxt) break;
          loop.push([nxt[0], nxt[1]]); cur = nxt;
        }
        loops.push(simplify(loop));
      }
    });
    return loops;
  }
  function simplify(p) {
    var out = [];
    for (var i = 0; i < p.length; i++) {
      var a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
      var cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (Math.abs(cr) > 1e-9) out.push(b);
    }
    return out;
  }
  function area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function rectPts(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }

  // Part: outline = rectilinear loops (largest is the outer edge, others are holes); cuts = inner openings
  function makePiece(name, group, ops, cuts, note) {
    var loops = rectilinear(ops);
    loops.sort(function (a, b) { return Math.abs(area(b)) - Math.abs(area(a)); });
    var outer = loops[0], inner = loops.slice(1);
    var all = outer.slice();
    (cuts || []).forEach(function (c) {
      if (c.type === 'circle') { all.push([c.cx - c.r, c.cy - c.r]); all.push([c.cx + c.r, c.cy + c.r]); }
    });
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    outer.forEach(function (q) { minx = Math.min(minx, q[0]); miny = Math.min(miny, q[1]); maxx = Math.max(maxx, q[0]); maxy = Math.max(maxy, q[1]); });
    function sh(q) { return [q[0] - minx, q[1] - miny]; }
    var c2 = inner.map(function (l) { return { type: 'poly', pts: l.map(sh) }; });
    (cuts || []).forEach(function (c) {
      if (c.type === 'circle') c2.push({ type: 'circle', cx: c.cx - minx, cy: c.cy - miny, r: c.r });
      else c2.push({ type: 'poly', pts: c.pts.map(sh) });
    });
    return { name: name, group: group, outline: outer.map(sh), cuts: c2, w: maxx - minx, h: maxy - miny, note: note || '' };
  }

  // ───────────────────────── Parametric model ─────────────────────────
  function generate(params) {
    var t = +params.t, f = +params.fit, bf = params.boxFit == null ? 0.1 : +params.boxFit;
    var includeOthers = params.includeOthers !== false;
    var T = K.TAB, H = K.WALL_INNER_H + t;
    var pieces = [], checks = [];

    // chamber inner rectangles (deck coordinates)
    var Lx1 = K.cuvL - t, Lx0 = Lx1 - K.L_W, Ly1 = K.cuvTop - t, Ly0 = Ly1 - K.L_H;
    var Rx0 = K.cuvR + t, Rx1 = Rx0 + K.R_W, Ry1 = K.cuvTop - K.R_GAP - t, Ry0 = Ry1 - K.R_H;
    var Tx0 = K.T_X0, Tx1 = K.T_X1, Ty0 = K.cuvTop, Ty1 = K.T_Y1;

    // Walls: axis = direction the wall runs; face = its fixed inner face; dir = side its thickness grows toward
    // s0..s1 = extent on the deck; slots = centers of the feet (= deck slots); holes = light holes
    var walls = [
      { id: 'L1', name: 'L chamber left wall', axis: 'y', face: Lx0, dir: -1, s0: Ly0, s1: Ly1, slots: [Ly0 + 7.25, Ly0 + 22.25] },
      { id: 'L2', name: 'L chamber bottom wall', axis: 'x', face: Ly0, dir: -1, s0: Lx0 - t, s1: Lx1, slots: [Lx0 + 10.25, Lx0 + 24.75] },
      { id: 'L3', name: 'L chamber top wall', axis: 'x', face: Ly1, dir: +1, s0: Lx0 - t, s1: Lx1, slots: [Lx0 + 9, Lx0 + 24.75] },
      { id: 'C1', name: 'Cuvette left wall (Ø4 LED hole)', axis: 'y', face: K.cuvL, dir: -1, s0: Ly0 - t, s1: K.cuvTop, slots: [K.cuvY], holes: [K.LED_HOLE] },
      { id: 'C2', name: 'Cuvette right wall (Ø8 light-trap opening)', axis: 'y', face: K.cuvR, dir: +1, s0: Ry0 - t, s1: K.cuvTop, slots: [K.cuvY], holes: [K.TRAP_HOLE] },
      { id: 'R1', name: 'R chamber right wall', axis: 'y', face: Rx1, dir: +1, s0: Ry0 - t, s1: Ry1 + t, slots: [Ry0 + 6, Ry0 + 24] },
      { id: 'R2', name: 'R chamber bottom wall', axis: 'x', face: Ry0, dir: -1, s0: Rx0, s1: Rx1, slots: [Rx0 + 8.5, Rx0 + 25.5] },
      { id: 'R3', name: 'R chamber top wall', axis: 'x', face: Ry1, dir: +1, s0: Rx0, s1: Rx1, slots: [Rx0 + 8.5, Rx0 + 25.5] },
      { id: 'T1', name: 'T chamber left wall', axis: 'y', face: Tx0, dir: -1, s0: Ty0, s1: Ty1 + t, slots: [Ty0 + 13.67, Ty0 + 28.67] },
      { id: 'T2', name: 'T chamber right wall', axis: 'y', face: Tx1, dir: +1, s0: Ty0, s1: Ty1 + t, slots: [Ty0 + 13.67, Ty0 + 28.67] },
      { id: 'T3', name: 'T chamber divider', axis: 'x', face: K.T_CROSS, dir: +1, s0: Tx0, s1: Tx1, slots: [Tx0 + 10.99], extraNotch: [Tx0 + 10.99] },
      { id: 'T4', name: 'T chamber end wall', axis: 'x', face: Ty1, dir: +1, s0: Tx0, s1: Tx1, slots: [Tx0 + 10.99] }
    ];
    var W = {}; walls.forEach(function (w) { w.notches = (w.extraNotch || []).slice(); W[w.id] = w; });

    // Roofs: inner rectangle + tongues (edge: bottom/top/left/right, at: deck coordinate, wall: the wall it locks into)
    var roofs = [
      { name: 'L chamber roof', x0: Lx0, y0: Ly0, x1: Lx1, y1: Ly1, tabs: [
        { edge: 'bottom', at: Lx0 + 20, wall: 'L2' }, { edge: 'top', at: Lx0 + 20, wall: 'L3' },
        { edge: 'left', at: Ly0 + 14.5, wall: 'L1' }, { edge: 'right', at: Ly0 + 14.5, wall: 'C1' }] },
      { name: 'R chamber roof', x0: Rx0, y0: Ry0, x1: Rx1, y1: Ry1, tabs: [
        { edge: 'bottom', at: Rx0 + 18.5, wall: 'R2' }, { edge: 'top', at: Rx0 + 18.5, wall: 'R3' },
        { edge: 'right', at: Ry0 + 15, wall: 'R1' }] },
      { name: 'T chamber roof', x0: Tx0, y0: Ty0, x1: Tx1, y1: Ty1, tabs: [
        { edge: 'left', at: Ty0 + 22.5, wall: 'T1' }, { edge: 'right', at: Ty0 + 22.5, wall: 'T2' },
        { edge: 'top', at: Tx0 + 10.99, wall: 'T4' }] }
    ];
    roofs.forEach(function (r) { r.tabs.forEach(function (tb) { W[tb.wall].notches.push(tb.at); }); });

    // ── Walls ──
    var deckCuts = [];
    walls.forEach(function (w) {
      var len = w.s1 - w.s0, ops = [[0, 0, len, H, 1]], cuts = [];
      w.slots.forEach(function (c) { var u = c - w.s0; ops.push([u - T / 2, -t, u + T / 2, 0, 1]); });
      w.notches.forEach(function (c) { var u = c - w.s0, hw = T / 2 - f; ops.push([u - hw, H - t, u + hw, H, -1]); });
      (w.holes || []).forEach(function (h) { cuts.push({ type: 'circle', cx: h.s - w.s0, cy: h.z, r: h.r }); });
      pieces.push(makePiece(w.name, 'Chamber walls', ops, cuts));
      // deck slots (receiving side, shrunk by f on each side)
      var mid = w.face + w.dir * t / 2;
      w.slots.forEach(function (c) {
        var a = T / 2 - f, b = t / 2 - f;
        deckCuts.push(w.axis === 'x' ? { type: 'poly', pts: rectPts(c - a, mid - b, c + a, mid + b) }
                                     : { type: 'poly', pts: rectPts(mid - b, c - a, mid + b, c + a) });
      });
      // wall footprint on the deck (used by the checks)
      var lo = Math.min(w.face, w.face + w.dir * t), hi = Math.max(w.face, w.face + w.dir * t);
      w.foot = w.axis === 'x' ? [w.s0, lo, w.s1, hi] : [lo, w.s0, hi, w.s1];
      w.len = len;
    });

    // ── Roofs ──
    roofs.forEach(function (r) {
      var w = r.x1 - r.x0, h = r.y1 - r.y0, ops = [[0, 0, w, h, 1]];
      r.tabs.forEach(function (tb) {
        var a = tb.at - (tb.edge === 'bottom' || tb.edge === 'top' ? r.x0 : r.y0);
        if (tb.edge === 'bottom') ops.push([a - T / 2, -t, a + T / 2, 0, 1]);
        if (tb.edge === 'top') ops.push([a - T / 2, h, a + T / 2, h + t, 1]);
        if (tb.edge === 'left') ops.push([-t, a - T / 2, 0, a + T / 2, 1]);
        if (tb.edge === 'right') ops.push([w, a - T / 2, w + t, a + T / 2, 1]);
      });
      pieces.push(makePiece(r.name, 'Chamber roofs', ops, []));
    });

    // ── Deck ──
    deckCuts.push({ type: 'poly', pts: rectPts(Tx0 - t + f, Ty0 + f, Tx1 + t - f, Ty0 + t - f) }); // wire slot under the T chamber
    deckCuts.push({ type: 'circle', cx: K.WIRE_HOLE.x, cy: K.WIRE_HOLE.y, r: K.WIRE_HOLE.r - f });   // wire hole in the L chamber
    pieces.push(makePiece('Optical deck', 'Deck', [[0, 0, K.DECK_W, K.DECK_H, 1]], deckCuts));

    // ── Enclosure (finger joints) ──
    var BI = K.BOX_IN, BN = K.BOX_N;
    function panel(name, Wd, Ht, nW, nH, maleW, maleH, cuts) {
      // maleW: top/bottom edges (length Wd) own the corners; maleH: left/right edges (length Ht) own the corners
      var ops = [[t, t, Wd - t, Ht - t, 1]];
      function band(L, n, male, mk) {
        var w = L / n;
        for (var i = 0; i < n; i++) {
          var present = male ? i % 2 === 0 : i % 2 === 1;
          if (!present) continue;
          var a = i * w, b = (i + 1) * w;
          if (!male) { a -= bf; b += bf; }
          a = Math.max(a, t); b = Math.min(b, L - t);
          if (b > a) mk(a, b);
        }
      }
      band(Wd, nW, maleW, function (a, b) { ops.push([a, 0, b, t, 1]); ops.push([a, Ht - t, b, Ht, 1]); });
      band(Ht, nH, maleH, function (a, b) { ops.push([0, a, t, b, 1]); ops.push([Wd - t, a, Wd, b, 1]); });
      if (maleW && maleH) { ops.push([0, 0, t, t, 1], [Wd - t, 0, Wd, t, 1], [0, Ht - t, t, Ht, 1], [Wd - t, Ht - t, Wd, Ht, 1]); }
      pieces.push(makePiece(name, 'Enclosure', ops, cuts || []));
    }
    var X = BI.x + 2 * t, Y = BI.y + 2 * t, Z = BI.z + 2 * t;
    function hole(o) { return { type: 'poly', pts: rectPts(o.x + t, o.y + t, o.x + t + o.w, o.y + t + o.h) }; }
    panel('Enclosure base', X, Y, BN.x, BN.y, true, true);
    panel('Enclosure lid (16×16 cuvette hole)', X, Y, BN.x, BN.y, true, true, [hole(K.LID_HOLE)]);
    panel('Enclosure front (USB opening)', X, Z, BN.x, BN.z, false, true, [hole(K.FRONT_PORT)]);
    panel('Enclosure back', X, Z, BN.x, BN.z, false, true);
    panel('Enclosure side (with opening)', Y, Z, BN.y, BN.z, false, false, [hole(K.SIDE_PORT)]);
    panel('Enclosure side', Y, Z, BN.y, BN.z, false, false);


    if (includeOthers) {
      pieces.push(makePiece('12 mm small wall (fixed size)', 'Other', [[0, 0, 12, 27, 1], [2, 27, 10, 30, 1]]));
    }

    // ───────────────────────── Checks ─────────────────────────
    function ok(msg) { checks.push({ level: 'ok', msg: msg }); }
    function warn(msg) { checks.push({ level: 'warn', msg: msg }); }
    function err(msg) { checks.push({ level: 'error', msg: msg }); }
    if (!(t > 0)) err('Board thickness must be greater than 0');
    if (!(t >= K.T_MIN && t <= K.T_MAX)) err('Board thickness ' + t + ' mm is outside the allowed range ' + K.T_MIN.toFixed(1) + '–' + K.T_MAX.toFixed(1) + ' mm. No files are generated.');
    if (f < 0 || f >= 0.5) warn('Slot fit offset ' + f + ' mm is unusual (the tested design uses 0.1)');
    // wall footprints must not overlap and must stay on the deck
    var overlaps = [];
    for (var i = 0; i < walls.length; i++) for (var j = i + 1; j < walls.length; j++) {
      var a = walls[i].foot, b = walls[j].foot;
      var ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
      if (ox > 1e-6 && oy > 1e-6) overlaps.push(walls[i].name + ' ↔ ' + walls[j].name);
    }
    if (overlaps.length) err('Walls overlap: ' + overlaps.join(', ')); else ok('No walls overlap on the deck');
    var out = walls.filter(function (w) { var a = w.foot; return a[0] < 0.5 || a[1] < 0.5 || a[2] > K.DECK_W - 0.5 || a[3] > K.DECK_H - 0.5; });
    if (out.length) err('Walls are too close to or past the deck edge: ' + out.map(function (w) { return w.name; }).join(', ')); else ok('All walls sit inside the deck');
    // every tab must land on its wall
    var bad = [];
    roofs.forEach(function (r) { r.tabs.forEach(function (tb) {
      var w = W[tb.wall]; if (tb.at - T / 2 < w.s0 || tb.at + T / 2 > w.s1) bad.push(r.name + '→' + w.name);
    }); });
    walls.forEach(function (w) { w.slots.forEach(function (c) { if (c - T / 2 < w.s0 || c + T / 2 > w.s1) bad.push(w.name + ' foot'); }); });
    if (bad.length) err('Some tabs run past the end of their wall: ' + bad.join(', ')); else ok('Every foot and roof tongue lines up with its slot or notch');
    // wire hole stays inside the L chamber
    var wh = K.WIRE_HOLE;
    if (wh.x - wh.r < Lx0 || wh.x + wh.r > Lx1 || wh.y - wh.r < Ly0 || wh.y + wh.r > Ly1) warn('The wire hole is no longer fully inside the L chamber');
    ok('Tabs 8 × ' + fmt(t) + '; deck slots ' + fmt(T - 2 * f) + ' × ' + fmt(t - 2 * f) + '; wall-top notches ' + fmt(T - 2 * f) + ' wide, ' + fmt(t) + ' deep');
    ok('Enclosure outer size ' + fmt(X) + ' × ' + fmt(Y) + ' × ' + fmt(Z) + ' (inner size fixed at 128 × 100 × 81)');

    return { params: { t: t, fit: f, boxFit: bf }, pieces: pieces, checks: checks, walls: walls };
  }
  // Parts without joints. They do not depend on board thickness and may be cut from any board.
  // Deck support rails: long = inner length − 5 − 20; short = inner width − thickness of both long rails − 20
  function fixedPieces(shortRail) {
    var G = 'Parts without joints';
    var longRail = K.BOX_IN.x - K.RAIL_LONG_GAP - K.RAIL_SHORTEN;
    if (!(shortRail > 0)) shortRail = K.BOX_IN.y - 2 * 3 - K.RAIL_SHORTEN;
    return [
      big(makePiece('Second plate (13×13 cuvette hole)', G, [[0, 0, K.DECK_W, K.DECK_H, 1]],
        [{ type: 'poly', pts: rectPts(K.cuvL, K.cuvBot, K.cuvR, K.cuvTop) }])),
      kind(makePiece('Deck support rail (long)', G, [[0, 0, longRail, K.RAIL_H, 1]]), 'railLong'),
      kind(makePiece('Deck support rail (long)', G, [[0, 0, longRail, K.RAIL_H, 1]]), 'railLong'),
      makePiece('Deck support rail (short)', G, [[0, 0, shortRail, K.RAIL_H, 1]]),
      makePiece('Deck support rail (short)', G, [[0, 0, shortRail, K.RAIL_H, 1]]),
      makePiece('Lid plug (16×16)', G, [[0, 0, 16, 16, 1]]),
      makePiece('Lid plug cap (18×18)', G, [[0, 0, 18, 18, 1]]),
      makePiece('Square 29.73×30', G, [[0, 0, 29.73, 30, 1]]),
      triangle('Triangle 22×20', G),
      triangle('Triangle 22×20', G)
    ];
  }
  // Large parts always go on sheet 1 (they are not used to fill gaps)
  function big(p) { p.big = true; return p; }
  function kind(p, k) { p.kind = k; return p; }
  function triangle(name, group) {
    return { name: name, group: group || 'Other', outline: [[0, 0], [22, 0], [0, 20]], cuts: [], w: 22, h: 20, note: '' };
  }
  function fmt(v) { return (Math.round(v * 100) / 100).toString(); }

  // ───────────────────────── Nesting (MaxRects, 90° rotation allowed) ─────────────────────────
  function layout(pieces, opt) {
    var SW = opt.sheetW, SH = opt.sheetH, g = opt.gap, M = opt.margin;
    // Each part is padded by the gap g; usable area = sheet minus margins, plus one gap
    var SORTS = {
      side: function (a, b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h; },
      area: function (a, b) { return b.w * b.h - a.w * a.h || Math.max(b.w, b.h) - Math.max(a.w, a.h); },
      short: function (a, b) { return Math.min(b.w, b.h) - Math.min(a.w, a.h) || b.w * b.h - a.w * a.h; },
      perim: function (a, b) { return (b.w + b.h) - (a.w + a.h) || b.w * b.h - a.w * a.h; }
    };
    var items = pieces.map(function (p) { return { p: p, w: p.w + g, h: p.h + g }; })
      .sort(SORTS[opt.sortMain] || SORTS.side);
    var AW = SW - 2 * M + g, AH = SH - 2 * M + g;
    var sheets = [], unplaced = [];
    function newSheet() { var s = { placed: [], free: [{ x: 0, y: 0, w: AW, h: AH }] }; sheets.push(s); return s; }
    function fit(sh, w, h) {
      var best = null;
      sh.free.forEach(function (r) {
        if (w <= r.w + 1e-9 && h <= r.h + 1e-9) {
          var ss = Math.min(r.w - w, r.h - h), ls = Math.max(r.w - w, r.h - h);
          // prefer bottom-left positions for a tighter layout
          var score = [ss, ls, r.y, r.x];
          if (!best || cmp(score, best.score) < 0) best = { x: r.x, y: r.y, score: score };
        }
      });
      return best;
    }
    function cmp(a, b) { for (var i = 0; i < a.length; i++) { if (Math.abs(a[i] - b[i]) > 1e-9) return a[i] - b[i]; } return 0; }
    function place(sh, x, y, w, h) {
      var out = [];
      sh.free.forEach(function (r) {
        if (x >= r.x + r.w || x + w <= r.x || y >= r.y + r.h || y + h <= r.y) { out.push(r); return; }
        if (x > r.x) out.push({ x: r.x, y: r.y, w: x - r.x, h: r.h });
        if (x + w < r.x + r.w) out.push({ x: x + w, y: r.y, w: r.x + r.w - x - w, h: r.h });
        if (y > r.y) out.push({ x: r.x, y: r.y, w: r.w, h: y - r.y });
        if (y + h < r.y + r.h) out.push({ x: r.x, y: y + h, w: r.w, h: r.y + r.h - y - h });
      });
      sh.free = out.filter(function (r, i) {
        return !out.some(function (q, j) { return j !== i && r.x >= q.x - 1e-9 && r.y >= q.y - 1e-9 && r.x + r.w <= q.x + q.w + 1e-9 && r.y + r.h <= q.y + q.h + 1e-9 && (j < i || r.x !== q.x || r.y !== q.y || r.w !== q.w || r.h !== q.h); });
      });
    }
    function tryPut(sh, it, isFill) {
      var a = fit(sh, it.w, it.h), b = fit(sh, it.h, it.w), use = null, rot = false;
      if (a && (!b || cmp(a.score, b.score) <= 0)) use = a; else if (b) { use = b; rot = true; }
      if (!use) return false;
      var w = rot ? it.h : it.w, h = rot ? it.w : it.h;
      place(sh, use.x, use.y, w, h);
      sh.placed.push({ piece: it.p, x: M + use.x, y: M + use.y, rot: rot, w: w - g, h: h - g, fill: !!isFill });
      return true;
    }
    items.forEach(function (it) {
      var done = false;
      for (var s = 0; s <= sheets.length && !done; s++) {
        var sh = sheets[s] || null;
        if (!sh) { if (it.w > AW && it.w > AH) break; sh = newSheet(); }
        var a = fit(sh, it.w, it.h), b = fit(sh, it.h, it.w), use = null, rot = false;
        if (a && (!b || cmp(a.score, b.score) <= 0)) use = a; else if (b) { use = b; rot = true; }
        if (use) {
          var w = rot ? it.h : it.w, h = rot ? it.w : it.h;
          place(sh, use.x, use.y, w, h);
          sh.placed.push({ piece: it.p, x: M + use.x, y: M + use.y, rot: rot, w: w - g, h: h - g });
          done = true;
        } else if (sh.placed.length === 0) { sheets.pop(); break; }
      }
      if (!done) unplaced.push(it.p);
    });
    // Fill: put opt.fill parts into free space on existing sheets; what does not fit goes to overflow (no new sheet)
    var overflow = [];
    (opt.fill || []).map(function (p) { return { p: p, w: p.w + g, h: p.h + g }; })
      .sort(SORTS[opt.sortFill] || SORTS.area)
      .forEach(function (it) {
        for (var s = 0; s < sheets.length; s++) if (tryPut(sheets[s], it, true)) return;
        overflow.push(it.p);
      });
    return { sheets: sheets.length ? sheets : [{ placed: [] }], unplaced: unplaced, overflow: overflow, sheetW: SW, sheetH: SH };
  }

  // Full plan: jointed parts (and large parts) go on sheet 1, small parts without joints fill the gaps, and the rest becomes sheet 2.
  // Short rail = inner width − thickness of both long rails − 20; a long rail on sheet 1 is t thick, on sheet 2 it is t2.
  function plan(params, lopt) {
    var r = generate(params);
    var jointed = r.pieces.filter(function (x) { return params.includeBox !== false || x.group !== 'Enclosure'; });
    var t = +params.t, t2 = +(params.t2 || 3), short = K.BOX_IN.y - 2 * t - K.RAIL_SHORTEN, best = null, fixed;
    function area(list) { return list.reduce(function (s, p) { return s + p.w * p.h; }, 0); }
    for (var pass = 0; pass < 3; pass++) {
      fixed = fixedPieces(short);
      var bigs = fixed.filter(function (p) { return p.big; }), movable = fixed.filter(function (p) { return !p.big; });
      var main = jointed.concat(bigs);
      best = null;
      // try several sort orders; keep the one with the fewest sheets and the least area left for sheet 2
      ['side', 'area', 'short', 'perim'].forEach(function (sm) {
        ['area', 'side', 'short'].forEach(function (sf) {
          var lay = layout(main, { sheetW: lopt.sheetW, sheetH: lopt.sheetH, gap: lopt.gap, margin: lopt.margin, fill: movable, sortMain: sm, sortFill: sf });
          var score = [lay.sheets.length + (lay.unplaced.length ? 99 : 0), area(lay.overflow), lay.overflow.length];
          if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && (score[1] < best.score[1] - 1e-9 || (Math.abs(score[1] - best.score[1]) < 1e-9 && score[2] < best.score[2]))))
            best = { lay: lay, main: main, score: score };
        });
      });
      var longOnMain = 0;
      best.lay.sheets.forEach(function (sh) { sh.placed.forEach(function (pl) { if (pl.fill && pl.piece.kind === 'railLong') longOnMain++; }); });
      var need = K.BOX_IN.y - (longOnMain * t + (2 - longOnMain) * t2) - K.RAIL_SHORTEN;
      if (Math.abs(need - short) < 1e-9) break;
      short = need;
    }
    var second = layout(best.lay.overflow, lopt);
    return { r: r, main: best.main, jointed: jointed, fixed: fixed, lay: best.lay, second: second, shortRail: short };
  }

  // map part coordinates to sheet coordinates (rot: 90° counter-clockwise)
  function xf(pl) {
    var p = pl.piece;
    return function (q) {
      return pl.rot ? [pl.x + (p.h - q[1]), pl.y + q[0]] : [pl.x + q[0], pl.y + q[1]];
    };
  }

  // ───────────────────────── DXF export (R12, closed polylines) ─────────────────────────
  function toDXF(lay, opt) {
    opt = opt || {};
    var L = [], gapX = 20;
    function g(c, v) { L.push(String(c), String(v)); }
    function n(v) { return (Math.round(v * 1e5) / 1e5).toString(); }
    g(0, 'SECTION'); g(2, 'HEADER'); g(9, '$ACADVER'); g(1, 'AC1009'); g(9, '$INSUNITS'); g(70, 4); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES');
    g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 1);
    g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, 0.0);
    g(0, 'ENDTAB');
    var layers = [['CUT', 1], ['CUT_INNER', 5], ['SHEET', 8]];
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, layers.length);
    layers.forEach(function (l) { g(0, 'LAYER'); g(2, l[0]); g(70, 0); g(62, l[1]); g(6, 'CONTINUOUS'); });
    g(0, 'ENDTAB'); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    function poly(pts, layer) {
      g(0, 'POLYLINE'); g(8, layer); g(66, 1); g(70, 1); g(10, 0); g(20, 0); g(30, 0);
      pts.forEach(function (q) { g(0, 'VERTEX'); g(8, layer); g(10, n(q[0])); g(20, n(q[1])); g(30, 0); });
      g(0, 'SEQEND'); g(8, layer);
    }
    lay.sheets.forEach(function (sh, si) {
      var ox = si * (lay.sheetW + gapX);
      if (opt.sheetFrame) poly(rectPts(ox, 0, ox + lay.sheetW, lay.sheetH), 'SHEET');
      sh.placed.forEach(function (pl) {
        var T = xf(pl), S = function (q) { var r = T(q); return [r[0] + ox, r[1]]; };
        pl.piece.cuts.forEach(function (c) {
          if (c.type === 'circle') { var cc = S([c.cx, c.cy]); g(0, 'CIRCLE'); g(8, 'CUT_INNER'); g(10, n(cc[0])); g(20, n(cc[1])); g(30, 0); g(40, n(c.r)); }
          else poly(c.pts.map(S), 'CUT_INNER');
        });
        poly(pl.piece.outline.map(S), 'CUT');
      });
    });
    g(0, 'ENDSEC'); g(0, 'EOF');
    return L.join('\n') + '\n';
  }

  // ───────────────────────── SVG export (units: mm) ─────────────────────────
  // opt.preview = true renders the on-page preview (colored by CSS classes, non-scaling strokes)
  function toSVG(lay, opt) {
    opt = opt || {};
    var gapX = 20, nS = Math.max(1, lay.sheets.length), P = !!opt.preview;
    var TW = nS * lay.sheetW + (nS - 1) * gapX, TH = lay.sheetH;
    var o = [];
    o.push('<svg xmlns="http://www.w3.org/2000/svg" ' + (P ? 'class="cg-svg" role="img" aria-label="Laser-cut layout preview" ' : 'width="' + TW + 'mm" height="' + TH + 'mm" ') +
      (P ? 'viewBox="-2 -12 ' + (TW + 4) + ' ' + (TH + 14) + '">' : 'viewBox="-2 -2 ' + (TW + 4) + ' ' + (TH + 4) + '">'));
    var CUT = P ? 'class="cg-cut"' : 'fill="none" stroke="#ff0000" stroke-width="0.1"';
    var INN = P ? 'class="cg-inner"' : 'fill="none" stroke="#0000ff" stroke-width="0.1"';
    function d(pts) { return 'M' + pts.map(function (q) { return q[0].toFixed(3) + ',' + (TH - q[1]).toFixed(3); }).join('L') + 'Z'; }
    function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    lay.sheets.forEach(function (sh, si) {
      var ox = si * (lay.sheetW + gapX);
      if (P) {
        o.push('<rect class="cg-sheet" x="' + ox + '" y="0" width="' + lay.sheetW + '" height="' + lay.sheetH + '"/>');
        o.push('<text class="cg-sheet-label" x="' + ox + '" y="-4">Sheet ' + (si + 1 + (opt.sheetOffset || 0)) + ' · ' + lay.sheetW + ' × ' + lay.sheetH + '</text>');
      } else if (opt.sheetFrame) {
        o.push('<rect x="' + ox + '" y="0" width="' + lay.sheetW + '" height="' + lay.sheetH + '" fill="none" stroke="#999999" stroke-width="0.1"/>');
      }
      sh.placed.forEach(function (pl) {
        var T = xf(pl), S = function (q) { var r = T(q); return [r[0] + ox, r[1]]; };
        o.push(P ? '<g class="cg-piece' + (pl.fill || pl.piece.big ? ' cg-is-fill' : '') + '" data-group="' + esc(pl.piece.group) + '">' : '<g>');
        if (P) o.push('<title>' + esc(pl.piece.name) + ' (' + fmt(pl.piece.w) + ' × ' + fmt(pl.piece.h) + ' mm)</title>');
        o.push('<path ' + CUT + ' d="' + d(pl.piece.outline.map(S)) + '"/>');
        pl.piece.cuts.forEach(function (c) {
          if (c.type === 'circle') { var cc = S([c.cx, c.cy]); o.push('<circle ' + INN + ' cx="' + cc[0].toFixed(3) + '" cy="' + (TH - cc[1]).toFixed(3) + '" r="' + c.r + '"/>'); }
          else o.push('<path ' + INN + ' d="' + d(c.pts.map(S)) + '"/>');
        });
        o.push('</g>');
      });
    });
    o.push('</svg>');
    return o.join('');
  }

  // ───────────────────────── Web interface ─────────────────────────
  function mount(root) {
    if (typeof root === 'string') root = document.querySelector(root);
    if (!root) return;
    root.classList.add('cg');
    root.innerHTML = [
      '<div class="cg-grid">',
      ' <form class="cg-panel" id="cg-form" novalidate>',
      '  <div class="cg-field cg-field-main">',
      '   <label for="cg-t">Board thickness t</label>',
      '   <div class="cg-stepper">',
      '    <button type="button" class="cg-step" data-step="-0.05" aria-label="Decrease by 0.05 mm">−</button>',
      '    <input id="cg-t" type="number" inputmode="decimal" step="0.01" min="2.8" max="3.2" value="3.00" aria-describedby="cg-t-hint">',
      '    <span class="cg-unit">mm</span>',
      '    <button type="button" class="cg-step" data-step="0.05" aria-label="Increase by 0.05 mm">+</button>',
      '   </div>',
      '   <p class="cg-hint" id="cg-t-hint">Measure this batch of boards with calipers at 3 points and enter the average. Allowed range: 2.80–3.20 mm.</p>',
      '  </div>',
      '  <div class="cg-field">',
      '   <label for="cg-fit">Slot fit offset (per side)</label>',
      '   <div class="cg-inline"><input id="cg-fit" type="number" inputmode="decimal" step="0.01" min="0" max="0.5" value="0.10"><span class="cg-unit">mm</span></div>',
      '   <p class="cg-hint">Deck slots, wall-top notches and wire holes shrink by this much on each side to absorb the laser kerf. The tested design uses 0.10.</p>',
      '  </div>',
      '  <div class="cg-field">',
      '   <label for="cg-bfit">Enclosure finger-joint offset (per side)</label>',
      '   <div class="cg-inline"><input id="cg-bfit" type="number" inputmode="decimal" step="0.01" min="0" max="0.5" value="0.10"><span class="cg-unit">mm</span></div>',
      '   <p class="cg-hint">The gaps between enclosure fingers shrink by this much on each side. Default 0.10, same as the inner slots.</p>',
      '  </div>',
      '  <details class="cg-more">',
      '   <summary>Sheet and layout</summary>',
      '   <div class="cg-two">',
      '    <div class="cg-field"><label for="cg-sw">Sheet width</label><div class="cg-inline"><input id="cg-sw" type="number" step="1" min="100" value="450"><span class="cg-unit">mm</span></div></div>',
      '    <div class="cg-field"><label for="cg-sh">Sheet height</label><div class="cg-inline"><input id="cg-sh" type="number" step="1" min="100" value="300"><span class="cg-unit">mm</span></div></div>',
      '    <div class="cg-field"><label for="cg-gap">Gap between parts</label><div class="cg-inline"><input id="cg-gap" type="number" step="0.5" min="0" value="2"><span class="cg-unit">mm</span></div></div>',
      '    <div class="cg-field"><label for="cg-t2">Sheet 2 thickness</label><div class="cg-inline"><input id="cg-t2" type="number" step="0.01" min="1" value="3.00"><span class="cg-unit">mm</span></div></div>',
      '    <div class="cg-field"><label for="cg-margin">Sheet margin</label><div class="cg-inline"><input id="cg-margin" type="number" step="0.5" min="0" value="3"><span class="cg-unit">mm</span></div></div>',
      '   </div>',
      '   <label class="cg-check"><input id="cg-box" type="checkbox" checked> Include the 6 enclosure panels</label>',
      '   <label class="cg-check"><input id="cg-others" type="checkbox" checked> Include the 12 mm small wall</label>',
      '   <label class="cg-check"><input id="cg-frame" type="checkbox"> Add the sheet outline to the DXF (SHEET layer, do not cut)</label>',
      '  </details>',
      '  <div class="cg-actions">',
      '   <button type="button" class="cg-btn cg-btn-primary" id="cg-dl-dxf">Download DXF</button>',
      '   <button type="button" class="cg-btn" id="cg-dl-svg">Download SVG</button>',
      '  </div>',
      '  <div class="cg-actions cg-actions-quiet">',
      '   <button type="button" class="cg-link" id="cg-copy-dxf">Copy DXF text</button>',
      '   <span class="cg-toast" id="cg-toast" role="status" aria-live="polite"></span>',
      '  </div>',
      ' </form>',
      ' <section class="cg-main">',
      '  <div class="cg-summary" id="cg-summary"></div>',
      '  <h3 class="cg-h cg-h-sheet">Sheet 1: all jointed parts and large parts, with small parts filling the gaps (cut from one batch of boards)</h3>',
      '  <div class="cg-preview" id="cg-preview"></div>',
      '  <div class="cg-legend"><span><i class="cg-sw-cut"></i>Outline (CUT, cut last)</span><span><i class="cg-sw-inner"></i>Inner holes (CUT_INNER, cut first)</span><span><i class="cg-sw-fill"></i>Parts without joints (large ones fixed on sheet 1, small ones fill gaps)</span><span>Hover over a part to see its name</span></div>',
      '  <div class="cg-fixed">',
      '   <div class="cg-fixed-head">',
      '    <div><h3 class="cg-h">Sheet 2: small parts that do not fit on sheet 1</h3><p class="cg-hint" id="cg-fx-hint"></p></div>',
      '    <div class="cg-actions"><button type="button" class="cg-btn" id="cg-fx-dxf">Download DXF</button><button type="button" class="cg-btn" id="cg-fx-svg">Download SVG</button><button type="button" class="cg-link" id="cg-fx-copy">Copy DXF text</button></div>',
      '   </div>',
      '   <div class="cg-preview cg-preview-fixed" id="cg-fx-preview"></div>',
      '  </div>',
      '  <div class="cg-lower">',
      '   <div><h3 class="cg-h">Checks</h3><ul class="cg-checks" id="cg-checks"></ul></div>',
      '   <div><h3 class="cg-h">Parts list</h3><div class="cg-table-wrap"><table class="cg-table"><thead><tr><th>Part</th><th>Size (mm)</th><th>Qty</th><th>Sheet</th></tr></thead><tbody id="cg-parts"></tbody></table></div></div>',
      '  </div>',
      ' </section>',
      '</div>'
    ].join('');

    var $ = function (id) { return root.querySelector('#' + id); };
    var state = {};
    var fixedLay = null;
    function num(id, d) { var v = parseFloat($(id).value); return isFinite(v) ? v : d; }
    function renderSecond(second) {
      fixedLay = second;
      var n = second.sheets[0].placed.length;
      ['cg-fx-dxf', 'cg-fx-svg', 'cg-fx-copy'].forEach(function (id) { $(id).disabled = n === 0; });
      if (!n) {
        $('cg-fx-hint').textContent = 'All parts without joints fit into the gaps on sheet 1. No second sheet is needed.';
        $('cg-fx-preview').innerHTML = '<p class="cg-empty">Sheet 1 already holds every part.</p>';
        return;
      }
      $('cg-fx-hint').textContent = n + (n === 1 ? ' part does' : ' parts do') + ' not fit on sheet 1 and ' + (n === 1 ? 'is' : 'are') + ' laid out on a second ' + second.sheetW + ' × ' + second.sheetH + ' sheet. These parts do not depend on board thickness, so any board works.';
      $('cg-fx-preview').innerHTML = toSVG(second, { preview: true, sheetOffset: state.lay.sheets.length });
    }
    function run() {
      var p = { t: num('cg-t', 3), fit: num('cg-fit', 0.1), boxFit: num('cg-bfit', 0.1), includeOthers: $('cg-others').checked,
                includeBox: $('cg-box').checked, t2: num('cg-t2', 3) };
      var P = plan(p, { sheetW: num('cg-sw', 450), sheetH: num('cg-sh', 300), gap: num('cg-gap', 2), margin: num('cg-margin', 3) });
      var r = P.r, lay = P.lay, pcs = P.main;
      state = { r: r, lay: lay, pcs: pcs };
      $('cg-preview').innerHTML = toSVG(lay, { preview: true });
      var errs = r.checks.filter(function (c) { return c.level === 'error'; }).length;
      var warns = r.checks.filter(function (c) { return c.level === 'warn'; }).length;
      if (lay.unplaced.length) errs++;
      var tOk = p.t >= K.T_MIN && p.t <= K.T_MAX;
      $('cg-t').setAttribute('aria-invalid', tOk ? 'false' : 'true');
      ['cg-dl-dxf', 'cg-dl-svg', 'cg-copy-dxf'].forEach(function (id) { $(id).disabled = !!errs; });
      $('cg-summary').innerHTML =
        '<div class="cg-stat"><span class="cg-stat-k">Thickness</span><span class="cg-stat-v">' + fmt(p.t) + '<small> mm</small></span></div>' +
        '<div class="cg-stat"><span class="cg-stat-k">Deck slot</span><span class="cg-stat-v">' + fmt(K.TAB - 2 * p.fit) + ' × ' + fmt(p.t - 2 * p.fit) + '</span></div>' +
        '<div class="cg-stat"><span class="cg-stat-k">Sheet 1</span><span class="cg-stat-v">' + lay.sheets.reduce(function (n, sh) { return n + sh.placed.length; }, 0) + '<small> parts</small></span></div>' +
        '<div class="cg-stat"><span class="cg-stat-k">Sheet 2</span><span class="cg-stat-v">' + lay.overflow.length + '<small> parts</small></span></div>' +

        '<div class="cg-pill ' + (errs ? 'is-error' : warns ? 'is-warn' : 'is-ok') + '">' + (errs ? errs + (errs === 1 ? ' problem, do not cut yet' : ' problems, do not cut yet') : warns ? warns + (warns === 1 ? ' warning' : ' warnings') : 'All checks passed') + '</div>';
      var items = r.checks.slice();
      var nFill = 0; lay.sheets.forEach(function (sh) { sh.placed.forEach(function (pl) { if (pl.fill) nFill++; }); });
      items.push({ level: 'ok', msg: 'The second plate is on sheet 1. Of the other ' + (nFill + lay.overflow.length) + ' parts without joints, ' + nFill + ' fill gaps on sheet 1 and ' + lay.overflow.length + ' go on sheet 2' });
      items.push({ level: 'ok', msg: 'Support rails: long ' + fmt(K.BOX_IN.x - K.RAIL_LONG_GAP - K.RAIL_SHORTEN) + ', short ' + fmt(P.shortRail) + ' (= 100 − both long-rail thicknesses − 20)' });
      if (lay.unplaced.length) items.unshift({ level: 'error', msg: 'Some parts are larger than the sheet: ' + lay.unplaced.map(function (x) { return x.name; }).join(', ') });
      $('cg-checks').innerHTML = items.map(function (c) {
        return '<li class="is-' + c.level + '"><span class="cg-dot" aria-hidden="true"></span><span>' + c.msg + '</span></li>';
      }).join('');
      var rows = {}, order = [];
      function addRow(x, where) {
        var k = x.name + '|' + fmt(x.w) + '|' + fmt(x.h) + '|' + where;
        if (!rows[k]) { rows[k] = { n: x.name, s: fmt(x.w) + ' × ' + fmt(x.h), q: 0, g: x.group, w: where }; order.push(k); }
        rows[k].q++;
      }
      pcs.forEach(function (x) { addRow(x, 'Sheet 1'); });
      lay.sheets.forEach(function (sh) { sh.placed.forEach(function (pl) { if (pl.fill) addRow(pl.piece, 'Sheet 1 (gap)'); }); });
      lay.overflow.forEach(function (x) { addRow(x, 'Sheet 2'); });
      var lastG = '';
      $('cg-parts').innerHTML = order.map(function (k) {
        var x = rows[k], head = '';
        if (x.g !== lastG) { head = '<tr class="cg-grp"><td colspan="4">' + x.g + '</td></tr>'; lastG = x.g; }
        return head + '<tr><td>' + x.n.replace(/ \([^)]*\)/g, '') + '</td><td class="cg-num">' + x.s + '</td><td class="cg-num">' + x.q + '</td><td>' + x.w + '</td></tr>';
      }).join('');
      renderSecond(P.second);
      try { localStorage.setItem('cg-params-v2', JSON.stringify(p)); } catch (e) { /* saving is optional */ }
    }
    function fname(ext) { return 'CAPTURE-Screen_t' + fmt(num('cg-t', 3)).replace('.', 'p') + '_fit' + fmt(num('cg-fit', 0.1)).replace('.', 'p') + '.' + ext; }
    function toast(msg) { var el = $('cg-toast'); el.textContent = msg; clearTimeout(toast.h); toast.h = setTimeout(function () { el.textContent = ''; }, 3200); }
    function dxfText() { return toDXF(state.lay, { sheetFrame: $('cg-frame').checked }); }
    function download(text, name, type) {
      try {
        var url = URL.createObjectURL(new Blob([text], { type: type }));
        var a = document.createElement('a'); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        toast('Downloaded ' + name);
      } catch (e) { toast('This page cannot download files. Use "Copy DXF text" instead.'); }
    }
    $('cg-fx-dxf').addEventListener('click', function () { download(toDXF(fixedLay, { sheetFrame: $('cg-frame').checked }), 'CAPTURE-Screen_parts-without-joints.dxf', 'application/dxf'); });
    $('cg-fx-svg').addEventListener('click', function () { download(toSVG(fixedLay, { sheetFrame: $('cg-frame').checked }), 'CAPTURE-Screen_parts-without-joints.svg', 'image/svg+xml'); });
    $('cg-fx-copy').addEventListener('click', function () {
      var txt = toDXF(fixedLay, { sheetFrame: $('cg-frame').checked });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { toast('Copied the sheet 2 DXF'); }, function () { toast('Could not copy to the clipboard'); });
      } else toast('Could not copy to the clipboard');
    });
    $('cg-dl-dxf').addEventListener('click', function () { download(dxfText(), fname('dxf'), 'application/dxf'); });
    $('cg-dl-svg').addEventListener('click', function () { download(toSVG(state.lay, { sheetFrame: $('cg-frame').checked }), fname('svg'), 'image/svg+xml'); });
    $('cg-copy-dxf').addEventListener('click', function () {
      var txt = dxfText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { toast('Copied. Paste into a text file and save it as .dxf'); }, function () { toast('Could not copy to the clipboard'); });
      } else toast('Could not copy to the clipboard');
    });
    root.querySelectorAll('.cg-step').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = Math.round((num('cg-t', 3) + parseFloat(b.getAttribute('data-step'))) * 100) / 100;
        v = Math.min(K.T_MAX, Math.max(K.T_MIN, v));
        $('cg-t').value = v.toFixed(2); run();
      });
    });
    root.querySelector('#cg-form').addEventListener('input', run);
    root.querySelector('#cg-form').addEventListener('change', run);
    root.querySelector('#cg-form').addEventListener('submit', function (e) { e.preventDefault(); });
    try {
      var saved = JSON.parse(localStorage.getItem('cg-params-v2') || 'null');
      if (saved && saved.t >= K.T_MIN && saved.t <= K.T_MAX) { $('cg-t').value = (+saved.t).toFixed(2); $('cg-fit').value = (+saved.fit).toFixed(2); $('cg-bfit').value = (+saved.boxFit).toFixed(2); }
    } catch (e) { /* ignore */ }
    run();
  }

  var API = { K: K, generate: generate, layout: layout, toDXF: toDXF, toSVG: toSVG, rectilinear: rectilinear, mount: mount, fixedPieces: fixedPieces, plan: plan };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.CaptureGen = API;
})(this);
