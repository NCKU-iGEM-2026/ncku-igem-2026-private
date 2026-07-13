(function () {
  var lastY = window.scrollY;
  var threshold = 8;

  function onScroll() {
    var y = window.scrollY;
    var delta = y - lastY;

    document.body.classList.toggle('navbar-scrolled', y > 20);

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
})();
