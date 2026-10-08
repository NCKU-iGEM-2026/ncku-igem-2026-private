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
    core:  { label: 'Optical core', show: { core: 1, trap: 1, under: 1, plate: 1, proxy: 1 }, dist: 250, z: 12 },
    open:  { label: 'Chambers open', show: { core: 1, trap: 1, under: 1, plate: 1, proxy: 1 }, explode: 1, dist: 290, z: 26 },
    whole: { label: 'Whole reader', show: { core: 1, trap: 1, under: 1, plate: 1, proxy: 1, rail: 1, box: 1, cap: 1 }, dist: 370, z: -6 }
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
    items.push({ name: 'Cuvette (UVette)', kind: 'proxy', sub: 'cuvette', mesh: boxMesh(cx - 6.25, cyy - 6.25, 0, cx + 6.25, cyy + 6.25, 36),
                 text: 'Bought part, drawn as a plain block in its 13 × 13 mm pocket; its height is not to scale.' });

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
      'attribute vec3 p; attribute vec3 n; uniform mat4 M; uniform vec3 off; uniform vec3 L; uniform float lit; varying float s;' +
      'void main(){ gl_Position = M * vec4(p + off, 1.0); s = lit > 0.5 ? 0.42 + 0.58 * abs(dot(normalize(n), L)) : 1.0; }'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER,
      'precision mediump float; uniform vec4 col; varying float s; void main(){ gl_FragColor = vec4(col.rgb * s, col.a); }'));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var loc = { p: gl.getAttribLocation(prog, 'p'), n: gl.getAttribLocation(prog, 'n'),
                M: gl.getUniformLocation(prog, 'M'), off: gl.getUniformLocation(prog, 'off'), L: gl.getUniformLocation(prog, 'L'),
                lit: gl.getUniformLocation(prog, 'lit'), col: gl.getUniformLocation(prog, 'col') };

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
    var mode = 'core', sel = -1, ex = 0, exTo = 0, cam = { yaw: -2.25, pitch: 0.62, dist: MODES.core.dist };
    var target = [64, 50, MODES.core.z], camTo = { dist: cam.dist, z: target[2] };

    function visible(it) { return !!MODES[mode].show[it.kind]; }

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
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      // opaque faces first, then see-through ones without writing depth
      [false, true].forEach(function (glass) {
        gl.depthMask(!glass);
        items.forEach(function (it, i) {
          if (!visible(it)) return;
          var key = it.sub === 'cuvette' ? 'cuvette' : it.kind, c = COL[key];
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
        var key = (it.sub === 'cuvette' ? 'cuvette' : it.kind) + 'Edge', c = i === sel ? [0.75, 1, 0.85, 1] : COL[key];
        gl.uniform3fv(loc.off, off(it)); gl.uniform1f(loc.lit, 0); gl.uniform4fv(loc.col, c);
        bind(it.lb); gl.drawArrays(gl.LINES, 0, it.lb.count);
      });
      gl.depthMask(true);
    }

    function pickAt(px, py) {
      var w = canvas.width, h = canvas.height;
      sizePick(w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      gl.uniformMatrix4fv(loc.M, false, matrix()); gl.uniform1f(loc.lit, 0);
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
      if (Math.abs(cam.dist - camTo.dist) > 0.05 || Math.abs(target[2] - camTo.z) > 0.05) {
        var k = calm ? 1 : 0.14;
        cam.dist += (camTo.dist - cam.dist) * k; target[2] += (camTo.z - target[2]) * k; dirty = true;
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
      if (it.kind === 'proxy') txt = it.text;
      else {
        var paint = it.kind === 'box' ? 'Bare plywood, not painted.' : 'Coloured matte black.';
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

    /* --- controls --- */
    var seg = document.createElement('div'); seg.className = 'hwx-seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'What to show');
    var buttons = {};
    Object.keys(MODES).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = MODES[k].label;
      b.setAttribute('aria-pressed', k === mode ? 'true' : 'false');
      b.addEventListener('click', function () {
        mode = k; exTo = MODES[k].explode ? 1 : 0; camTo = { dist: MODES[k].dist, z: MODES[k].z };
        if (sel >= 0 && !visible(items[sel])) { sel = -1; say(); }
        Object.keys(buttons).forEach(function (q) { buttons[q].setAttribute('aria-pressed', q === k ? 'true' : 'false'); });
        dirty = true;
      });
      buttons[k] = b; seg.appendChild(b);
    });
    var reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Reset view';
    reset.addEventListener('click', function () { cam.yaw = -2.25; cam.pitch = 0.62; camTo = { dist: MODES[mode].dist, z: MODES[mode].z }; sel = -1; say(); dirty = true; });
    var seg2 = document.createElement('div'); seg2.className = 'hwx-seg'; seg2.appendChild(reset);
    ctrls.appendChild(seg); ctrls.appendChild(seg2);

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
