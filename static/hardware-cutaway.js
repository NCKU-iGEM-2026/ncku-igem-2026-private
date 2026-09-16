/* CAPTURE-Screen P1 cutaway viewer.
 *
 * A small software renderer: orbit camera, painter's algorithm, canvas 2D, no
 * library. It is written that way so the page loads nothing but its own files,
 * which is what the iGEM asset rules require.
 *
 * Read the provenance note on every part below before reusing a number from it.
 * Coordinates along X come from the plan view on this same page and are real.
 * Y and Z are not: they place parts so the arrangement can be seen, and the
 * parts list on the page says so for each one.
 */
(function () {
  "use strict";

  if (!document.getElementById("hw3d-view")) return;

  /* ==========================================================================
     MODEL
     Device coordinates in millimetres. X is the excitation axis (+X toward the
     light trap), Y is the detection axis (+Y toward the AS7341), Z is up.
     X = 0 is the centre of the UVette.

     src: "drawn"   -> read off the plan view on this page (5 px = 1 mm on X),
                       quoted in that page's text, or dimensioned on the 09-12
                       enclosure DWG.
          "spec"    -> stated by the team for the built enclosure: 80 mm tall,
                       two layers, UVette through the top plate, ESP32 above the
                       breadboard, no emission filter.
          "derived" -> arithmetic on two known numbers, or read off a vendor
                       photograph's scale bar; the note says which.
          "todo"    -> NOT established anywhere. Placeholder so the thing can be
                       drawn. Nothing below invents a measurement.

     Z layout of the 80 mm stack, marked derived because the split is arithmetic
     on the 3 mm material and the 27 mm upper clear height of the 08-06 drawing,
     not a number anyone has stated for the 127.4 x 99.4 x 80 box:
        +16.5 .. +13.5  top plate, 3 mm, with the UVette opening
        +13.5 .. -13.5  upper layer, 27 mm clear   -> optics, LED, AS7341
        -13.5 .. -16.5  deck, 3 mm
        -16.5 .. -60.5  lower layer, 44 mm clear   -> breadboard, ESP32, wiring
        -60.5 .. -63.5  bottom plate, 3 mm
     The excitation axis sits at Z = 0, mid-height of the upper layer.
     ========================================================================== */

  var PARTS = [
    {
      id: "enclosure", name: "Enclosure, 127.4 × 99.4 × 80", kind: "shell", layer: "enc",
      x: [-65.1, 62.3], y: [-40.2, 59.2], z: [-63.5, 16.5],
      src: "drawn", xLabel: "−65.1 … +62.3",
      note: "127.4 × 99.4 dimensioned on the 09-12 DWG; the 80 mm height is as stated by the team"
    },
    {
      id: "deck", name: "Deck between layers", kind: "box", layer: "enc",
      x: [-62.1, 59.3], y: [-37.2, 56.2], z: [-16.5, -13.5],
      color: "ghost", src: "derived", xLabel: "−62.1 … +59.3",
      note: "Splits the two layers. Its height is arithmetic — 3 + 27 + 3 + 44 + 3 = 80 — not a stated figure"
    },
    {
      id: "ledholder", name: "LED holder", kind: "box", layer: "core",
      x: [-48, -33.25], y: [-8, 8], z: [-8, 8],
      color: "frame", src: "drawn", explode: [-1, 0, 0],
      note: "X from the plan view. Bonded after fracture; the C-clip slot straddles the joint",
      label: { text: "LED holder", dir: [-1, 0, 1] }
    },
    {
      id: "led", name: "Cree C503B LED", kind: "cyl", axis: "x",
      x: [-46.4, -40.4], c: [0, 0], r: 2.5, layer: "core",
      color: "beamEx", pieces: function (p) { return ledPieces(p); },
      src: "drawn", explode: [-1, 0, 0],
      note: "In the upper layer (team). X from the plan view; the package diameter is a placeholder",
      label: { text: "470 nm LED", dir: [-1, -1, -1] }
    },
    {
      id: "nose", name: "LED holder nose", kind: "cyl", axis: "x",
      x: [-34.8, -30], c: [0, 0], r: 4, layer: "core",
      color: "frame", src: "drawn", explode: [-1, 0, 0],
      note: "X from the plan view; the diameter is a placeholder"
    },
    {
      id: "baffle", name: "Aperture baffle", kind: "box", layer: "core",
      x: [-33.25, -18.25], y: [-8, 8], z: [-8, 8],
      color: "frame", src: "drawn", explode: [-0.6, 0, 0.4],
      note: "15.00 mm. The body fractured at both aperture-disk pocket planes, leaving three pieces",
      label: { text: "baffle", dir: [0, 0, 1] }
    },
    {
      id: "stop1", name: "Aperture stop 1", kind: "ring", axis: "x",
      x: [-30.4, -27.6], c: [0, 0], r: 7.5, ri: 1.6, layer: "core",
      color: "ink", src: "drawn", explode: [-0.6, 0, 0.4],
      note: "X from the plan view; the aperture diameter is a placeholder"
    },
    {
      id: "stop2", name: "Aperture stop 2", kind: "ring", axis: "x",
      x: [-23.8, -21], c: [0, 0], r: 7.5, ri: 1.6, layer: "core",
      color: "ink", src: "drawn", explode: [-0.6, 0, 0.4],
      note: "X from the plan view; the aperture diameter is a placeholder"
    },
    {
      id: "uvette", name: "UVette", kind: "box", layer: "core",
      x: [-6.2, 6.2], y: [-6.2, 6.2], z: [-13.5, 32.5],
      color: "sample", pieces: function (p) { return uvettePieces(p); },
      src: "spec", explode: [0, 0, 1],
      note: "X from the plan view. Stands on the deck and passes through the opening in the top plate",
      label: { text: "UVette 200 µL", dir: [0, -1, 1] }
    },
    {
      id: "sample", name: "Sample column", kind: "box", layer: "core",
      x: [-1, 1], y: [-5, 5], z: [-5, 5],
      color: "sample", solid: true, src: "derived", explode: [0, 0, 1],
      note: "2 mm excitation path × 10 mm detection path; the 10 mm column is 200 µL ÷ (2 × 10 mm)"
    },
    {
      id: "trap", name: "Angled-wedge light trap", kind: "ring", axis: "x",
      x: [18.25, 45.25], c: [0, 0], r: 6.4, ri: 4, layer: "core",
      color: "ink", src: "drawn", explode: [1, 0, 0],
      note: "Ø8.0 × 27 mm, both stated on this page; the slant of the end face is schematic",
      label: { text: "light trap Ø8.0 × 27", dir: [1, 0, 1] }
    },
    {
      id: "board", name: "SEN0365 board", kind: "box", layer: "core",
      x: [-10, 10], y: [26, 28], z: [-9, 9],
      color: "pcb", pieces: function (p) { return sen0365Pieces(p); },
      src: "derived", explode: [0, 1, 0],
      note: "20 × 18 mm read off the scale bar in the vendor photograph (±0.5). Board thickness and the distance to the sample are placeholders"
    },
    {
      id: "as7341", name: "AS7341 detector", kind: "box", layer: "core",
      x: [-1.5, 1.5], y: [24.8, 26], z: [-1.15, 1.15],
      color: "beamEm", solid: true, src: "derived", explode: [0, 1, 0],
      note: "Package ≈ 3 × 2.3 mm, centred on the board, both read off the vendor photograph",
      label: { text: "AS7341", dir: [0, 1, -1] }
    },
    {
      id: "die", name: "Die position, unmeasured", kind: "ghost",
      x: [-0.6, 0.6], y: [25.1, 25.7], z: [-0.6, 0.6], layer: "core",
      src: "todo", xLabel: "—", explode: [0, 1, 0],
      note: "The physical die position inside the package has not been measured"
    },
    {
      id: "breadboard", name: "Breadboard", kind: "box", layer: "esp",
      x: [-42.9, 40.1], y: [-18, 37], z: [-60.5, -50.5], color: "bb",
      pieces: function (p) { return breadboardPieces(p); },
      src: "todo", xLabel: "—",
      note: "In the lower layer (team). Its size and where it sits in that layer are placeholders",
      label: { text: "breadboard", dir: [-1, -1, -1] }
    },
    {
      id: "esp32", name: "ESP32 controller", kind: "box", layer: "esp",
      x: [-28.55, 25.75], y: [-4.45, 23.45], z: [-50.5, -42.4], color: "pcb",
      pieces: function (p) { return esp32Pieces(p); },
      src: "spec", xLabel: "—", explode: [0, 0, 1],
      note: "Directly above the breadboard (team). Its size and position in the layer are placeholders",
      label: { text: "ESP32", dir: [1, -1, -1] }
    }
  ];

  /* Beams. Endpoints follow the X coordinates above. */
  var BEAMS = [
    { id: "ex", color: "beamEx", pts: [[-40.4, 0, 0], [18.25, 0, 0]], w: 3.2 },
    { id: "exTrap", color: "beamEx", pts: [[18.25, 0, 0], [43.5, 0, 0]], w: 2.2, dash: true },
    { id: "em", color: "beamEm", pts: [[0, 0, 0], [23.2, 0, 0]], w: 3.2, alongY: true }
  ];

  /* The five stations dimensioned on the wiki plan view. */
  var STATIONS = [-33.25, -18.25, 0, 18.25, 45.25];

  /* ==========================================================================
     PIECE BUILDERS
     Shape only. None of these introduces a dimension the part's own x/y/z does
     not already carry: every piece is placed as a fraction of the envelope
     above, or at the 2.54 mm pitch a breadboard is defined by. They make a part
     read as the object it is; they are not evidence about the object.
     ========================================================================== */

  function breadboardPieces(p) {
    var x0 = p.x[0], x1 = p.x[1], y0 = p.y[0], y1 = p.y[1], z0 = p.z[0], z1 = p.z[1];
    var yc = (y0 + y1) / 2, top = z1 + 0.02, out = [];

    out.push({ kind: "box", x: [x0, x1], y: [y0, y1], z: [z0, z1], color: "bb", solid: true });
    /* The channel down the middle that separates the two banks. */
    out.push({ kind: "box", x: [x0 + 1.5, x1 - 1.5], y: [yc - 2.4, yc + 2.4], z: [z1 - 1.4, z1 - 0.3], color: "bbDark", solid: true });

    /* Power rails: a red and a blue line down each long edge. */
    [[y0 + 1.6, "railR"], [y0 + 4.4, "beamEx"], [y1 - 4.4, "railR"], [y1 - 1.6, "beamEx"]].forEach(function (r) {
      out.push({ kind: "quadXY", x: [x0 + 4, x1 - 4], y: [r[0] - 0.25, r[0] + 0.25], z: top, color: r[1], flat: true });
    });

    /* Tie points, on the 2.54 mm pitch, five a side either way from the channel. */
    var pitch = 2.54, h = 0.45;
    for (var gx = x0 + 4; gx <= x1 - 4; gx += pitch) {
      for (var k = 0; k < 5; k++) {
        [yc - 3.6 - k * pitch, yc + 3.6 + k * pitch].forEach(function (gy) {
          if (gy < y0 + 6 || gy > y1 - 6) return;
          out.push({
            kind: "quadXY", x: [gx - h, gx + h], y: [gy - h, gy + h], z: top,
            color: "bbDark", flat: true
          });
        });
      }
    }
    return out;
  }

  function esp32Pieces(p) {
    var x0 = p.x[0], x1 = p.x[1], y0 = p.y[0], y1 = p.y[1], z0 = p.z[0];
    var zHdr = z0 + 3.4, zPcb = zHdr + 1.6;
    return [
      /* Header strips down both long edges, plugged into the breadboard. */
      { kind: "box", x: [x0, x1], y: [y0, y0 + 2.6], z: [z0, zHdr], color: "pcb", solid: true },
      { kind: "box", x: [x0, x1], y: [y1 - 2.6, y1], z: [z0, zHdr], color: "pcb", solid: true },
      { kind: "box", x: [x0, x1], y: [y0, y1], z: [zHdr, zPcb], color: "pcb", solid: true },
      /* The WROOM module's metal can at one end. */
      { kind: "box", x: [x0 + 1, x0 + 19], y: [y0 + 4.5, y1 - 4.5], z: [zPcb, zPcb + 3.1], color: "metal", solid: true },
      /* USB connector overhanging the other end. */
      { kind: "box", x: [x1 - 2, x1 + 1.5], y: [y0 + 9.5, y1 - 9.5], z: [zPcb, zPcb + 2.8], color: "metal", solid: true },
      /* EN and BOOT buttons flanking it. */
      { kind: "box", x: [x1 - 10, x1 - 6.5], y: [y0 + 3, y0 + 6.5], z: [zPcb, zPcb + 1.6], color: "bbDark", solid: true },
      { kind: "box", x: [x1 - 10, x1 - 6.5], y: [y1 - 6.5, y1 - 3], z: [zPcb, zPcb + 1.6], color: "bbDark", solid: true }
    ];
  }

  /* Laid out from the DFRobot product photo: two mounting holes at the top,
     two white LEDs flanking the sensor, four pads along the bottom edge. */
  function sen0365Pieces(p) {
    var x0 = p.x[0], x1 = p.x[1], z0 = p.z[0], z1 = p.z[1];
    var yFront = p.y[0], face = yFront - 0.02, out = [];
    out.push({ kind: "box", x: [x0, x1], y: p.y, z: [z0, z1], color: "pcb", solid: true });
    [-1, 1].forEach(function (s) {
      out.push({ kind: "discXZ", cx: s * 6.4, cz: z1 - 3.4, r: 2.1, y: face, color: "gold", flat: true });
      out.push({ kind: "box", x: [s * 4.2 - 1.1, s * 4.2 + 1.1], y: [yFront - 0.7, yFront], z: [-1.4, 1.4], color: "ledw", solid: true });
    });
    [-4.5, -1.5, 1.5, 4.5].forEach(function (cx) {
      out.push({ kind: "discXZ", cx: cx, cz: z0 + 1.6, r: 0.95, y: face, color: "gold", flat: true });
    });
    return out;
  }

  /* A 5 mm through-hole LED: flange, barrel, domed lens, two leads. */
  function ledPieces(p) {
    var x0 = p.x[0], x1 = p.x[1], r = p.r;
    return [
      { kind: "cyl", x: [x0, x0 + 0.7], c: p.c, r: r + 0.45, color: "beamEx" },
      { kind: "cyl", x: [x0, x1 - 2.2], c: p.c, r: r, color: "beamEx" },
      { kind: "dome", x: [x1 - 2.2, x1], c: p.c, r: r, color: "beamEx" },
      { kind: "cyl", x: [x0 - 2.1, x0], c: [p.c[0] - 1.27, p.c[1]], r: 0.3, color: "metal", solid: true, seg: 8 },
      { kind: "cyl", x: [x0 - 2.1, x0], c: [p.c[0] + 1.27, p.c[1]], r: 0.3, color: "metal", solid: true, seg: 8 }
    ];
  }

  /* A cuvette: optical block at the bottom, body above it, rim at the mouth. */
  function uvettePieces(p) {
    var x = p.x, y = p.y, z = p.z;
    return [
      { kind: "box", x: x, y: y, z: [z[0], 8] },
      { kind: "box", x: [x[0] + 0.4, x[1] - 0.4], y: [y[0] + 0.4, y[1] - 0.4], z: [8, z[1] - 2] },
      { kind: "box", x: [x[0] - 0.9, x[1] + 0.9], y: [y[0] - 0.9, y[1] + 0.9], z: [z[1] - 2, z[1]] }
    ];
  }

  /* ==========================================================================
     SMALL 3D ENGINE: orbit camera, painter's algorithm, canvas 2D.
     ========================================================================== */

  var canvas = document.getElementById("hw3d-view");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = 1;

  var cam = { az: -58, el: 20, dist: 400, zoom: 1, panX: 0, panY: 0 };
  var opts = { opacity: 0.78, explode: 0, enc: true, beam: true, label: true, rule: true, esp: false, spin: false };
  var selected = null, hovered = null;

  var T = {};
  function readTheme() {
    var cs = getComputedStyle(canvas.parentNode);
    function g(n, fb) { var v = cs.getPropertyValue(n).trim(); return v || fb; }
    T = {
      paper: g("--hw3d-paper", "#fffdf7"),
      ink: g("--hw3d-ink", "#1c2a23"),
      ink2: g("--hw3d-ink-2", "#4a5a51"),
      ink3: g("--hw3d-ink-3", "#8a978f"),
      rule: g("--hw3d-rule", "#d7ded7"),
      accent: g("--hw3d-accent", "#1f4a38"),
      accent2: g("--hw3d-accent-2", "#4f8f74"),
      beamEx: g("--hw3d-beam-ex", "#2b6cb0"),
      beamEm: g("--hw3d-beam-em", "#2e9e5b"),
      sample: g("--hw3d-sample", "#c08a25"),
      frame: g("--hw3d-frame", "#3f544a"),
      ghost: g("--hw3d-ghost", "#98a69e"),
      warn: g("--hw3d-warn", "#a8632a"),
      bb: g("--hw3d-bb", "#dcd7c8"),
      bbDark: g("--hw3d-bb-dark", "#a8a294"),
      pcb: g("--hw3d-pcb", "#1e2428"),
      metal: g("--hw3d-metal", "#b4bac0"),
      gold: g("--hw3d-gold", "#bd9a2e"),
      ledw: g("--hw3d-ledw", "#f2eedd"),
      railR: g("--hw3d-rail-r", "#b8402f")
    };
  }
  function hex(c) { return T[c] || c; }
  function rgba(c, a) {
    var h = hex(c).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  /* --- vector helpers --- */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(a) {
    var l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /* --- camera basis, rebuilt every frame --- */
  var basis = null;
  function buildCamera() {
    var target = [-1, 10, -14];
    var az = cam.az * Math.PI / 180;
    var el = Math.max(-89.5, Math.min(89.5, cam.el)) * Math.PI / 180;
    var eye = [
      target[0] + cam.dist * Math.cos(el) * Math.cos(az),
      target[1] + cam.dist * Math.cos(el) * Math.sin(az),
      target[2] + cam.dist * Math.sin(el)
    ];
    var f = norm(sub(target, eye));
    var right = norm(cross(f, [0, 0, 1]));
    var up = cross(right, f);
    /* Fit the 130 mm box length to ~62% of the width, and the 96 mm from the
       floor to the top of the UVette to ~72% of the height, whichever binds. */
    var focal = Math.min(1.81 * W, 2.85 * H) * cam.zoom;
    basis = { eye: eye, f: f, right: right, up: up, focal: focal };
  }

  function project(p) {
    var v = sub(p, basis.eye);
    var d = dot(v, basis.f);
    if (d < 6) d = 6;
    var s = basis.focal / d;
    return {
      x: W / 2 + cam.panX + dot(v, basis.right) * s,
      y: H / 2 + cam.panY - dot(v, basis.up) * s,
      d: d
    };
  }

  /* --- primitive builders: each returns {faces:[[p,p,p,p],...], edges:[[p,p],...]} --- */
  function boxGeom(x, y, z) {
    var v = [
      [x[0], y[0], z[0]], [x[1], y[0], z[0]], [x[1], y[1], z[0]], [x[0], y[1], z[0]],
      [x[0], y[0], z[1]], [x[1], y[0], z[1]], [x[1], y[1], z[1]], [x[0], y[1], z[1]]
    ];
    var fi = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]];
    var ei = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    return {
      faces: fi.map(function (f) { return f.map(function (i) { return v[i]; }); }),
      edges: ei.map(function (e) { return [v[e[0]], v[e[1]]]; })
    };
  }

  /* Cylinder or tube along X. slant tapers the far end face, which is how the
     angled-wedge trap terminates. */
  function tubeGeom(x, c, ro, ri, seg, slant) {
    seg = seg || 20;
    var faces = [], edges = [], i;
    function ring(radius, xAt, slanted) {
      var out = [];
      for (i = 0; i < seg; i++) {
        var t = i / seg * Math.PI * 2;
        var yy = c[0] + radius * Math.cos(t), zz = c[1] + radius * Math.sin(t);
        var xx = xAt;
        if (slanted) xx = xAt - slant * (0.5 + 0.5 * Math.sin(t));
        out.push([xx, yy, zz]);
      }
      return out;
    }
    var o0 = ring(ro, x[0], false), o1 = ring(ro, x[1], !!slant);
    var i0 = ri ? ring(ri, x[0], false) : null, i1 = ri ? ring(ri, x[1], !!slant) : null;
    for (i = 0; i < seg; i++) {
      var j = (i + 1) % seg;
      faces.push([o0[i], o1[i], o1[j], o0[j]]);
      if (ri) {
        faces.push([i0[i], i1[i], i1[j], i0[j]]);
        faces.push([o0[i], o0[j], i0[j], i0[i]]);
        faces.push([o1[i], o1[j], i1[j], i1[i]]);
      } else {
        faces.push([o0[i], o0[j], [x[0], c[0], c[1]]]);
        faces.push([o1[i], o1[j], [x[1], c[0], c[1]]]);
      }
      edges.push([o0[i], o0[j]], [o1[i], o1[j]]);
      if (ri) edges.push([i0[i], i0[j]], [i1[i], i1[j]]);
      if (i % 5 === 0) edges.push([o0[i], o1[i]]);
    }
    return { faces: faces, edges: edges };
  }

  /* A hemisphere capping +X, which is what a 5 mm LED actually looks like. */
  function domeGeom(xb, xt, c, r, seg, rings) {
    var faces = [], prev = null, i, j;
    for (i = 0; i <= rings; i++) {
      var t = i / rings * Math.PI / 2;
      var rr = r * Math.cos(t), xx = xb + (xt - xb) * Math.sin(t);
      var ring = [];
      for (j = 0; j < seg; j++) {
        var a = j / seg * Math.PI * 2;
        ring.push([xx, c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a)]);
      }
      if (prev) {
        for (j = 0; j < seg; j++) {
          var k = (j + 1) % seg;
          faces.push([prev[j], ring[j], ring[k], prev[k]]);
        }
      }
      prev = ring;
    }
    return { faces: faces, edges: [] };
  }

  /* Zero-thickness markings: silkscreen, tie-point holes, pads. They carry no
     edges, and sit in the depth sort like any other face so nothing shows
     through the part in front of it. */
  function quadXY(x, y, z) {
    return { faces: [[[x[0], y[0], z], [x[1], y[0], z], [x[1], y[1], z], [x[0], y[1], z]]], edges: [] };
  }
  function discXZ(cx, cz, r, y, seg) {
    var f = [];
    for (var i = 0; i < (seg || 12); i++) {
      var a = i / (seg || 12) * Math.PI * 2;
      f.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]);
    }
    return { faces: [f], edges: [] };
  }

  function primGeom(s) {
    if (s.kind === "cyl") return tubeGeom(s.x, s.c, s.r, 0, s.seg || 18, 0);
    if (s.kind === "ring") return tubeGeom(s.x, s.c, s.r, s.ri, s.seg || 20, s.slant || 0);
    if (s.kind === "dome") return domeGeom(s.x[0], s.x[1], s.c, s.r, 14, 4);
    if (s.kind === "quadXY") return quadXY(s.x, s.y, s.z);
    if (s.kind === "discXZ") return discXZ(s.cx, s.cz, s.r, s.y, s.seg);
    return boxGeom(s.x, s.y, s.z);
  }

  function partGeom(p) {
    if (p.kind === "ring" && p.id === "trap") return tubeGeom(p.x, p.c, p.r, p.ri, 20, 5);
    return primGeom(p);
  }

  /* A part is either one primitive or an assembly of pieces. Geometry is
     static, so it is built once and cached; explode moves it at draw time. */
  function piecesOf(p) {
    if (p._pieces) return p._pieces;
    var src = p.pieces ? (typeof p.pieces === "function" ? p.pieces(p) : p.pieces) : null;
    p._pieces = src
      ? src.map(function (s) {
          return {
            g: primGeom(s),
            color: s.color || p.color || "frame",
            solid: s.solid !== undefined ? s.solid : p.solid,
            flat: !!s.flat
          };
        })
      : [{ g: partGeom(p), color: p.color || "frame", solid: p.solid, flat: false }];
    return p._pieces;
  }

  function offsetOf(p) {
    if (!opts.explode || !p.explode) return [0, 0, 0];
    var k = opts.explode;
    return [p.explode[0] * k, p.explode[1] * k, p.explode[2] * k];
  }
  function shift(pt, o) { return [pt[0] + o[0], pt[1] + o[1], pt[2] + o[2]]; }

  function centroidOf(p) {
    var o = offsetOf(p);
    if (p.kind === "cyl" || p.kind === "ring") {
      return shift([(p.x[0] + p.x[1]) / 2, p.c[0], p.c[1]], o);
    }
    return shift([(p.x[0] + p.x[1]) / 2, (p.y[0] + p.y[1]) / 2, (p.z[0] + p.z[1]) / 2], o);
  }

  function partVisible(p) {
    if (p.layer === "enc") return opts.enc;
    if (p.layer === "esp") return opts.esp;
    return true;
  }

  /* --- drawing helpers --- */
  function poly(pts2) {
    ctx.beginPath();
    ctx.moveTo(pts2[0].x, pts2[0].y);
    for (var i = 1; i < pts2.length; i++) ctx.lineTo(pts2[i].x, pts2[i].y);
    ctx.closePath();
  }
  function segment(a, b) {
    var p = project(a), q = project(b);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }

  var LIGHT = norm([-0.45, -0.7, 0.75]);

  function faceShade(pts, base) {
    var n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    var lam = Math.abs(dot(n, LIGHT));
    return 0.62 + 0.38 * lam;
  }

  function mix(c, amt) {
    var h = hex(c).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    var r = Math.round(Math.min(255, ((n >> 16) & 255) * amt));
    var g = Math.round(Math.min(255, ((n >> 8) & 255) * amt));
    var b = Math.round(Math.min(255, (n & 255) * amt));
    return [r, g, b];
  }
  function shaded(c, amt, a) {
    var v = mix(c, amt);
    return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + a + ")";
  }

  /* --- the frame --- */
  var hitFaces = [];

  function draw() {
    readTheme();
    buildCamera();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    hitFaces = [];

    var enc = PARTS[0];
    var encGeom = boxGeom(enc.x, enc.y, enc.z);

    if (opts.rule) drawGrid(enc);

    /* Enclosure back faces first, so interior parts sit on top of them. */
    if (opts.enc) drawShellFaces(encGeom, false);

    /* Every interior face, sorted far to near. */
    var list = [];
    PARTS.forEach(function (p) {
      if (p.kind === "shell" || !partVisible(p)) return;
      if (p.kind === "ghost") return;
      var o = offsetOf(p);
      piecesOf(p).forEach(function (pc) {
        pc.g.faces.forEach(function (f) {
          var pts = f.map(function (v) { return shift(v, o); });
          var cx = 0, cy = 0, cz = 0;
          pts.forEach(function (v) { cx += v[0]; cy += v[1]; cz += v[2]; });
          var c = [cx / pts.length, cy / pts.length, cz / pts.length];
          list.push({
            part: p, pts: pts, color: pc.color, solid: pc.solid, flat: pc.flat,
            d: dot(sub(c, basis.eye), basis.f), shade: faceShade(pts)
          });
        });
      });
    });
    list.sort(function (a, b) { return b.d - a.d; });

    list.forEach(function (f) {
      var p = f.part;
      var col = f.color || p.color || "frame";
      var isSel = selected === p.id;
      var isHov = hovered === p.id;
      var a = f.solid ? 0.88 : 0.28 + 0.52 * (1 - opts.opacity);
      if (f.flat) a = Math.max(a, 0.9);
      if (isSel || isHov) a = Math.min(0.95, a + 0.3);
      var pts2 = f.pts.map(project);
      poly(pts2);
      ctx.fillStyle = shaded(col, f.shade, a);
      ctx.fill();
      hitFaces.push({ id: p.id, pts: pts2, d: f.d });
    });

    /* Part edges: this is what makes a transparent part still readable. */
    PARTS.forEach(function (p) {
      if (p.kind === "shell" || !partVisible(p)) return;
      var o = offsetOf(p);
      var isSel = selected === p.id, isHov = hovered === p.id;
      if (p.kind === "ghost") {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = rgba(isSel || isHov ? "accent" : "ink3", isSel || isHov ? 0.95 : 0.6);
        ctx.lineWidth = 1.2;
        boxGeom(p.x, p.y, p.z).edges.forEach(function (e) { segment(shift(e[0], o), shift(e[1], o)); });
        ctx.setLineDash([]);
        return;
      }
      ctx.setLineDash([]);
      ctx.lineWidth = isSel ? 1.8 : 1;
      piecesOf(p).forEach(function (pc) {
        if (pc.flat || !pc.g.edges.length) return;
        ctx.strokeStyle = rgba(isSel ? "accent" : pc.color, isSel || isHov ? 0.95 : 0.5);
        pc.g.edges.forEach(function (e) { segment(shift(e[0], o), shift(e[1], o)); });
      });
    });

    if (opts.beam) drawBeams();
    if (opts.enc) {
      drawShellFaces(encGeom, true);
      drawShellEdges(encGeom);
    }
    if (opts.rule) drawRuler(enc);
    drawTriad();
    if (opts.enc) drawLayerTags(enc);
    drawLabels();

    document.getElementById("hw3d-hud").textContent =
      "AZ " + cam.az.toFixed(0).padStart(4) + "°  EL " + cam.el.toFixed(0).padStart(3) +
      "°  ZOOM " + cam.zoom.toFixed(2) + "×";
  }

  function drawShellFaces(g, front) {
    g.faces.forEach(function (f) {
      var n = norm(cross(sub(f[1], f[0]), sub(f[2], f[0])));
      var c = [0, 0, 0];
      f.forEach(function (v) { c = [c[0] + v[0] / 4, c[1] + v[1] / 4, c[2] + v[2] / 4]; });
      var facingAway = dot(n, sub(c, basis.eye)) > 0;
      if (facingAway === front) return;
      poly(f.map(project));
      ctx.fillStyle = rgba("frame", front ? 0.05 + 0.05 * (1 - opts.opacity) : 0.1);
      ctx.fill();
    });
  }

  function drawShellEdges(g) {
    ctx.setLineDash([]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = rgba("frame", 0.85);
    g.edges.forEach(function (e) { segment(e[0], e[1]); });

    /* The opening in the top plate that the UVette drops through. */
    var zt = PARTS[0].z[1], h = 7.2;
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = rgba("sample", 0.95);
    segment([-h, -h, zt], [h, -h, zt]);
    segment([h, -h, zt], [h, h, zt]);
    segment([h, h, zt], [-h, h, zt]);
    segment([-h, h, zt], [-h, -h, zt]);
    /* Corner ticks read as a frame rather than a solid box. */
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgba("frame", 0.95);
    g.edges.forEach(function (e) {
      var a = e[0], b = e[1];
      var t = 0.13;
      segment(a, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
      segment(b, [b[0] + (a[0] - b[0]) * t, b[1] + (a[1] - b[1]) * t, b[2] + (a[2] - b[2]) * t]);
    });
  }

  function drawBeams() {
    BEAMS.forEach(function (b) {
      var a = b.pts[0], c = b.pts[1];
      if (b.alongY) { a = [0, 0, 0]; c = [0, b.pts[1][0], 0]; }
      ctx.setLineDash(b.dash ? [6, 4] : []);
      ctx.lineWidth = b.w + 4;
      ctx.strokeStyle = rgba(b.color, 0.16);
      segment(a, c);
      ctx.lineWidth = b.w;
      ctx.strokeStyle = rgba(b.color, 0.92);
      segment(a, c);
      ctx.setLineDash([]);
      /* arrow head */
      var p = project(c), q = project(a);
      var ang = Math.atan2(p.y - q.y, p.x - q.x);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 10 * Math.cos(ang - 0.38), p.y - 10 * Math.sin(ang - 0.38));
      ctx.lineTo(p.x - 10 * Math.cos(ang + 0.38), p.y - 10 * Math.sin(ang + 0.38));
      ctx.closePath();
      ctx.fillStyle = rgba(b.color, 0.92);
      ctx.fill();
    });

    /* The 90 degrees between excitation and emission, drawn as an arc. */
    var steps = 14, pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps * Math.PI / 2;
      pts.push([16 * Math.cos(t), 16 * Math.sin(t), 0]);
    }
    ctx.setLineDash([]);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = rgba("accent", 0.8);
    ctx.beginPath();
    pts.forEach(function (p, i) {
      var s = project(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();
    var mid = project([16 * Math.cos(Math.PI / 4) + 5, 16 * Math.sin(Math.PI / 4) + 5, 0]);
    ctx.fillStyle = rgba("accent", 0.95);
    ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("90°", mid.x, mid.y);
  }

  function drawGrid(enc) {
    var z = enc.z[0];
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    for (var x = Math.ceil(enc.x[0] / 20) * 20; x <= enc.x[1]; x += 20) {
      ctx.strokeStyle = rgba("rule", x === 0 ? 0.95 : 0.55);
      segment([x, enc.y[0], z], [x, enc.y[1], z]);
    }
    for (var y = Math.ceil(enc.y[0] / 20) * 20; y <= enc.y[1]; y += 20) {
      ctx.strokeStyle = rgba("rule", y === 0 ? 0.95 : 0.55);
      segment([enc.x[0], y, z], [enc.x[1], y, z]);
    }
  }

  function drawRuler(enc) {
    var y = enc.y[0] - 6, z = enc.z[0];
    ctx.setLineDash([]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgba("ink3", 0.85);
    segment([-48, y, z], [45.25, y, z]);
    ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    var last = -1e9;
    STATIONS.forEach(function (s) {
      segment([s, y, z], [s, y - 4, z]);
      var p = project([s, y - 11, z]);
      if (Math.abs(p.x - last) < 30) return;
      last = p.x;
      ctx.fillStyle = rgba("ink3", 0.95);
      ctx.fillText((s > 0 ? "+" : "") + s.toFixed(2), p.x, p.y);
    });
  }

  function drawTriad() {
    var enc = PARTS[0];
    var o = [enc.x[0], enc.y[0], enc.z[0]];
    var axes = [
      { v: [22, 0, 0], t: "+X excitation", c: "beamEx" },
      { v: [0, 22, 0], t: "+Y detection", c: "beamEm" },
      { v: [0, 0, 22], t: "+Z", c: "ink3" }
    ];
    ctx.setLineDash([]);
    ctx.lineWidth = 1.6;
    ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    axes.forEach(function (a) {
      var end = [o[0] + a.v[0], o[1] + a.v[1], o[2] + a.v[2]];
      ctx.strokeStyle = rgba(a.c, 0.9);
      segment(o, end);
      var p = project([o[0] + a.v[0] * 1.18, o[1] + a.v[1] * 1.18, o[2] + a.v[2] * 1.18]);
      ctx.fillStyle = rgba(a.c, 0.95);
      ctx.fillText(a.t, p.x + 2, p.y);
    });
  }

  /* Which layer holds what is the one thing the team stated outright, so it is
     written on the box rather than left to the parts list. */
  function drawLayerTags(enc) {
    var tags = [
      { z: 0, t: "upper layer, 27 mm — optics, LED, AS7341" },
      { z: -38.5, t: "lower layer, 44 mm — breadboard, ESP32, wiring" }
    ];
    ctx.font = "500 12px Changa, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    tags.forEach(function (tag) {
      var a = project([enc.x[0], enc.y[0], tag.z]);
      var b = project([enc.x[0] - 16, enc.y[0] - 10, tag.z]);
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba("ink3", 0.75);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      var w = ctx.measureText(tag.t).width;
      var bx = Math.max(4, Math.min(W - w - 10, b.x - w - 8));
      ctx.fillStyle = rgba("paper", 0.9);
      ctx.fillRect(bx - 3, b.y - 9, w + 8, 18);
      ctx.fillStyle = rgba("ink2", 1);
      ctx.fillText(tag.t, bx + 1, b.y);
    });
  }

  function drawLabels() {
    ctx.font = "500 12.5px Changa, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    PARTS.forEach(function (p) {
      if (!p.label || !partVisible(p)) return;
      var show = opts.label || selected === p.id || hovered === p.id;
      if (!show) return;
      var c = centroidOf(p);
      var anchor = project(c);
      var d = p.label.dir;
      var out = project([c[0] + d[0] * 26, c[1] + d[1] * 26, c[2] + d[2] * 26]);
      var dx = out.x - anchor.x, dy = out.y - anchor.y;
      var len = Math.hypot(dx, dy) || 1;
      var lx = anchor.x + dx / len * 52, ly = anchor.y + dy / len * 52;
      lx = Math.max(60, Math.min(W - 60, lx));
      ly = Math.max(18, Math.min(H - 26, ly));

      var strong = selected === p.id || hovered === p.id;
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(strong ? "accent" : "ink3", strong ? 0.95 : 0.6);
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = rgba(strong ? "accent" : "ink3", 0.95);
      ctx.fill();

      var txt = p.label.text;
      var w = ctx.measureText(txt).width;
      var left = dx < 0;
      var bx = left ? lx - w - 10 : lx + 4;
      ctx.fillStyle = rgba("paper", 0.92);
      ctx.fillRect(bx - 3, ly - 9, w + 12, 18);
      ctx.textAlign = "left";
      ctx.fillStyle = rgba(strong ? "accent" : "ink2", 1);
      ctx.fillText(txt, bx + 3, ly);
    });
  }

  /* ==========================================================================
     INTERACTION
     ========================================================================== */

  function pointIn(pts, x, y) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function pick(x, y) {
    for (var i = hitFaces.length - 1; i >= 0; i--) {
      if (pointIn(hitFaces[i].pts, x, y)) return hitFaces[i].id;
    }
    return null;
  }

  var drag = null;
  canvas.addEventListener("pointerdown", function (e) {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.offsetX, y: e.offsetY, pan: e.shiftKey || e.button === 1 || e.button === 2, moved: 0 };
  });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  canvas.addEventListener("pointermove", function (e) {
    if (drag) {
      var dx = e.offsetX - drag.x, dy = e.offsetY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.pan) {
        cam.panX += dx; cam.panY += dy;
      } else {
        cam.az -= dx * 0.4;
        cam.el = Math.max(-89.5, Math.min(89.5, cam.el + dy * 0.3));
      }
      drag.x = e.offsetX; drag.y = e.offsetY;
      draw();
      return;
    }
    var id = pick(e.offsetX, e.offsetY);
    if (id !== hovered) {
      hovered = id;
      canvas.style.cursor = id ? "pointer" : "grab";
      draw();
    }
  });
  canvas.addEventListener("pointerup", function (e) {
    if (drag && drag.moved < 5) select(pick(e.offsetX, e.offsetY));
    drag = null;
  });
  canvas.addEventListener("pointerleave", function () {
    if (hovered) { hovered = null; draw(); }
  });
  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    cam.zoom = Math.max(0.45, Math.min(4, cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    draw();
  }, { passive: false });
  canvas.addEventListener("keydown", function (e) {
    var k = e.key, step = e.shiftKey ? 12 : 4;
    if (k === "ArrowLeft") cam.az -= step;
    else if (k === "ArrowRight") cam.az += step;
    else if (k === "ArrowUp") cam.el = Math.min(89.5, cam.el + step);
    else if (k === "ArrowDown") cam.el = Math.max(-89.5, cam.el - step);
    else if (k === "+" || k === "=") cam.zoom = Math.min(4, cam.zoom * 1.12);
    else if (k === "-") cam.zoom = Math.max(0.45, cam.zoom / 1.12);
    else return;
    e.preventDefault();
    draw();
  });

  var VIEWS = {
    iso: { az: -58, el: 20, zoom: 1 },
    plan: { az: -90, el: 89, zoom: 1.05 },
    ex: { az: 178, el: 4, zoom: 1.15 },
    det: { az: 90, el: 8, zoom: 1.15 }
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (b) {
    b.addEventListener("click", function () {
      var v = VIEWS[b.dataset.view];
      cam.az = v.az; cam.el = v.el; cam.zoom = v.zoom;
      cam.panX = 0; cam.panY = 0;
      draw();
    });
  });

  function bindRange(id, outId, fmt, apply) {
    var el = document.getElementById(id), out = document.getElementById(outId);
    function upd() {
      var v = Number(el.value);
      out.textContent = fmt(v);
      apply(v);
      draw();
    }
    el.addEventListener("input", upd);
    upd();
  }
  bindRange("hw3d-opacity", "hw3d-opacity-out", function (v) { return v + "%"; }, function (v) { opts.opacity = v / 100; });
  bindRange("hw3d-explode", "hw3d-explode-out", function (v) { return (v * 0.4).toFixed(0) + " mm"; },
    function (v) { opts.explode = v * 0.4; });

  [["hw3d-ly-enc", "enc"], ["hw3d-ly-beam", "beam"], ["hw3d-ly-label", "label"], ["hw3d-ly-rule", "rule"],
   ["hw3d-ly-esp", "esp"], ["hw3d-ly-spin", "spin"]].forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    el.addEventListener("change", function () {
      opts[pair[1]] = el.checked;
      if (pair[1] === "spin" && el.checked) spin();
      draw();
    });
    opts[pair[1]] = el.checked;
  });

  var spinning = false;
  function spin() {
    if (spinning) return;
    spinning = true;
    var last = performance.now();
    (function step(now) {
      if (!opts.spin) { spinning = false; return; }
      cam.az += (now - last) * 0.012;
      last = now;
      draw();
      requestAnimationFrame(step);
    })(last);
  }

  /* ==========================================================================
     REGISTER TABLE + READOUT
     ========================================================================== */

  function fmtX(p) {
    if (p.xLabel) return p.xLabel;
    var a = p.x[0], b = p.x[1];
    return (a > 0 ? "+" : "") + a.toFixed(2) + " … " + (b > 0 ? "+" : "") + b.toFixed(2);
  }

  var tbody = document.getElementById("hw3d-rows");
  PARTS.forEach(function (p) {
    if (p.kind === "shell" && p.id !== "enclosure") return;
    var tr = document.createElement("tr");
    tr.tabIndex = 0;
    tr.dataset.id = p.id;
    tr.innerHTML =
      '<td><span class="hw3d-name">' + p.name + "</span></td>" +
      '<td class="hw3d-num">' + fmtX(p) + "</td>" +
      '<td class="hw3d-note">' + p.note + "</td>";
    tr.addEventListener("click", function () { select(p.id); });
    tr.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(p.id); }
    });
    tr.addEventListener("mouseenter", function () { hovered = p.id; draw(); });
    tr.addEventListener("mouseleave", function () { hovered = null; draw(); });
    tbody.appendChild(tr);
  });

  function select(id) {
    selected = (selected === id) ? null : id;
    Array.prototype.forEach.call(tbody.children, function (tr) {
      tr.setAttribute("aria-selected", tr.dataset.id === selected ? "true" : "false");
    });
    var box = document.getElementById("hw3d-readout");
    var p = PARTS.filter(function (q) { return q.id === selected; })[0];
    if (!p) {
      box.innerHTML = '<span class="hw3d-dim">Pick a part in the view, or a row in the list below, to see its coordinates and where they come from.</span>';
      draw();
      return;
    }
    var yz = p.kind === "cyl" || p.kind === "ring"
      ? "Ø " + (p.r * 2).toFixed(1) + (p.ri ? " / bore Ø " + (p.ri * 2).toFixed(1) : "")
      : "Y " + p.y[0].toFixed(1) + "…" + p.y[1].toFixed(1) + "  Z " + p.z[0].toFixed(1) + "…" + p.z[1].toFixed(1);
    box.innerHTML =
      '<span class="hw3d-rname">' + p.name + "</span>" +
      '<span class="hw3d-rnum">X ' + fmtX(p) + "</span>" +
      '<span class="hw3d-rnum">' + yz + "</span>" +
      '<span class="hw3d-rnote">' + p.note + "</span>";
    draw();
  }

  /* ==========================================================================
     BOOT
     ========================================================================== */

  function resize() {
    var r = canvas.parentNode.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(280, r.width);
    H = Math.max(280, r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    draw();
  }
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentNode);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.getElementById("hw3d-ly-spin").disabled = true;
  }

  select(null);
  resize();
  /* Fonts change nothing structural, but labels are measured, so redraw once. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
