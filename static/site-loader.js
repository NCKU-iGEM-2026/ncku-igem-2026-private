(function () {
  "use strict";

  var screen = document.getElementById("siteLoader");
  if (!screen) return;

  var done = false;

  var MIN_MS = 1050;
  var now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };
  var shownAt = now();
  if (window.requestAnimationFrame) requestAnimationFrame(function () { shownAt = now(); });

  screen.classList.add("is-watching");

  function finish() {
    if (done) return;
    done = true;
    screen.classList.add("is-done");
    screen.setAttribute("aria-busy", "false");
    window.setTimeout(function () {
      if (screen.parentNode) screen.parentNode.removeChild(screen);
    }, 450);
  }

  function visibleSince() {
    try {
      var all = screen.getAnimations ? screen.getAnimations({ subtree: true }) : [];
      for (var i = 0; i < all.length; i++) {
        var t = all[i].effect && all[i].effect.getTiming && all[i].effect.getTiming();
        if (t && t.iterations === Infinity && typeof all[i].currentTime === "number") {
          return now() - all[i].currentTime;
        }
      }
    } catch (e) { }
    return shownAt;
  }

  function loaded() {
    var wait = MIN_MS - (now() - visibleSince());
    if (wait > 0) window.setTimeout(finish, wait);
    else finish();
  }

  if (document.readyState === "complete") loaded();
  else window.addEventListener("load", loaded);

  window.addEventListener("pageshow", function (e) { if (e.persisted) finish(); });
})();
