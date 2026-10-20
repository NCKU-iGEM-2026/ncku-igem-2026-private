/* Five quick clicks on the navbar logo open the Capture page.

   Only clicks made while we are already on Home count. On every other page
   the logo keeps its ordinary job and goes Home on the first click, with no
   delay added to it -- so someone tapping the logo over and over arrives on
   Home and then keeps counting there. On Home the link has nowhere to go,
   so the click is taken over: it scrolls back to the top instead of
   reloading the page, and the run is only broken by waiting too long. */
(function () {
  var brand = document.querySelector('.navbar-brand[data-egg]');
  if (!brand) return;

  var NEEDED = 5;     // clicks that open the page
  var GAP = 1200;     // ms allowed between one click and the next

  var count = 0;
  var last = 0;

  function tidy(path) {
    return path.replace(/index\.html$/, '').replace(/\/$/, '');
  }

  function onHomePage() {
    var home = document.createElement('a');
    home.href = brand.getAttribute('href');
    return tidy(home.pathname) === tidy(window.location.pathname);
  }

  brand.addEventListener('click', function (event) {
    // leave ctrl/cmd-click, middle-click and the rest to the browser
    if (event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;

    if (!onHomePage()) return;   // first click just goes Home, as it always did

    event.preventDefault();

    var now = Date.now();
    count = (now - last <= GAP) ? count + 1 : 1;
    last = now;

    if (count >= NEEDED) {
      count = 0;
      window.location.href = brand.dataset.egg;
      return;
    }

    var reduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
})();
