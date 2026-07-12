(function () {
  function onScroll() {
    if (window.scrollY > 20) {
      document.body.classList.add('navbar-scrolled');
    } else {
      document.body.classList.remove('navbar-scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
