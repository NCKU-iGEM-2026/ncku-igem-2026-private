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
   *   - the home page, whose tour and quiz are its own way in, and any page
   *     with a full-width band (see below);
   *   - a page with fewer than two headings, where a list has nothing to say.
   *
   * Without JavaScript there is no list, and nothing on the page is lost.
   * page-toc.css keeps it to wide screens, where there is room beside the page.
   */
  var host = document.querySelector("body > .container");
  if (!host || document.getElementById("siteTour") || document.querySelector(".edu-sidebar")) return;
  /* A band that runs the full width of the screen (the board game's story, the
     collaboration wall) would sit under the list, so those pages go without. */
  if (document.querySelector(".sgd, .story, .collab-wall")) return;

  var MIN = 2;
  var OFFSET = 130;          /* a heading counts as "reached" this far below the top */
  var aside = null, list = null, items = [], signature = "", ticking = false, pinned = null;

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
      if (h.closest("aside, nav, header, .modal, .tour, .quiz-pages")) return;
      var t = titleOf(h);
      if (!t) return;
      var id = h.id;
      if (!id) {
        var sec = h.closest("section[id]");
        id = sec ? sec.id : "";
      }
      if (!id) { id = slug(t, taken); h.id = id; }
      var target = document.getElementById(id) || h;
      target.style.scrollMarginTop = "104px";
      out.push({ id: id, title: t, el: h });
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
    var sig = found.map(function (f) { return f.id + "|" + f.title; }).join("\n");
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
    var p = document.createElement("p");
    p.className = "page-toc-title";
    p.textContent = "On this page";
    list = document.createElement("ol");
    list.className = "page-toc-list";
    items.forEach(function (f) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + f.id;
      a.textContent = f.title;
      li.appendChild(a);
      list.appendChild(li);
      f.link = a;
      a.addEventListener("click", function () { pinned = f; });
    });
    nav.appendChild(p);
    nav.appendChild(list);
    aside.appendChild(nav);
    host.classList.add("has-page-toc");
    mark();
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
    items.forEach(function (f) {
      var on = f === current;
      f.link.classList.toggle("is-active", on);
      if (on) f.link.setAttribute("aria-current", "location");
      else f.link.removeAttribute("aria-current");
    });
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
