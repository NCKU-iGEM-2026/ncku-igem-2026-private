/* The printed parts, drawn from the meshes of the STL files themselves.
 *
 * hardware-cutaway.js is a schematic: boxes placed from the optical
 * coordinates, to show where the light goes. This is the other half, the
 * geometry that was prepared for printing, shown three ways:
 *
 *   assembled     every part where the CAD assembly puts it
 *   pulled apart  the same, moved as the CAD's own exploded assembly moves it
 *   laid out      one module's files side by side on a 10 mm grid
 *
 * The geometry is one glTF model on static.igem.wiki, named in the panel's
 * data-model. iGEM's upload tool takes neither STL nor ZIP files, so the STL
 * files were packed into that model: one mesh per file, under the file's
 * name, with the file's own vertices and triangles in the file's own order.
 * Nothing was simplified, which is what lets a part be handed back here as
 * the STL it came from.
 *
 * The STL files are exported in their own frames, most of them lying on the
 * print bed, so a file does not say where its part goes. The placements are
 * in hardware.html, in the JSON block inside the panel: one position and one
 * rotation per piece, read out of the STEP assemblies and checked against
 * the files point by point. This script applies them; it does not work any
 * of them out.
 *
 * Everything the panel says about a part is in hardware.html as well, in the
 * list under the view: the names, counts, notes and links are taken from
 * there. Without WebGL, or without this script, that list is the whole
 * panel, with a link to the model.
 *
 * A small WebGL 1 renderer, no library: flat-shaded triangles, the edges
 * where two faces meet at more than 25 degrees drawn over them, an orbit
 * camera, and picking by casting a ray at the triangles.
 *
 * "Take a reading" draws the light path through the assembly. The printed
 * parts go to outline, a blue box grows from the LED into the light trap and
 * a green one from the cuvette to the sensor board. Both boxes take their
 * ends from where the assembly puts those parts, and the steps beside them
 * are sentences from the page. It is a drawing, not a simulation.
 */
