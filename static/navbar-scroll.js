(function () {
  var lastY = window.scrollY;
  var threshold = 8;
  // Show the back-to-top button once a screenful or so has gone by, so it
  // never appears while the top of the page is still in view.
  var backToTopAt = 400;

  function onScroll() {
    var y = window.scrollY;
    var delta = y - lastY;

    document.body.classList.toggle('navbar-scrolled', y > 20);
    document.body.classList.toggle('show-back-to-top', y > backToTopAt);

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

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      var reduced = window.matchMedia &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      // Scrolling away moves focus nowhere on its own; hand it back to the
      // top of the document so keyboard users carry on from there.
      var target = document.querySelector('.navbar-brand') || document.body;
      if (target && target.focus) target.focus({ preventScroll: true });
    });
  }
})();
