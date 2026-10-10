(function () {
  "use strict";

  /* "On this page": a short list of the page's headings down the left side,
   * each a link that jumps to its section. Built from the h2s the page
   * already has, so a page is never out of step with its own contents and
   * nothing is written twice.
   *
   * Left out on purpose:
   *   - pages that carry their own sidebar (.edu-sidebar), which is the same
   *     thing already;
   *   - the home page, whose map of the wiki is its own way in, and any page
   *     with a full-width band (see below);
   *   - a page with fewer than two headings, where a list has nothing to say.
   *
   * Without JavaScript there is no list, and nothing on the page is lost.
   * page-toc.css keeps it to wide screens, where there is room beside the page.
   */
  var host = document.querySelector("body > .container");
  if (!host || document.getElementById("rxHeroStage") || document.querySelector(".edu-sidebar")) return;
  /* A band that runs the full width of the screen (the board game's story, the
     collaboration wall) would sit under the list, so those pages go without.
     Engineering's DBTL cycle stands in the same place and does the same job. */
  if (document.querySelector(".sgd, .story, .collab-wall, .eng-dbtl")) return;

  var MIN = 2;
  var OFFSET = 130;          /* a heading counts as "reached" this far below the top */
  var aside = null, list = null, items = [], signature = "", ticking = false, pinned = null;
  /* A page that is split into numbered parts can ask for them to be drawn as
     parts (data-toc-style="parts" anywhere on the page, the Software page for
     one): a numbered badge per part, the sections of the part being read on
     a rail under it, and a bar for how far down the page the reader is.
     Every other page keeps the plain list. */
  var parts = !!host.querySelector('[data-toc-style="parts"]'), bar = null;
  /* Each part's sections open with the part being read, unless the reader has
     opened or closed that part by hand (open: true / false), which then holds. */
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

  function collect() {
    var taken = {}, out = [];
    Array.prototype.forEach.call(host.querySelectorAll("h2"), function (h) {
      /* a heading you cannot see (a closed fold, a build that is not showing) is not one to jump to */
      if (!h.getClientRects().length) return;
      /* A page split into parts (the Model page) marks each part's banner with
         data-toc-group; its heading is listed as a group title even though it
         sits in a <header>. */
      var group = h.closest("[data-toc-group]");
      if (h.closest("aside, nav, .modal, .quiz-pages")) return;
      if (!group && h.closest("header")) return;
      /* data-toc-title gives a long heading a short name in the list */
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
        apart: !!(group && group.hasAttribute("data-toc-apart")) });
    });
    /* Headings that sit side by side (the team's columns) are not a sequence to
       jump along; a page laid out that way goes without. */
    var tops = out.map(function (f) { return f.el.getBoundingClientRect().top + window.pageYOffset; })
      .sort(function (x, y) { return x - y; });
    for (var i = 1; i < tops.length; i++) {
      if (tops[i] - tops[i - 1] < 60) return [];
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
    // This is the element that scrolls when the list is longer than the
    // viewport (max-height + overflow-y in page-toc.css). Lenis takes the
    // wheel over for the whole page and calls preventDefault on it unless the
    // pointer is inside something carrying this attribute, so without it a
    // long contents list -- the Lab Book's, for one -- cannot be scrolled at
    // all: the page scrolls instead and the tail of the list is unreachable.
    nav.setAttribute("data-lenis-prevent", "");
    var p = document.createElement("p");
    p.className = "page-toc-title";
    p.textContent = "On this page";
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
    if (parts) {
      aside.classList.add("is-parts");
      allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "page-toc-all";
      allBtn.addEventListener("click", function () {
        var anyClosed = partList.some(function (e) { return e.sub && !isOpen(e); });
        partList.forEach(function (e) { e.open = anyClosed; });
        applyOpen();
      });
      p.appendChild(allBtn);
      var track = document.createElement("div");
      track.className = "page-toc-progress";
      track.setAttribute("aria-hidden", "true");
      bar = document.createElement("span");
      track.appendChild(bar);
      nav.appendChild(track);
    }
    nav.appendChild(list);
    aside.appendChild(nav);
    host.classList.add("has-page-toc");
    mark();
  }

  /* Parts: each group heading opens an <li> holding its badge and title, and
     the sections after it go in a nested list on a rail. */
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
        no.textContent = f.no;
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
        /* a numbered section ("1.2 The workflow") keeps its number in a column of its own */
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
            /* the part's own open / close button, at the end of its line */
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
    /* at the very bottom the last heading may never get as far as the top */
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) {
      current = items[items.length - 1];
      /* on a short page a click on an early entry can only scroll as far as the bottom: keep the one that was clicked */
      if (pinned && pinned.el.getBoundingClientRect().top < window.innerHeight - 40) current = pinned;
    }
    var at = items.indexOf(current);
    items.forEach(function (f, i) {
      var on = f === current;
      f.link.classList.toggle("is-active", on);
      /* scrolled past already, as on the Human Practices sidebar */
      f.link.classList.toggle("is-passed", i < at);
      if (on) f.link.setAttribute("aria-current", "location");
      else f.link.removeAttribute("aria-current");
    });
    if (parts) {
      items.forEach(function (f) {
        if (f.part) f.part.classList.toggle("is-current", f.part === current.part);
      });
      applyOpen();
      var room = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (room > 0 ? Math.min(100, Math.max(0, window.pageYOffset / room * 100)) : 100) + "%";
    }
    /* keep the active entry in view when the list is longer than the screen */
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
  /* the pin is for the scroll a click causes; the reader's own scrolling lets it go */
  ["wheel", "touchstart", "keydown"].forEach(function (t) {
    window.addEventListener(t, function () { pinned = null; }, { passive: true });
  });
  /* a page that shows or hides sections (an opened fold, a build switch) fires resize; rebuild if its headings changed */
  window.addEventListener("resize", function () { build(); onScroll(); });
  window.addEventListener("load", function () { build(); onScroll(); });
})();
