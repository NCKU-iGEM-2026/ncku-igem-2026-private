(function () {
  "use strict";

  /* Human Practices, survey: each figure's table holds the numbers, and this
   * draws them as a donut with a legend beside it. The table stays in the page
   * for screen readers (and is what shows if this script does not run); the
   * drawing and the legend are hidden from them so nothing is read twice.
   *
   * Colour follows what the answers are, not their order on the page:
   *   nominal    unordered categories        the categorical slots 1..4
   *   ordinal    an ordered scale             one blue ramp, darker to lighter
   *   diverging  a 1-5 scale from no to yes   warm arm, grey middle, cool arm
   * Every palette was checked against the panel the figures sit on (#16323f)
   * with the data-viz validator: the categorical slots pass every check, and
   * each ramp and arm runs monotone in lightness with its lightest-on-dark end
   * at 2:1 or better; the grey middle is 3.8:1.
   */
  var PALETTES = {
    nominal: ["#3987e5", "#d95926", "#199e70", "#c98500"],
    ordinal: ["#1c5cab", "#2a78d6", "#5598e7", "#86b6ef", "#b7d3f6"],
    diverging: ["#d95926", "#f2a07e", "#7d8a8f", "#86b6ef", "#3987e5"]
  };
  var SURFACE = "#16323f";             /* the panel: also the 2px gap between slices */
  var INK_DARK = "#0e242e", INK_LIGHT = "#ffffff";
  var NS = "http://www.w3.org/2000/svg";
  var R = 100, R_IN = 55, LABEL_MIN = 0.09;   /* print a share on a slice of 9% or more */

  function lum(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  /* the ink that reads better on a slice's own colour */
  function inkFor(fill) {
    return contrast(fill, INK_LIGHT) >= contrast(fill, INK_DARK) ? INK_LIGHT : INK_DARK;
  }

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* one ring segment, clockwise from 12 o'clock */
  function arc(a0, a1) {
    var big = a1 - a0 > Math.PI ? 1 : 0;
    function pt(r, a) { return [r * Math.sin(a), -r * Math.cos(a)]; }
    if (a1 - a0 >= 2 * Math.PI - 1e-9) {        /* a whole ring */
      return "M0," + (-R) + "A" + R + "," + R + " 0 1 1 0," + R + "A" + R + "," + R + " 0 1 1 0," + (-R) +
             "M0," + (-R_IN) + "A" + R_IN + "," + R_IN + " 0 1 0 0," + R_IN + "A" + R_IN + "," + R_IN + " 0 1 0 0," + (-R_IN) + "Z";
    }
    var o0 = pt(R, a0), o1 = pt(R, a1), i1 = pt(R_IN, a1), i0 = pt(R_IN, a0);
    return "M" + o0 + "A" + R + "," + R + " 0 " + big + " 1 " + o1 +
           "L" + i1 + "A" + R_IN + "," + R_IN + " 0 " + big + " 0 " + i0 + "Z";
  }

  var tip = null;
  function tooltip() {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className = "hp-pie-tip";
    tip.setAttribute("aria-hidden", "true");
    tip.hidden = true;
    document.body.appendChild(tip);
    return tip;
  }
  function showTip(row, x, y) {
    var t = tooltip();
    t.innerHTML = "";
    var h = document.createElement("strong"); h.textContent = row.label; t.appendChild(h);
    var v = document.createElement("span");
    v.textContent = row.share + " · " + row.countText + " of " + row.total + " responses";
    t.appendChild(v);
    if (row.est) {
      var n = document.createElement("em");
      n.textContent = "Measured from the original chart, which left this slice unlabelled";
      t.appendChild(n);
    }
    t.hidden = false;
    var w = t.offsetWidth, hgt = t.offsetHeight;
    var left = Math.min(window.innerWidth - w - 8, Math.max(8, x + 14));
    var top = y - hgt - 12;
    if (top < 8) top = y + 18;
    t.style.left = left + "px";
    t.style.top = top + "px";
  }
  function hideTip() { if (tip) tip.hidden = true; }

  function draw(fig) {
    var table = fig.querySelector("table");
    if (!table) return;
    var kind = fig.getAttribute("data-pie") || "nominal";
    var colours = PALETTES[kind] || PALETTES.nominal;
    var total = parseFloat(fig.getAttribute("data-total")) || 0;

    var rows = Array.prototype.map.call(table.tBodies[0].rows, function (tr, i) {
      var cells = tr.cells;
      var countText = cells[1].textContent.trim();
      return {
        label: tr.cells[0].textContent.trim(),
        count: parseFloat(countText.replace(/[^\d.]/g, "")),
        countText: countText,
        share: cells[2].textContent.trim(),
        est: tr.hasAttribute("data-est"),
        colour: colours[i % colours.length]
      };
    });
    var sum = rows.reduce(function (s, r) { return s + r.count; }, 0);
    if (!total) total = sum;
    rows.forEach(function (r) { r.total = total; });

    var box = document.createElement("div");
    box.className = "hp-pie-chart";
    box.setAttribute("aria-hidden", "true");

    var svg = el("svg", { viewBox: "-104 -104 208 208", class: "hp-pie-svg", focusable: "false" }, box);
    var a = 0;
    rows.forEach(function (r) {
      var a1 = a + 2 * Math.PI * r.count / sum;
      var g = el("g", { class: "hp-pie-slice" + (r.est ? " is-est" : "") }, svg);
      r.path = el("path", { d: arc(a, a1), fill: r.colour, stroke: SURFACE, "stroke-width": 2, "stroke-linejoin": "round" }, g);
      if (r.count / sum >= LABEL_MIN) {
        var mid = (a + a1) / 2, rr = (R + R_IN) / 2;
        var t = el("text", { x: (rr * Math.sin(mid)).toFixed(1), y: (-rr * Math.cos(mid)).toFixed(1),
                             class: "hp-pie-pct", fill: inkFor(r.colour) }, g);
        t.textContent = r.share;
      }
      r.g = g;
      a = a1;
    });
    var c1 = el("text", { x: 0, y: -2, class: "hp-pie-total" }, svg); c1.textContent = String(total);
    var c2 = el("text", { x: 0, y: 18, class: "hp-pie-total-sub" }, svg); c2.textContent = "responses";

    var legend = document.createElement("ul");
    legend.className = "hp-pie-legend";
    rows.forEach(function (r) {
      var li = document.createElement("li");
      var sw = document.createElement("span"); sw.className = "hp-pie-swatch"; sw.style.background = r.colour;
      var name = document.createElement("span"); name.className = "hp-pie-name"; name.textContent = r.label;
      var val = document.createElement("span"); val.className = "hp-pie-val"; val.textContent = r.share;
      li.appendChild(sw); li.appendChild(name); li.appendChild(val);
      legend.appendChild(li);
      r.li = li;
    });
    box.appendChild(legend);

    /* hover: the slice and its legend row light up together, and the tooltip
       gives the count as well as the share */
    function on(r, ev) {
      fig.classList.add("is-focusing");
      rows.forEach(function (o) { o.g.classList.toggle("is-on", o === r); o.li.classList.toggle("is-on", o === r); });
      if (ev) showTip(r, ev.clientX, ev.clientY);
    }
    function off() {
      fig.classList.remove("is-focusing");
      rows.forEach(function (o) { o.g.classList.remove("is-on"); o.li.classList.remove("is-on"); });
      hideTip();
    }
    rows.forEach(function (r) {
      r.g.addEventListener("pointermove", function (ev) { on(r, ev); });
      r.g.addEventListener("pointerleave", off);
      r.li.addEventListener("pointermove", function (ev) { on(r, ev); });
      r.li.addEventListener("pointerleave", off);
    });

    fig.insertBefore(box, fig.firstChild);
    fig.classList.add("is-drawn");
  }

  Array.prototype.forEach.call(document.querySelectorAll(".hp-pie"), draw);
  window.addEventListener("scroll", hideTip, { passive: true });
})();
