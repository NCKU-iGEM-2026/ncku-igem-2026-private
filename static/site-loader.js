(function () {
  "use strict";

  /* Takes the loading screen away once the page has loaded. See the comment
   * at the top of site-loader.css for what counts as loaded and why.
   *
   * Loaded straight after the screen's own markup at the top of <body>, and
   * deliberately tiny, so it is listening before anything else on the page
   * can go wrong.
   */
  var screen = document.getElementById("siteLoader");
  if (!screen) return;

  var done = false;

  /* The AHL ring turns for at least this long, however fast the page loads:
     a page out of the cache would otherwise flash the screen for a moment and
     take it away before the ring had gone round. Counted from the first frame
     the screen is drawn in, which is when the ring starts to turn. */
  var MIN_MS = 1050;           /* a hair over a second, so it is never just under */
  var now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };
  var shownAt = now();
  if (window.requestAnimationFrame) requestAnimationFrame(function () { shownAt = now(); });

  /* the stylesheet's own 4-second fallback is for when this script never
     arrives; now that it has, the screen stays until the page has loaded */
  screen.classList.add("is-watching");

  function finish() {
    if (done) return;
    done = true;
    screen.classList.add("is-done");
    screen.setAttribute("aria-busy", "false");
    /* out of the page once the fade is over, so nothing is left sitting
       over the content */
    window.setTimeout(function () {
      if (screen.parentNode) screen.parentNode.removeChild(screen);
    }, 450);
  }

  /* When the screen really came up. Its animations start on the very first
     frame the screen is painted, which can be before this script has arrived
     (the browser may paint the markup above while it fetches this file), so an
     animation's own clock is the honest measure. It has to be one that never
     ends -- the bacterium's drift or the ring -- because a finished animation's
     clock stops at its length (the 0.25s fade-in would always say 250ms). The
     first frame this script saw is the fallback, and what is used when reduced
     motion has switched the animations off. */
  function visibleSince() {
    try {
      var all = screen.getAnimations ? screen.getAnimations({ subtree: true }) : [];
      for (var i = 0; i < all.length; i++) {
        var t = all[i].effect && all[i].effect.getTiming && all[i].effect.getTiming();
        if (t && t.iterations === Infinity && typeof all[i].currentTime === "number") {
          return now() - all[i].currentTime;
        }
      }
    } catch (e) { /* older browser: use the frame we saw */ }
    return shownAt;
  }

  /* loaded: go once the ring has had its second */
  function loaded() {
    var wait = MIN_MS - (now() - visibleSince());
    if (wait > 0) window.setTimeout(finish, wait);
    else finish();
  }

  if (document.readyState === "complete") loaded();
  else window.addEventListener("load", loaded);

  /* coming back with the Back button can restore the page as it was left,
     without a load event */
  window.addEventListener("pageshow", function (e) { if (e.persisted) finish(); });
})();
