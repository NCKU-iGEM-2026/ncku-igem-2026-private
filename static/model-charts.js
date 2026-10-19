// Model page: the three figures.
//
// The points are tube means from our own bench sessions, copied out of the
// per-tube tables of the team's data analysis (P1_DATA_ANALYSIS_2026-09-30,
// section 4.4). Nothing else about the figures is typed in: every
// slope, every line and every held-out error is computed here from those
// twenty points, so a figure cannot drift away from its own data. Add a tube
// to SESSIONS and all three redraw.
//
// No library. If the script never runs, each panel keeps the sentence it
// shipped with, and the same numbers are in the tables beside it.
(function () {
  "use strict";

  const SVG = "http://www.w3.org/2000/svg";

  // rho: the stock density index of that session (displayed OD read in the
  // low range, multiplied back by the dilution). tubes: [sample, G, F4].
  const SESSIONS = [
    { id: "16", name: "Mixing session 1", short: "Session 1", date: "2026-09-16", shape: "circle", rho: 2.84, tubes: [
      ["CAL_B03", 0.25, 6.000], ["CAL_B06", 0.50, 19.667],
      ["CAL_B09", 0.75, 22.667], ["CAL_B12", 1.00, 29.667],
    ] },
    { id: "21", name: "Mixing session 2", short: "Session 2", date: "2026-09-21", shape: "triangle", rho: 0.5125, tubes: [
      ["CAL_C03r1", 0.50, 0.667], ["CAL_C03r2", 0.50, 0.667],
      ["CAL_C06r1", 0.75, 4.333], ["CAL_C06r2", 0.75, 3.333],
      ["CAL_C09r1", 1.00, 7.000], ["CAL_C09r2", 1.00, 5.333],
    ] },
    { id: "29", name: "Mixing session 3", short: "Session 3", date: "2026-09-29", shape: "square", rho: 1.72, tubes: [
      ["ATN_E_1", 0.25, 3.667], ["ATN_E_2", 0.25, 3.333],
      ["ATN_A_1", 0.50, 11.000], ["ATN_A_2", 0.50, 8.667], ["ATN_A_3", 0.50, 8.000],
      ["ATN_A_4", 0.50, 9.667], ["ATN_A_5", 0.50, 8.667], ["ATN_A_6", 0.50, 10.000],
      ["ATN_D_1", 1.00, 18.000], ["ATN_D_2", 1.00, 20.000],
    ] },
  ];

  // ---- arithmetic ---------------------------------------------------------
  // Least squares through the origin, and the error of a line of slope m.
  const slope = (pts) => pts.reduce((a, p) => a + p[0] * p[1], 0) / pts.reduce((a, p) => a + p[0] * p[0], 0);
  const rmse = (pts, m) => Math.sqrt(pts.reduce((a, p) => a + (p[1] - m * p[0]) ** 2, 0) / pts.length);

  const byG = (s) => s.tubes.map((t) => [t[1], t[2]]);
  const byX = (s) => s.tubes.map((t) => [t[1] * s.rho, t[2]]);
  const others = (s, f) => SESSIONS.filter((o) => o !== s).flatMap(f);
  // Leave one recipe out inside a single session: hold out every tube at one
  // value of G, fit on the rest, predict the ones held out. This is the
  // reference the cross-session bars are measured against -- how close a
  // session lands when predicted from itself rather than from the other two.
  const looRecipe = (s) => {
    const pts = byG(s);
    const recipes = [...new Set(pts.map((q) => q[0]))];
    const sq = recipes.flatMap((r) => {
      const m = slope(pts.filter((q) => q[0] !== r));
      return pts.filter((q) => q[0] === r).map((q) => (q[1] - m * q[0]) ** 2);
    });
    return Math.sqrt(sq.reduce((a, v) => a + v, 0) / sq.length);
  };

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
            `${t[0]} · ${s.name} · ${xName} ${xv.toFixed(xName === "G" ? 2 : 3)} · F4 ${t[2].toFixed(3)} counts`));
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
        SESSIONS.map((s) => `${s.name} ${slope(byG(s)).toFixed(2)}`).join(", ") + " counts per unit G.",
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
      own: looRecipe(s),
    }));
    const p = frame(host, {
      h: 360, x: [0, rows.length], y: [0, 15], yticks: [0, 3, 6, 9, 12, 15], ytitle: "prediction error (counts)",
      label: "Error when each session is predicted from the other two, against the error when it is predicted from inside itself. " +
        rows.map((r) => `${r.s.name}: ${r.raw.toFixed(2)} counts without conversion, ${r.conv.toFixed(2)} with it, ${r.own.toFixed(2)} from inside itself`).join("; ") + ".",
    });
    const bw = 64;
    rows.forEach((r, i) => {
      const cx = p.X(i + 0.5);
      [["raw", r.raw, cx - bw - 4], ["conv", r.conv, cx + 4]].forEach(([kind, v, x]) => {
        const bar = el("rect", { class: "md-bar md-bar-" + kind, x, y: p.Y(v), width: bw, height: p.Y(0) - p.Y(v), rx: 3 });
        bar.appendChild(el("title", {}, `${r.s.name} held out, ${kind === "raw" ? "no conversion" : "converted"}: ${v.toFixed(2)} counts`));
        p.svg.appendChild(bar);
        p.svg.appendChild(el("text", { class: "md-val", x: x + bw / 2, y: p.Y(v) - 7, "text-anchor": "middle" }, v.toFixed(2)));
      });
      // The reference: what the same tubes cost when predicted from inside
      // their own session. A dashed rule rather than a third bar, because it
      // is the target the converted bar has to reach, not a third method.
      const ref = el("line", { class: "md-ref", x1: cx - bw - 10, y1: p.Y(r.own), x2: cx + bw + 10, y2: p.Y(r.own) });
      ref.appendChild(el("title", {}, `${r.s.name} predicted from inside itself: ${r.own.toFixed(2)} counts`));
      p.svg.appendChild(ref);
      p.svg.appendChild(el("text", { class: "md-tick", x: cx, y: p.H - p.m.b + 21, "text-anchor": "middle" }, r.s.short));
      // The sub-line names the two sessions the slope came from. Without it
      // "Session 1 held out" says which session is being predicted but not
      // what it is being predicted from, which is the whole point of the test.
      const from = SESSIONS.filter((o) => o !== r.s).map((o) => o.short.replace("Session ", "")).join(" and ");
      p.svg.appendChild(el("text", { class: "md-tick md-tick-sub", x: cx, y: p.H - p.m.b + 39, "text-anchor": "middle" },
        `predicted from sessions ${from}`));
    });
  }

  [["mdFigRaw", drawRaw], ["mdFigConverted", drawConverted], ["mdFigHeldOut", drawHeldOut]]
    .forEach(([id, draw]) => {
      const host = document.getElementById(id);
      if (host) draw(host);
    });
})();
