(function () {
  var lastY = window.scrollY;
  var threshold = 8;
  // Show the back-to-top button once a screenful or so has gone by, so it
  // never appears while the top of the page is still in view.
  var backToTopAt = 400;

  // While the mobile drawer is open the page behind it is frozen. Touch
  // scrolling on iOS ignores overflow:hidden on html/body, so the page is
  // pinned with position:fixed instead (keeping its scroll offset), and
  // touch moves that would only drag the page or the drawer are cancelled.
  // Without this the page scrolled under the drawer, the scroll handler
  // below slid the whole navbar away, and the burger went with it.
  var drawer = document.getElementById('navbarSupportedContent');
  var lockedY = 0;

  function lockPage() {
    if (document.body.classList.contains('drawer-locked')) return;
    lockedY = window.scrollY;
    document.body.classList.remove('navbar-hidden');
    document.body.classList.add('drawer-locked');
    document.body.style.position = 'fixed';
    document.body.style.top = -lockedY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function unlockPage() {
    if (!document.body.classList.contains('drawer-locked')) return;
    document.body.classList.remove('drawer-locked');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo({ top: lockedY, behavior: 'instant' });
  }

  if (drawer) {
    drawer.addEventListener('show.bs.collapse', lockPage);
    drawer.addEventListener('hidden.bs.collapse', unlockPage);
    // Leaving the mobile layout (rotate, resize) with the drawer open.
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) unlockPage();
    });
    document.addEventListener('touchmove', function (e) {
      if (!document.body.classList.contains('drawer-locked')) return;
      // The drawer may scroll its own list, but only when that list is
      // actually taller than the screen.
      if (drawer.contains(e.target) && drawer.scrollHeight > drawer.clientHeight) return;
      e.preventDefault();
    }, { passive: false });
  }

  function onScroll() {
    if (document.body.classList.contains('drawer-locked')) return;
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

  // Several scroll events can arrive in one frame; the classes only need
  // setting once per frame, just before it is drawn.
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
      // Scrolling away moves focus nowhere on its own; hand it back to the
      // top of the document so keyboard users carry on from there.
      var target = document.querySelector('.navbar-brand') || document.body;
      if (target && target.focus) target.focus({ preventScroll: true });
    });
  }
})();
