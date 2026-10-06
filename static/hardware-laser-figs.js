/* Charts for the laser-cut build on the Hardware page (wiki/hardware-laser-cut.html).
   Every number below is copied from the team's measurement CSVs (2026-09-16 to 09-22);
   the source file is named above each array. No external library: plain SVG.
   Each chart draws into <div data-lc-chart="name">. */
(function () {
  'use strict';

  var C = { ink: '#33413a', mute: '#6b7a72', rule: '#dfe8e2', green: '#075a3e', blue: '#2a5fa8', amber: '#b0610f', red: '#a33a2a' };
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, s, x, y, o) {
    o = o || {};
    var t = el('text', { x: x, y: y, fill: o.fill || C.mute, 'font-size': o.size || 11,
      'text-anchor': o.anchor || 'middle', 'font-weight': o.weight || 400 }, parent);
    t.textContent = s;
    return t;
  }
  function svg(host, w, h, label) {
    var s = el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': label, width: '100%' });
    s.style.maxWidth = '100%'; s.style.height = 'auto'; s.style.display = 'block';
    host.appendChild(s);
    return s;
  }
  function path(s, pts, X, Y, color, width, dash) {
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    el('path', { d: d, fill: 'none', stroke: color, 'stroke-width': width || 2, 'stroke-linejoin': 'round', 'stroke-dasharray': dash || '' }, s);
  }
  function dots(s, pts, X, Y, color, r) {
    pts.forEach(function (p) { el('circle', { cx: X(p[0]), cy: Y(p[1]), r: r || 3, fill: color }, s); });
  }
  function legend(host, items) {
    var d = document.createElement('p');
    d.className = 'hw-aside';
    d.style.margin = '0 0 .4rem';
    d.innerHTML = items.map(function (it) {
      return '<span style="display:inline-block;margin-right:1rem"><span style="display:inline-block;width:.8em;height:.8em;border-radius:2px;margin-right:.35em;vertical-align:-1px;background:' + it[0] + '"></span>' + it[1] + '</span>';
    }).join('');
    host.appendChild(d);
  }

  var charts = {

    /* 0917_逐筆.csv: the stability test, chamber empty, sensor still in its original low position, nothing moved for an hour. Each point is the mean F3 of readings
       2–5 of a batch (the first reading of each batch is discarded, as in every other result),
       relative to the first batch. Minutes since the first batch. */
    drift: function (host) {
      var pts = [[0,1.00000],[2.86,0.99576],[5.72,0.99597],[8.57,0.99653],[11.46,0.99387],[14.32,0.99803],[17.28,0.99762],[20.46,0.99905],[23.32,1.00171],[26.18,1.00199],[29.03,1.00262],[31.89,1.00308],[34.75,1.00357],[37.61,1.00373],[40.46,1.00067],[43.32,1.00078],[46.18,0.99931],[49.04,0.99846],[51.89,0.99822],[54.75,0.99708],[57.61,0.99528]];
      legend(host, [[C.green, 'Empty chamber, nothing moved: mean of readings 2–5 of each batch']]);
      var W = 680, H = 270, L = 52, R = 16, T = 14, B = 46, pw = W - L - R, ph = H - T - B;
      function X(v) { return L + v / 60 * pw; }
      function Y(v) { return T + ph - (v - 0.97) / 0.06 * ph; }
      var s = svg(host, W, H, 'Blue channel with the chamber empty and nothing moved, over an hour. All 21 batches lie within a one percent band.');
      el('rect', { x: L, y: Y(1.0037), width: pw, height: Y(0.9939) - Y(1.0037), fill: C.green, opacity: 0.08 }, s);
      [0.97, 0.98, 0.99, 1.0, 1.01, 1.02, 1.03].forEach(function (v) {
        el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: C.rule, 'stroke-dasharray': v === 1 ? '' : '3 4' }, s);
        text(s, Math.round(v * 100) + '%', L - 8, Y(v) + 4, { anchor: 'end', size: 10 });
      });
      [0, 15, 30, 45, 60].forEach(function (v) { text(s, v, X(v), T + ph + 17, { size: 10 }); });
      text(s, 'Minutes', L + pw / 2, H - 6, { size: 10 });
      path(s, pts, X, Y, C.green, 2.2); dots(s, pts, X, Y, C.green, 2.8);
    },

    /* 0916_菌液初測.csv, the 28 batches with an OD600 record, in the order measured.
       Fit: ln F3 = a + b·OD600 + s·[batch ≥ 8]  (b = 0.066, s = −0.517, R² 0.88).
       Each point is F3 corrected to the mean OD600 (divided by exp(b·(OD600 − mean))),
       relative to the fitted level before the step. After the step the fit is exp(s) = 0.596. */
    step: function (host) {
      var pts = [[1,1.037],[2,1.055],[3,0.975],[4,1.059],[6,0.959],[7,0.923],[8,0.691],[9,0.626],[10,0.621],[11,0.620],[12,0.586],[13,0.643],[14,0.589],[15,0.571],[16,0.584],[17,0.556],[18,0.653],[19,0.592],[20,0.571],[21,0.634],[22,0.626],[23,0.617],[24,0.644],[25,0.612],[26,0.564],[27,0.449],[28,0.578],[29,0.542]];
      var post = 0.596;
      legend(host, [[C.blue, 'Each batch, corrected for culture density'], [C.green, 'Best single-step fit']]);
      var W = 680, H = 280, L = 52, R = 16, T = 14, B = 46, pw = W - L - R, ph = H - T - B;
      function X(v) { return L + (v - 0.5) / 29 * pw; }
      function Y(v) { return T + ph - (v - 0.4) / 0.75 * ph; }
      var s = svg(host, W, H, 'Density-corrected blue channel in the first culture test. It sits near 100% for the first seven batches, then drops by about 40% to near 60% and stays there.');
      [0.4, 0.6, 0.8, 1.0].forEach(function (v) {
        el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: C.rule, 'stroke-dasharray': v === 1 ? '' : '3 4' }, s);
        text(s, Math.round(v * 100) + '%', L - 8, Y(v) + 4, { anchor: 'end', size: 10 });
      });
      el('line', { x1: X(7.5), x2: X(7.5), y1: T, y2: T + ph, stroke: C.mute, 'stroke-dasharray': '4 4' }, s);
      text(s, '−40%', X(7.5) + 6, Y(0.8), { anchor: 'start', size: 11, fill: C.green, weight: 600 });
      path(s, [[0.6, 1], [7.5, 1], [7.5, post], [29.4, post]], X, Y, C.green, 2);
      dots(s, pts, X, Y, C.blue, 3.4);
      [1, 5, 10, 15, 20, 25, 29].forEach(function (v) { text(s, v, X(v), T + ph + 17, { size: 10 }); });
      text(s, 'Batch, in the order measured', L + pw / 2, H - 6, { size: 10 });
    },

    /* 0922_批次.csv: net signal = (F5/F3 of the tube − F5/F3 of the N tube) × 1000, averaged per tube.
       Fit through the origin over the 7 tubes with f > 0: slope 68.1. */
    dose: function (host) {
      var pts = [[0.10,4.88],[0.15,14.86],[0.20,14.38],[0.30,24.46],[0.50,30.85],[0.75,46.29],[1.00,71.33]];
      var slope = 68.1;
      legend(host, [[C.blue, 'Each tube (mean of its batches)'], [C.green, 'Fit through the origin, 7 tubes']]);
      var W = 680, H = 300, L = 52, R = 18, T = 14, B = 48, pw = W - L - R, ph = H - T - B;
      function X(v) { return L + v / 1.05 * pw; }
      function Y(v) { return T + ph - v / 78 * ph; }
      var s = svg(host, W, H, 'Net F5/F3 signal against the fraction of sfGFP cells. The seven tubes rise along a straight line, r squared about 0.97.');
      [0, 20, 40, 60].forEach(function (v) {
        el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: C.rule, 'stroke-dasharray': v === 0 ? '' : '3 4' }, s);
        text(s, v, L - 8, Y(v) + 4, { anchor: 'end', size: 10 });
      });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { text(s, v.toFixed(2), X(v), T + ph + 17, { size: 10 }); });
      text(s, 'Fraction of sfGFP cells, f', L + pw / 2, H - 6, { size: 10 });
      text(s, 'Net F5/F3 × 1000', L - 8, T - 2 + 10, { anchor: 'start', size: 10 });
      el('line', { x1: X(0), y1: Y(0), x2: X(1), y2: Y(slope), stroke: C.green, 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }, s);
      dots(s, pts, X, Y, C.blue, 4.2);
      text(s, 'r² ≈ 0.97', X(0.08), Y(58), { anchor: 'start', size: 12, fill: C.green, weight: 600 });
    },

    /* 0920_逐筆.csv: for each turbidity d, (F/F3 at f = 1) − (F/F3 at f = 0), normalised to its peak. */
    spectrum: function (host) {
      var lbl = ['F1','F2','F3','F4','F5','F6','F7','F8'], wl = [415,445,480,515,555,590,630,680];
      var groups = [
        [-0.02,0.18,0.00,1.00,0.45,0.11,0.03,0.01],
        [ 0.02,0.07,0.00,1.00,0.39,0.10,0.06,-0.01],
        [ 0.02,1.00,0.00,0.84,0.40,0.13,0.09,0.08],
        [ 0.13,0.04,0.00,1.00,0.48,0.20,0.13,0.08]
      ];
      var mean = [0.04,0.32,0.00,0.96,0.43,0.14,0.08,0.04];
      legend(host, [[C.green, 'Mean of the four turbidities'], [C.blue, 'Each turbidity, d = 1.00 / 0.75 / 0.50 / 0.25']]);
      var W = 680, H = 300, L = 48, R = 18, T = 18, B = 54, pw = W - L - R, ph = H - T - B;
      function X(i) { return L + pw * i / 7; }
      function Y(v) { return T + ph - (v + 0.15) / 1.27 * ph; }
      var s = svg(host, W, H, 'Difference spectrum, sfGFP minus no sfGFP: a single peak at 515 nanometres falling steadily toward the red, near zero at 415 nanometres.');
      el('rect', { x: X(1) - 14, y: T, width: 28, height: ph, fill: C.mute, opacity: 0.09 }, s);
      text(s, 'unreliable', X(1), T + 11, { size: 9 });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: C.rule, 'stroke-dasharray': v === 0 ? '' : '3 4' }, s);
        text(s, v.toFixed(2), L - 8, Y(v) + 4, { anchor: 'end', size: 10 });
      });
      groups.forEach(function (g) {
        path(s, g.map(function (v, i) { return [i, v]; }), X, Y, C.blue, 1.2);
      });
      var m = mean.map(function (v, i) { return [i, v]; });
      path(s, m, X, Y, C.green, 2.6); dots(s, m, X, Y, C.green, 4);
      text(s, 'peak at 515 nm', X(3), Y(1) - 10, { size: 10.5, fill: C.green, weight: 600 });
      lbl.forEach(function (c, i) {
        text(s, c, X(i), T + ph + 18, { size: 10.5, fill: C.ink });
        text(s, wl[i], X(i), T + ph + 31, { size: 9.5 });
      });
      text(s, 'Channel (centre wavelength, nm)', L + pw / 2, H - 4, { size: 10 });
    },

    /* Per-channel change in two events, each divided by the mean change across the nine channels.
       Cuvette: 0920_逐筆.csv, the same blank lifted out and put back (batches 22–23 vs 26–27).
       LED: 0922_逐筆.csv, the first batch after the LED lead was knocked and the board rebooted, vs the next batch. */
    flatness: function (host) {
      var lbl = ['F1','F2','F3','F4','F5','F6','F7','F8','Clear'], wl = ['415','445','480','515','555','590','630','680',''];
      var cuvPct = [20.38,14.38,14.05,14.82,17.35,18.96,18.16,16.11,15.91];
      var led = [0.12,0.30,0.30,0.19,0.17,0.12,0.17,0.23,0.30];
      function norm(a) { var m = a.reduce(function (s, v) { return s + v; }, 0) / a.length; return a.map(function (v) { return v / m; }); }
      var A = norm(cuvPct.map(function (p) { return 1 + p / 100; })), Bv = norm(led);
      legend(host, [[C.green, 'Cuvette lifted out and put back (the grid)'], [C.amber, 'LED lead knocked, board rebooted (the linearity series)']]);
      var W = 680, H = 290, L = 48, R = 16, T = 14, B = 52, pw = W - L - R, ph = H - T - B;
      function X(i) { return L + pw * (i + 0.5) / 9; }
      function Y(v) { return T + ph - (v - 0.4) / 1.2 * ph; }
      var s = svg(host, W, H, 'Change in each channel relative to the nine-channel mean. Putting the cuvette back moves every channel together within five percent; the LED event moves them by different amounts, a factor of 2.5 apart.');
      el('rect', { x: L, y: Y(1.05), width: pw, height: Y(0.95) - Y(1.05), fill: C.green, opacity: 0.1 }, s);
      [0.5, 0.75, 1, 1.25, 1.5].forEach(function (v) {
        el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: C.rule, 'stroke-dasharray': v === 1 ? '' : '3 4' }, s);
        text(s, v.toFixed(2), L - 8, Y(v) + 4, { anchor: 'end', size: 10 });
      });
      var a = A.map(function (v, i) { return [i, v]; }), b = Bv.map(function (v, i) { return [i, v]; });
      path(s, b, X, Y, C.amber, 2); dots(s, b, X, Y, C.amber, 3.4);
      path(s, a, X, Y, C.green, 2); dots(s, a, X, Y, C.green, 3.4);
      lbl.forEach(function (c, i) {
        text(s, c, X(i), T + ph + 18, { size: 10.5, fill: C.ink });
        text(s, wl[i], X(i), T + ph + 31, { size: 9.5 });
      });
      text(s, 'Relative to the nine-channel mean (shaded band: ±5%)', L + pw / 2, H - 4, { size: 10 });
    }
  };

  function init() {
    var hosts = document.querySelectorAll('[data-lc-chart]');
    for (var i = 0; i < hosts.length; i++) {
      var h = hosts[i], fn = charts[h.getAttribute('data-lc-chart')];
      if (fn && !h.getAttribute('data-lc-done')) { fn(h); h.setAttribute('data-lc-done', '1'); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
