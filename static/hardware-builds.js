(function () {
  "use strict";

  /* Hardware page — one build at a time.
   *
   * The page documents two readers. Both are in the markup, one after the
   * other, and each card under "The two builds" ends in a link to its build.
   * That is the whole page without this file.
   *
   * With it, one build is shown at a time and a card swaps which. The address
   * keeps up (#printed, #laser-cut), and a link to anything inside the build
   * that is not showing brings that build back first, so no link into the
   * page lands on something hidden.
   */

  var picker = document.querySelector("[data-hw-pick]");
  if (!picker) return;

  var builds = Array.prototype.slice.call(picker.querySelectorAll("[data-build]"))
    .map(function (card) {
      var panel = document.getElementById(card.getAttribute("data-build"));
      return panel && { card: card, panel: panel, go: card.querySelector(".hw-pick-go") };
    })
    .filter(Boolean);
  if (builds.length < 2) return;

  var root = document.documentElement;
  var shown = null;

  function show(build) {
    if (build === shown) return;
    shown = build;
    builds.forEach(function (b) {
      var on = b === build;
      b.panel.hidden = !on;
      b.card.classList.toggle("is-on", on);
      if (b.go) {
        if (on) b.go.setAttribute("aria-current", "true");
        else b.go.removeAttribute("aria-current");
      }
    });
    /* A panel that sizes itself had no size to measure while it was hidden. */
    try { window.dispatchEvent(new Event("resize")); } catch (e) { /* old browser: it keeps its size */ }
  }

  function owner(el) {
    for (var i = 0; i < builds.length; i++) {
      if (builds[i].panel === el || builds[i].panel.contains(el)) return builds[i];
    }
    return null;
  }

  function named(hash) {
    var id = hash.replace(/^#/, "");
    try { id = decodeURIComponent(id); } catch (e) { /* keep it as written */ }
    return id ? document.getElementById(id) : null;
  }

  /* The site scrolls smoothly, and one build can be ten screens long. Going
     from one build into the other is a change of page in all but name, so
     the scroll that follows a swap goes straight there. */
  var calm = 0;
  function straight() {
    root.style.scrollBehavior = "auto";
    clearTimeout(calm);
    calm = setTimeout(function () { root.style.scrollBehavior = ""; }, 400);
  }

  /* The address names a build, or something inside one: on arrival, and on
     Back and Forward. */
  function follow() {
    var el = named(location.hash);
    var build = el && owner(el);
    if (!build) return false;
    if (build !== shown) {
      show(build);
      straight();
      el.scrollIntoView();
    }
    return true;
  }

  function plain(e) {
    return !(e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);
  }

  builds.forEach(function (b) {
    b.card.addEventListener("click", function (e) {
      if (!plain(e)) return;
      var link = e.target.closest ? e.target.closest("a, button") : null;
      if (link && link !== b.go) return;          /* a link that leads elsewhere */
      e.preventDefault();
      show(b);
      if (history.replaceState) history.replaceState(null, "", "#" + b.panel.id);
    });
  });

  /* Any other link into the build that is hidden: show it first, and the
     browser's own jump then has something to land on. */
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || !e.target.closest || !plain(e)) return;
    var a = e.target.closest('a[href^="#"]');
    var el = a && named(a.getAttribute("href"));
    var build = el && owner(el);
    if (!build || build === shown) return;
    show(build);
    straight();
  });

  picker.classList.add("is-live");
  if (!follow()) show(builds[0]);
  window.addEventListener("hashchange", follow);
})();
