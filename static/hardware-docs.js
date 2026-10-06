(function () {
  "use strict";

  /* Hardware page — links into the folded tables.
   *
   * The tables behind each section sit folded at the end of the build, under
   * "Data and documentation", and the sections link to them. A link that
   * lands on a closed fold would show its title and nothing else, so this
   * opens the fold a link points at (or the fold around what it points at)
   * before the browser jumps there. The same on arrival with an address that
   * names one, and on Back and Forward.
   *
   * Without this file the links still land on the right row; it stays shut
   * until it is opened by hand.
   */

  function named(hash) {
    var id = (hash || "").replace(/^#/, "");
    try { id = decodeURIComponent(id); } catch (e) { /* keep it as written */ }
    return id ? document.getElementById(id) : null;
  }

  function open(el) {
    var changed = false;
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (n.tagName === "DETAILS" && !n.open) { n.open = true; changed = true; }
    }
    return changed;
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href^="#"]');
    var el = a && named(a.getAttribute("href"));
    if (el) open(el);
  });

  function arrive() {
    var el = named(location.hash);
    if (el && open(el)) el.scrollIntoView();
  }

  arrive();
  window.addEventListener("hashchange", arrive);
})();
