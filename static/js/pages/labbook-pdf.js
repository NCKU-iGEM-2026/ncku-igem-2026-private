(function () {
  'use strict';

  var frames = Array.prototype.slice.call(document.querySelectorAll('.protocol-viewer iframe'));
  if (!frames.length || !('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var f = e.target;
      var kept = f.getAttribute('data-src');
      if (e.isIntersecting) {
        if (kept) { f.setAttribute('src', kept); f.removeAttribute('data-src'); }
      } else if (!kept) {
        f.setAttribute('data-src', f.getAttribute('src'));
        f.setAttribute('src', 'about:blank');
      }
    });
  }, { rootMargin: '1600px 0px' });

  frames.forEach(function (f) { io.observe(f); });
})();
