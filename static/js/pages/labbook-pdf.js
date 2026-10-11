(function () {
  'use strict';

  /* Lab Book embeds 21 protocols as PDFs, and every embedded PDF is a whole
     viewer of the browser's own: its scripts, its memory, often its own
     process. loading="lazy" starts each one as it nears the screen but never
     stops one, so a reader who scrolls the page ends up with all 21 running.

     This keeps only the viewers near the screen alive. One that has scrolled
     far away (beyond the margin below) gives its address back and shows a
     blank page; coming back near the screen, it gets it again and reloads. A
     reader sees no difference. */
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
