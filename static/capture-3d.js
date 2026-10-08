/* The laser-cut reader in 3D.
 *
 * Nothing here is modelled by hand. Every board is the outline that
 * capture-generator.js cuts, given its thickness and put where
 * CaptureGen.assembly() says it goes: the walls on their deck slots, the
 * roofs in their wall-top notches, the deck on its rails, the enclosure
 * around it. Change the generator and this view changes with it.
 *
 * One thing is not a cut part and is drawn as a plain shape: the cuvette. Parts the drawing gives no exact spot for (the rails,
 * which wall of the enclosure faces which way) say so when picked.
 *
 * A small WebGL 1 renderer, no library and nothing fetched, as the iGEM asset
 * rules require: flat-shaded faces, the board edges drawn over them, an orbit
 * camera, and picking by drawing each part in its own colour off screen.
 * Without WebGL the panel keeps its written description.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------
     TRIANGULATION: a polygon with holes, cut into vertical slabs
     Every vertex's x starts a new slab, so inside a slab each edge is one
     straight piece; the edges crossing a slab, sorted bottom to top, pair up
     (even-odd) into trapezoids, and each trapezoid is two triangles. Exact
     for any outline and holes that do not cross each other, and it cannot
     get stuck the way ear clipping can on rows of aligned slots.
     ------------------------------------------------------------------ */
  function triangulate(outer, holes) {
    var loops = [outer].concat(holes), edges = [], xs = [];
    loops.forEach(function (l) {
      for (var i = 0; i < l.length; i++) {
        var a = l[i], b = l[(i + 1) % l.length];
        xs.push(a[0]);
        if (Math.abs(a[0] - b[0]) > 1e-9) edges.push(a[0] < b[0] ? [a, b] : [b, a]);
      }
    });
    xs.sort(function (p, q) { return p - q; });
    var X = xs.filter(function (v, i) { return i === 0 || v - xs[i - 1] > 1e-9; });
    var pts = [], tris = [];
    function yAt(e, x) { return e[0][1] + (e[1][1] - e[0][1]) * (x - e[0][0]) / (e[1][0] - e[0][0]); }
    function add(p) { pts.push(p); return pts.length - 1; }
    for (var i = 0; i + 1 < X.length; i++) {
      var x0 = X[i], x1 = X[i + 1], xm = (x0 + x1) / 2;
      var cr = edges.filter(function (e) { return e[0][0] < xm && e[1][0] > xm; });
      cr.sort(function (a, b) { return yAt(a, xm) - yAt(b, xm); });
      for (var k = 0; k + 1 < cr.length; k += 2) {
        var lo = cr[k], hi = cr[k + 1];
        var a = add([x0, yAt(lo, x0)]), b = add([x1, yAt(lo, x1)]), c = add([x1, yAt(hi, x1)]), d = add([x0, yAt(hi, x0)]);
        tris.push([a, b, c], [a, c, d]);
      }
    }
    // drop the slivers of zero area (a trapezoid that narrows to a point)
    tris = tris.filter(function (t) {
      var p = pts[t[0]], q = pts[t[1]], r = pts[t[2]];
      return Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])) > 1e-12;
    });
    return { pts: pts, tris: tris };
  }

  function circlePts(c, n) {
    var out = [];
    for (var i = 0; i < n; i++) { var a = 2 * Math.PI * i / n; out.push([c.cx + c.r * Math.cos(a), c.cy + c.r * Math.sin(a)]); }
    return out;
  }

  /* ------------------------------------------------------------------
     MESHES: a board = its outline and cuts, given thickness
     ------------------------------------------------------------------ */
  function boardMesh(part) {
    var p = part.piece, O = part.O, U = part.U, V = part.V, N = part.N;
    function W(q, w) {
      var u = q[0] + p.ox, v = q[1] + p.oy;
      return [O[0] + U[0] * u + V[0] * v + N[0] * w, O[1] + U[1] * u + V[1] * v + N[1] * w, O[2] + U[2] * u + V[2] * v + N[2] * w];
    }
    var holes = p.cuts.map(function (c) { return c.type === 'circle' ? circlePts(c, 32) : c.pts; });
    var tri = triangulate(p.outline, holes);
    var tv = [], lv = [];
    function face(a, b, c) { tv.push(a, b, c); }
    tri.tris.forEach(function (t) {
      face(W(tri.pts[t[0]], 0), W(tri.pts[t[1]], 0), W(tri.pts[t[2]], 0));
      face(W(tri.pts[t[0]], 1), W(tri.pts[t[1]], 1), W(tri.pts[t[2]], 1));
    });
    [p.outline].concat(holes).forEach(function (loop, li) {
      var round = li > 0 && p.cuts[li - 1].type === 'circle';
      for (var i = 0; i < loop.length; i++) {
        var a = loop[i], b = loop[(i + 1) % loop.length];
        var a0 = W(a, 0), b0 = W(b, 0), a1 = W(a, 1), b1 = W(b, 1);
        face(a0, b0, b1); face(a0, b1, a1);
        lv.push(a0, b0, a1, b1);
        if (!round) lv.push(a0, a1);
      }
    });
    return { tris: tv, lines: lv, area: tri };
  }

  function boxMesh(x0, y0, z0, x1, y1, z1) {
    var c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    var f = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], tv = [], lv = [];
    f.forEach(function (q) { tv.push(c[q[0]], c[q[1]], c[q[2]], c[q[0]], c[q[2]], c[q[3]]); });
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { lv.push(c[e[0]], c[e[1]]); });
    return { tris: tv, lines: lv };
  }

  // a ball, for the LED's head
  function ballMesh(c, r, n) {
    var tv = [], P = function (i, j) {
      var th = Math.PI * i / n, ph = 2 * Math.PI * j / (2 * n);
      return [c[0] + r * Math.sin(th) * Math.cos(ph), c[1] + r * Math.sin(th) * Math.sin(ph), c[2] + r * Math.cos(th)];
    };
    for (var i = 0; i < n; i++) for (var j = 0; j < 2 * n; j++) {
      var a = P(i, j), b = P(i + 1, j), d = P(i, j + 1), e = P(i + 1, j + 1);
      tv.push(a, b, e, a, e, d);
    }
    return { tris: tv, lines: [] };
  }

  /* ------------------------------------------------------------------
     SMALL MATRIX KIT (column-major, as WebGL wants)
     ------------------------------------------------------------------ */
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
    }
    return o;
  }
  function persp(fov, asp, n, f) {
    var t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
    return o;
  }
  function lookAt(e, c, up) {
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
    function crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    var z = nrm(sub(e, c)), x = nrm(crs(up, z)), y = crs(z, x);
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]);
  }

  /* ------------------------------------------------------------------
     THE VIEWER
     ------------------------------------------------------------------ */
  var COL = {
    core: [0.20, 0.23, 0.245, 1], coreEdge: [0.56, 0.65, 0.69, 0.75],
    rail: [0.20, 0.23, 0.245, 1], railEdge: [0.56, 0.65, 0.69, 0.75],
    // the cuvette plate covers the whole optical layer, so it is drawn as glass: there, but not in the way
    plate: [0.55, 0.64, 0.68, 0.10], plateEdge: [0.70, 0.79, 0.83, 0.85],
    cap: [0.20, 0.23, 0.245, 1], capEdge: [0.56, 0.65, 0.69, 0.75],
    trap: [0.20, 0.23, 0.245, 1], trapEdge: [0.56, 0.65, 0.69, 0.75],
    under: [0.20, 0.23, 0.245, 1], underEdge: [0.56, 0.65, 0.69, 0.75],
    box: [0.78, 0.63, 0.42, 0.16], boxEdge: [0.89, 0.77, 0.57, 0.55],
    proxy: [0.36, 0.45, 0.50, 1], proxyEdge: [0.62, 0.72, 0.77, 0.7],
    cuvette: [0.80, 0.89, 0.94, 0.28], cuvetteEdge: [0.86, 0.93, 0.97, 0.75],
    pick: [0.39, 0.87, 0.60, 1]
  };
  var MODES = {
    core:  { label: 'Optical core', show: { core: 1, trap: 1, under: 1, plate: 1, proxy: 1, sensor: 1 }, dist: 250, z: 12 },
    open:  { label: 'Chambers open', show: { core: 1, trap: 1, under: 1, plate: 1, proxy: 1, sensor: 1, elec: 1, wire: 1 }, explode: 1, dist: 330, z: 6 },
    whole: { label: 'Whole reader', show: { core: 1, trap: 1, under: 1, plate: 1, proxy: 1, sensor: 1, elec: 1, wire: 1, rail: 1, box: 1, cap: 1 }, dist: 400, z: -6 }
  };

  function mount(el, opt) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el || !root.CaptureGen || !root.CaptureGen.assembly) return;
    opt = opt || {};
    var stage = el.querySelector('.lc3d-stage'), canvas = el.querySelector('.lc3d-view');
    var ctrls = el.querySelector('.lc3d-ctrls'), readout = el.querySelector('.lc3d-readout');
    if (!stage || !canvas || !ctrls || !readout) return;
    var gl = null;
    try { gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true }) || canvas.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return;   // the written description stays

    var t = +(el.getAttribute('data-t') || opt.t || 3);
    var A = root.CaptureGen.assembly({ t: t, fit: 0.1, boxFit: 0.1 });
    var K = root.CaptureGen.K, calm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --- the things to draw --- */
    var items = A.parts.map(function (p) {
      var m = boardMesh(p);
      return { name: p.name, kind: p.kind, where: p.where, height: p.height, size: [p.piece.w, p.piece.h, t], group: p.group, mesh: m };
    });
    var cx = (K.cuvL + K.cuvR) / 2, cyy = (K.cuvBot + K.cuvTop) / 2;
    // the UVette, sized as in the 3D-printed section's parts list (12.5 × 12.5 × 36 mm) and shaped as in its cutaway:
    // a solid optical block at the bottom, a body 0.4 mm slimmer on each side, and a 2 mm rim 0.9 mm proud at the mouth
    var uv = [boxMesh(cx - 6.25, cyy - 6.25, 0, cx + 6.25, cyy + 6.25, 21.5),
              boxMesh(cx - 5.85, cyy - 5.85, 21.5, cx + 5.85, cyy + 5.85, 34),
              boxMesh(cx - 7.15, cyy - 7.15, 34, cx + 7.15, cyy + 7.15, 36)];
    items.push({ name: 'Eppendorf UVette, 200 µL', kind: 'proxy', sub: 'cuvette',
                 mesh: { tris: [].concat(uv[0].tris, uv[1].tris, uv[2].tris), lines: [].concat(uv[0].lines, uv[1].lines, uv[2].lines) },
                 text: '12.5 × 12.5 × 36 mm, in its 13 × 13 mm pocket: a solid optical block at the bottom, a slimmer body, a rim at the mouth. The 2 mm path faces the LED, the 10 mm path faces the sensor. Bought part, drawn as in the 3D-printed build\'s section.' });

    /* --- the electronics: bought parts as plain shapes, wires routed through the holes the parts provide ---
       Where each wire goes in or out is fixed by the cut parts (the LED chamber's wire hole, the detection
       chamber's wire hole, the long side's opening); the path between those points is drawn to show the
       connection, not traced from the reader. */
    var zf = A.box.z0 + t, zb = A.box.z0;                 // inside floor, and the table under the enclosure
    var Tx0 = K.T_X0, Tx1 = K.T_X1, Ty0 = K.cuvTop, Rx0 = K.cuvR + t;
    var SX = (Tx0 + Tx1) / 2, SY = Ty0 + t / 2;           // sensor board: stands in the slot beside the cuvette
    var BOARD = 'Bought part, drawn as a plain shape; its size is not to scale.';
    function part(name, kind, mesh, text, col) { items.push({ name: name, kind: kind, mesh: mesh, text: text, col: col }); }
    part('AS7341 sensor board (DFRobot SEN0364)', 'sensor', boxMesh(SX - 10.5, SY - 0.8, -t, SX + 10.5, SY + 0.8, 17),
      'Stands upright in the slot beside the cuvette, facing it at 90°, on the plate glued under the deck. ' + BOARD, [0.22, 0.34, 0.46, 1]);
    part('AS7341 sensor chip', 'sensor', boxMesh(SX - 1.6, SY - 1.2, 4, SX + 1.6, SY - 0.8, 7.2),
      'The ten-channel spectral sensor, on the side of the board that faces the cuvette. ' + BOARD, [0.1, 0.1, 0.12, 1]);
    part('ESP32 DevKit (ESP32-WROOM-32)', 'elec', boxMesh(22, 30, zf, 73, 58, zf + 1.6),
      'The controller, in the lower layer under the deck. Its spot there is illustrative. ' + BOARD, [0.13, 0.17, 0.22, 1]);
    part('ESP32-WROOM-32 module', 'elec', boxMesh(52, 35, zf + 1.6, 70, 53, zf + 4.6),
      'The ESP32 module on the controller board. ' + BOARD, [0.62, 0.64, 0.66, 1]);
    part('Blue LED (Cree C503B, 470 nm)', 'led', ballMesh([K.cuvL - t - 2.6, K.LED_HOLE.s, K.LED_HOLE.z], 2.5, 8),
      'Behind the 4 mm hole in the cuvette wall, shining straight at the cuvette. ' + BOARD, [0.55, 0.75, 1, 1]);
    var WH = K.WIRE_HOLE, TW = K.T_WIRE_HOLE, FP = K.FRONT_PORT;
    // the display and the button are fixed to the outside of the long side, side by side, and together cover
    // its opening; their wires come through the opening from behind
    var fy = A.box.y0 + A.box.Y, fx0 = FP.x, fx1 = FP.x + FP.w, fzc = zf + FP.y + FP.h / 2;
    part('SSD1306 OLED display', 'elec', boxMesh(fx0 - 4.5, fy, fzc - 13.5, fx0 + 22.5, fy + 3.2, fzc + 13.5),
      'Fixed to the outside of the long side, over its opening, beside the button. ' + BOARD, [0.08, 0.1, 0.14, 1]);
    part('OLED screen', 'elec', boxMesh(fx0 - 3, fy + 3.2, fzc - 6, fx0 + 21, fy + 3.5, fzc + 8), 'The display\'s screen. ' + BOARD, [0.12, 0.2, 0.32, 1]);
    part('Push button', 'elec', boxMesh(fx0 + 22.5, fy, fzc - 8, fx1 + 10.5, fy + 2.6, fzc + 8),
      'Fixed to the outside of the long side, over its opening, beside the display. One press records a batch of five readings. ' + BOARD, [0.3, 0.3, 0.33, 1]);
    part('Push button cap', 'elec', boxMesh(fx1 + 2.5, fy + 2.6, fzc - 2.5, fx1 + 7.5, fy + 5.6, fzc + 2.5), 'The button itself. ' + BOARD, [0.85, 0.25, 0.2, 1]);
    // the reader is to run on a battery; which one is not decided, so this is a placeholder of no particular size
    part('Battery (not decided yet)', 'elec', boxMesh(80, 62, zf, 118, 92, zf + 15),
      'Placeholder: the reader is to run on a battery, which has not been chosen yet. Its size and spot here mean nothing.', [0.32, 0.3, 0.22, 1]);
    // a resistor in the LED line, on the stretch that drops through the LED chamber's wire hole
    part('220 Ω resistor', 'elec', boxMesh(WH.x - 1.2, WH.y - 1.2, -16, WH.x + 1.2, WH.y + 1.2, -9),
      'In the LED line: GPIO25 through 220 Ω to the LED. ' + BOARD, [0.82, 0.72, 0.52, 1]);

    var WIRE = {
      v: { c: [0.86, 0.22, 0.2, 1], what: '3.3 V supply' }, g: { c: [0.5, 0.52, 0.56, 1], what: 'ground' },
      sda: { c: [0.3, 0.55, 0.98, 1], what: 'I²C data (SDA), GPIO21' }, scl: { c: [0.96, 0.8, 0.22, 1], what: 'I²C clock (SCL), GPIO22' },
      led: { c: [0.96, 0.55, 0.2, 1], what: 'LED, GPIO25 through 220 Ω' }, btn: { c: [0.9, 0.9, 0.92, 1], what: 'button, GPIO13 (internal pull-up)' },
      bv: { c: [0.86, 0.22, 0.2, 1], what: 'battery positive (placeholder: the battery is not decided yet)' }, bg: { c: [0.5, 0.52, 0.56, 1], what: 'battery negative (placeholder: the battery is not decided yet)' }
    };
    function wire(name, sig, pts) {
      var tv = [], r = 0.55;
      for (var i = 0; i + 1 < pts.length; i++) {
        var a = pts[i], b = pts[i + 1];
        var m = boxMesh(Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.min(a[2], b[2]) - r,
                        Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, Math.max(a[2], b[2]) + r);
        tv = tv.concat(m.tris);
      }
      items.push({ name: name, kind: 'wire', mesh: { tris: tv, lines: [] }, col: WIRE[sig].c,
                   text: 'Wire: ' + WIRE[sig].what + '. Drawn to show the connection; the path between holes is not traced from the reader.' });
    }
    // LED: up through the LED chamber's wire hole, across the chamber to the LED behind its hole in the cuvette wall
    var ledX = K.cuvL - t - 2.5;
    wire('LED wire (GPIO25)', 'led', [[30, 31, zf + 1.6], [30, 31, zf + 8], [WH.x, 31, zf + 8], [WH.x, WH.y, zf + 8], [WH.x, WH.y, 1.2], [ledX, WH.y, 1.2], [ledX, K.LED_HOLE.s + 0.9, 1.2], [ledX, K.LED_HOLE.s + 0.9, K.LED_HOLE.z]]);
    wire('LED ground wire', 'g', [[27, 31, zf + 1.6], [27, 31, zf + 10], [WH.x - 1.6, 31, zf + 10], [WH.x - 1.6, WH.y, zf + 10], [WH.x - 1.6, WH.y, 2.6], [ledX, WH.y, 2.6], [ledX, K.LED_HOLE.s - 0.9, 2.6], [ledX, K.LED_HOLE.s - 0.9, K.LED_HOLE.z]]);
    // sensor: from the top of the board along the detection chamber, down through its wire hole, to the controller
    [['Sensor 3.3 V wire', 'v', -2.4], ['Sensor ground wire', 'g', -0.8], ['Sensor SDA wire', 'sda', 0.8], ['Sensor SCL wire', 'scl', 2.4]].forEach(function (w, i) {
      var x = SX + w[2];
      wire(w[0], w[1], [[x, SY, 17], [x, SY, 19 + i * 0.01], [x, TW.y, 19], [x, TW.y, zf + 12 + i * 1.3], [x, 56, zf + 12 + i * 1.3], [x, 56, zf + 1.6]]);
    });
    // display and button: from the controller out through the long side's opening to the back of each
    var portZ = fzc;
    [['OLED 3.3 V wire', 'v', 0], ['OLED ground wire', 'g', 1], ['OLED SDA wire', 'sda', 2], ['OLED SCL wire', 'scl', 3],
     ['Button wire (GPIO13)', 'btn', 15], ['Button ground wire', 'g', 16.4]].forEach(function (w, i) {
      var x0 = 60 + i * 1.4, x = fx0 + 6 + w[2] * 1.4, z = portZ - 3 + (i % 4) * 1.6;
      wire(w[0], w[1], [[x0, 57, zf + 1.6], [x0, 57, z], [x, 57, z], [x, fy + 0.2, z]]);
    });
    // battery: two leads to the controller, drawn only to show that it powers it
    [['Battery lead (+)', 'bv', 0], ['Battery lead (−)', 'bg', 1.6]].forEach(function (w) {
      wire(w[0], w[1], [[80, 70 + w[2], zf + 5], [74 + w[2], 70 + w[2], zf + 5], [74 + w[2], 52, zf + 5], [72, 52, zf + 5], [72, 52, zf + 1.6]]);
    });

    /* --- the light, for "Take a reading": each piece has a start, a duration, and either grows along `dir`
       or fades in. None of it is a measurement; the captions say what each step is. */
    var lights = [];
    function light(mesh, col, start, dur, dir, from, len, fadeAfter) {
      lights.push({ mesh: mesh, col: col, start: start + DARK, dur: dur, dir: dir, from: from, len: len, fadeAfter: fadeAfter && fadeAfter + DARK });
    }
    var DARK = 0.9;   // the eight samples with the LED off come first
    var BLUE = [0.2, 0.45, 1.0, 0.92], GREEN = [0.2, 0.85, 0.35, 0.92];
    // where the beam meets the light trap's sloped plate: its top face rises from the floor at the opening wall
    // (it starts t·22/29.73 up, the board's own thickness) at 20 mm per 22 mm
    var ly = K.LED_HOLE.s, lz = K.LED_HOLE.z, rampL = Math.hypot(22, 20);
    var hitX = Rx0 + Math.max(0.5, (lz - t * 22 / rampL) * 22 / 20), gz = lz;
    // the LED lights up
    light(ballMesh([ledX - 0.1, ly, lz], 3.6, 8), [0.35, 0.6, 1, 0.6], 0, 0.4);
    // blue: from the LED, through the cuvette's 2 mm path, into the light trap, where it ends on the sloped plate
    light(boxMesh(ledX, ly - 1.6, lz - 1.5, hitX, ly + 1.6, lz + 1.5), BLUE, 0.3, 1.1, [1, 0, 0], ledX, hitX - ledX);
    light(boxMesh(hitX - 0.5, ly - 3, lz - 1.5, hitX + 2.5, ly + 3, lz + 3.5), [0.2, 0.45, 1.0, 0.5], 1.4, 0.4);
    // green: the sample answers as soon as the blue reaches it, sideways at 90°, through the 10 mm path to the sensor
    var tGreen = 0.3 + 1.1 * (cx - ledX) / (hitX - ledX);
    light(boxMesh(cx - 1.8, cyy, gz - 1.8, cx + 1.8, SY - 1.2, gz + 1.8), GREEN, tGreen, 0.7, [0, 1, 0], cyy, SY - 1.2 - cyy);
    var STEPS = [
      [0, 'The button is pressed and the reading starts with the LED still off: eight samples of ambient light and the sensor\'s dark current, to be subtracted later.'],
      [DARK, 'LED on. Eight samples with it on follow; the two averages are subtracted channel by channel.'],
      [DARK + 0.3, 'Blue 470 nm light from the LED goes into the cuvette through its 2 mm path.'],
      [DARK + tGreen, 'As the blue reaches the sample, sfGFP glows green. The sensor, at 90° to the blue beam, collects the green that reaches it through the 10 mm path.'],
      [DARK + 1.4, 'The blue that passes straight through goes on into the light trap, which is designed to swallow it on its sloped plate so that it does not bounce back toward the sensor.'],
      [DARK + 2.8, 'The sensor reads its channels: one reading done, and the display moves to 1/5.'],
      [DARK + 3.6, 'One press runs five readings like this one, about 22 seconds each. The first is discarded and the other four averaged, so the display then shows the batch with n = 4: SIG, the firmware\'s green signal (F5 − k5·F3), here for the undiluted sfGFP culture. The figure this page reports is F5/F3, green at 555 nm over blue at 480 nm.']
    ];
    var END = DARK + 4.6;

    /* the display, as the batch firmware (v5.5) draws it while a batch runs: the tube's ID in large type with
       "n/5" and a progress bar, and "DONE" with the batch's means once all five readings are in (the first is
       not counted, so n = 4). The numbers are one real batch from the linearity series: tube H100, the
       undiluted sfGFP culture, batch 6 in 0922_summary.csv, F3 800.8 and SIG 55.34 (SIG = F5 − k5·F3, the
       value the screen shows). That file keeps the batch means only, so the screen here leaves out the
       firmware's "+- SD" and the single readings, rather than make them up. */
    var SCREEN = { id: 'H100', f3: 800.8, sig: 55.34, n: 4 };
    var oled = document.createElement('div'); oled.className = 'lc3d-oled'; oled.hidden = true;
    oled.setAttribute('role', 'img'); oled.setAttribute('aria-label', 'The reader\'s display during the batch');
    // the caption and the display share one row under the view
    var foot = document.createElement('div'); foot.className = 'lc3d-foot';
    readout.parentNode.insertBefore(foot, readout); foot.appendChild(readout); foot.appendChild(oled);
    function oledAt(T) {
      // as the firmware draws it: "measuring..." from the press on (the LED-off samples are part of the reading),
      // 1/5 only once the first reading is complete, DONE only after all five
      var rows, done = T >= DARK + 2.8 ? 1 : 0;
      if (T < END - 0.05) {
        rows = [['big', SCREEN.id, done + '/5'], ['bar', done / 5], ['txt', 'measuring...'], ['txt', ''], ['txt', 'do not touch']];
      } else {
        rows = [['big', 'DONE', ''], ['txt', SCREEN.id + '   n=' + SCREEN.n],
                ['txt', 'F3  ' + SCREEN.f3.toFixed(0)], ['txt', 'SIG ' + SCREEN.sig.toFixed(2)], ['txt', 'Next: ID + button']];
      }
      oled.innerHTML = '';
      rows.forEach(function (r) {
        var d = document.createElement('div');
        if (r[0] === 'big') { d.className = 'lc3d-oled-big'; d.textContent = r[1]; var k = document.createElement('span'); k.textContent = r[2]; d.appendChild(k); }
        else if (r[0] === 'bar') { d.className = 'lc3d-oled-bar'; var f = document.createElement('i'); f.style.width = (r[1] * 100) + '%'; d.appendChild(f); }
        else { d.textContent = r[1] || '\u00a0'; }
        oled.appendChild(d);
      });
      oled.hidden = false;
    }

    /* explode offsets */
    var bx = A.box, mid = [bx.x0 + bx.X / 2, bx.y0 + bx.Y / 2];
    items.forEach(function (it) {
      var o = [0, 0, 0];
      // "Chambers open" lifts the cuvette plate off and sets each chamber roof aside, away from the cuvette,
      // so the inside of every chamber can be seen from above; the cuvette stays in its pocket
      if (it.kind === 'plate') o = [0, 0, 70];
      else if (/^L chamber roof/.test(it.name)) o = [-58, 0, 26];
      else if (/^R chamber roof/.test(it.name)) o = [58, 0, 26];
      else if (/^T chamber roof/.test(it.name)) o = [0, 58, 26];
      it.off = o;
    });

    /* --- GL resources --- */
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER,
      'attribute vec3 p; attribute vec3 n; uniform mat4 M; uniform vec3 off; uniform vec3 L; uniform float lit; varying float s; varying vec3 wp;' +
      'void main(){ wp = p + off; gl_Position = M * vec4(wp, 1.0); s = lit > 0.5 ? 0.42 + 0.58 * abs(dot(normalize(n), L)) : 1.0; }'));
    // cutN, cutD: anything past the plane dot(x, cutN) = cutD is not drawn; that is how a beam grows
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER,
      'precision mediump float; uniform vec4 col; uniform vec3 cutN; uniform float cutD; varying float s; varying vec3 wp;' +
      'void main(){ if (dot(wp, cutN) > cutD) discard; gl_FragColor = vec4(col.rgb * s, col.a); }'));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var loc = { p: gl.getAttribLocation(prog, 'p'), n: gl.getAttribLocation(prog, 'n'),
                M: gl.getUniformLocation(prog, 'M'), off: gl.getUniformLocation(prog, 'off'), L: gl.getUniformLocation(prog, 'L'),
                lit: gl.getUniformLocation(prog, 'lit'), col: gl.getUniformLocation(prog, 'col'),
                cutN: gl.getUniformLocation(prog, 'cutN'), cutD: gl.getUniformLocation(prog, 'cutD') };
    function noCut() { gl.uniform3f(loc.cutN, 0, 0, 0); gl.uniform1f(loc.cutD, 1); }

    function upload(list, withNormals) {
      var n = list.length, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) { pos[i * 3] = list[i][0]; pos[i * 3 + 1] = list[i][1]; pos[i * 3 + 2] = list[i][2]; }
      if (withNormals) for (var k = 0; k < n; k += 3) {
        var a = list[k], b = list[k + 1], c = list[k + 2];
        var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        for (var j = 0; j < 3; j++) { nor[(k + j) * 3] = nx; nor[(k + j) * 3 + 1] = ny; nor[(k + j) * 3 + 2] = nz; }
      }
      var bp = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
      var bn = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bn); gl.bufferData(gl.ARRAY_BUFFER, nor, gl.STATIC_DRAW);
      return { p: bp, n: bn, count: n };
    }
    items.forEach(function (it) { it.tb = upload(it.mesh.tris, true); it.lb = upload(it.mesh.lines, false); });
    lights.forEach(function (l) { l.tb = upload(l.mesh.tris, true); });

    /* --- picking target --- */
    var fbo = gl.createFramebuffer(), ftex = gl.createTexture(), frb = gl.createRenderbuffer(), fw = 0, fh = 0;
    function sizePick(w, h) {
      if (w === fw && h === fh) return;
      fw = w; fh = h;
      gl.bindTexture(gl.TEXTURE_2D, ftex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.bindRenderbuffer(gl.RENDERBUFFER, frb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ftex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, frb);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /* --- state --- */
    var mode = 'core', sel = -1, ex = 0, exTo = 0, cam = { yaw: 2.25, pitch: 0.62, dist: MODES.core.dist };
    var target = [64, 50, MODES.core.z], camTo = { dist: cam.dist, z: target[2], x: 64, y: 50 };

    var elecOn = true, anim = null;   // anim: { t0 } while a reading plays, { done: true } after it
    function visible(it) {
      // while the light plays, the lifted plate would only be in the way
      if (anim && it.kind === 'plate') return false;
      if (it.kind === 'led') return true;
      return !!MODES[mode].show[it.kind] && (elecOn || (it.kind !== 'elec' && it.kind !== 'wire'));
    }

    function matrix() {
      var w = canvas.width, h = canvas.height;
      var e = [target[0] + cam.dist * Math.cos(cam.pitch) * Math.cos(cam.yaw),
               target[1] + cam.dist * Math.cos(cam.pitch) * Math.sin(cam.yaw),
               target[2] + cam.dist * Math.sin(cam.pitch)];
      return mul(persp(0.62, w / Math.max(1, h), 5, 3000), lookAt(e, target, [0, 0, 1]));
    }

    function bind(b, normals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b.p); gl.enableVertexAttribArray(loc.p); gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.n); gl.enableVertexAttribArray(loc.n); gl.vertexAttribPointer(loc.n, 3, gl.FLOAT, false, 0, 0);
    }
    function off(it) { return [it.off[0] * ex, it.off[1] * ex, it.off[2] * ex]; }

    function draw() {
      var w = canvas.width, h = canvas.height, M = matrix();
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.uniformMatrix4fv(loc.M, false, M);
      gl.uniform3f(loc.L, 0.38, -0.52, 0.76);
      noCut();
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      // opaque faces first, then see-through ones without writing depth
      [false, true].forEach(function (glass) {
        gl.depthMask(!glass);
        items.forEach(function (it, i) {
          if (!visible(it)) return;
          var key = it.sub === 'cuvette' ? 'cuvette' : it.kind, c = it.col || COL[key];
          if ((c[3] < 1) !== glass) return;
          if (i === sel) c = [COL.pick[0], COL.pick[1], COL.pick[2], glass ? 0.45 : 1];
          gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
          gl.uniform3fv(loc.off, off(it)); gl.uniform1f(loc.lit, 1); gl.uniform4fv(loc.col, c);
          bind(it.tb); gl.drawArrays(gl.TRIANGLES, 0, it.tb.count);
          gl.disable(gl.POLYGON_OFFSET_FILL);
        });
      });
      gl.depthMask(false);
      items.forEach(function (it, i) {
        if (!visible(it)) return;
        var key = (it.sub === 'cuvette' ? 'cuvette' : it.kind) + 'Edge', c = i === sel ? [0.75, 1, 0.85, 1] : (COL[key] || [0.7, 0.78, 0.82, 0.6]);
        gl.uniform3fv(loc.off, off(it)); gl.uniform1f(loc.lit, 0); gl.uniform4fv(loc.col, c);
        bind(it.lb); gl.drawArrays(gl.LINES, 0, it.lb.count);
      });
      if (anim) {
        var T = anim.done ? END : (now() - anim.t0) / 1000;
        // the light is drawn through the walls, as an x-ray of where it goes
        gl.disable(gl.DEPTH_TEST);
        // plain blending, not adding: added onto grey walls, blue and green both wash out to cyan
        gl.uniform1f(loc.lit, 0); gl.uniform3f(loc.off, 0, 0, 0);
        lights.forEach(function (l) {
          var p = Math.max(0, Math.min(1, (T - l.start) / l.dur));
          if (p <= 0) return;
          var a = l.col[3];
          if (l.fadeAfter && T > l.fadeAfter) a *= Math.max(0.25, 1 - (T - l.fadeAfter) / 0.8);
          if (l.dir) { gl.uniform3fv(loc.cutN, l.dir); gl.uniform1f(loc.cutD, l.from + l.len * p); a *= 1; }
          else { noCut(); a *= p; }
          gl.uniform4f(loc.col, l.col[0], l.col[1], l.col[2], a);
          bind(l.tb); gl.drawArrays(gl.TRIANGLES, 0, l.tb.count);
        });
        noCut();
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
      }
      gl.depthMask(true);
    }
    function now() { return (root.performance && root.performance.now) ? root.performance.now() : Date.now(); }

    function pickAt(px, py) {
      var w = canvas.width, h = canvas.height;
      sizePick(w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      gl.uniformMatrix4fv(loc.M, false, matrix()); gl.uniform1f(loc.lit, 0); noCut();
      // the enclosure and the cuvette plate are glass: pick what is inside first, the glass only where nothing else is
      var px8 = new Uint8Array(4), hit = -1;
      [false, true].forEach(function (glass) {
        if (hit >= 0) return;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        items.forEach(function (it, i) {
          if (!visible(it) || (it.kind === 'box' || it.kind === 'plate') !== glass) return;
          gl.uniform3fv(loc.off, off(it)); gl.uniform4f(loc.col, (i + 1) / 255, 0, 0, 1);
          bind(it.tb); gl.drawArrays(gl.TRIANGLES, 0, it.tb.count);
        });
        gl.readPixels(px, h - py - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px8);
        if (px8[3]) hit = px8[0] - 1;
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return hit;
    }

    /* --- sizing and the frame loop --- */
    var dirty = true;
    function fit() {
      var r = canvas.getBoundingClientRect(), d = Math.min(root.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; dirty = true; }
    }
    function frame() {
      fit();
      if (ex !== exTo) {
        ex = calm ? exTo : ex + Math.sign(exTo - ex) * Math.min(Math.abs(exTo - ex), 0.06);
        dirty = true;
      }
      var tx = camTo.x == null ? 64 : camTo.x, ty = camTo.y == null ? 50 : camTo.y;
      if (Math.abs(cam.dist - camTo.dist) > 0.05 || Math.abs(target[2] - camTo.z) > 0.05 || Math.abs(target[0] - tx) > 0.05 || Math.abs(target[1] - ty) > 0.05) {
        var k = calm ? 1 : 0.14;
        cam.dist += (camTo.dist - cam.dist) * k; target[2] += (camTo.z - target[2]) * k;
        target[0] += (tx - target[0]) * k; target[1] += (ty - target[1]) * k; dirty = true;
      }
      if (anim && !anim.done) {
        var T = (now() - anim.t0) / 1000, step = 0;
        STEPS.forEach(function (s, i) { if (T >= s[0]) step = i; });
        if (step !== anim.step) { anim.step = step; caption(STEPS[step][1]); }
        oledAt(T);
        if (T >= END) anim.done = true;
        dirty = true;
      }
      if (dirty) { draw(); dirty = false; }
      root.requestAnimationFrame(frame);
    }

    /* --- the readout --- */
    function fmt(v) { return (Math.round(v * 100) / 100).toString(); }
    var intro = readout.innerHTML;
    function say() {
      if (sel < 0) { readout.innerHTML = intro; return; }
      var it = items[sel], txt;
      if (it.text) txt = it.text;
      else {
        var paint = it.kind === 'box' ? 'Painted matte black inside; bare plywood outside.' : 'Painted matte black.';
        var place = it.where === 'cut' ? 'Placed as in the drawing.' : 'Placed by its size; the drawing does not fix which way it faces or exactly where it sits.';
        if (it.kind === 'plate') place = 'Lies on top of the chambers; its 13 × 13 mm opening holds the cuvette upright.';
        if (it.kind === 'trap') place = 'Inside the light trap: the square\'s lower edge stands against the wall with the 8 mm opening and the square rises away from it at about 45°, carried on the 29.73 mm slopes of the two triangles. Placed from the builder\'s description; the drawing does not show it assembled.';
        if (it.kind === 'under') place = 'Glued under the deck: it closes the slot beside the cuvette, where the sensor board stands upright, and carries the board. Its size is the slot plus 5 mm on every side.';
        if (it.kind === 'cap') place = 'One of the two squares glued together to close the lid opening: the smaller one fits the opening, the larger one rests on the lid.';
        if (it.height === 'about') place += ' It sits at about half the enclosure\'s height, with the electronics below.';
        txt = fmt(it.size[0]) + ' × ' + fmt(it.size[1]) + ' mm, ' + fmt(it.size[2]) + ' mm board. ' + paint + ' ' + place;
      }
      readout.innerHTML = '';
      var b = document.createElement('strong');
      // the generator's short chamber names, spelled out for a reader
      b.textContent = it.name.replace(/^L chamber/, 'LED chamber').replace(/^R chamber/, 'Light-trap chamber').replace(/^T chamber/, 'Detection chamber');
      readout.appendChild(b);
      readout.appendChild(document.createTextNode(' — ' + txt));
    }

    // during a reading the readout shows what the light is doing
    function caption(text) {
      readout.innerHTML = '';
      var b = document.createElement('strong'); b.textContent = 'Taking a reading';
      readout.appendChild(b); readout.appendChild(document.createTextNode(' — ' + text));
    }

    /* --- controls --- */
    var seg = document.createElement('div'); seg.className = 'hwx-seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'What to show');
    var buttons = {};
    function setMode(k) {
      mode = k; exTo = MODES[k].explode ? 1 : 0; camTo = { dist: MODES[k].dist, z: MODES[k].z, x: 64, y: 50 };
      if (sel >= 0 && !visible(items[sel])) { sel = -1; say(); }
      Object.keys(buttons).forEach(function (q) { buttons[q].setAttribute('aria-pressed', q === k ? 'true' : 'false'); });
      dirty = true;
    }
    Object.keys(MODES).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = MODES[k].label;
      b.setAttribute('aria-pressed', k === mode ? 'true' : 'false');
      b.addEventListener('click', function () { anim = null; oled.hidden = true; setMode(k); say(); });
      buttons[k] = b; seg.appendChild(b);
    });
    var tools = document.createElement('div'); tools.className = 'hwx-seg';
    function tool(label, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); tools.appendChild(b); return b; }
    var go = tool('Take a reading', function () {
      // open the chambers, look in from above the LED side, and play the light through once
      setMode('open'); sel = -1;
      cam.yaw = 2.6; cam.pitch = 1.38; camTo = { dist: 132, z: 2, x: (K.cuvL + K.cuvR) / 2 + 4, y: (K.cuvBot + K.cuvTop) / 2 + 3 };
      anim = calm ? { done: true, step: STEPS.length - 1 } : { t0: now(), step: -1 };
      caption(calm ? STEPS[STEPS.length - 1][1] : STEPS[0][1]);
      oledAt(calm ? END : 0);
      dirty = true;
    });
    go.className = 'hwx-hot';
    var eb = tool('Electronics', function () {
      elecOn = !elecOn; eb.setAttribute('aria-pressed', elecOn ? 'true' : 'false');
      if (sel >= 0 && !visible(items[sel])) { sel = -1; say(); }
      dirty = true;
    });
    eb.setAttribute('aria-pressed', 'true');
    tool('Reset view', function () { cam.yaw = 2.25; cam.pitch = 0.62; camTo = { dist: MODES[mode].dist, z: MODES[mode].z, x: 64, y: 50 }; anim = null; oled.hidden = true; sel = -1; say(); dirty = true; });
    ctrls.appendChild(seg); ctrls.appendChild(tools);

    /* --- pointer and keys --- */
    var drag = null;
    canvas.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, moved: 0 }; try { canvas.setPointerCapture(e.pointerId); } catch (er) {} });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      cam.yaw -= dx * 0.008; cam.pitch = Math.max(-0.2, Math.min(1.45, cam.pitch + dy * 0.006)); dirty = true;
    });
    canvas.addEventListener('pointerup', function (e) {
      if (drag && drag.moved < 5) {
        var r = canvas.getBoundingClientRect(), d = canvas.width / r.width;
        var hit = pickAt(Math.round((e.clientX - r.left) * d), Math.round((e.clientY - r.top) * d));
        sel = hit === sel ? -1 : hit; say(); dirty = true;
      }
      drag = null;
    });
    canvas.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault(); cam.dist = camTo.dist = Math.max(120, Math.min(800, cam.dist * (e.deltaY > 0 ? 1.1 : 0.9))); dirty = true;
    }, { passive: false });
    canvas.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') cam.yaw += 0.12; else if (k === 'ArrowRight') cam.yaw -= 0.12;
      else if (k === 'ArrowUp') cam.pitch = Math.min(1.45, cam.pitch + 0.1); else if (k === 'ArrowDown') cam.pitch = Math.max(-0.2, cam.pitch - 0.1);
      else if (k === '+' || k === '=') cam.dist = camTo.dist = Math.max(120, cam.dist * 0.9); else if (k === '-') cam.dist = camTo.dist = Math.min(800, cam.dist * 1.1);
      else return;
      e.preventDefault(); dirty = true;
    });

    stage.hidden = false; ctrls.hidden = false;
    root.requestAnimationFrame(frame);
  }

  var API = { mount: mount, triangulate: triangulate, boardMesh: boardMesh };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Capture3D = API;
})(this);
