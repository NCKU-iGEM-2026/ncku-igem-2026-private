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

  if (document.readyState === "complete") finish();
  else window.addEventListener("load", finish);

  /* coming back with the Back button can restore the page as it was left,
     without a load event */
  window.addEventListener("pageshow", function (e) { if (e.persisted) finish(); });
})();
