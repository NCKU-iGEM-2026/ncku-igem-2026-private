(function () {
  "use strict";

  const root = document.getElementById("swTry");
  if (!root || typeof CurveFit === "undefined") return;

  const EXAMPLE = null;

  const HINT_SPREAD = [0, 0.03, -0.03];
  function hint(r, c) {
    const concentration = r === 0 ? 0 : 10 ** r;
    if (c === 0) return String(concentration);
    const signal = r === 0 ? 100 : 100 + 4500 / (1 + 300 / concentration);
    return String(Math.round((signal * (1 + HINT_SPREAD[c - 1])) / 5) * 5);
  }

  const READINGS = 3;
  const MIN_ROWS = 6;
  const SVG = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);

  const head = $("swTryHead");
  const rows = $("swTryRows");
  const msg = $("swTryMsg");
  const empty = $("swTryEmpty");
  const out = $("swTryOut");
  const plot = $("swTryPlot");
  const unitInput = $("swTryUnit");
  const invF = $("swTryF");
  const invN = $("swTryN");
  const result = $("swTryResult");
  const needBlanks = $("swTryNeedBlanks");
  const needStd = $("swTryNeedStd");

  let note = "";
  let current = null;
  let toPlotY = null;
  let timer = 0;

  const unit = () => unitInput.value.trim() || "units";
  function num(x) {
    if (!Number.isFinite(x)) return "--";
    return Number(x.toPrecision(3)).toLocaleString("en-US", { maximumSignificantDigits: 3 });
  }
  const conc = (c) => num(c) + " " + unit();
  const sig = (x) => (Number.isFinite(x) ? Number(x.toPrecision(4)).toString() : "--");

  function parseNum(v) {
    const s = /^[-+]?\d{1,3}(,\d{3})+(\.\d*)?$/.test(v) ? v.replace(/,/g, "") : v;
    return s === "" ? NaN : Number(s);
  }

  const indexIn = (parent, child) => Array.prototype.indexOf.call(parent.children, child);

  function newCell() {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.spellcheck = false;
    td.append(input);
    return td;
  }
  function renderHead() {
    const first = document.createElement("th");
    first.scope = "col";
    first.textContent = `Concentration (${unit()})`;
    const ths = [first];
    for (let j = 1; j <= READINGS; j++) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = `Reading ${j}`;
      ths.push(th);
    }
    head.replaceChildren(...ths);
  }
  function relabel() {
    Array.from(rows.children).forEach((tr, i) => {
      Array.from(tr.children).forEach((td, j) => {
        td.firstChild.setAttribute("aria-label", j === 0 ? `Row ${i + 1}, concentration` : `Row ${i + 1}, reading ${j}`);
        td.firstChild.placeholder = hint(i, j);
      });
    });
  }
  function addRow() {
    const tr = document.createElement("tr");
    for (let j = 0; j <= READINGS; j++) tr.append(newCell());
    rows.append(tr);
    return tr;
  }
  function cell(r, c) {
    if (c > READINGS) return null;
    while (rows.children.length <= r) addRow();
    return rows.children[r].children[c].firstChild;
  }
  const filled = (input) => input.value.trim() !== "";
  function grow() {
    if (Array.from(rows.lastElementChild.querySelectorAll("input")).some(filled)) addRow();
    relabel();
  }
  function clearTable() {
    note = "";
    renderHead();
    rows.replaceChildren();
    for (let i = 0; i < MIN_ROWS; i++) addRow();
    relabel();
  }

  rows.addEventListener("paste", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\r/g, "");
    if (!/[\t\n,; ]/.test(text.trim())) return;
    e.preventDefault();
    const td = target.parentElement;
    const r0 = indexIn(rows, td.parentElement);
    const c0 = indexIn(td.parentElement, td);
    const sep = text.includes("\t") ? /\t/ : /\s*[,;]\s*|\s+/;
    const lines = text.split("\n");
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    let trimmed = false;
    lines.forEach((line, i) => {
      line.trim().split(sep).forEach((value, j) => {
        const input = cell(r0 + i, c0 + j);
        if (input) input.value = value.trim();
        else if (value.trim() !== "") trimmed = true;
      });
    });
    note = trimmed ? `Only ${READINGS} readings per row fit in this table; the rest of the pasted block was left out.` : "";
    grow();
    schedule();
  });
  rows.addEventListener("input", () => { note = ""; grow(); schedule(); });
  rows.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !(e.target instanceof HTMLInputElement)) return;
    e.preventDefault();
    const td = e.target.parentElement;
    const r = indexIn(rows, td.parentElement) + (e.shiftKey ? -1 : 1);
    if (r >= 0) cell(r, indexIn(td.parentElement, td)).focus();
  });

  function read() {
    const points = [];
    const problems = [];
    root.querySelectorAll(".sw-try-table .is-bad").forEach((n) => n.classList.remove("is-bad"));
    const bad = (input, text) => { input.classList.add("is-bad"); problems.push(text); };
    Array.from(rows.children).forEach((tr, i) => {
      const inputs = Array.from(tr.querySelectorAll("input"));
      const values = inputs.map((x) => x.value.trim());
      if (values.every((v) => v === "")) return;
      if (i === 0 && values[0] !== "" && !Number.isFinite(parseNum(values[0]))) return;
      const c = parseNum(values[0]);
      if (values[0] === "") {
        bad(inputs[0], `Row ${i + 1}: type its concentration; the grey numbers are only hints.`);
        return;
      }
      if (!Number.isFinite(c) || c < 0) {
        bad(inputs[0], `Row ${i + 1}: the concentration must be a number, 0 or more.`);
        return;
      }
      values.slice(1).forEach((v, j) => {
        if (v === "") return;
        const y = parseNum(v);
        if (!Number.isFinite(y)) bad(inputs[j + 1], `Row ${i + 1}, reading ${j + 1}: not a number.`);
        else points.push({ c, y, sd: 0 });
      });
    });
    return { points, problems };
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 250);
  }
  function say(text, isError) {
    msg.textContent = text;
    msg.classList.toggle("is-error", !!isError);
  }
  function check(li, have, need, noun) {
    li.classList.toggle("is-done", have >= need);
    li.querySelector(".sw-try-count").textContent = have >= need ? `(${have})` : `(${have} so far)`;
    li.setAttribute("aria-label", `${noun}: ${have} of at least ${need}`);
  }
  function show(ready) {
    out.hidden = !ready;
    empty.hidden = ready;
  }

  function run() {
    current = null;
    const { points, problems } = read();
    const blanks = points.filter((p) => p.c === 0).length;
    const groups = new Map();
    points.forEach((p) => groups.set(p.c, (groups.get(p.c) || 0) + 1));
    const standards = [...groups.keys()].filter((c) => c > 0).length;
    check(needBlanks, blanks, 2, "Blank readings");
    check(needStd, standards, 4, "Standard concentrations");

    if (problems.length) { say(problems.slice(0, 2).join(" "), true); show(false); return; }
    say(note, false);
    if (blanks < 2 || standards < 4) { show(false); return; }

    let fit;
    try {
      fit = CurveFit.fit(points);
    } catch (e) {
      say("No curve from these readings: " + e.message, true);
      show(false);
      return;
    }
    const weighted = fit.noise.b > 0;
    current = { points, fit, weighted };
    show(true);
    render();
  }

  function render() {
    const { points, fit, weighted } = current;
    $("swTryRange").textContent = num(fit.range_nM.min) + " – " + conc(fit.range_nM.max);
    $("swTryLod").textContent = conc(fit.lod_nM);
    $("swTryWeight").textContent = `${points.length} readings, ` +
      (weighted ? "weighted by their replicate spread."
        : "weighted equally: the replicates do not show the spread growing with the signal.");
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

  function invert() {
    if (!current) return;
    const raw = invF.value.trim();
    const n = Math.round(Number(invN.value));
    result.className = "sw-try-result";
    if (raw === "") { result.textContent = ""; renderPlot(null); return; }
    const F = Number(raw);
    if (!Number.isFinite(F)) { result.textContent = "Enter the sample's mean reading."; renderPlot(null); return; }
    if (!(n >= 1)) { result.textContent = "Replicates must be at least 1."; renderPlot(null); return; }
    const r = CurveFit.invert(F, current.fit, n);
    if (r.status === "ok") {
      result.className = "sw-try-result is-ok";
      result.innerHTML = "";
      const big = document.createElement("strong");
      big.textContent = "≈ " + conc(r.concentration_nM);
      result.append(big, document.createTextNode(` approx. 95% CI ${num(r.ci95_nM[0])} – ${conc(r.ci95_nM[1])}`));
      renderPlot({ F, c: r.concentration_nM, ci: r.ci95_nM });
    } else {
      result.className = "sw-try-result is-bound";
      result.textContent = r.status === "below_lod"
        ? `Below the usable range: under ${conc(current.fit.range_nM.min)}. No number is given.`
        : `Above the usable range: over ${conc(current.fit.range_nM.max)}. No number is given.`;
      renderPlot({ F });
    }
  }
  invF.addEventListener("input", invert);
  invN.addEventListener("input", invert);

  plot.addEventListener("click", (e) => {
    if (!current || !toPlotY) return;
    const ctm = plot.getScreenCTM();
    if (!ctm) return;
    const pt = plot.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const F = toPlotY(pt.matrixTransform(ctm.inverse()).y);
    if (F === null) return;
    invF.value = sig(F);
    invert();
  });

  function el(name, attrs, text) {
    const n = document.createElementNS(SVG, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderPlot(marker) {
    const { points, fit } = current;
    const W = 520, H = 380, L = 60, R = 16, TOP = 16, BOT = 50, ZERO = 52;
    const cs = points.filter((p) => p.c > 0).map((p) => p.c);
    const lx0 = Math.floor(Math.log10(Math.min(...cs)) - 0.25);
    const lx1 = Math.ceil(Math.log10(Math.max(...cs)) + 0.25);
    const ys = points.map((p) => p.y).concat([fit.params.top, fit.params.bottom]);
    if (marker) ys.push(marker.F);
    let y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = (y1 - y0) * 0.08 || Math.abs(y1) * 0.1 || 1;
    y0 -= pad; y1 += pad;

    const x0px = L + ZERO;
    const X = (c) => x0px + ((Math.log10(c) - lx0) / (lx1 - lx0)) * (W - R - x0px);
    const Y = (y) => TOP + (1 - (y - y0) / (y1 - y0)) * (H - TOP - BOT);
    const XB = L + 20;
    toPlotY = (py) => (py < TOP || py > H - BOT ? null : y0 + (1 - (py - TOP) / (H - TOP - BOT)) * (y1 - y0));

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

  $("swTryClear").addEventListener("click", () => {
    clearTable();
    invF.value = "";
    result.textContent = "";
    run();
    cell(0, 0).focus();
  });
  unitInput.addEventListener("input", () => {
    renderHead();
    if (current) render();
  });
  const exampleBtn = $("swTryExample");
  if (exampleBtn) {
    if (!EXAMPLE) exampleBtn.remove();
    else exampleBtn.addEventListener("click", () => {
      clearTable();
      EXAMPLE.rows.forEach((r, i) => r.forEach((v, j) => { const input = cell(i, j); if (input) input.value = String(v); }));
      grow();
      unitInput.value = EXAMPLE.unit;
      unitInput.dispatchEvent(new Event("input"));
      run();
      if (current) say(EXAMPLE.source, false);
    });
  }

  clearTable();
  run();
})();
