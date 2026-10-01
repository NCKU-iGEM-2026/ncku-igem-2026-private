// Model page: the four figures.
//
// The points are tube means from our own bench sessions, copied out of the
// per-tube tables of the team's data analysis (P1_DATA_ANALYSIS_2026-09-30,
// section 4.4). Nothing else about the first three figures is typed in: every
// slope, every line and every held-out error is computed here from those
// twenty points, so a figure cannot drift away from its own data. Add a tube
// to SESSIONS and all three redraw.
//
// The fourth and fifth figures are different. Their numbers are results of
// model fits that this file does not repeat, so they are quoted, with their
// source.
//
// No library. If the script never runs, each panel keeps the sentence it
// shipped with, and the same numbers are in the tables beside it.
(function () {
  "use strict";

  const SVG = "http://www.w3.org/2000/svg";

  // rho: the stock density index of that session (displayed OD read in the
  // low range, multiplied back by the dilution). tubes: [sample, G, F4].
  const SESSIONS = [
    { id: "16", date: "2026-09-16", shape: "circle", rho: 2.84, tubes: [
      ["CAL_B03", 0.25, 6.000], ["CAL_B06", 0.50, 19.667],
      ["CAL_B09", 0.75, 22.667], ["CAL_B12", 1.00, 29.667],
    ] },
    { id: "21", date: "2026-09-21", shape: "triangle", rho: 0.5125, tubes: [
      ["CAL_C03r1", 0.50, 0.667], ["CAL_C03r2", 0.50, 0.667],
      ["CAL_C06r1", 0.75, 4.333], ["CAL_C06r2", 0.75, 3.333],
      ["CAL_C09r1", 1.00, 7.000], ["CAL_C09r2", 1.00, 5.333],
    ] },
    { id: "29", date: "2026-09-29", shape: "square", rho: 1.72, tubes: [
      ["ATN_E_1", 0.25, 3.667], ["ATN_E_2", 0.25, 3.333],
      ["ATN_A_1", 0.50, 11.000], ["ATN_A_2", 0.50, 8.667], ["ATN_A_3", 0.50, 8.000],
      ["ATN_A_4", 0.50, 9.667], ["ATN_A_5", 0.50, 8.667], ["ATN_A_6", 0.50, 10.000],
      ["ATN_D_1", 1.00, 18.000], ["ATN_D_2", 1.00, 20.000],
    ] },
  ];

  // Four-channel Ridge, whole sessions held out, mean absolute error in
  // percentage points of G. Source: P1_COMPREHENSIVE_ML_2026-09-30/revision2,
  // OD_PERMUTATIONS.csv, and 20.73 for the same pipeline given no OD at all.
  // Each label is the OD handed to session one / two / three.
  const OD_RUNS = [
    { label: "1.56 / 0.52 / 1.10", note: "the true pairing", mae: 8.24, kind: "true" },
    { label: "no OD", note: "channels only", mae: 20.73, kind: "none" },
    { label: "1.10 / 0.52 / 1.56", note: "wrong", mae: 25.91, kind: "wrong" },
    { label: "0.52 / 1.56 / 1.10", note: "wrong", mae: 40.37, kind: "wrong" },
    { label: "1.10 / 1.56 / 0.52", note: "wrong", mae: 43.00, kind: "wrong" },
    { label: "1.56 / 1.10 / 0.52", note: "wrong", mae: 56.80, kind: "wrong" },
    { label: "0.52 / 1.10 / 1.56", note: "wrong", mae: 57.24, kind: "wrong" },
  ];

  // Eighteen model families under the same scoring: whole sessions held out,
  // settings chosen inside the training sessions, 50 tubes. Each family is
  // shown at the better of its two feature sets (four or twelve channels,
  // each divided by the stock OD), so this is a ranking made after the scores
  // were seen, not a result. Source: the same revision 2,
  // FIGURE_SOURCE_DATA.json, "family_minima". The ridge row is the pipeline
  // that was fixed beforehand.
  const FAMILIES = [
    { name: "Ordinary least squares", feat: "4 channels", mae: 7.60 },
    { name: "Elastic net", feat: "4 channels", mae: 8.08 },
    { name: "Ridge, the fixed pipeline", feat: "4 channels", mae: 8.24, kind: "fixed" },
    { name: "Linear SVR", feat: "12 channels", mae: 8.56 },
    { name: "Ridge, zero-constrained", feat: "12 channels", mae: 8.82 },
    { name: "RBF SVR", feat: "12 channels", mae: 9.03 },
    { name: "Huber regression", feat: "4 channels", mae: 9.05 },
    { name: "MLP (convergence warnings)", feat: "12 channels", mae: 9.15 },
    { name: "Quadratic polynomial", feat: "4 channels", mae: 9.30 },
    { name: "Gaussian process", feat: "4 channels", mae: 9.32 },
    { name: "Kernel ridge", feat: "4 channels", mae: 9.71 },
    { name: "Partial least squares", feat: "4 channels", mae: 9.97 },
    { name: "Spline", feat: "4 channels", mae: 12.39 },
    { name: "k-nearest neighbours", feat: "4 channels", mae: 14.34 },
    { name: "Cubic polynomial", feat: "4 channels", mae: 15.04 },
    { name: "Boosting", feat: "12 channels", mae: 16.42 },
    { name: "Extra trees", feat: "4 channels", mae: 16.60 },
    { name: "Random forest", feat: "4 channels", mae: 17.97 },
  ];

  // ---- arithmetic ---------------------------------------------------------
  // Least squares through the origin, and the error of a line of slope m.
  const slope = (pts) => pts.reduce((a, p) => a + p[0] * p[1], 0) / pts.reduce((a, p) => a + p[0] * p[0], 0);
  const rmse = (pts, m) => Math.sqrt(pts.reduce((a, p) => a + (p[1] - m * p[0]) ** 2, 0) / pts.length);

  const byG = (s) => s.tubes.map((t) => [t[1], t[2]]);
  const byX = (s) => s.tubes.map((t) => [t[1] * s.rho, t[2]]);
  const others = (s, f) => SESSIONS.filter((o) => o !== s).flatMap(f);

  // ---- drawing ------------------------------------------------------------
  function el(name, attrs, text) {
    const n = document.createElementNS(SVG, name);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // An empty plot with its axes, grid and titles. Returns the two scales.
  function frame(host, o) {
    const W = 760, H = o.h || 400;
    const m = Object.assign({ l: 64, r: 24, t: 22, b: 56 }, o.margin);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "md-plot", role: "img", "aria-label": o.label });
    const X = (v) => m.l + ((v - o.x[0]) / (o.x[1] - o.x[0])) * (W - m.l - m.r);
    const Y = (v) => H - m.b - ((v - o.y[0]) / (o.y[1] - o.y[0])) * (H - m.t - m.b);

    (o.yticks || []).forEach((v) => {
      svg.appendChild(el("line", { class: "md-grid", x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }));
      svg.appendChild(el("text", { class: "md-tick", x: m.l - 10, y: Y(v) + 4.5, "text-anchor": "end" }, String(v)));
    });
    (o.xticks || []).forEach((v) => {
      svg.appendChild(el("line", { class: "md-grid", x1: X(v), x2: X(v), y1: m.t, y2: H - m.b }));
      svg.appendChild(el("text", { class: "md-tick", x: X(v), y: H - m.b + 20, "text-anchor": "middle" }, String(v)));
    });
    svg.appendChild(el("path", { class: "md-axis", d: `M${m.l} ${m.t} V${H - m.b} H${W - m.r}` }));
    if (o.xtitle) {
      svg.appendChild(el("text", { class: "md-axis-title", x: (m.l + W - m.r) / 2, y: H - 12, "text-anchor": "middle" }, o.xtitle));
    }
    if (o.ytitle) {
      svg.appendChild(el("text", { class: "md-axis-title", x: 18, y: (m.t + H - m.b) / 2, "text-anchor": "middle",
        transform: `rotate(-90 18 ${(m.t + H - m.b) / 2})` }, o.ytitle));
    }
    host.replaceChildren(svg);
    return { svg, X, Y, W, H, m };
  }

  // The three sessions are told apart by shape as well as by colour.
  function mark(shape, cx, cy, cls, title) {
    let n;
    if (shape === "circle") n = el("circle", { cx, cy, r: 5.6 });
    else if (shape === "square") n = el("rect", { x: cx - 5, y: cy - 5, width: 10, height: 10, rx: 1.5 });
    else n = el("path", { d: `M${cx} ${cy - 6.6} L${cx + 6.2} ${cy + 4.6} L${cx - 6.2} ${cy + 4.6} Z` });
    n.setAttribute("class", "md-pt " + cls);
    n.appendChild(el("title", {}, title));
    return n;
  }

  // Tubes of one session at one abscissa are drawn side by side instead of
  // on top of each other; the spread is a few pixels and carries no meaning.
  function scatter(p, xOf, xName) {
    SESSIONS.forEach((s) => {
      const groups = new Map();
      s.tubes.forEach((t) => {
        const key = t[1];
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(t);
      });
      groups.forEach((tubes) => {
        tubes.forEach((t, i) => {
          const dx = (i - (tubes.length - 1) / 2) * 9;
          const xv = xOf(s, t);
          p.svg.appendChild(mark(s.shape, p.X(xv) + dx, p.Y(t[2]), "md-s" + s.id,
            `${t[0]} · ${s.date} · ${xName} ${xv.toFixed(xName === "G" ? 2 : 3)} · F4 ${t[2].toFixed(3)} counts`));
        });
      });
    });
  }

  // ---- figure 1: every session has its own slope ---------------------------
  function drawRaw(host) {
    const p = frame(host, {
      x: [0, 1.04], y: [0, 33], xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0, 5, 10, 15, 20, 25, 30],
      xtitle: "G, volume fraction of GFP stock in the tube", ytitle: "F4 (counts)",
      label: "Emission-channel counts against the volume fraction of GFP stock, pure-GFP tubes only, for the three sessions. " +
        "Each session lies close to its own straight line through the origin, and the three lines have very different slopes: " +
        SESSIONS.map((s) => `${s.date} ${slope(byG(s)).toFixed(2)}`).join(", ") + " counts per unit G.",
    });
    SESSIONS.forEach((s) => {
      const k = slope(byG(s));
      p.svg.appendChild(el("line", { class: "md-ln md-ln" + s.id, x1: p.X(0), y1: p.Y(0), x2: p.X(1), y2: p.Y(k) }));
      p.svg.appendChild(el("text", { class: "md-lbl md-lbl" + s.id, x: p.X(0.87), y: p.Y(k * 0.87) - 10, "text-anchor": "end" },
        `k = ${k.toFixed(2)}`));
    });
    scatter(p, (s, t) => t[1], "G");
  }

  // ---- figure 2: one slope after conversion --------------------------------
  function drawConverted(host) {
    const all = SESSIONS.flatMap(byX);
    const s = slope(all);
    const p = frame(host, {
      x: [0, 3.05], y: [0, 35], xticks: [0, 0.5, 1, 1.5, 2, 2.5, 3], yticks: [0, 5, 10, 15, 20, 25, 30, 35],
      xtitle: "x = G · ρ, the GFP density index of the tube", ytitle: "F4 (counts)",
      label: "The same twenty tubes against the density index x. After conversion the three sessions fall along one line through the origin " +
        `with slope ${s.toFixed(2)} counts per unit x.`,
    });
    p.svg.appendChild(el("line", { class: "md-ln md-ln-shared", x1: p.X(0), y1: p.Y(0), x2: p.X(3), y2: p.Y(3 * s) }));
    p.svg.appendChild(el("text", { class: "md-lbl md-lbl-shared", x: p.X(2.5), y: p.Y(2.5 * s) - 12, "text-anchor": "end" },
      `one shared slope, s = ${s.toFixed(2)}`));
    scatter(p, (ses, t) => t[1] * ses.rho, "x");
  }

  // ---- figure 3: predicting a session from the other two -------------------
  function drawHeldOut(host) {
    const rows = SESSIONS.map((s) => ({
      s,
      raw: rmse(byG(s), slope(others(s, byG))),
      conv: rmse(byX(s), slope(others(s, byX))),
    }));
    const p = frame(host, {
      h: 360, x: [0, rows.length], y: [0, 15], yticks: [0, 3, 6, 9, 12, 15], ytitle: "held-out error (counts)",
      label: "Error when each session is predicted from the other two. " +
        rows.map((r) => `${r.s.date}: ${r.raw.toFixed(2)} counts without conversion, ${r.conv.toFixed(2)} with it`).join("; ") + ".",
    });
    const bw = 64;
    rows.forEach((r, i) => {
      const cx = p.X(i + 0.5);
      [["raw", r.raw, cx - bw - 4], ["conv", r.conv, cx + 4]].forEach(([kind, v, x]) => {
        const bar = el("rect", { class: "md-bar md-bar-" + kind, x, y: p.Y(v), width: bw, height: p.Y(0) - p.Y(v), rx: 3 });
        bar.appendChild(el("title", {}, `${r.s.date} held out, ${kind === "raw" ? "no conversion" : "converted"}: ${v.toFixed(2)} counts`));
        p.svg.appendChild(bar);
        p.svg.appendChild(el("text", { class: "md-val", x: x + bw / 2, y: p.Y(v) - 7, "text-anchor": "middle" }, v.toFixed(2)));
      });
      p.svg.appendChild(el("text", { class: "md-tick", x: cx, y: p.H - p.m.b + 21, "text-anchor": "middle" }, r.s.date + " held out"));
      p.svg.appendChild(el("text", { class: "md-tick md-tick-sub", x: cx, y: p.H - p.m.b + 39, "text-anchor": "middle" },
        `${r.s.tubes.length} tubes`));
    });
  }

  // ---- figures 4 and 5: one bar per row -------------------------------------
  // rows: { label, note, mae, kind, tip }. With o.twoLine the note sits under
  // the label; otherwise a row is a single line and the note is tooltip only.
  // o.ref draws one dashed reference line with its own label.
  function hbars(host, rows, o) {
    const rowH = o.twoLine ? 38 : 26;
    const barH = o.twoLine ? 22 : 15;
    const top = o.heading ? 34 : 26;
    const p = frame(host, {
      h: top + rows.length * rowH + 62, margin: { l: o.left, t: top },
      x: [0, o.max], y: [0, 1], xticks: o.xticks,
      xtitle: "mean absolute error, percentage points of G",
      label: o.label + " " + rows.map((r) => `${r.label}${r.note ? " (" + r.note + ")" : ""}: ${r.mae.toFixed(2)}`).join("; ") + ".",
    });
    if (o.heading) {
      p.svg.appendChild(el("text", { class: "md-tick", x: p.m.l - 12, y: 20, "text-anchor": "end" }, o.heading));
    }
    if (o.ref) {
      p.svg.appendChild(el("line", { class: "md-ref", x1: p.X(o.ref.at), x2: p.X(o.ref.at), y1: top - 4, y2: p.H - p.m.b }));
      // Beside the top rows, which are the shortest bars, so it never sits on a value.
      p.svg.appendChild(el("text", { class: "md-ref-lbl", x: p.X(o.ref.at) - 8, y: top + 15, "text-anchor": "end" }, o.ref.text));
    }
    rows.forEach((r, i) => {
      const y = p.m.t + i * rowH + (rowH - barH) / 2;
      const mid = y + barH / 2;
      const bar = el("rect", { class: "md-bar md-bar-" + r.kind, x: p.X(0), y, width: p.X(r.mae) - p.X(0), height: barH, rx: 3 });
      bar.appendChild(el("title", {}, `${r.label}${r.note ? " (" + r.note + ")" : ""}: ${r.mae.toFixed(2)} percentage points`));
      p.svg.appendChild(bar);
      p.svg.appendChild(el("text", { class: "md-val", x: p.X(r.mae) + 8, y: mid + 4.5 }, r.mae.toFixed(2)));
      const strong = r.kind === "true" || r.kind === "fixed";
      p.svg.appendChild(el("text", { class: "md-rowlbl" + (strong ? " is-true" : ""), x: p.m.l - 12,
        y: o.twoLine ? mid - 2 : mid + 4.5, "text-anchor": "end" }, r.label));
      if (o.twoLine) {
        p.svg.appendChild(el("text", { class: "md-tick md-tick-sub", x: p.m.l - 12, y: mid + 13, "text-anchor": "end" }, r.note));
      }
    });
  }

  // ---- figure 4: only the true OD pairing helps ----------------------------
  function drawOd(host) {
    hbars(host, OD_RUNS, {
      twoLine: true, left: 232, max: 62, xticks: [0, 10, 20, 30, 40, 50, 60],
      heading: "OD given to session 1 / 2 / 3",
      label: "Mean absolute error of the four-channel model for seven ways of supplying the stock OD.",
    });
  }

  // ---- figure 5: eighteen model families under one scoring rule ------------
  function drawFamilies(host) {
    hbars(host, FAMILIES.map((f) => ({ label: f.name, note: f.feat, mae: f.mae, kind: f.kind || "fam" })), {
      left: 250, max: 22, xticks: [0, 5, 10, 15, 20],
      ref: { at: 20.73, text: "ridge with no OD, 20.73" },
      label: "Held-out mean absolute error of eighteen model families, each given the stock OD.",
    });
  }

  [["mdFigRaw", drawRaw], ["mdFigConverted", drawConverted], ["mdFigHeldOut", drawHeldOut],
   ["mdFigOd", drawOd], ["mdFigFamilies", drawFamilies]]
    .forEach(([id, draw]) => {
      const host = document.getElementById(id);
      if (host) draw(host);
    });
})();