(function () {
  "use strict";

  var root = document.getElementById("hwParts");
  if (!root) return;
  var stage = root.querySelector(".hwp-stage");
  var canvas = root.querySelector(".hwp-view");
  var ctrls = root.querySelector(".hwp-ctrls");
  var readout = root.querySelector(".hwp-readout");
  var hud = root.querySelector(".hwp-hud");
  var status = root.querySelector(".hwp-status");
  if (!stage || !canvas || !ctrls || !readout || !hud || !status) return;

  var GL_OPTS = { antialias: true, alpha: true };
  var gl = null;
  try {
    gl = canvas.getContext("webgl", GL_OPTS) || canvas.getContext("experimental-webgl", GL_OPTS);
  } catch (e) { gl = null; }
  if (!gl || !window.Promise || !window.fetch || !window.Map) return;

  function $$(sel, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(sel));
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  /* ------------------------------------------------------------------
     THE PARTS, READ FROM THE PAGE
     ------------------------------------------------------------------ */
  var byFile = {};
  var groups = $$(".hwp-group", root).map(function (sec) {
    var g = {
      id: sec.getAttribute("data-group"),
      name: sec.querySelector("h4").firstChild.textContent.replace(/\s+/g, " ").trim(),
      parts: [],
      pieces: 0,
      button: null
    };
    g.parts = $$("li[data-file]", sec).map(function (li) {
      var p = {
        group: g,
        li: li,
        file: li.getAttribute("data-file"),
        qty: Math.max(1, parseInt(li.getAttribute("data-qty"), 10) || 1),
        state: li.getAttribute("data-state") || "both",
        name: li.querySelector(".hwp-name").textContent.replace(/\s+/g, " ").trim(),
        mesh: null
      };
      byFile[p.file] = p;
      g.pieces += p.qty;
      return p;
    });
    return g;
  }).filter(function (g) { return g.parts.length; });
  if (!groups.length) return;

  // The bought parts: no file, but a line in the list like any other.
  var bought = {};
  $$("li[data-standin]", root).forEach(function (li) { bought[li.getAttribute("data-standin")] = li; });

  /* Where each piece goes. Anything wrong with the list and it is not used
     at all: the laid-out view needs none of it and is what is left. */
  var plan = null;
  try {
    plan = JSON.parse(document.getElementById("hwPartsPlan").textContent);
    var numbers = function (a, n) {
      if (!Array.isArray(a) || a.length !== n ||
          !a.every(function (v) { return typeof v === "number" && isFinite(v); })) {
        throw new Error("placement");
      }
    };
    ["v1", "v2"].forEach(function (v) {
      plan[v].forEach(function (e) {
        if (!byFile[e.f]) throw new Error(e.f);
        numbers(e.t, 3);
        if (e.r) numbers(e.r, 9);
        if (e.x) numbers(e.x, 3);
      });
    });
    ["p1", "p2"].forEach(function (v) {
      plan[v] = plan[v] || [];
      plan[v].forEach(function (p) {
        if (!bought[p.id]) throw new Error(p.id);
        numbers(p.lo, 3);
        numbers(p.hi, 3);
        if (p.x) numbers(p.x, 3);
      });
    });
  } catch (e) { plan = null; }

  /* The light trap, for "Take a reading": which file it is, and the three
     numbers of its cavity that decide where the beam goes. In the file's own
     frame, x from its entrance and z from the cuvette's base: the sloped end
     wall from its foot to its top, the roof, and half the cavity's width. */
  var LIGHT = null;
  try {
    var lt = plan && plan.light;
    if (lt && byFile[lt.trap] && Array.isArray(lt.ramp) && lt.ramp.length === 4 &&
        lt.ramp.concat([lt.roof, lt.half]).every(function (v) { return typeof v === "number" && isFinite(v); }) &&
        lt.ramp[2] > lt.ramp[0] && lt.ramp[3] > lt.ramp[1] && lt.roof >= lt.ramp[3]) {
      LIGHT = lt;
    }
  } catch (e) { LIGHT = null; }

  /* ------------------------------------------------------------------
     COLOUR, FROM THE STYLESHEET
     ------------------------------------------------------------------ */
  var cssOf = getComputedStyle(root);
  function colour(name, fallback) {
    var m = /^#([0-9a-f]{6})$/i.exec((cssOf.getPropertyValue(name) || "").trim());
    var hex = m ? m[1] : fallback;
    return [0, 2, 4].map(function (i) { return parseInt(hex.substr(i, 2), 16) / 255; });
  }
  var COL = {
    both: colour("--hwp-both", "b3c1cb"),
    v1: colour("--hwp-v1", "66757f"),
    v2: colour("--hwp-v2", "49c5b6"),
    proxy: colour("--hwp-proxy", "5fb3e0"),
    ex: colour("--hwp-ex", "5fb3e0"),
    em: colour("--hwp-em", "55d98a"),
    absent: colour("--hwp-absent", "8fa5b0"),
    hot: colour("--hwp-hot", "e6b060"),
    bed: colour("--hwp-bed", "12222b"),
    grid: colour("--hwp-grid", "23404d")
  };
  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  /* ------------------------------------------------------------------
     THE MESHES
     A part's triangles, as its STL had them. The coordinates are kept as
     they are, because the placements are written for those. Normals are
     taken from the vertices.
     ------------------------------------------------------------------ */
  var EDGE_COS = Math.cos(25 * Math.PI / 180);

  function finish(pos) {
    var n = pos.length / 9, nor = new Float32Array(pos.length);
    var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], t, k;
    for (k = 0; k < pos.length; k++) {
      if (pos[k] < lo[k % 3]) lo[k % 3] = pos[k];
      if (pos[k] > hi[k % 3]) hi[k % 3] = pos[k];
    }
    for (t = 0; t < n; t++) {
      var i = t * 9;
      var ux = pos[i + 3] - pos[i], uy = pos[i + 4] - pos[i + 1], uz = pos[i + 5] - pos[i + 2];
      var wx = pos[i + 6] - pos[i], wy = pos[i + 7] - pos[i + 1], wz = pos[i + 8] - pos[i + 2];
      var nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      for (k = 0; k < 3; k++) {
        nor[i + k * 3] = nx; nor[i + k * 3 + 1] = ny; nor[i + k * 3 + 2] = nz;
      }
    }
    return {
      tris: n, pos: pos, nor: nor, lo: lo, hi: hi,
      size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]],
      lines: edges(pos, nor, n)
    };
  }

  /* The model is binary glTF, read by hand. Only what this page's own model
     uses is understood: one primitive per mesh, positions as floats, indices
     of 16 or 32 bits. What comes back gives a part's triangles, nine numbers
     each, by the name of its STL file. */
  function readModel(buf) {
    var dv = new DataView(buf);
    if (buf.byteLength < 28 || dv.getUint32(0, true) !== 0x46546C67 ||
        dv.getUint32(16, true) !== 0x4E4F534A) return null;
    var jl = dv.getUint32(12, true);
    if (28 + jl > buf.byteLength || dv.getUint32(24 + jl, true) !== 0x004E4942) return null;
    var doc = JSON.parse(new TextDecoder("utf-8").decode(new Uint8Array(buf, 20, jl)));
    var bin = 28 + jl, byName = {};
    doc.meshes.forEach(function (m) { byName[m.name] = m.primitives[0]; });
    return function (name) {
      var prim = byName[name];
      if (!prim) return null;
      var pa = doc.accessors[prim.attributes.POSITION], ia = doc.accessors[prim.indices];
      var po = bin + (doc.bufferViews[pa.bufferView].byteOffset || 0) + (pa.byteOffset || 0);
      var io = bin + (doc.bufferViews[ia.bufferView].byteOffset || 0) + (ia.byteOffset || 0);
      var wide = ia.componentType === 5125, pos = new Float32Array(ia.count * 3);
      for (var i = 0; i < ia.count; i++) {
        var v = po + (wide ? dv.getUint32(io + i * 4, true) : dv.getUint16(io + i * 2, true)) * 12;
        pos[i * 3] = dv.getFloat32(v, true);
        pos[i * 3 + 1] = dv.getFloat32(v + 4, true);
        pos[i * 3 + 2] = dv.getFloat32(v + 8, true);
      }
      return pos;
    };
  }

  /* The edges worth drawing: where a face ends, or where two faces meet at
     an angle. Vertices are matched to a micron, which is how an STL has to
     be stitched since it shares nothing between triangles. */
  function edges(pos, nor, n) {
    var ids = new Map(), where = [], vid = new Uint32Array(n * 3), count = 0;
    var t, e, key, id;
    for (t = 0; t < n * 3; t++) {
      key = Math.round(pos[t * 3] * 1000) + "," + Math.round(pos[t * 3 + 1] * 1000) + "," +
            Math.round(pos[t * 3 + 2] * 1000);
      id = ids.get(key);
      if (id === undefined) { id = count++; ids.set(key, id); where.push(t * 3); }
      vid[t] = id;
    }

    var seen = new Map(), out = [];
    function push(a, b) {
      var p = where[a], q = where[b];
      out.push(pos[p], pos[p + 1], pos[p + 2], pos[q], pos[q + 1], pos[q + 2]);
    }
    for (t = 0; t < n; t++) {
      for (e = 0; e < 3; e++) {
        var a = vid[t * 3 + e], b = vid[t * 3 + (e + 1) % 3];
        if (a === b) continue;
        key = a < b ? a * count + b : b * count + a;
        var other = seen.get(key);
        if (other === undefined) { seen.set(key, t); continue; }
        if (other < 0) continue;
        var dot = nor[other * 9] * nor[t * 9] + nor[other * 9 + 1] * nor[t * 9 + 1] +
                  nor[other * 9 + 2] * nor[t * 9 + 2];
        if (dot < EDGE_COS) push(a, b);
        seen.set(key, -1);
      }
    }
    seen.forEach(function (face, k2) {
      if (face >= 0) push(Math.floor(k2 / count), k2 % count);
    });
    return new Float32Array(out);
  }

  /* The bought parts have no file. The CAD gives each an extent, and that
     is all that is drawn: a block, or a cylinder along its longest side. */
  function standIn(shape, lo, hi) {
    var p = [];
    function quad(a, b, c, d) { p.push.apply(p, a.concat(b, c, a, c, d)); }
    if (shape === "cyl") {
      var size = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
      var ax = size[0] >= size[1] && size[0] >= size[2] ? 0 : (size[1] >= size[2] ? 1 : 2);
      var u = (ax + 1) % 3, v = (ax + 2) % 3, N = 28;
      var cu = (lo[u] + hi[u]) / 2, cv = (lo[v] + hi[v]) / 2, r = Math.min(size[u], size[v]) / 2;
      var at = function (h, i) {
        var q = [0, 0, 0], a = i / N * Math.PI * 2;
        q[ax] = h; q[u] = cu + r * Math.cos(a); q[v] = cv + r * Math.sin(a);
        return q;
      };
      var mid = function (h) { var q = [0, 0, 0]; q[ax] = h; q[u] = cu; q[v] = cv; return q; };
      for (var i = 0; i < N; i++) {
        quad(at(lo[ax], i), at(lo[ax], i + 1), at(hi[ax], i + 1), at(hi[ax], i));
        p.push.apply(p, mid(hi[ax]).concat(at(hi[ax], i), at(hi[ax], i + 1)));
        p.push.apply(p, mid(lo[ax]).concat(at(lo[ax], i + 1), at(lo[ax], i)));
      }
    } else {
      var c = function (i) { return [(i & 1 ? hi : lo)[0], (i & 2 ? hi : lo)[1], (i & 4 ? hi : lo)[2]]; };
      quad(c(0), c(2), c(3), c(1)); quad(c(4), c(5), c(7), c(6));
      quad(c(0), c(1), c(5), c(4)); quad(c(2), c(6), c(7), c(3));
      quad(c(0), c(4), c(6), c(2)); quad(c(1), c(3), c(7), c(5));
    }
    return finish(new Float32Array(p));
  }

  /* ------------------------------------------------------------------
     GL
     ------------------------------------------------------------------ */
  var VS_SOLID =
    "attribute vec3 aPos;attribute vec3 aNor;" +
    "uniform mat4 uProj;uniform mat4 uView;uniform mat3 uRot;uniform vec3 uOff;" +
    "varying vec3 vN;varying vec3 vV;varying float vUp;" +
    "void main(){vec3 n=uRot*aNor;vec4 v=uView*vec4(uRot*aPos+uOff,1.0);vV=v.xyz;" +
    "vN=(uView*vec4(n,0.0)).xyz;vUp=n.z;gl_Position=uProj*v;}";
  /* Two lights fixed to the camera, so a part keeps its modelling as it
     turns, and a little extra on faces that look up, so the top of a part
     reads as its top from every side. */
  var FS_SOLID =
    "precision mediump float;uniform vec3 uCol;" +
    "varying vec3 vN;varying vec3 vV;varying float vUp;" +
    "void main(){vec3 n=normalize(vN);vec3 e=normalize(-vV);" +
    "if(dot(n,e)<0.0)n=-n;" +
    "float d=0.56*max(dot(n,normalize(vec3(-0.5,0.7,0.6))),0.0)" +
    "+0.20*max(dot(n,normalize(vec3(0.65,-0.2,0.7))),0.0);" +
    "float rim=pow(1.0-max(dot(n,e),0.0),3.0);" +
    "vec3 c=uCol*(0.30+d+0.10*max(vUp,0.0))+vec3(0.07)*rim;" +
    "gl_FragColor=vec4(min(c,vec3(1.0)),1.0);}";
  var VS_FLAT =
    "attribute vec3 aPos;uniform mat4 uProj;uniform mat4 uView;uniform mat3 uRot;uniform vec3 uOff;" +
    "void main(){gl_Position=uProj*(uView*vec4(uRot*aPos+uOff,1.0));}";
  var FS_FLAT = "precision mediump float;uniform vec3 uCol;void main(){gl_FragColor=vec4(uCol,1.0);}";
  // the light and the cuvette it passes through: one colour, with its own alpha
  var FS_GLOW = "precision mediump float;uniform vec4 uCol;void main(){gl_FragColor=uCol;}";

  function program(vs, fs) {
    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    // The same slots in both programs, so turning the normals off after the
    // solid pass cannot turn the positions off for the flat one.
    gl.bindAttribLocation(p, 0, "aPos");
    gl.bindAttribLocation(p, 1, "aNor");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return {
      id: p,
      aPos: gl.getAttribLocation(p, "aPos"),
      aNor: gl.getAttribLocation(p, "aNor"),
      uProj: gl.getUniformLocation(p, "uProj"),
      uView: gl.getUniformLocation(p, "uView"),
      uRot: gl.getUniformLocation(p, "uRot"),
      uOff: gl.getUniformLocation(p, "uOff"),
      uCol: gl.getUniformLocation(p, "uCol")
    };
  }

  var solid = null, flat = null, glow = null;
  function buffer(data) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }
  function upload(mesh) {
    mesh.bPos = buffer(mesh.pos);
    mesh.bNor = buffer(mesh.nor);
    mesh.bLine = buffer(mesh.lines);
  }
  function setup() {
    solid = program(VS_SOLID, FS_SOLID);
    flat = program(VS_FLAT, FS_FLAT);
    glow = program(VS_FLAT, FS_GLOW);
    if (!solid || !flat || !glow) return false;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    gl.clearColor(0, 0, 0, 0);
    return true;
  }
  if (!setup()) return;

  /* ------------------------------------------------------------------
     LOADING
     ------------------------------------------------------------------ */
  var modelURL = root.getAttribute("data-model");
  if (!modelURL) return;
  var model = null;
  // One fetch for everything; a failure is forgotten so the next ask tries again.
  function fetchModel() {
    if (!model) {
      model = fetch(modelURL).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      }).then(function (buf) {
        var read = readModel(buf);
        if (!read) throw new Error("not a glTF model");
        return read;
      }).catch(function (err) {
        model = null;
        throw err;
      });
    }
    return model;
  }
  function load(part) {
    if (part.mesh) return Promise.resolve(part.mesh);
    return fetchModel().then(function (read) {
      if (!part.mesh) {
        var pos = read(part.file);
        if (!pos) throw new Error(part.file);
        var mesh = finish(pos);
        upload(mesh);
        part.mesh = mesh;
      }
      return part.mesh;
    });
  }

  /* ------------------------------------------------------------------
     A SCENE
     A list of pieces, each a part with a rotation, a place, and how far
     pulling the assembly apart moves it. The rotations only ever swap or
     flip axes, which keeps the box of a turned part a box.
     ------------------------------------------------------------------ */
  var GAP = 8, MARGIN = 12, GRID = 10;
  var scene = null;
  var spread = 0, spreadGoal = 0;

  function piece(part, rows, base, pull, absent) {
    var m = part.mesh, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (var i = 0; i < 8; i++) {
      var c = [(i & 1 ? m.hi : m.lo)[0], (i & 2 ? m.hi : m.lo)[1], (i & 4 ? m.hi : m.lo)[2]];
      for (var k = 0; k < 3; k++) {
        var v = rows[k * 3] * c[0] + rows[k * 3 + 1] * c[1] + rows[k * 3 + 2] * c[2];
        if (v < lo[k]) lo[k] = v;
        if (v > hi[k]) hi[k] = v;
      }
    }
    return {
      part: part, rows: rows, base: base, pull: pull || [0, 0, 0], absent: !!absent,
      // GL wants the matrix by columns
      rot: new Float32Array([rows[0], rows[3], rows[6], rows[1], rows[4], rows[7], rows[2], rows[5], rows[8]]),
      lo: lo, hi: hi, off: base.slice()
    };
  }
  function place(it, k) {
    for (var i = 0; i < 3; i++) it.off[i] = it.base[i] + it.pull[i] * k;
  }
  /* The box round some of the pieces, with the assembly pulled apart by k. */
  function boxOf(pick, k) {
    var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    scene.items.forEach(function (it) {
      if (pick && !pick(it)) return;
      for (var i = 0; i < 3; i++) {
        var o = it.base[i] + it.pull[i] * k;
        lo[i] = Math.min(lo[i], it.lo[i] + o);
        hi[i] = Math.max(hi[i], it.hi[i] + o);
      }
    });
    return [lo, hi];
  }

  function ground(x0, x1, y0, y1, z) {
    var g = [], i;
    x0 = Math.floor(x0 / GRID) * GRID; x1 = Math.ceil(x1 / GRID) * GRID;
    y0 = Math.floor(y0 / GRID) * GRID; y1 = Math.ceil(y1 / GRID) * GRID;
    for (i = x0; i <= x1; i += GRID) g.push(i, y0, z, i, y1, z);
    for (i = y0; i <= y1; i += GRID) g.push(x0, i, z, x1, i, z);
    if (scene) { gl.deleteBuffer(scene.bGrid); gl.deleteBuffer(scene.bBed); }
    return {
      bGrid: buffer(new Float32Array(g)),
      gridCount: g.length / 3,
      bBed: buffer(new Float32Array([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z]))
    };
  }

  /* One module's files, left to right in the order the page lists them,
     front row first, every copy drawn. Nothing is rotated: each part is
     only moved so that it stands on the grid. */
  function layOut(group) {
    var items = [], area = 0, widest = 0;
    group.parts.forEach(function (p) {
      for (var i = 0; i < p.qty; i++) {
        items.push({ part: p, w: p.mesh.size[0], d: p.mesh.size[1], x: 0, y: 0 });
        area += (p.mesh.size[0] + GAP) * (p.mesh.size[1] + GAP);
        widest = Math.max(widest, p.mesh.size[0]);
      }
    });
    var limit = Math.max(widest, Math.sqrt(area) * 1.55);
    var rows = [], row = { items: [], w: 0, d: 0 };
    items.forEach(function (it) {
      if (row.items.length && row.w + GAP + it.w > limit) {
        rows.push(row);
        row = { items: [], w: 0, d: 0 };
      }
      it.x = (row.items.length ? row.w + GAP : 0) + it.w / 2;
      row.w = it.x + it.w / 2;
      row.d = Math.max(row.d, it.d);
      row.items.push(it);
    });
    rows.push(row);

    var depth = -GAP, width = 0;
    rows.forEach(function (r) { depth += r.d + GAP; width = Math.max(width, r.w); });
    var y = -depth / 2, out = [];
    rows.forEach(function (r) {
      r.items.forEach(function (it) {
        var m = it.part.mesh;
        out.push(piece(it.part, IDENT, [
          it.x - r.w / 2 - (m.lo[0] + m.hi[0]) / 2,
          y + r.d / 2 - (m.lo[1] + m.hi[1]) / 2,
          -m.lo[2]
        ]));
      });
      y += r.d + GAP;
    });
    var g = ground(-width / 2 - MARGIN, width / 2 + MARGIN, -depth / 2 - MARGIN, depth / 2 + MARGIN, 0);
    g.items = out;
    return g;
  }

  /* A version of the instrument, each piece where the placement list says. */
  var standIns = {};
  function assemble(version) {
    var out = plan[version].map(function (e) {
      return piece(byFile[e.f], e.r || IDENT, e.t, e.x, e.a);
    });
    plan[version === "v1" ? "p1" : "p2"].forEach(function (p) {
      var key = p.id + version;
      if (!standIns[key]) {
        var mesh = standIn(p.shape, p.lo, p.hi), li = bought[p.id];
        upload(mesh);
        standIns[key] = {
          standin: p.id, li: li, state: "proxy", qty: 1, mesh: mesh,
          name: li.querySelector(".hwp-name").textContent.replace(/\s+/g, " ").trim()
        };
      }
      out.push(piece(standIns[key], IDENT, [0, 0, 0], p.x));
    });
    var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    out.forEach(function (it) {
      for (var i = 0; i < 3; i++) {
        lo[i] = Math.min(lo[i], it.lo[i] + it.base[i]);
        hi[i] = Math.max(hi[i], it.hi[i] + it.base[i]);
      }
    });
    var g = ground(lo[0] - 20, hi[0] + 20, lo[1] - 20, hi[1] + 20, lo[2]);
    g.items = out;
    return g;
  }
  function filesOf(version) {
    var seen = {}, out = [];
    plan[version].forEach(function (e) {
      if (!seen[e.f]) { seen[e.f] = 1; out.push(byFile[e.f]); }
    });
    return out;
  }

  /* ------------------------------------------------------------------
     A READING, DRAWN
     One cycle of the firmware's dark, lit, dark, slowed down so that it can
     be followed. Nothing is simulated. The blue box runs from the front of
     the LED, along the excitation axis, to just short of the far end of the
     light trap; the green one from that axis to the face of the sensor
     board. Each end is read off the piece it belongs to, as the assembly
     places it.
     ------------------------------------------------------------------ */
  var reading = null, unit = null, rod = null;
  var READ = { az: -118, el: 44 };       // the whole path
  var TRAP_VIEW = { az: -90, el: 7 };    // the trap from the side, nearly level, so its sloped wall is seen as a slope
  // seconds: the dark read, the blue front reaching the sample, the green
  // reaching the board, each reflection inside the trap, the LED held on
  // after the last of them, its fade, and the dark read after
  var T_DARK = 1.8, T_REACH = 1.3, T_GREEN = 1.5, T_BOUNCE = 0.45, T_HOLD = 2.6, T_FADE = 0.4, T_AFTER = 1.8;
  var BEAM = 1.6;   // mm, the radius the beams are drawn at: they pass the 4 mm ports of version 2's cuvette holder

  function lightPath() {
    var at = {};
    scene.items.forEach(function (it) {
      if (it.part.standin) at[it.part.standin] = it;
      else if (LIGHT && it.part.file === LIGHT.trap) at.trap = it;
    });
    // the trap's numbers are in its own frame, so it has to stand unturned
    if (!at.led || !at.uvette || !at.board || !at.trap || at.trap.rows !== IDENT) return null;
    var lo = function (it, k) { return it.lo[k] + it.base[k]; };
    var hi = function (it, k) { return it.hi[k] + it.base[k]; };
    var p = {
      x0: hi(at.led, 0),
      y: (lo(at.led, 1) + hi(at.led, 1)) / 2,
      z: (lo(at.led, 2) + hi(at.led, 2)) / 2,
      xc: (lo(at.uvette, 0) + hi(at.uvette, 0)) / 2,
      y1: lo(at.board, 1),
      cup: [0, 1, 2].map(function (k) { return lo(at.uvette, k); }),
      cupSize: [0, 1, 2].map(function (k) { return hi(at.uvette, k) - lo(at.uvette, k); }),
      trap: at.trap.part
    };
    /* The sloped end wall, in the vertical plane the beam travels in: a is
       its foot, b its top, n points off it into the cavity. The axial ray
       meets it at the beam's height, is turned up to the roof, and from the
       roof comes back down onto the wall. Two ideal reflections and no more:
       what the matte black walls absorb at each one was not measured. */
    var ox = at.trap.base[0], oz = at.trap.base[2];
    var a = [LIGHT.ramp[0] + ox, LIGHT.ramp[1] + oz], b = [LIGHT.ramp[2] + ox, LIGHT.ramp[3] + oz];
    var roof = LIGHT.roof + oz, k = (b[1] - a[1]) / (b[0] - a[0]);
    var len = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
    var n = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    var hit = [a[0] + (p.z - a[1]) / k, p.z];
    if (!(hit[0] > hi(at.uvette, 0)) || !(p.cup[0] > p.x0) || !(p.y1 > p.y) || !(roof > p.z)) return null;
    var d1 = [1 - 2 * n[0] * n[0], -2 * n[0] * n[1]];
    var q1 = [hit[0] + d1[0] * (roof - hit[1]) / d1[1], roof];
    var d2 = [d1[0], -d1[1]];
    var s2 = (q1[1] - a[1] - k * (q1[0] - a[0])) / (k * d2[0] - d2[1]);
    var q2 = [q1[0] + d2[0] * s2, q1[1] + d2[1] * s2];
    p.x1 = hit[0];
    p.wall = { a: a, b: b, n: n, half: LIGHT.half };
    p.bounces = [{ from: hit, to: q1, a: 0.6, thin: 0.8 }, { from: q1, to: q2, a: 0.36, thin: 0.62 }];
    // one speed for the blue front: it reaches the sample after T_REACH
    p.tBlue = T_REACH * (p.x1 - p.x0) / (p.cup[0] - p.x0);
    p.tCup = T_DARK + T_REACH;
    p.tTrap = T_DARK + p.tBlue;
    p.tOff = p.tTrap + 2 * T_BOUNCE + T_HOLD;
    p.tEnd = p.tOff + T_FADE + T_AFTER;
    return p;
  }

  /* What the light is doing t seconds into the cycle, and which of the
     page's steps that is. Once the cycle is over the path stays drawn. */
  function lightAt(p, t) {
    if (t >= p.tEnd) return { blue: 1, green: 1, b1: 1, b2: 1, lit: 1, read: 0, focus: 0, step: -1, done: true };
    var u = function (v) { return Math.max(0, Math.min(1, v)); };
    var bump = function (from, to) { return t > from && t < to ? Math.sin(Math.PI * (t - from) / (to - from)) : 0; };
    return {
      blue: u((t - T_DARK) / p.tBlue),
      green: u((t - p.tCup - 0.15) / T_GREEN),
      b1: u((t - p.tTrap) / T_BOUNCE),
      b2: u((t - p.tTrap - T_BOUNCE) / T_BOUNCE),
      lit: t < T_DARK ? 0 : (t < p.tOff ? 1 : u(1 - (t - p.tOff) / T_FADE)),
      // the detector reads with the LED off as well, before and after
      read: Math.max(bump(0.3, T_DARK - 0.2), bump(p.tOff + T_FADE + 0.1, p.tEnd - 0.2)),
      // while the light is in the trap the other parts' outlines step back
      focus: u((t - p.tTrap) / 0.5) * (1 - u((t - p.tOff) / 0.5)),
      step: t < T_DARK ? 0 : t < p.tCup + 0.15 ? 1 : t < p.tTrap ? 2 : t < p.tOff ? 3 : 4,
      done: false
    };
  }

  /* ------------------------------------------------------------------
     CAMERA
     Z is up. az and el are where the eye sits, seen from the target.
     ------------------------------------------------------------------ */
  var FOV = 30 * Math.PI / 180;
  // The assembly is seen from the LED end, so the light runs left to right
  // as it does in the plan view; a tray of parts is seen nearly square on.
  var HOME = { built: { az: -122, el: 30 }, laid: { az: -76, el: 36 } };
  var cam = { az: HOME.built.az, el: HOME.built.el, dist: 200, t: [0, 0, 0] };
  var goal = null;

  function aspect() { return canvas.width / Math.max(1, canvas.height); }

  function axes(az, elv) {
    az *= Math.PI / 180; elv *= Math.PI / 180;
    var out = [Math.cos(elv) * Math.cos(az), Math.cos(elv) * Math.sin(az), Math.sin(elv)];
    // right = up x out, normalised; up' = out x right
    var rl = Math.sqrt(out[0] * out[0] + out[1] * out[1]) || 1;
    var right = [-out[1] / rl, out[0] / rl, 0];
    var up = [
      out[1] * right[2] - out[2] * right[1],
      out[2] * right[0] - out[0] * right[2],
      out[0] * right[1] - out[1] * right[0]
    ];
    return { out: out, right: right, up: up };
  }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /* Where the eye has to stand, looking from this direction, for some
     pieces to fill the given share of the view. The corners of each piece's
     own box are pushed back until every one is inside: fitting one box
     round the lot would leave most of the frame empty, since the tall
     parts stand in the middle of a wide, flat plate. */
  function frameOf(target, az, elv) {
    if (az == null) { az = cam.az; elv = cam.el; }
    var chosen = function (it) { return !target || it.part === target; };
    var all = boxOf(chosen, spreadGoal), i;
    // A shim is 2 mm across; without a floor the camera would end up inside it.
    var pad = [0, 0, 0];
    for (i = 0; i < 3; i++) pad[i] = Math.max(0, 12 - (all[1][i] - all[0][i])) / 2;
    var t = [(all[0][0] + all[1][0]) / 2, (all[0][1] + all[1][1]) / 2, (all[0][2] + all[1][2]) / 2];
    var ax = axes(az, elv), th = Math.tan(FOV / 2), share = target ? 0.5 : 0.9, dist = 0;
    scene.items.forEach(function (it) {
      if (!chosen(it)) return;
      for (var n = 0; n < 8; n++) {
        var c = [0, 0, 0];
        for (var k = 0; k < 3; k++) {
          var up = n >> k & 1;
          c[k] = (up ? it.hi[k] + pad[k] : it.lo[k] - pad[k]) + it.base[k] + it.pull[k] * spreadGoal - t[k];
        }
        var z = dot3(c, ax.out);
        dist = Math.max(dist,
          z + Math.abs(dot3(c, ax.right)) / (share * th * aspect()),
          z + Math.abs(dot3(c, ax.up)) / (share * th));
      }
    });
    return { t: t, dist: dist };
  }
  function travel(to, jump) {
    if (jump || calm) {
      cam.t = to.t.slice(); cam.dist = to.dist;
      if (to.az != null) { cam.az = to.az; cam.el = to.el; }
      goal = null;
    } else {
      goal = to;
    }
    invalidate();
  }

  function basis() {
    var ax = axes(cam.az, cam.el), out = ax.out;
    ax.eye = [cam.t[0] + out[0] * cam.dist, cam.t[1] + out[1] * cam.dist, cam.t[2] + out[2] * cam.dist];
    return ax;
  }

  function matrices() {
    var b = basis();
    var view = new Float32Array([
      b.right[0], b.up[0], b.out[0], 0,
      b.right[1], b.up[1], b.out[1], 0,
      b.right[2], b.up[2], b.out[2], 0,
      -dot3(b.right, b.eye), -dot3(b.up, b.eye), -dot3(b.out, b.eye), 1
    ]);
    var near = Math.max(cam.dist / 40, 0.5), far = cam.dist * 4 + 400;
    var f = 1 / Math.tan(FOV / 2);
    var proj = new Float32Array([
      f / aspect(), 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, 2 * far * near / (near - far), 0
    ]);
    return { view: view, proj: proj, basis: b };
  }

  /* ------------------------------------------------------------------
     DRAWING
     ------------------------------------------------------------------ */
  var selected = null, hovered = null, raf = 0;

  function invalidate() {
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function fitCanvas() {
    var r = stage.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function step() {
    var k = 0.22, done = true;
    function ease(from, to, fine) {
      var d = to - from;
      if (Math.abs(d) > fine) { done = false; return from + d * k; }
      return to;
    }
    if (spread !== spreadGoal) {
      spread = calm ? spreadGoal : ease(spread, spreadGoal, 0.002);
      scene.items.forEach(function (it) { place(it, spread); });
    }
    if (goal) {
      cam.dist = ease(cam.dist, goal.dist, 0.02);
      for (var i = 0; i < 3; i++) cam.t[i] = ease(cam.t[i], goal.t[i], 0.02);
      if (goal.az != null) { cam.az = ease(cam.az, goal.az, 0.02); cam.el = ease(cam.el, goal.el, 0.02); }
      if (done) goal = null;
    }
    if (!done) invalidate();
  }

  function tint(it) {
    var c = COL[it.part.state] || COL.both;
    if (reading && it.part.standin) {
      // Grey, so that blue and green are the light and nothing else. The LED
      // whitens while it is on. The board shows each of the cycle's three
      // reads: pale for the two in the dark, green once the green has reached it.
      var L = reading.light || { lit: 0, green: 0, read: 0, focus: 0 };
      if (it.part.standin === "led") return mix(COL.both, [1, 1, 1], 0.8 * L.lit);
      if (it.part.standin === "board") {
        return L.green >= 1 && L.lit > 0 ? mix(COL.both, COL.em, 0.7 * L.lit) : mix(COL.both, [1, 1, 1], 0.55 * L.read);
      }
      return COL.both;
    }
    if (selected) return it.part === selected ? COL.hot : mix(c, COL.bed, 0.74);
    if (hovered && hovered.part === it.part) return mix(c, [1, 1, 1], 0.3);
    return c;
  }
  /* A part that was never on the instrument is an outline. So is every
     other part of the assembly while one is chosen, which is what lets a
     part buried inside it be seen. */
  function hollow(it) {
    // during a reading every printed part is an outline, so the light inside shows
    if (reading) return !it.part.standin;
    if (selected && it.part === selected) return false;
    return it.absent || (selected && scene.built);
  }

  function draw() {
    raf = 0;
    fitCanvas();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!scene) return;
    step();
    var m = matrices();
    if (reading) {
      var L = lightAt(reading.path, reading.done ? Infinity : (performance.now() - reading.t0) / 1000);
      reading.light = L;
      if (L.done) reading.done = true;
      if (L.step !== reading.step) {
        reading.step = L.step;
        tellStep();
        // The view goes to the trap while the light is in it and comes back
        // after, unless the reader has taken hold of the view.
        if (!reading.manual && !calm) {
          if (L.step === 3) travel(trapFrame(), false);
          else if (L.step === 4 || L.done) travel(readFrame(), false);
        }
      }
    }

    gl.useProgram(flat.id);
    gl.uniformMatrix4fv(flat.uProj, false, m.proj);
    gl.uniformMatrix4fv(flat.uView, false, m.view);
    gl.enableVertexAttribArray(flat.aPos);
    function flatDraw(buf, mode, count, col, rot, off) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(flat.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(flat.uCol, col);
      gl.uniformMatrix3fv(flat.uRot, false, rot);
      gl.uniform3fv(flat.uOff, off);
      gl.drawArrays(mode, 0, count);
    }
    // The bed sits a hair under the parts so their undersides do not fight it.
    flatDraw(scene.bBed, gl.TRIANGLES, 6, COL.bed, IDENT, [0, 0, -0.25]);
    flatDraw(scene.bGrid, gl.LINES, scene.gridCount, COL.grid, IDENT, [0, 0, -0.2]);

    gl.useProgram(solid.id);
    gl.uniformMatrix4fv(solid.uProj, false, m.proj);
    gl.uniformMatrix4fv(solid.uView, false, m.view);
    gl.enableVertexAttribArray(solid.aPos);
    gl.enableVertexAttribArray(solid.aNor);
    scene.items.forEach(function (it) {
      if (hollow(it)) return;
      if (reading && it.part.standin === "uvette") return;   // drawn as glass, with the light
      var mesh = it.part.mesh;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.bPos);
      gl.vertexAttribPointer(solid.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.bNor);
      gl.vertexAttribPointer(solid.aNor, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix3fv(solid.uRot, false, it.rot);
      gl.uniform3fv(solid.uOff, it.off);
      gl.uniform3fv(solid.uCol, tint(it));
      gl.drawArrays(gl.TRIANGLES, 0, mesh.tris * 3);
    });
    gl.disableVertexAttribArray(solid.aNor);

    gl.useProgram(flat.id);
    gl.enableVertexAttribArray(flat.aPos);
    scene.items.forEach(function (it) {
      var col;
      if (reading) {
        // the trap's outline takes the light's colour once the light is in it
        var inTrap = reading.light.blue >= 1 ? reading.light.lit : 0, back = reading.manual ? 0 : reading.light.focus;
        col = it.part.standin === "uvette" ? COL.both
          : it.part.standin ? mix(tint(it), [0, 0, 0], 0.68)
          : it.part === reading.path.trap ? mix(mix(COL.grid, COL.both, 0.62), COL.ex, 0.6 * inTrap)
          : mix(COL.grid, COL.both, (it.absent ? 0.14 : 0.5) * (1 - 0.6 * back));
      }
      else if (!hollow(it)) col = mix(tint(it), [0, 0, 0], 0.68);
      else if (selected) col = scene.built ? mix(COL.grid, COL.both, it.absent ? 0.12 : 0.3) : null;
      else col = hovered && hovered.part === it.part ? [1, 1, 1] : COL.absent;
      if (!col) return;
      flatDraw(it.part.mesh.bLine, gl.LINES, it.part.mesh.lines.length / 3, col, it.rot, it.off);
    });

    if (reading) {
      drawLight(m, reading.path, reading.light);
      if (!reading.done) invalidate();
    }
  }

  /* The cuvette as glass, the trap's sloped wall, then the light. Drawn last
     and blended, without writing depth, so the outlines behind stay. The
     alpha is blended separately so the canvas stays opaque where a part
     already is. Everything is one of two unit shapes, a cube and a rod,
     with the rotation slot carrying its three edges. */
  function drawLight(m, p, L) {
    gl.useProgram(glow.id);
    gl.uniformMatrix4fv(glow.uProj, false, m.proj);
    gl.uniformMatrix4fv(glow.uView, false, m.view);
    gl.enableVertexAttribArray(glow.aPos);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    function shape(buf, count, edges, off, col, a) {
      if (a <= 0.004) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(glow.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix3fv(glow.uRot, false, edges);
      gl.uniform3fv(glow.uOff, off);
      gl.uniform4f(glow.uCol, col[0], col[1], col[2], a);
      gl.drawArrays(gl.TRIANGLES, 0, count);
    }
    /* A beam from one point towards another, drawn `part` of the way: a core
       of the beam's radius, and round it a wider, much fainter glow. What is
       left after a reflection is drawn thinner as well as fainter. */
    function beam(from, to, part, col, a, thin) {
      var u = [(to[0] - from[0]) * part, (to[1] - from[1]) * part, (to[2] - from[2]) * part];
      var len = Math.sqrt(dot3(u, u));
      if (len < 0.01 || a <= 0.004) return;
      var e = [u[0] / len, u[1] / len, u[2] / len];
      var v = Math.abs(e[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d = dot3(v, e);
      v = [v[0] - d * e[0], v[1] - d * e[1], v[2] - d * e[2]];
      var vl = Math.sqrt(dot3(v, v));
      v = [v[0] / vl, v[1] / vl, v[2] / vl];
      var w = [e[1] * v[2] - e[2] * v[1], e[2] * v[0] - e[0] * v[2], e[0] * v[1] - e[1] * v[0]];
      [[BEAM, a], [BEAM * 2.1, a * 0.16]].forEach(function (k) {
        var r = k[0] * (thin || 1);
        shape(rod.bPos, rod.count,
          [u[0], u[1], u[2], v[0] * r, v[1] * r, v[2] * r, w[0] * r, w[1] * r, w[2] * r], from, col, k[1]);
      });
    }
    var lit = 0.92 * L.lit, inTrap = L.blue >= 1 ? L.lit : 0, W = p.wall;

    shape(unit.bPos, unit.tris * 3, [p.cupSize[0], 0, 0, 0, p.cupSize[1], 0, 0, 0, p.cupSize[2]], p.cup, COL.both, 0.13);
    // The wall the beam ends on: a thin slab along the slope, across the
    // cavity. It stays grey, a little brighter once it is lit, so that the
    // only blue in the trap is the light itself.
    shape(unit.bPos, unit.tris * 3,
      [W.b[0] - W.a[0], 0, W.b[1] - W.a[1], 0, 2 * W.half, 0, -W.n[0] * 0.5, 0, -W.n[1] * 0.5],
      [W.a[0], p.y - W.half, W.a[1]], mix(COL.both, [1, 1, 1], 0.35 * inTrap), 0.2 + 0.1 * inTrap);

    beam([p.x0, p.y, p.z], [p.x1, p.y, p.z], L.blue, COL.ex, lit);
    p.bounces.forEach(function (b, i) {
      beam([b.from[0], p.y, b.from[1]], [b.to[0], p.y, b.to[1]], i ? L.b2 : L.b1, COL.ex, lit * b.a, b.thin);
    });
    beam([p.xc, p.y, p.z], [p.xc, p.y1, p.z], L.green, COL.em, lit);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  /* A rod along +X, one long and one in radius, with its ends closed. */
  function makeRod() {
    var N = 20, q = [], i;
    for (i = 0; i < N; i++) {
      var a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
      var c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      q.push(0, c0, s0, 1, c0, s0, 1, c1, s1, 0, c0, s0, 1, c1, s1, 0, c1, s1);
      q.push(0, 0, 0, 0, c1, s1, 0, c0, s0, 1, 0, 0, 1, c0, s0, 1, c1, s1);
    }
    var pos = new Float32Array(q);
    return { pos: pos, count: pos.length / 3, bPos: buffer(pos) };
  }

  /* ------------------------------------------------------------------
     PICKING
     A ray from the eye through the pointer, taken into each piece's own
     frame and tested against its box and then its triangles, so a part is
     picked by its shape and not by the empty corner of its box.
     ------------------------------------------------------------------ */
  function rayAt(x, y) {
    var r = canvas.getBoundingClientRect();
    var nx = (x - r.left) / r.width * 2 - 1, ny = 1 - (y - r.top) / r.height * 2;
    var b = basis(), th = Math.tan(FOV / 2), a = r.width / Math.max(1, r.height);
    var d = [0, 1, 2].map(function (i) {
      return -b.out[i] + b.right[i] * nx * th * a + b.up[i] * ny * th;
    });
    var len = Math.sqrt(dot3(d, d));
    return { o: b.eye, d: [d[0] / len, d[1] / len, d[2] / len] };
  }

  function hitBox(o, d, lo, hi) {
    var t0 = 0, t1 = Infinity;
    for (var i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-9) {
        if (o[i] < lo[i] || o[i] > hi[i]) return false;
        continue;
      }
      var a = (lo[i] - o[i]) / d[i], b = (hi[i] - o[i]) / d[i];
      if (a > b) { var s = a; a = b; b = s; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      if (t0 > t1) return false;
    }
    return true;
  }

  function hitMesh(o, d, pos, n) {
    var best = Infinity;
    for (var t = 0; t < n; t++) {
      var i = t * 9;
      var e1x = pos[i + 3] - pos[i], e1y = pos[i + 4] - pos[i + 1], e1z = pos[i + 5] - pos[i + 2];
      var e2x = pos[i + 6] - pos[i], e2y = pos[i + 7] - pos[i + 1], e2z = pos[i + 8] - pos[i + 2];
      var px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x;
      var det = e1x * px + e1y * py + e1z * pz;
      if (det > -1e-9 && det < 1e-9) continue;
      var inv = 1 / det;
      var tx = o[0] - pos[i], ty = o[1] - pos[i + 1], tz = o[2] - pos[i + 2];
      var u = (tx * px + ty * py + tz * pz) * inv;
      if (u < 0 || u > 1) continue;
      var qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
      var w = (d[0] * qx + d[1] * qy + d[2] * qz) * inv;
      if (w < 0 || u + w > 1) continue;
      var dist = (e2x * qx + e2y * qy + e2z * qz) * inv;
      if (dist > 0 && dist < best) best = dist;
    }
    return best;
  }

  function pick(x, y) {
    if (!scene) return null;
    var ray = rayAt(x, y), best = [Infinity, Infinity], found = [null, null];
    scene.items.forEach(function (it) {
      // into the piece's frame: the rows of a rotation are its inverse's columns
      var q = [ray.o[0] - it.off[0], ray.o[1] - it.off[1], ray.o[2] - it.off[2]], r = it.rows;
      var o = [r[0] * q[0] + r[3] * q[1] + r[6] * q[2], r[1] * q[0] + r[4] * q[1] + r[7] * q[2],
               r[2] * q[0] + r[5] * q[1] + r[8] * q[2]];
      var d = [r[0] * ray.d[0] + r[3] * ray.d[1] + r[6] * ray.d[2],
               r[1] * ray.d[0] + r[4] * ray.d[1] + r[7] * ray.d[2],
               r[2] * ray.d[0] + r[5] * ray.d[1] + r[8] * ray.d[2]];
      var mesh = it.part.mesh;
      if (!hitBox(o, d, mesh.lo, mesh.hi)) return;
      var t = hitMesh(o, d, mesh.pos, mesh.tris), k = hollow(it) ? 1 : 0;
      if (t < best[k]) { best[k] = t; found[k] = it; }
    });
    // What is drawn solid comes before what is only an outline, so a part
    // seen through the outline of another can be reached.
    return found[0] || found[1];
  }

  /* ------------------------------------------------------------------
     THE PANEL AROUND THE VIEW
     What is on show is three choices: assembled or laid out, which version
     when assembled, which module when laid out.
     ------------------------------------------------------------------ */
  var FAILED = "The model did not load. It is linked under Every file, below.";
  var want = { built: !!plan, pulled: false, version: "v2", group: groups[0] };
  var shown = null, ticket = 0;

  function seg(label, options) {
    var box = el("div", "hwx-cgroup");
    box.appendChild(el("p", "hwx-clabel", label));
    var row = el("div", "hwx-seg");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", label);
    options.forEach(function (o) {
      var b = el("button", null, o.text);
      b.type = "button";
      if (o.label) b.setAttribute("aria-label", o.label);
      if (o.on) b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", o.click);
      o.button = b;
      row.appendChild(b);
    });
    box.appendChild(row);
    ctrls.appendChild(box);
    return { box: box, options: options };
  }

  var viewSeg = plan && seg("View", [
    { text: "Assembled", on: function () { return want.built && !want.pulled; },
      click: function () { want.built = true; want.pulled = false; go(null); } },
    { text: "Pulled apart", on: function () { return want.built && want.pulled; },
      click: function () { want.built = true; want.pulled = true; go(null); } },
    { text: "Laid out", on: function () { return !want.built; },
      click: function () { want.built = false; go(null); } }
  ]);
  var versionSeg = plan && seg("Version", [
    { text: "Version 1", on: function () { return want.version === "v1"; },
      click: function () { want.version = "v1"; go(null); } },
    { text: "Version 2", on: function () { return want.version === "v2"; },
      click: function () { want.version = "v2"; go(null); } }
  ]);
  var readSeg = plan && LIGHT && seg("Light path", [
    { text: "Take a reading", on: function () { return !!reading; },
      click: function () {
        if (reading) { stopReading(); return; }
        want.built = true; want.pulled = false;
        var mine = ticket + 1;
        go(null).then(function () { if (mine === ticket) startReading(); });
      } }
  ]);
  var moduleSeg = seg("Module", groups.map(function (g) {
    return { text: g.name, on: function () { return want.group === g; },
             click: function () { want.group = g; go(null); } };
  }));
  moduleSeg.box.classList.add("hwp-wide");
  seg("Zoom", [
    { text: "−", label: "Zoom out", click: function () { zoom(1.25); } },
    { text: "+", label: "Zoom in", click: function () { zoom(0.8); } },
    { text: "Reset view", click: function () {
        if (!scene) return;
        select(null);
        travel(reading ? readFrame() : homeFrame(), false);
      } }
  ]).box.classList.add("hwp-tools");

  function press() {
    [viewSeg, versionSeg, readSeg, moduleSeg].forEach(function (s) {
      if (!s) return;
      s.options.forEach(function (o) { o.button.setAttribute("aria-pressed", String(o.on())); });
    });
    if (versionSeg) versionSeg.box.hidden = !want.built;
    if (readSeg) readSeg.box.hidden = !want.built;
    moduleSeg.box.hidden = want.built;
    // the legend only names what the view on show can contain
    var key = reading ? "reading" : (want.built ? want.version : "laid");
    $$(".hwp-legend li", root).forEach(function (li) {
      li.hidden = (li.getAttribute("data-in") || key).split(" ").indexOf(key) < 0;
    });
  }

  /* Closer than the whole assembly, and centred on the light: the plate's
     corners can leave the view, the two beams cannot. */
  function readFrame() {
    var f = frameOf(null, READ.az, READ.el), p = reading && reading.path;
    f.az = READ.az; f.el = READ.el;
    if (p) {
      f.t = [(p.x0 + p.wall.b[0]) / 2, (p.y + p.y1) / 2, p.z];
      f.dist *= 0.62;
    }
    return f;
  }
  /* The trap alone, from the side: the slope of its end wall is only a slope
     seen from there. */
  function trapFrame() {
    var f = frameOf(reading.path.trap, TRAP_VIEW.az, TRAP_VIEW.el);
    f.az = TRAP_VIEW.az; f.el = TRAP_VIEW.el;
    // frameOf leaves a part half the view, measured over its flange as well;
    // the cavity is what is to be seen, so come in closer than that
    f.dist *= 0.72;
    return f;
  }
  function startReading() {
    if (!scene || !scene.built) return;
    var path = lightPath();
    if (!path) return;
    if (!unit) { unit = standIn("box", [0, 0, 0], [1, 1, 1]); upload(unit); }
    if (!rod) rod = makeRod();
    if (selected) selected.li.classList.remove("is-on");
    selected = null;
    hovered = null;
    hud.textContent = "";
    // with reduced motion there is no cycle to watch: the path is simply drawn
    reading = { path: path, t0: performance.now(), step: -2, done: calm, light: null, manual: false };
    press();
    tell();
    travel(readFrame(), false);
  }
  /* Quietly when something else is about to redraw the panel anyway. */
  function stopReading(quiet) {
    if (!reading) return;
    reading = null;
    if (quiet) return;
    press();
    tell();
    if (scene) travel(homeFrame(), false);
  }

  function homeFrame() {
    var h = scene.built ? HOME.built : HOME.laid;
    var f = frameOf(null, h.az, h.el);
    f.az = h.az; f.el = h.el;
    return f;
  }
  function zoom(factor) {
    if (!scene) return;
    var far = frameOf(null).dist * 1.8;
    goal = null;
    if (reading) reading.manual = true;
    cam.dist = Math.max(18, Math.min(far, cam.dist * factor));
    invalidate();
  }

  /* What the panel says is the page's own: the sentence for each view, and
     for a chosen part its size, note and link, are copied from the markup. */
  var readSteps = $$('.hwp-says [data-for="reading"] li', root).map(function (li) {
    return li.textContent.replace(/\s+/g, " ").trim();
  });
  function tellReading() {
    var head = el("div", "hwp-r-head");
    head.appendChild(el("p", "hwp-r-name", "Taking a reading"));
    var tools = el("span", "hwp-r-tools");
    if (!calm) {
      var again = el("button", "hwp-back", "Play again");
      again.type = "button";
      again.addEventListener("click", function () {
        if (!reading) return;
        reading.t0 = performance.now();
        reading.done = false;
        reading.manual = false;
        travel(readFrame(), false);
      });
      tools.appendChild(again);
    }
    var back = el("button", "hwp-back", "Show the parts again");
    back.type = "button";
    back.addEventListener("click", function () {
      stopReading();
      canvas.focus({ preventScroll: true });
    });
    tools.appendChild(back);
    head.appendChild(tools);
    readout.appendChild(head);
    var list = el("ol", "hwp-r-steps");
    readSteps.forEach(function (s) { list.appendChild(el("li", null, s)); });
    readout.appendChild(list);
    var note = root.querySelector('.hwp-says [data-for="reading-note"]');
    if (note) readout.appendChild(el("p", "hwp-r-lead", note.textContent.replace(/\s+/g, " ").trim()));
    tellStep();
  }
  /* The step the light has reached is lit; the ones before it stay read. */
  function tellStep() {
    $$(".hwp-r-steps li", readout).forEach(function (li, i) {
      var on = !!reading && !reading.done && i === reading.step;
      li.classList.toggle("is-now", on);
      li.classList.toggle("is-done", !!reading && (reading.done || i < reading.step));
    });
  }

  function tell() {
    readout.textContent = "";
    if (!shown) return;
    if (reading) { tellReading(); return; }
    if (!selected) {
      var key = shown.built ? shown.version : "laid";
      var say = root.querySelector('.hwp-says [data-for="' + key + '"]');
      var p = el("p", "hwp-r-lead");
      if (!shown.built) {
        p.appendChild(el("strong", null, shown.group.name));
        p.appendChild(document.createTextNode(
          " · " + shown.group.parts.length + " files, " + shown.group.pieces + " pieces. "));
      }
      p.appendChild(document.createTextNode(say ? say.textContent.replace(/\s+/g, " ").trim() : ""));
      readout.appendChild(p);
      return;
    }
    var head = el("div", "hwp-r-head");
    head.appendChild(el("p", "hwp-r-name", selected.name));
    var back = el("button", "hwp-back", shown.built ? "Show the whole assembly" : "Show the whole module");
    back.type = "button";
    back.addEventListener("click", function () {
      select(null);
      canvas.focus({ preventScroll: true });
    });
    head.appendChild(back);
    readout.appendChild(head);
    [".hwp-meta", ".hwp-note", ".hwp-dl"].forEach(function (sel) {
      var src = selected.li.querySelector(sel);
      if (!src) return;
      var line = el("p", "hwp-r-line");
      line.appendChild(src.cloneNode(true));
      readout.appendChild(line);
    });
  }

  function select(part) {
    // choosing a part ends the reading: the part is what is wanted now
    if (part && reading) { reading = null; press(); }
    if (selected) selected.li.classList.remove("is-on");
    selected = part;
    if (part) part.li.classList.add("is-on");
    hovered = null;
    hud.textContent = "";
    tell();
    if (scene) travel(frameOf(part), false);
  }

  /* Bring the view to what is wanted, loading what it needs first. Asking
     again before that has finished simply supersedes it. */
  function go(part) {
    var mine = ++ticket;
    var w = { built: want.built, pulled: want.pulled, version: want.version, group: want.group };
    stopReading(true);
    press();
    var same = shown && shown.built === w.built &&
               (w.built ? shown.version === w.version : shown.group === w.group);
    if (same && scene) {
      status.textContent = "";
      shown.pulled = w.pulled;
      spreadGoal = w.built && w.pulled ? 1 : 0;
      select(part);
      return Promise.resolve();
    }
    var files = w.built ? filesOf(w.version) : w.group.parts;
    status.textContent = "Loading the model…";
    return Promise.all(files.map(load)).then(function () {
      if (mine !== ticket) return;
      status.textContent = "";
      var next = w.built ? assemble(w.version) : layOut(w.group);
      next.built = w.built;
      scene = next;
      shown = w;
      spreadGoal = w.built && w.pulled ? 1 : 0;
      spread = spreadGoal;
      scene.items.forEach(function (it) { place(it, spread); });
      if (selected) selected.li.classList.remove("is-on");
      selected = null;
      hovered = null;
      fitCanvas();
      travel(homeFrame(), true);
      select(part);
    }).catch(function () {
      if (mine !== ticket) return;
      status.textContent = FAILED;
    });
  }

  // Each name in the list becomes the way to that part in the view: where it
  // sits in the assembly if it is in the one on show, its module's tray if not.
  groups.forEach(function (g) {
    g.parts.forEach(function (p) {
      var name = p.li.querySelector(".hwp-name");
      var b = el("button", "hwp-name hwp-pick", p.name);
      b.type = "button";
      b.addEventListener("click", function () {
        var inView = plan && want.built && plan[want.version].some(function (e) { return e.f === p.file; });
        if (!inView) { want.built = false; want.group = g; }
        go(p);
        stage.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
      });
      name.parentNode.replaceChild(b, name);
    });
  });

  // A bought part is only ever in the assembly, so its name leads there.
  if (plan) {
    Object.keys(bought).forEach(function (id) {
      var name = bought[id].querySelector(".hwp-name");
      var b = el("button", "hwp-name hwp-pick", name.textContent.replace(/\s+/g, " ").trim());
      b.type = "button";
      b.addEventListener("click", function () {
        want.built = true;
        var mine = ticket + 1;
        go(null).then(function () {
          if (mine !== ticket || !scene) return;
          var it = scene.items.filter(function (x) { return x.part.standin === id; })[0];
          if (it) select(it.part);
        });
        stage.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
      });
      name.parentNode.replaceChild(b, name);
    });
  }

  /* ------------------------------------------------------------------
     HANDING THE FILES BACK
     The model holds each STL's triangles exactly, so a part can be written
     out again as a binary STL, and all of them as one ZIP. Both are made
     here in the browser from what was already fetched.
     ------------------------------------------------------------------ */
  function stlOf(name, pos) {
    var n = pos.length / 9, out = new ArrayBuffer(84 + n * 50), dv = new DataView(out);
    var head = "CAPTURE-Screen, NCKU-Tainan iGEM 2026: " + name, i, k, o = 84;
    for (i = 0; i < head.length && i < 80; i++) dv.setUint8(i, head.charCodeAt(i) & 127);
    dv.setUint32(80, n, true);
    for (i = 0; i < n; i++, o += 50) {
      var p = i * 9;
      var ux = pos[p + 3] - pos[p], uy = pos[p + 4] - pos[p + 1], uz = pos[p + 5] - pos[p + 2];
      var wx = pos[p + 6] - pos[p], wy = pos[p + 7] - pos[p + 1], wz = pos[p + 8] - pos[p + 2];
      var nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      dv.setFloat32(o, nx / len, true);
      dv.setFloat32(o + 4, ny / len, true);
      dv.setFloat32(o + 8, nz / len, true);
      for (k = 0; k < 9; k++) dv.setFloat32(o + 12 + k * 4, pos[p + k], true);
    }
    return new Uint8Array(out);
  }

  var CRC = null;
  function crc32(bytes) {
    var c, n, k;
    if (!CRC) {
      CRC = new Uint32Array(256);
      for (n = 0; n < 256; n++) {
        c = n;
        for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        CRC[n] = c >>> 0;
      }
    }
    c = 0xFFFFFFFF;
    for (n = 0; n < bytes.length; n++) c = CRC[(c ^ bytes[n]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  /* A ZIP with nothing compressed: for each file a header and its bytes,
     then the index of them, then where the index is. */
  function zipOf(files) {
    var body = [], index = [], at = 0, size = 0, day = (46 << 9) | (10 << 5) | 4;   // 2026-10-04
    files.forEach(function (f) {
      var name = new TextEncoder().encode(f.name), crc = crc32(f.data);
      var head = new DataView(new ArrayBuffer(30)), entry = new DataView(new ArrayBuffer(46));
      head.setUint32(0, 0x04034b50, true);
      head.setUint16(4, 20, true);
      head.setUint16(12, day, true);
      head.setUint32(14, crc, true);
      head.setUint32(18, f.data.length, true);
      head.setUint32(22, f.data.length, true);
      head.setUint16(26, name.length, true);
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(14, day, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, f.data.length, true);
      entry.setUint32(24, f.data.length, true);
      entry.setUint16(28, name.length, true);
      entry.setUint32(42, at, true);
      body.push(head.buffer, name, f.data);
      index.push(entry.buffer, name);
      at += 30 + name.length + f.data.length;
      size += 46 + name.length;
    });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, size, true);
    end.setUint32(16, at, true);
    return new Blob(body.concat(index, [end.buffer]), { type: "application/zip" });
  }
  function save(blob, name) {
    var a = el("a"), url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  // The file name in each line of the list becomes the button that saves it.
  $$(".hwp-dl[data-stl]", root).forEach(function (span) {
    var b = el("button", "hwp-dl");
    b.type = "button";
    b.setAttribute("data-stl", span.getAttribute("data-stl"));
    b.title = "Save this part as an STL file";
    while (span.firstChild) b.appendChild(span.firstChild);
    span.parentNode.replaceChild(b, span);
  });
  // One listener for all of them, since the readout shows copies of these buttons.
  root.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button.hwp-dl[data-stl]") : null;
    if (!b) return;
    var name = b.getAttribute("data-stl");
    fetchModel().then(function (read) {
      var pos = read(name);
      if (pos) save(new Blob([stlOf(name, pos)], { type: "model/stl" }), name);
    }).catch(function () { status.textContent = FAILED; });
  });
  var getAll = root.querySelector(".hwp-get");
  if (getAll) {
    var zipButton = el("button", "hwp-back", "Save every part as STL, in one ZIP");
    zipButton.type = "button";
    zipButton.addEventListener("click", function () {
      fetchModel().then(function (read) {
        var files = [];
        groups.forEach(function (g) {
          g.parts.forEach(function (p) {
            var pos = read(p.file);
            if (pos) files.push({ name: p.file, data: stlOf(p.file, pos) });
          });
        });
        save(zipOf(files), "capture-screen-printed-parts-stl.zip");
      }).catch(function () { status.textContent = FAILED; });
    });
    getAll.appendChild(zipButton);
  }

  /* ------------------------------------------------------------------
     POINTER AND KEYBOARD
     One pointer turns the view; two pinch it. A press that does not move
     is a pick. Scrolling only zooms with ctrl held, which is also what a
     trackpad pinch sends, so the page can always be scrolled past.
     ------------------------------------------------------------------ */
  var held = {}, drag = null, pinch = 0;
  function heldList() { return Object.keys(held).map(function (k) { return held[k]; }); }
  function gap() {
    var p = heldList();
    return Math.sqrt(Math.pow(p[0].x - p[1].x, 2) + Math.pow(p[0].y - p[1].y, 2)) || 1;
  }

  canvas.addEventListener("pointerdown", function (e) {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    held[e.pointerId] = { x: e.clientX, y: e.clientY };
    var n = heldList().length;
    drag = n === 1 ? { x: e.clientX, y: e.clientY, moved: 0 } : null;
    pinch = n === 2 ? gap() : 0;
  });
  canvas.addEventListener("pointermove", function (e) {
    if (held[e.pointerId]) { held[e.pointerId].x = e.clientX; held[e.pointerId].y = e.clientY; }
    if (pinch && heldList().length === 2) {
      var s = gap();
      zoom(pinch / s);
      pinch = s;
      return;
    }
    if (drag) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX; drag.y = e.clientY;
      goal = null;
      if (reading) reading.manual = true;
      cam.az -= dx * 0.4;
      cam.el = Math.max(4, Math.min(89, cam.el + dy * 0.3));
      invalidate();
      return;
    }
    var it = pick(e.clientX, e.clientY);
    if ((it && it.part) !== (hovered && hovered.part)) {
      hovered = it;
      hud.textContent = it ? it.part.name + (it.part.qty > 1 ? " ×" + it.part.qty : "") : "";
      canvas.style.cursor = it ? "pointer" : "";
      invalidate();
    }
  });
  function release(e) {
    var wasDrag = drag;
    delete held[e.pointerId];
    var left = heldList();
    // A finger lifted from a pinch leaves the other one turning the view,
    // and what it does next is not a pick.
    drag = left.length === 1 ? { x: left[0].x, y: left[0].y, moved: 99 } : null;
    pinch = 0;
    if (e.type === "pointerup" && wasDrag && wasDrag.moved < 5) {
      var it = pick(e.clientX, e.clientY);
      select(it ? it.part : null);
    }
  }
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", function () {
    if (hovered) { hovered = null; hud.textContent = ""; canvas.style.cursor = ""; invalidate(); }
  });
  canvas.addEventListener("wheel", function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoom(e.deltaY > 0 ? 1.1 : 0.9);
  }, { passive: false });
  canvas.addEventListener("keydown", function (e) {
    var k = e.key, by = e.shiftKey ? 12 : 4;
    if (k === "ArrowLeft") cam.az -= by;
    else if (k === "ArrowRight") cam.az += by;
    else if (k === "ArrowUp") cam.el = Math.min(89, cam.el + by);
    else if (k === "ArrowDown") cam.el = Math.max(4, cam.el - by);
    else if (k === "+" || k === "=") { zoom(0.88); e.preventDefault(); return; }
    else if (k === "-") { zoom(1.14); e.preventDefault(); return; }
    else if (k === "Escape" && selected) { select(null); return; }
    else if (k === "Escape" && reading) { stopReading(); return; }
    else return;
    e.preventDefault();
    goal = null;
    if (reading) reading.manual = true;
    invalidate();
  });

  // A lost context takes the buffers with it; the arrays are still here.
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); });
  canvas.addEventListener("webglcontextrestored", function () {
    if (!setup()) return;
    groups.forEach(function (g) {
      g.parts.forEach(function (p) { if (p.mesh) upload(p.mesh); });
    });
    Object.keys(standIns).forEach(function (k) { upload(standIns[k].mesh); });
    if (unit) upload(unit);
    if (rod) rod.bPos = buffer(rod.pos);
    if (shown) {
      var keep = selected, built = scene.built;
      scene = null;
      scene = shown.built ? assemble(shown.version) : layOut(shown.group);
      scene.built = built;
      scene.items.forEach(function (it) { place(it, spread); });
      selected = keep;
    }
    invalidate();
  });

  /* The fit depends on the shape of the view, so a change of shape frames
     the same thing again, from the same direction. */
  var shape = 0;
  function resized() {
    fitCanvas();
    var now = aspect();
    if (scene && shape && Math.abs(now - shape) > 0.01) travel(reading ? readFrame() : frameOf(selected), true);
    shape = now;
    invalidate();
  }
  if (window.ResizeObserver) new ResizeObserver(resized).observe(stage);
  else window.addEventListener("resize", resized);

  /* ------------------------------------------------------------------
     START
     An assembly is a few megabytes of files, so nothing is fetched until
     the panel is nearly on screen.
     ------------------------------------------------------------------ */
  root.classList.add("hwp-on");
  ctrls.hidden = false;
  stage.hidden = false;
  readout.hidden = false;
  press();

  // Unless something was asked for before the panel scrolled into view.
  function begin() { if (!ticket) go(null); }
  if (window.IntersectionObserver) {
    var watch = new IntersectionObserver(function (entries) {
      if (!entries.some(function (en) { return en.isIntersecting; })) return;
      watch.disconnect();
      begin();
    }, { rootMargin: "400px 0px" });
    watch.observe(root);
  } else {
    begin();
  }
})();
