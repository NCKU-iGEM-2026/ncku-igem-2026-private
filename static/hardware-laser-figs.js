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

    /* 0917_漂移測試.csv: F3 of one sample left in place, relative to the first batch.
       "after" = after the light path was adjusted; "before" = before. Minutes since the first batch. */
    drift: function (host) {
      var after = [[0,1],[2.86,.990114],[5.72,.988773],[8.57,.990114],[11.46,.988606],[14.32,.991538],[17.28,.990952],[20.46,.991287],[23.32,.993968],[26.18,.994052],[29.03,.994638],[31.89,.995476],[34.75,.995392],[37.61,.996314],[40.46,.993214],[43.32,.995141],[46.18,.992962],[49.04,.991622],[51.89,.991119],[54.75,.990784],[57.61,.989276]];
      var before = [[0,1],[2.91,1.025332],[7.09,1.023958],[9.5,1.051045],[12.41,.878529],[15.34,.951091],[17.88,.891653],[20.8,.672135],[23.24,.611781],[26.52,.590111],[28.56,.58767],[31.13,.594079],[33.64,.643522],[36.65,.610255],[40.61,.573325],[43.51,.56539],[45.64,.539066],[48.22,.64398],[51.07,.585686],[53.98,.59324],[56.55,.608576],[59.22,.638639]];
      var beforeLate = [[73.78,.583092],[76.04,.530978],[79.68,.471616],[81.72,.450175],[84.21,.450023]];
      legend(host, [[C.green, 'After adjusting the light path'], [C.red, 'Before']]);
      var W = 680, H = 290, L = 52, R = 16, T = 14, B = 46, pw = W - L - R, ph = H - T - B;
      function X(v) { return L + v / 86 * pw; }
      function Y(v) { return T + ph - (v - 0.4) / 0.7 * ph; }
      var s = svg(host, W, H, 'Reading of one undisturbed sample over time. Before the adjustment it falls to about half; after it stays within about one percent for an hour.');
      [0.4, 0.6, 0.8, 1.0].forEach(function (v) {
        el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: C.rule, 'stroke-dasharray': v === 1 ? '' : '3 4' }, s);
        text(s, Math.round(v * 100) + '%', L - 8, Y(v) + 4, { anchor: 'end', size: 10 });
      });
      [0, 20, 40, 60, 80].forEach(function (v) { text(s, v, X(v), T + ph + 17, { size: 10 }); });
      text(s, 'Minutes', L + pw / 2, H - 6, { size: 10 });
      path(s, before, X, Y, C.red, 1.8); dots(s, before, X, Y, C.red, 2.6);
      path(s, beforeLate, X, Y, C.red, 1.8); dots(s, beforeLate, X, Y, C.red, 2.6);
      path(s, after, X, Y, C.green, 2.2); dots(s, after, X, Y, C.green, 2.6);
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
      var s = svg(host, W, H, 'Net F5/F3 signal against the fraction of GFP cells. The seven tubes rise along a straight line, r squared about 0.97.');
      [0, 20, 40, 60].forEach(function (v) {
        el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: C.rule, 'stroke-dasharray': v === 0 ? '' : '3 4' }, s);
        text(s, v, L - 8, Y(v) + 4, { anchor: 'end', size: 10 });
      });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { text(s, v.toFixed(2), X(v), T + ph + 17, { size: 10 }); });
      text(s, 'Fraction of GFP cells, f', L + pw / 2, H - 6, { size: 10 });
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
      var s = svg(host, W, H, 'Difference spectrum, GFP minus no GFP: a single peak at 515 nanometres falling steadily toward the red, near zero at 415 nanometres.');
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
      legend(host, [[C.green, 'Cuvette lifted out and put back (2026-09-20)'], [C.amber, 'LED lead knocked, board rebooted (2026-09-22)']]);
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
