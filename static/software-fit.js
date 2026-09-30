// Software page: the "Try the fit" panel.
//
// Everything numeric goes through CurveFit (static/lasreader-curve-fit.js), which is
// LasReader's own curve_fit.js, so a curve drawn here is the curve the tool would give
// for the same readings. This file only parses what was typed, draws the result and
// asks CurveFit to invert a signal. Nothing is sent anywhere and nothing is stored.
//
// The input starts empty. The simulator fills it from a 4PL the reader chooses, and
// marks every line it writes as simulated, so a simulated dataset can never be
// mistaken for a measured one.
(function () {
  "use strict";

  const root = document.getElementById("swLab");
  if (!root || typeof CurveFit === "undefined") return;

  const $ = (id) => document.getElementById(id);
  const input = $("swLabInput");
  const msg = $("swLabMsg");
  const out = $("swLabOut");
  const plot = $("swLabPlot");
  const params = $("swLabParams");
  const invF = $("swInvF");
  const invN = $("swInvN");
  const invOut = $("swInvOut");

  const SVG = "http://www.w3.org/2000/svg";
  let current = null; // { points, fit, weighted }

  // ---- formatting: the tool's own rules ----------------------------------
  // Concentration to 1 dp, in µM above 1000 nM; signal to 4 significant figures.
  function conc(nM) {
    if (!Number.isFinite(nM)) return "--";
    return nM > 1000 ? (nM / 1000).toFixed(1) + " µM" : nM.toFixed(1) + " nM";
  }
  function sig(x) {
    if (!Number.isFinite(x)) return "--";
    return Number(x.toPrecision(4)).toString();
  }

  // ---- parsing -----------------------------------------------------------
  // One row per concentration: the concentration in nM (0 for a blank), then
  // its readings. Tabs, commas, semicolons or spaces all separate, so a block
  // pasted from a spreadsheet works. A line starting with # is a comment, and
  // a line whose first cell is not a number (a header) is skipped.
  function parse(text) {
    const points = [];
    const problems = [];
    text.split(/\r?\n/).forEach((line, i) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return;
      const cells = t.split(/[\t,; ]+/).filter(Boolean);
      const c = Number(cells[0]);
      if (!Number.isFinite(c)) return;
      if (c < 0) { problems.push(`Line ${i + 1}: a concentration cannot be negative.`); return; }
      const ys = cells.slice(1).map(Number);
      if (ys.length === 0) { problems.push(`Line ${i + 1}: no readings after the concentration.`); return; }
      if (!ys.every(Number.isFinite)) { problems.push(`Line ${i + 1}: every reading must be a number.`); return; }
      ys.forEach((y) => points.push({ c, y, sd: 0 }));
    });
    return { points, problems };
  }

  // ---- the simulator -----------------------------------------------------
  function gauss() {
    let u = 0;
    while (u === 0) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }

  function simulate() {
    const num = (id) => Number($(id).value);
    const T = num("swSimT"), B = num("swSimB"), ec50 = num("swSimEc"), h = num("swSimH");
    const cv = num("swSimCv") / 100, add = num("swSimAdd");
    const reps = Math.round(num("swSimReps")), blanks = Math.round(num("swSimBlanks"));
    const concs = $("swSimConcs").value.split(/[\s,;]+/).map(Number).filter((c) => Number.isFinite(c) && c > 0);

    const bad = [];
    if (!(T > B)) bad.push("top must be above bottom");
    if (!(ec50 > 0)) bad.push("EC50 must be positive");
    if (!(h > 0.05 && h < 20)) bad.push("the Hill coefficient must lie between 0.05 and 20");
    if (!(cv >= 0) || !(add >= 0)) bad.push("noise cannot be negative");
    if (!(reps >= 1 && reps <= 10)) bad.push("replicates must be 1 to 10");
    if (!(blanks >= 2 && blanks <= 10)) bad.push("blanks must be 2 to 10");
    if (new Set(concs).size < 4) bad.push("give at least 4 distinct positive concentrations");
    if (bad.length) { say("Cannot simulate: " + bad.join("; ") + ".", true); return; }

    const model = { top: T, bottom: B, ec50_nM: ec50, hill: h };
    const reading = (c) => {
      const F = CurveFit.model(c, model);
      return F + gauss() * Math.sqrt(add * add + (cv * F) * (cv * F));
    };
    const lines = [
      "# SIMULATED, not measured: drawn from a 4PL with",
      `# top ${T}, bottom ${B}, EC50 ${ec50} nM, hill ${h}; noise ${cv * 100}% + ${add} (SD).`,
      "# concentration (nM), readings...",
      "0, " + Array.from({ length: blanks }, () => sig(reading(0))).join(", "),
    ];
    [...new Set(concs)].sort((a, b) => a - b).forEach((c) => {
      lines.push(c + ", " + Array.from({ length: reps }, () => sig(reading(c))).join(", "));
    });
    input.value = lines.join("\n");
    run();
  }

  // ---- fitting -----------------------------------------------------------
  function say(text, isError) {
    msg.textContent = text;
    msg.classList.toggle("is-error", !!isError);
  }

  function run() {
    const { points, problems } = parse(input.value);
    current = null;
    out.hidden = true;
    invOut.textContent = "";
    if (problems.length) { say(problems.join(" "), true); return; }
    if (points.length === 0) { say("Enter readings above, or simulate a dataset.", true); return; }

    let fit;
    try {
      fit = CurveFit.fit(points);
    } catch (e) {
      say("No curve: " + e.message, true);
      return;
    }
    // The same test CurveFit.fit makes: without replicate spread or read-noise SDs it fits unweighted.
    const groups = new Map();
    points.forEach((p) => groups.set(p.c, (groups.get(p.c) || 0) + 1));
    const weighted = [...groups.values()].some((n) => n >= 2);

    current = { points, fit, weighted };
    const blanks = points.filter((p) => p.c === 0).length;
    say(`Fitted ${points.length} readings: ${blanks} blanks and ${groups.size - 1} standard concentrations.`, false);
    out.hidden = false;
    renderParams();
    renderPlot(null);
  }

  function row(label, value, note) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.innerHTML = label;
    const td = document.createElement("td");
    td.textContent = value;
    tr.append(th, td);
    const tn = document.createElement("td");
    tn.className = "sw-lab-note";
    tn.textContent = note || "";
    tr.append(tn);
    return tr;
  }

  function renderParams() {
    const { fit, weighted } = current;
    const p = fit.params;
    params.replaceChildren(
      row("Top <var>T</var>", sig(p.top), "saturated signal"),
      row("Bottom <var>B</var>", sig(p.bottom), "signal with no AHL"),
      row("EC<sub>50</sub>", conc(p.ec50_nM), "half-maximal response"),
      row("Hill <var>h</var>", sig(p.hill), "steepness"),
      row("LOD", conc(fit.lod_nM), "blank + 3 SD, through the curve"),
      row("LOQ", conc(fit.loq_nM), "blank + 10 SD, through the curve"),
      row("Usable range", conc(fit.range_nM.min) + " – " + conc(fit.range_nM.max), "the only range that returns a number"),
      row("RMSE", sig(fit.rmse), "unweighted, in signal units"),
      row("Noise model", `a = ${sig(fit.noise.a)}, b = ${sig(fit.noise.b)}`, "Var(F) = a + bF²"),
      row("Weighting", weighted ? "weighted" : "unweighted", weighted ? "weights from the replicate spread" : "no replicates: a from the residuals"),
    );
  }

  // ---- the plot ----------------------------------------------------------
  // Log concentration axis. Blanks have no place on a log axis, so they sit in
  // a column of their own to the left of a break, labelled 0.
  function el(name, attrs, text) {
    const n = document.createElementNS(SVG, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderPlot(marker) {
    const { points, fit } = current;
    const W = 640, H = 360, L = 64, R = 18, TOP = 18, BOT = 52, ZERO = 64;
    const cs = points.filter((p) => p.c > 0).map((p) => p.c);
    const lx0 = Math.floor(Math.log10(Math.min(...cs)) - 0.25);
    const lx1 = Math.ceil(Math.log10(Math.max(...cs)) + 0.25);
    const ys = points.map((p) => p.y).concat([fit.params.top, fit.params.bottom]);
    if (marker) ys.push(marker.F);
    let y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = (y1 - y0) * 0.08 || Math.abs(y1) * 0.1 || 1;
    y0 -= pad; y1 += pad;

    const x0px = L + ZERO; // where the log axis starts
    const X = (c) => x0px + ((Math.log10(c) - lx0) / (lx1 - lx0)) * (W - R - x0px);
    const Y = (y) => TOP + (1 - (y - y0) / (y1 - y0)) * (H - TOP - BOT);
    const XB = L + 22;

    plot.replaceChildren();
    plot.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // usable range band
    plot.append(el("rect", {
      class: "sw-plot-range", x: X(fit.range_nM.min), y: TOP,
      width: Math.max(0, X(fit.range_nM.max) - X(fit.range_nM.min)), height: H - TOP - BOT,
    }));

    // grid and ticks
    for (let d = lx0; d <= lx1; d++) {
      const x = X(10 ** d);
      plot.append(el("line", { class: "sw-plot-grid", x1: x, x2: x, y1: TOP, y2: H - BOT }));
      const label = d >= 3 ? 10 ** (d - 3) + " µM" : d >= 0 ? 10 ** d + " nM" : Number((10 ** d).toPrecision(1)) + " nM";
      plot.append(el("text", { class: "sw-plot-tick", x, y: H - BOT + 18, "text-anchor": "middle" }, label));
    }
    // Round ticks: a step of 1, 2 or 5 times a power of ten, about five of them.
    const raw = (y1 - y0) / 5;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    for (let v = Math.ceil(y0 / step) * step; v <= y1; v += step) {
      const y = Y(v);
      plot.append(el("line", { class: "sw-plot-grid", x1: L, x2: W - R, y1: y, y2: y }));
      plot.append(el("text", { class: "sw-plot-tick", x: L - 8, y: y + 4, "text-anchor": "end" }, sig(Math.abs(v) < step / 1e6 ? 0 : v)));
    }
    plot.append(el("text", { class: "sw-plot-tick", x: XB, y: H - BOT + 18, "text-anchor": "middle" }, "0"));
    plot.append(el("line", { class: "sw-plot-axis", x1: L, x2: W - R, y1: H - BOT, y2: H - BOT }));
    plot.append(el("line", { class: "sw-plot-axis", x1: L, x2: L, y1: TOP, y2: H - BOT }));
    plot.append(el("path", { class: "sw-plot-axis", d: `M${x0px - 6} ${H - BOT + 5} l4 -10 M${x0px - 1} ${H - BOT + 5} l4 -10` }));
    plot.append(el("text", { class: "sw-plot-title", x: (x0px + W - R) / 2, y: H - 10, "text-anchor": "middle" }, "AHL concentration (log scale)"));
    plot.append(el("text", { class: "sw-plot-title", x: 14, y: (TOP + H - BOT) / 2, "text-anchor": "middle", transform: `rotate(-90 14 ${(TOP + H - BOT) / 2})` }, "signal"));

    // LOD in signal: dashed horizontal
    const lodF = CurveFit.model(fit.lod_nM, fit.params);
    plot.append(el("line", { class: "sw-plot-lod", x1: L, x2: W - R, y1: Y(lodF), y2: Y(lodF) }));
    plot.append(el("text", { class: "sw-plot-tick", x: W - R - 4, y: Y(lodF) - 5, "text-anchor": "end" }, "LOD"));

    // fitted curve
    let d = "";
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const lc = lx0 + ((lx1 - lx0) * i) / steps;
      const c = 10 ** lc;
      d += (i ? "L" : "M") + X(c).toFixed(1) + " " + Y(CurveFit.model(c, fit.params)).toFixed(1);
    }
    plot.append(el("path", { class: "sw-plot-curve", d }));
    plot.append(el("line", { class: "sw-plot-curve sw-plot-base", x1: XB - 12, x2: XB + 12, y1: Y(fit.params.bottom), y2: Y(fit.params.bottom) }));

    // readings
    points.forEach((p) => {
      const cx = p.c > 0 ? X(p.c) : XB;
      plot.append(el("circle", { class: p.c > 0 ? "sw-plot-pt" : "sw-plot-pt is-blank", cx, cy: Y(p.y), r: 4 }));
    });

    // an inverted sample
    if (marker) {
      const yF = Y(marker.F);
      plot.append(el("line", { class: "sw-plot-inv", x1: L, x2: marker.c ? X(marker.c) : W - R, y1: yF, y2: yF }));
      if (marker.c) {
        if (marker.ci) {
          plot.append(el("rect", { class: "sw-plot-ci", x: X(marker.ci[0]), y: yF - 5, width: X(marker.ci[1]) - X(marker.ci[0]), height: 10, rx: 3 }));
        }
        plot.append(el("line", { class: "sw-plot-inv", x1: X(marker.c), x2: X(marker.c), y1: yF, y2: H - BOT }));
        plot.append(el("circle", { class: "sw-plot-mark", cx: X(marker.c), cy: yF, r: 6 }));
      }
    }
  }

  // ---- inversion ---------------------------------------------------------
  function invert() {
    if (!current) { invOut.textContent = "Fit a curve first."; return; }
    const F = Number(invF.value);
    const n = Math.round(Number(invN.value));
    if (!Number.isFinite(F) || invF.value.trim() === "") { invOut.textContent = "Enter the sample's mean signal."; return; }
    if (!(n >= 1)) { invOut.textContent = "n must be at least 1."; return; }
    const r = CurveFit.invert(F, current.fit, n);
    if (r.status === "ok") {
      invOut.textContent = `${conc(r.concentration_nM)}, 95% CI ${conc(r.ci95_nM[0])} – ${conc(r.ci95_nM[1])}`;
      renderPlot({ F, c: r.concentration_nM, ci: r.ci95_nM });
    } else if (r.status === "below_lod") {
      invOut.textContent = `Below LOD: under ${conc(current.fit.range_nM.min)}. No number is given.`;
      renderPlot({ F });
    } else {
      invOut.textContent = `Above range: over ${conc(current.fit.range_nM.max)}. No number is given.`;
      renderPlot({ F });
    }
  }

  $("swLabFit").addEventListener("click", run);
  $("swLabClear").addEventListener("click", () => {
    input.value = "";
    current = null;
    out.hidden = true;
    invOut.textContent = "";
    say("", false);
    input.focus();
  });
  $("swSimGo").addEventListener("click", simulate);
  $("swInvGo").addEventListener("click", invert);
  invF.addEventListener("keydown", (e) => { if (e.key === "Enter") invert(); });
})();
