(function () {
  "use strict";

  function named(hash) {
    var id = (hash || "").replace(/^#/, "");
    try { id = decodeURIComponent(id); } catch (e) { }
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
