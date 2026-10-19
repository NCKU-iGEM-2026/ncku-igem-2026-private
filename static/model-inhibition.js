(function () {
  'use strict';
  var host = document.querySelector('[data-model-inhibition]');
  if (!host) return;

  var NS = 'http://www.w3.org/2000/svg';
  var ink = '#172e39', muted = '#4c626d', grid = '#dce4e5';
  var teal = '#087c68', blue = '#2469a0', orange = '#b14c1d';
  var colours = { 'ALS-5': blue, 'A16-2': orange, 'Cb-2': teal };

  function node(tag, attrs, text) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function add(svg, tag, attrs, text) {
    var el = node(tag, attrs, text);
    svg.appendChild(el);
    return el;
  }
  function label(svg, x, y, text, attrs) {
    return add(svg, 'text', Object.assign({ x: x, y: y, fill: ink, 'font-size': 15 }, attrs), text);
  }
  function line(svg, x1, y1, x2, y2, attrs) {
    return add(svg, 'line', Object.assign({ x1: x1, y1: y1, x2: x2, y2: y2, stroke: grid, 'stroke-width': 1 }, attrs));
  }
  function point(svg, x, y, colour, shape) {
    if (shape === 'diamond') return add(svg, 'path', { d: 'M' + x + ',' + (y - 6) + 'l6,6l-6,6l-6,-6Z', fill: '#fff', stroke: colour, 'stroke-width': 2 });
    if (shape === 'square') return add(svg, 'rect', { x: x - 5, y: y - 5, width: 10, height: 10, fill: '#fff', stroke: colour, 'stroke-width': 2 });
    return add(svg, 'circle', { cx: x, cy: y, r: 5, fill: colour, stroke: '#fff', 'stroke-width': 1.5 });
  }
  function interval(svg, x1, x2, y, colour, width) {
    line(svg, x1, y, x2, y, { stroke: colour, 'stroke-width': width || 4 });
    [x1, x2].forEach(function (x) { line(svg, x, y - 5, x, y + 5, { stroke: colour, 'stroke-width': 1.5 }); });
  }
  function canvas(key, height, title, desc) {
    var svg = node('svg', { viewBox: '0 0 820 ' + height, role: 'img', 'aria-labelledby': 'md-' + key + '-title md-' + key + '-desc', class: 'md-svg' });
    add(svg, 'title', { id: 'md-' + key + '-title' }, title);
    add(svg, 'desc', { id: 'md-' + key + '-desc' }, desc);
    label(svg, 24, 30, title, { 'font-size': 20, 'font-weight': 700 });
    return svg;
  }
  function horizontalAxis(svg, x, ticks, top, bottom, text) {
    ticks.forEach(function (t) {
      line(svg, x(t), top, x(t), bottom);
      label(svg, x(t), bottom + 24, String(t), { 'text-anchor': 'middle', fill: muted, 'font-size': 14 });
    });
    line(svg, x(ticks[0]), bottom, x(ticks[ticks.length - 1]), bottom, { stroke: muted });
    label(svg, (x(ticks[0]) + x(ticks[ticks.length - 1])) / 2, bottom + 52, text, { 'text-anchor': 'middle', fill: muted });
  }
  function effect(data, assay, treatment) {
    return data.effects.find(function (r) { return r.assay === assay && r.treatment === treatment; });
  }
  function summary(data, output) {
    return data.uncertainty.find(function (r) { return r.output === output; });
  }

  function effects(data) {
    var svg = canvas('effects', 650, 'Measured effects across three assays', 'Nine treatment/control ratios with the primary 95% intervals. Values and methods match the table in section 1.2.');
    label(svg, 24, 55, 'Primary analysis · dashed line = no change', { fill: muted, 'font-size': 14 });
    var x = function (v) { return 246 + (v - 0.4) / 0.7 * 430; };
    horizontalAxis(svg, x, [0.4, 0.6, 0.8, 1, 1.1], 80, 588, 'Treatment/control ratio');
    line(svg, x(1), 80, x(1), 588, { stroke: muted, 'stroke-dasharray': '5 5' });
    label(svg, 794, 91, 'Reduction', { fill: muted, 'text-anchor': 'end', 'font-size': 14 });
    ['swarming', 'pyocyanin', 'biofilm'].forEach(function (assay, a) {
      label(svg, 24, 96 + a * 170, assay.charAt(0).toUpperCase() + assay.slice(1), { 'font-weight': 700 });
      ['ALS-5', 'A16-2', 'Cb-2'].forEach(function (t, i) {
        var r = effect(data, assay, t), y = 126 + a * 170 + i * 43;
        label(svg, 24, y + 1, t, { fill: colours[t], 'font-weight': 600 });
        var units = assay === 'biofilm' ? r.n_obs + ' replicates / ' + r.n_batches + ' plates' : r.n_obs + ' readings / ' + r.n_batches + ' plates';
        label(svg, 24, y + 18, units, { fill: muted, 'font-size': 12 });
        interval(svg, x(r.ci_low), x(r.ci_high), y, colours[t]);
        point(svg, x(r.ratio_gm), y, colours[t]);
        label(svg, 794, y + 5, (100 * (1 - r.ratio_gm)).toFixed(1) + '%', { 'text-anchor': 'end', fill: colours[t] });
      });
    });
    return svg;
  }

  function predictions(data) {
    var svg = canvas('predictions', 500, 'Swarming: fit, held-out comparison and uncertainty', 'ALS-5 and A16-2 are calibration treatments. Cb-2 measured ratio 0.820 has primary 95% interval 0.697 to 0.964. Its nominal equal-mass prediction is 0.992 and equal-molar prediction 0.490. The successful joint scenarios have median 0.669 and central 90% range 0.064 to 0.989.');
    var x = function (v) { return 207 + v / 1.1 * 565; };
    point(svg, 28, 61, teal); label(svg, 42, 66, 'Measured + 95% interval', { 'font-size': 13 });
    point(svg, 280, 61, ink, 'diamond'); label(svg, 294, 66, 'Nominal equal-mass', { 'font-size': 13 });
    point(svg, 517, 61, blue, 'square'); label(svg, 531, 66, 'Nominal equal-molar', { 'font-size': 13 });
    horizontalAxis(svg, x, [0, 0.2, 0.4, 0.6, 0.8, 1, 1.1], 88, 438, 'Swarm radius / control radius');
    line(svg, x(1), 88, x(1), 438, { stroke: muted, 'stroke-dasharray': '5 5' });
    ['ALS-5', 'A16-2', 'Cb-2'].forEach(function (t, i) {
      var r = effect(data, 'swarming', t), y = 125 + i * 85;
      label(svg, 24, y - 3, t, { 'font-weight': 700 });
      label(svg, 24, y + 17, i < 2 ? 'Calibration' : 'Held out', { fill: muted, 'font-size': 13 });
      interval(svg, x(r.ci_low), x(r.ci_high), y, teal, 7);
      point(svg, x(r.ratio_gm), y, teal);
      data.predictions.filter(function (p) { return p.treatment === t; }).forEach(function (p) {
        var mass = p.dosing === 'equal-mass';
        point(svg, x(p.predicted), y + (mass ? -14 : 14), mass ? ink : blue, mass ? 'diamond' : 'square');
      });
    });
    line(svg, 24, 334, 795, 334);
    var u = summary(data, 'cb2_ratio');
    label(svg, 24, 373, 'Cb-2 joint scenarios', { 'font-weight': 700 });
    label(svg, 24, 394, u.n_calibrated + ' / ' + u.n_total + ' calibrations', { fill: muted, 'font-size': 13 });
    interval(svg, x(u.p05), x(u.p95), 378, orange, 6);
    point(svg, x(u.median), 378, orange);
    label(svg, x(u.median), 413, 'Median ' + u.median.toFixed(3) + ' · central 90% range', { 'text-anchor': 'middle', fill: muted, 'font-size': 13 });
    return svg;
  }

  function budget(data) {
    var svg = canvas('budget', 385, 'Specificity and molecule number in the nominal model', 'These bars are model predictions, not measured construct advantages. Inhibition is 36.1% for A16-2, 50.9% for dual specificity at the same molar amount, and 0.8% at the same mass.');
    label(svg, 24, 56, 'Fixed core parameters and assumed affinities · dashed line = measured Cb-2', { fill: muted, 'font-size': 14 });
    var x = function (v) { return 306 + v / 60 * 440; };
    horizontalAxis(svg, x, [0, 10, 20, 30, 40, 50, 60], 88, 320, 'Swarming inhibition (%)');
    var names = [['A16-2 specialist', '44 nt · nominal reference'], ['Dual specificity', 'Same molar amount as A16-2'], ['Dual specificity', 'Same mass · 93 nt']];
    data.budget.forEach(function (r, i) {
      var y = 124 + i * 78;
      label(svg, 24, y, names[i][0], { 'font-weight': 600 });
      label(svg, 24, y + 21, names[i][1], { fill: muted, 'font-size': 13 });
      add(svg, 'rect', { x: x(0), y: y - 16, width: x(r.inhibition_pct) - x(0), height: 30, fill: i ? teal : orange });
      label(svg, x(r.inhibition_pct) + 9, y + 5, r.inhibition_pct.toFixed(1) + '%');
    });
    var measured = 100 * (1 - effect(data, 'swarming', 'Cb-2').ratio_gm);
    line(svg, x(measured), 88, x(measured), 320, { stroke: ink, 'stroke-dasharray': '5 5' });
    return svg;
  }

  function doses(data) {
    var svg = canvas('doses', 350, 'Relative A16-2 dose requirements', 'For 50% inhibition the joint median is 1.63 times baseline, central 90% range 1.00 to 2.59. For 90% inhibition the median is 11.11 and the range 1.00 to 49.36. All ranges are conditional on 296 successful joint draws out of 400.');
    label(svg, 24, 56, 'Joint scenarios: 296 / 400 calibrations · nominal baseline dose is assumed', { fill: muted, 'font-size': 14 });
    point(svg, 28, 81, teal); label(svg, 42, 86, 'Joint median + central 90% range', { 'font-size': 13 });
    point(svg, 400, 81, ink, 'diamond'); label(svg, 414, 86, 'Nominal fit', { 'font-size': 13 });
    var x = function (v) { return 240 + Math.log(v / 0.8) / Math.log(60 / 0.8) * 520; };
    horizontalAxis(svg, x, [1, 2, 5, 10, 20, 50], 104, 284, 'Dose / assumed baseline dose (log scale)');
    line(svg, x(1), 104, x(1), 284, { stroke: muted, 'stroke-dasharray': '5 5' });
    ['fold_50', 'fold_90'].forEach(function (key, i) {
      var u = summary(data, key), y = 143 + i * 91;
      var nominal = data.doses[0][i ? 'fold_increase_for_90pct' : 'fold_increase_for_50pct'];
      label(svg, 24, y, i ? '90% radius reduction' : '50% radius reduction', { 'font-weight': 600 });
      interval(svg, x(u.p05), x(u.p95), y, teal, 6);
      point(svg, x(u.median), y, teal);
      point(svg, x(nominal), y - 18, ink, 'diamond');
      label(svg, 24, y + 22, 'Median ' + u.median.toFixed(1) + '×', { fill: muted, 'font-size': 13 });
    });
    return svg;
  }

  function sensitivity(data) {
    var svg = canvas('sensitivity', 410, 'Which inputs are associated with the required dose?', 'Partial rank correlations in successful joint draws. Untreated C4-HSL level is most influential for the half-inhibition target; beta is most influential for the 90% target. Four inputs are shown; signs indicate association, not causality.');
    label(svg, 24, 56, 'Partial rank correlations · four inputs · 296 successful joint draws', { fill: muted, 'font-size': 14 });
    point(svg, 28, 81, blue); label(svg, 42, 86, '50% inhibition target', { 'font-size': 13 });
    point(svg, 304, 81, orange); label(svg, 318, 86, '90% inhibition target', { 'font-size': 13 });
    var x = function (v) { return 340 + (v + 0.6) * 400; };
    horizontalAxis(svg, x, [-0.6, -0.4, -0.2, 0, 0.2, 0.4], 106, 348, 'Partial rank correlation');
    line(svg, x(0), 106, x(0), 348, { stroke: muted });
    var names = ['β · occupancy-to-radius', 'L₂,ss · untreated C4-HSL', 'h · feedback exponent', 'K₂ · rhl activation constant'];
    ['beta', 'L2_ss', 'h', 'K2'].forEach(function (parameter, i) {
      var y = 136 + i * 59;
      label(svg, 24, y + 4, names[i], { 'font-size': 14 });
      ['fold_50', 'fold_90'].forEach(function (output, j) {
        var r = data.sensitivity.find(function (p) { return p.parameter === parameter && p.output === output; });
        var yy = y + (j ? 9 : -9), colour = j ? orange : blue;
        line(svg, x(0), yy, x(r.prcc), yy, { stroke: colour, 'stroke-width': 3 });
        point(svg, x(r.prcc), yy, colour);
        label(svg, x(r.prcc) + (r.prcc < 0 ? -9 : 9), yy + 4, r.prcc.toFixed(2), { 'text-anchor': r.prcc < 0 ? 'end' : 'start', 'font-size': 12, fill: colour });
      });
    });
    return svg;
  }

  var dialog;
  function expandButton(container, svg) {
    if (typeof HTMLDialogElement === 'undefined') return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'md-chart-expand';
    button.textContent = 'Expand figure';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', 'Expand: ' + svg.querySelector('title').textContent);
    container.after(button);
    button.addEventListener('click', function () {
      if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.className = 'md-chart-dialog';
        dialog.setAttribute('data-lenis-prevent', '');
        var close = document.createElement('button');
        close.type = 'button'; close.className = 'md-chart-close'; close.textContent = 'Close figure';
        close.addEventListener('click', function () { dialog.close(); });
        var content = document.createElement('div'); content.className = 'md-chart-dialog-content';
        dialog.append(close, content);
        document.body.appendChild(dialog);
        dialog.addEventListener('close', function () { document.body.classList.remove('md-chart-dialog-open'); });
      }
      var copy = svg.cloneNode(true);
      // A modal copy needs distinct IDs so its accessible name stays local.
      copy.querySelectorAll('[id]').forEach(function (el) { el.id += '-expanded'; });
      copy.setAttribute('aria-labelledby', svg.getAttribute('aria-labelledby').split(' ').map(function (id) { return id + '-expanded'; }).join(' '));
      dialog.querySelector('.md-chart-dialog-content').replaceChildren(copy);
      dialog.setAttribute('aria-label', svg.querySelector('title').textContent);
      document.body.classList.add('md-chart-dialog-open');
      dialog.showModal();
    });
  }

  // Deep links open the target disclosure and any enclosing disclosures.
  function reveal(hash, scroll) {
    if (!hash || hash === '#') return;
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (_) { return; }
    var target = document.getElementById(id);
    if (!target || !host.contains(target)) return;
    var el = target;
    while (el && el !== host) {
      if (el.tagName === 'DETAILS') el.open = true;
      el = el.parentElement;
    }
    if (scroll) requestAnimationFrame(function () { target.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }
  document.addEventListener('click', function (event) {
    var a = event.target.closest('a[href^="#"]');
    if (!a || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    reveal(a.hash, false);
  });
  window.addEventListener('hashchange', function () { reveal(location.hash, true); });
  reveal(location.hash, false);

  var renderers = { effects: effects, predictions: predictions, budget: budget, doses: doses, sensitivity: sensitivity };
  fetch(host.getAttribute('data-chart-source')).then(function (response) {
    if (!response.ok) throw new Error('Chart data unavailable');
    return response.json();
  }).then(function (data) {
    host.querySelectorAll('[data-md-chart]').forEach(function (container) {
      var svg = renderers[container.getAttribute('data-md-chart')](data);
      container.setAttribute('data-lenis-prevent', '');
      container.replaceChildren(svg);
      expandButton(container, svg);
    });
    host.setAttribute('data-charts-ready', 'true');
  }).catch(function () {
    // Keep the numerical text fallback and the main HTML tables readable.
    host.setAttribute('data-charts-ready', 'false');
  });
})();
