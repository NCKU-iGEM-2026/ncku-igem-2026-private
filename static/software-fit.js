// Software page: "Try it with your data".
//
// Everything numeric goes through CurveFit (static/lasreader-curve-fit.js), which is
// LasReader's own curve_fit.js, so a curve drawn here is the curve the tool would give
// for the same readings. This file only reads the table, draws the result and asks
// CurveFit to convert a reading. Nothing is sent anywhere and nothing is stored.
//
// The table starts empty. A block copied from a spreadsheet can be pasted into any
// cell and fills the table from there. The curve is refitted as you type.
(function () {
  "use strict";

  const root = document.getElementById("swTry");
  if (!root || typeof CurveFit === "undefined") return;

  // A real calibration from the team, to be added later: rows of
  // [concentration, reading, reading, ...] plus a line saying where it comes from.
  // While it is null the "Load our calibration" button stays out of the page.
  const EXAMPLE = null; // { source: "…", unit: "nM", rows: [[0, …], …] }

  const READINGS = 4;
  const START_ROWS = 8;
  const SVG = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);

  const rows = $("swTryRows");
  const msg = $("swTryMsg");
  const out = $("swTryOut");
  const plot = $("swTryPlot");
  const unitInput = $("swTryUnit");
  const invF = $("swTryF");
  const invN = $("swTryN");
  const result = $("swTryResult");

  let current = null; // { points, fit, weighted }
  let timer = 0;

  // ---- formatting -------------------------------------------------------
  const unit = () => unitInput.value.trim() || "units";
  function num(x) {
    if (!Number.isFinite(x)) return "--";
    return Number(x.toPrecision(3)).toLocaleString("en-US", { maximumSignificantDigits: 3 });
  }
  const conc = (c) => num(c) + " " + unit();
  const sig = (x) => (Number.isFinite(x) ? Number(x.toPrecision(4)).toString() : "--");

  // ---- the table --------------------------------------------------------
  function addRow() {
    const tr = document.createElement("tr");
    for (let col = 0; col <= READINGS; col++) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.setAttribute("aria-label", col === 0
        ? `Row ${rows.children.length + 1}, concentration`
        : `Row ${rows.children.length + 1}, reading ${col}`);
      td.append(input);
      tr.append(td);
    }
    rows.append(tr);
    return tr;
  }
  function cell(r, c) {
    while (rows.children.length <= r) addRow();
    return rows.children[r].children[c].firstChild;
  }
  function clearTable() {
    rows.replaceChildren();
    for (let i = 0; i < START_ROWS; i++) addRow();
  }

  // A block pasted from a spreadsheet: tab-separated cells, one line per row.
  // Commas or semicolons also separate, for a block typed by hand.
  rows.addEventListener("paste", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (!/[\t\n,;]/.test(text.trim())) return; // a single value: let the browser paste it
    e.preventDefault();
    const td = target.parentElement;
    const r0 = Array.prototype.indexOf.call(rows.children, td.parentElement);
    const c0 = Array.prototype.indexOf.call(td.parentElement.children, td);
    const lines = text.replace(/\r/g, "").split("\n");
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.forEach((line, i) => {
      line.split(/\t|[,;]\s*/).forEach((value, j) => {
        if (c0 + j <= READINGS) cell(r0 + i, c0 + j).value = value.trim();
      });
    });
    schedule();
  });
  rows.addEventListener("input", schedule);

  function read() {
    const points = [];
    const problems = [];
    Array.from(rows.children).forEach((tr, i) => {
      const values = Array.from(tr.querySelectorAll("input")).map((x) => x.value.trim());
      if (values.every((v) => v === "")) return;
      // A header row copied along with the data: skip it quietly.
      if (i === 0 && values[0] !== "" && !Number.isFinite(Number(values[0]))) return;
      const c = Number(values[0]);
      if (values[0] === "" || !Number.isFinite(c) || c < 0) {
        problems.push(`Row ${i + 1}: the concentration must be a number, 0 or more.`);
        return;
      }
      values.slice(1).forEach((v, j) => {
        if (v === "") return;
        const y = Number(v);
        if (!Number.isFinite(y)) problems.push(`Row ${i + 1}, reading ${j + 1}: not a number.`);
        else points.push({ c, y, sd: 0 });
      });
    });
    return { points, problems };
  }

  // ---- fitting ----------------------------------------------------------
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 250);
  }
  function say(text, isError) {
    msg.textContent = text;
    msg.classList.toggle("is-error", !!isError);
  }

  function run() {
    current = null;
    out.hidden = true;
    const { points, problems } = read();
    if (problems.length) { say(problems.slice(0, 3).join(" "), true); return; }
    if (!points.length) { say("Type or paste your standards to begin.", false); return; }

    const blanks = points.filter((p) => p.c === 0).length;
    const groups = new Map();
    points.forEach((p) => groups.set(p.c, (groups.get(p.c) || 0) + 1));
    const standards = [...groups.keys()].filter((c) => c > 0).length;
    if (blanks < 2 || standards < 4) {
      say(`So far: ${blanks} blank reading${blanks === 1 ? "" : "s"} and ${standards} standard concentration${standards === 1 ? "" : "s"}. ` +
        "A curve needs at least 2 blank readings and 4 standard concentrations.", false);
      return;
    }

    let fit;
    try {
      fit = CurveFit.fit(points);
    } catch (e) {
      say("No curve: " + e.message, true);
      return;
    }
    // The same test CurveFit.fit makes: without replicate spread it fits unweighted.
    const weighted = [...groups.values()].some((n) => n >= 2);
    current = { points, fit, weighted };
    say("", false);
    out.hidden = false;
    render();
  }

  function render() {
    const { points, fit, weighted } = current;
    $("swTryRange").textContent = num(fit.range_nM.min) + " – " + conc(fit.range_nM.max);
    $("swTryLod").textContent = conc(fit.lod_nM);
    $("swTryUsed").textContent = String(points.length);
    $("swTryWeight").textContent = weighted ? "weighted by their replicate spread" : "unweighted: no replicates to weight by";
    renderParams();
    invert();
  }

  function row(label, value, note) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.innerHTML = label;
    const td = document.createElement("td");
    td.textContent = value;
    const tn = document.createElement("td");
    tn.className = "sw-lab-note";
    tn.textContent = note || "";
    tr.append(th, td, tn);
    return tr;
  }
  function renderParams() {
    const { fit } = current;
    const p = fit.params;
    $("swTryParams").replaceChildren(
      row("Top <var>T</var>", sig(p.top), "saturated signal"),
      row("Bottom <var>B</var>", sig(p.bottom), "signal with no target"),
      row("EC<sub>50</sub>", conc(p.ec50_nM), "half-maximal response"),
      row("Hill <var>h</var>", sig(p.hill), "steepness"),
      row("LOD", conc(fit.lod_nM), "blank + 3 SD, through the curve"),
      row("LOQ", conc(fit.loq_nM), "blank + 10 SD, through the curve"),
      row("RMSE", sig(fit.rmse), "in signal units"),
      row("Noise model", `a = ${sig(fit.noise.a)}, b = ${sig(fit.noise.b)}`, "Var(F) = a + bF²"),
    );
  }

  // ---- converting a sample ----------------------------------------------
  function invert() {
    if (!current) return;
    const raw = invF.value.trim();
    const n = Math.round(Number(invN.value));
    if (raw === "") { result.textContent = ""; result.className = "sw-try-result"; renderPlot(null); return; }
    const F = Number(raw);
    if (!Number.isFinite(F)) { result.textContent = "Enter the sample's mean reading."; renderPlot(null); return; }
    if (!(n >= 1)) { result.textContent = "Replicates must be at least 1."; renderPlot(null); return; }
    const r = CurveFit.invert(F, current.fit, n);
    if (r.status === "ok") {
      result.className = "sw-try-result is-ok";
      result.innerHTML = "";
      const big = document.createElement("strong");
      big.textContent = "≈ " + conc(r.concentration_nM);
      result.append(big, document.createTextNode(`  95% CI ${num(r.ci95_nM[0])} – ${conc(r.ci95_nM[1])}`));
      renderPlot({ F, c: r.concentration_nM, ci: r.ci95_nM });
    } else {
      result.className = "sw-try-result is-bound";
      result.textContent = r.status === "below_lod"
        ? `Below the limit of detection: under ${conc(current.fit.range_nM.min)}. No number is given.`
        : `Above the usable range: over ${conc(current.fit.range_nM.max)}. No number is given.`;
      renderPlot({ F });
    }
  }
  invF.addEventListener("input", invert);
  invN.addEventListener("input", invert);

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

    plot.append(el("rect", {
      class: "sw-plot-range", x: X(fit.range_nM.min), y: TOP,
      width: Math.max(0, X(fit.range_nM.max) - X(fit.range_nM.min)), height: H - TOP - BOT,
    }));

    for (let d = lx0; d <= lx1; d++) {
      const x = X(10 ** d);
      plot.append(el("line", { class: "sw-plot-grid", x1: x, x2: x, y1: TOP, y2: H - BOT }));
      plot.append(el("text", { class: "sw-plot-tick", x, y: H - BOT + 18, "text-anchor": "middle" }, num(10 ** d)));
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
    plot.append(el("text", { class: "sw-plot-title", x: (x0px + W - R) / 2, y: H - 10, "text-anchor": "middle" }, `concentration, ${unit()} (log scale)`));
    plot.append(el("text", { class: "sw-plot-title", x: 14, y: (TOP + H - BOT) / 2, "text-anchor": "middle", transform: `rotate(-90 14 ${(TOP + H - BOT) / 2})` }, "reading"));

    const lodF = CurveFit.model(fit.lod_nM, fit.params);
    plot.append(el("line", { class: "sw-plot-lod", x1: L, x2: W - R, y1: Y(lodF), y2: Y(lodF) }));
    plot.append(el("text", { class: "sw-plot-tick", x: W - R - 4, y: Y(lodF) - 5, "text-anchor": "end" }, "LOD"));

    let d = "";
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const c = 10 ** (lx0 + ((lx1 - lx0) * i) / steps);
      d += (i ? "L" : "M") + X(c).toFixed(1) + " " + Y(CurveFit.model(c, fit.params)).toFixed(1);
    }
    plot.append(el("path", { class: "sw-plot-curve", d }));
    plot.append(el("line", { class: "sw-plot-curve sw-plot-base", x1: XB - 12, x2: XB + 12, y1: Y(fit.params.bottom), y2: Y(fit.params.bottom) }));

    points.forEach((p) => {
      plot.append(el("circle", { class: p.c > 0 ? "sw-plot-pt" : "sw-plot-pt is-blank", cx: p.c > 0 ? X(p.c) : XB, cy: Y(p.y), r: 4 }));
    });

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

  // ---- buttons ------------------------------------------------------------
  $("swTryAdd").addEventListener("click", () => addRow().querySelector("input").focus());
  $("swTryClear").addEventListener("click", () => {
    clearTable();
    invF.value = "";
    result.textContent = "";
    run();
    cell(0, 0).focus();
  });
  unitInput.addEventListener("input", () => {
    root.querySelectorAll(".sw-try-unit-label").forEach((n) => { n.textContent = unit(); });
    if (current) render();
  });
  const exampleBtn = $("swTryExample");
  if (exampleBtn) {
    if (!EXAMPLE) exampleBtn.remove();
    else exampleBtn.addEventListener("click", () => {
      clearTable();
      EXAMPLE.rows.forEach((r, i) => r.forEach((v, j) => { if (j <= READINGS) cell(i, j).value = String(v); }));
      unitInput.value = EXAMPLE.unit;
      unitInput.dispatchEvent(new Event("input"));
      run();
      if (current) say(EXAMPLE.source, false);
    });
  }

  clearTable();
  run();
})();
