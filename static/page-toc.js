(function () {
  "use strict";

  var host = document.querySelector("body > .container");
  if (!host || document.getElementById("rxHeroStage") || document.querySelector(".edu-sidebar")) return;
  if (document.querySelector(".sgd, .story, .collab-wall, .eng-dbtl")) return;

  var MIN = 2;
  var OFFSET = 130;
  var LINES = "M4 4.5h8M4 8h8M4 11.5h5";
  var ICONS = { summary: LINES, refs: LINES };
  var aside = null, list = null, items = [], signature = "", ticking = false, pinned = null;
  var parts = !!host.querySelector('[data-toc-style="parts"]'), bar = null;
  var partList = [], allBtn = null;

  function titleOf(h) {
    var c = h.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll(".visually-hidden, .sr-only"), function (n) { n.remove(); });
    return c.textContent.replace(/\s+/g, " ").trim();
  }

  function slug(t, taken) {
    var s = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!s) s = "section";
    var id = s, n = 2;
    while (taken[id] || document.getElementById(id)) id = s + "-" + n++;
    taken[id] = true;
    return id;
  }

  var depth3 = !!host.querySelector('[data-toc-depth="3"]');

  function collect() {
    var taken = {}, out = [];
    Array.prototype.forEach.call(host.querySelectorAll(depth3 ? "h2, h3" : "h2"), function (h) {
      if (!h.getClientRects().length) return;
      var group = h.closest("[data-toc-group]");
      if (h.closest("aside, nav, .modal, .quiz-pages")) return;
      if (!group && h.closest("header")) return;
      var t = h.getAttribute("data-toc-title") || titleOf(h);
      if (!t) return;
      var id = h.id;
      if (!id) {
        var sec = group && group.id ? group : h.closest("section[id]");
        id = sec ? sec.id : "";
      }
      if (!id) { id = slug(t, taken); h.id = id; }
      var target = document.getElementById(id) || h;
      target.style.scrollMarginTop = "104px";
      out.push({ id: id, title: t, el: h, group: !!group,
        no: group ? group.getAttribute("data-toc-no") || "" : "",
        icon: group ? group.getAttribute("data-toc-icon") || "" : "",
        apart: !!(group && group.hasAttribute("data-toc-apart")) });
    });
    var levels = {};
    out.forEach(function (f) {
      var k = f.el.tagName;
      (levels[k] = levels[k] || []).push(f.el.getBoundingClientRect().top + window.pageYOffset);
    });
    for (var k in levels) {
      var tops = levels[k].sort(function (x, y) { return x - y; });
      for (var i = 1; i < tops.length; i++) {
        if (tops[i] - tops[i - 1] < 60) return [];
      }
    }
    return out;
  }

  function build() {
    var found = collect();
    var sig = found.map(function (f) { return f.id + "|" + f.title + (f.group ? "|g" : ""); }).join("\n");
    if (sig === signature) return;
    signature = sig;
    items = found;

    if (items.length < MIN) {
      items = [];
      if (aside) { aside.remove(); aside = null; }
      host.classList.remove("has-page-toc");
      return;
    }

    if (!aside) {
      aside = document.createElement("aside");
      aside.className = "page-toc";
      aside.setAttribute("aria-label", "On this page");
      host.appendChild(aside);
    }
    aside.textContent = "";
    var nav = document.createElement("nav");
    nav.className = "page-toc-inner";
    nav.setAttribute("data-lenis-prevent", "");
    var p = document.createElement("p");
    p.className = "page-toc-title";
    list = document.createElement("ol");
    list.className = "page-toc-list";
    if (parts) buildParts(); else items.forEach(function (f) {
      var li = document.createElement("li");
      if (f.group) li.className = "page-toc-group";
      var a = document.createElement("a");
      a.href = "#" + f.id;
      a.textContent = f.title;
      li.appendChild(a);
      list.appendChild(li);
      f.link = a;
      a.addEventListener("click", function () { pinned = f; });
    });
    nav.appendChild(p);
    aside.classList.add(parts ? "is-parts" : "is-rail");
    if (parts) {
      allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "page-toc-all";
      allBtn.addEventListener("click", function () {
        var anyClosed = partList.some(function (e) { return e.sub && !isOpen(e); });
        partList.forEach(function (e) { e.open = anyClosed; });
        applyOpen();
      });
      p.appendChild(allBtn);
    }
    var track = document.createElement("div");
    track.className = "page-toc-progress";
    track.setAttribute("aria-hidden", "true");
    bar = document.createElement("span");
    track.appendChild(bar);
    nav.appendChild(track);
    nav.appendChild(list);
    aside.appendChild(nav);
    host.classList.add("has-page-toc");
    place();
    mark();
  }

  function place() {
    if (!aside) return;
    var start = host.querySelector("[data-toc-start]");
    if (!start) { aside.style.top = ""; return; }
    var bar = aside.querySelector(".page-toc-progress");
    var shift = bar ? bar.offsetTop : 0;
    aside.style.top = (start.getBoundingClientRect().top - host.getBoundingClientRect().top - shift) + "px";
  }

  function isOpen(e) {
    return e.open !== null ? e.open : e.li.classList.contains("is-current");
  }

  function applyOpen() {
    var anyClosed = false;
    partList.forEach(function (e) {
      if (!e.sub) return;
      var open = isOpen(e);
      if (!open) anyClosed = true;
      e.li.classList.toggle("is-open", open);
      e.btn.setAttribute("aria-expanded", open ? "true" : "false");
      e.btn.setAttribute("aria-label", (open ? "Hide" : "Show") + " the sections of " + e.name);
    });
    if (allBtn) allBtn.textContent = anyClosed ? "Expand all" : "Collapse all";
  }

  function buildParts() {
    var sub = null, partLi = null, entry = null;
    partList = [];
    items.forEach(function (f) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + f.id;
      if (f.group) {
        li.className = "page-toc-part" + (f.apart ? " is-apart" : "");
        a.className = "page-toc-part-head";
        var no = document.createElement("span");
        no.className = "page-toc-no";
        no.setAttribute("aria-hidden", "true");
        if (ICONS[f.icon]) no.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICONS[f.icon] + '"/></svg>';
        else no.textContent = f.no;
        var name = document.createElement("span");
        name.textContent = f.title;
        a.appendChild(no);
        a.appendChild(name);
        var row = document.createElement("div");
        row.className = "page-toc-part-row";
        row.appendChild(a);
        li.appendChild(row);
        list.appendChild(li);
        partLi = li;
        sub = null;
        entry = { li: li, row: row, sub: null, btn: null, open: null, name: f.title };
        partList.push(entry);
      } else {
        var m = /^(\d+(?:\.\d+)*)\s+(.+)$/.exec(f.title);
        if (m) {
          var sec = document.createElement("span");
          sec.className = "page-toc-sec";
          sec.textContent = m[1];
          a.appendChild(sec);
          a.appendChild(document.createTextNode(m[2]));
        } else {
          a.textContent = f.title;
        }
        li.appendChild(a);
        if (partLi) {
          if (!sub) {
            sub = document.createElement("ol");
            sub.className = "page-toc-sub";
            sub.id = "page-toc-sub-" + partList.length;
            partLi.appendChild(sub);
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "page-toc-toggle";
            btn.setAttribute("aria-controls", sub.id);
            btn.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>';
            (function (e) {
              btn.addEventListener("click", function () { e.open = !isOpen(e); applyOpen(); });
            })(entry);
            entry.row.appendChild(btn);
            entry.sub = sub;
            entry.btn = btn;
          }
          sub.appendChild(li);
        } else {
          list.appendChild(li);
        }
      }
      f.link = a;
      f.part = partLi;
      a.addEventListener("click", function () { pinned = f; });
    });
  }

  function mark() {
    ticking = false;
    if (!items.length) return;
    var current = items[0];
    for (var i = 0; i < items.length; i++) {
      if (items[i].el.getBoundingClientRect().top <= OFFSET) current = items[i];
    }
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) {
      current = items[items.length - 1];
      if (pinned && pinned.el.getBoundingClientRect().top < window.innerHeight - 40) current = pinned;
    }
    var room = document.documentElement.scrollHeight - window.innerHeight;
    var at = items.indexOf(current);
    items.forEach(function (f, i) {
      var on = f === current;
      f.link.classList.toggle("is-active", on);
      f.link.classList.toggle("is-passed", i < at);
      if (on) f.link.setAttribute("aria-current", "location");
      else f.link.removeAttribute("aria-current");
    });
    if (parts) {
      items.forEach(function (f) {
        if (f.part) f.part.classList.toggle("is-current", f.part === current.part);
      });
      applyOpen();
    }
    if (bar) bar.style.width = (room > 0 ? Math.min(100, Math.max(0, window.pageYOffset / room * 100)) : 100) + "%";
    var a = current.link, l = list;
    if (l && l.scrollHeight > l.clientHeight) {
      if (a.offsetTop < l.scrollTop) l.scrollTop = a.offsetTop - 8;
      else if (a.offsetTop + a.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = a.offsetTop + a.offsetHeight - l.clientHeight + 8;
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(mark);
  }

  build();
  window.addEventListener("scroll", onScroll, { passive: true });
  ["wheel", "touchstart", "keydown"].forEach(function (t) {
    window.addEventListener(t, function () { pinned = null; }, { passive: true });
  });
  window.addEventListener("resize", function () { build(); place(); onScroll(); });
  window.addEventListener("load", function () { build(); place(); onScroll(); });
})();
