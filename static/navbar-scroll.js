(function () {
  var lastY = window.scrollY;
  var threshold = 8;
  var backToTopAt = 400;

  function onScroll() {
    var y = window.scrollY;
    var delta = y - lastY;

    document.body.classList.toggle('navbar-scrolled', y > 20);
    document.body.classList.toggle('show-back-to-top', y > backToTopAt);

    /* The home page's logo animation holds the page, and squares it to the
       screen first -- often a short jump back up. That is not the reader
       scrolling up, so the menu is left as it was until the hold ends. */
    if (document.documentElement.classList.contains('rx-meet-holding')) {
      lastY = y;
      return;
    }

    if (y <= 20) {
      document.body.classList.remove('navbar-hidden');
      lastY = y;
      return;
    }

    if (delta > threshold && y > 50) {
      document.body.classList.add('navbar-hidden');
      lastY = y;
    } else if (delta < -threshold) {
      document.body.classList.remove('navbar-hidden');
      lastY = y;
    }
  }

  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      onScroll();
    });
  }, { passive: true });
  onScroll();

  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      var reduced = window.matchMedia &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var target = document.querySelector('.navbar-brand') || document.body;
      if (target && target.focus) target.focus({ preventScroll: true });
    });
  }
})();
