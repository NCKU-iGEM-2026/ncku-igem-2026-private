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

  var CAP = 3000;            /* ms from the start of the page: never longer than this */
  var done = false;

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

  if (document.readyState === "complete") finish();
  else window.addEventListener("load", finish);

  var since = (window.performance && performance.now) ? performance.now() : 0;
  window.setTimeout(finish, Math.max(0, CAP - since));

  /* coming back with the Back button can restore the page as it was left,
     without a load event */
  window.addEventListener("pageshow", function (e) { if (e.persisted) finish(); });
})();
