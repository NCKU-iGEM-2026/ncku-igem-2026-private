(function () {
  // Each .tngs-chat-msg starts hidden (style.css) and gets .is-visible added
  // as it scrolls into view, so the Q&A reads as a conversation unfolding
  // rather than a wall of text dropped in all at once. No coordination
  // needed to stagger them -- they sit one above another, so scrolling past
  // them naturally reveals one bubble at a time.

  function init() {
    var msgs = Array.prototype.slice.call(document.querySelectorAll('.tngs-chat-msg'));
    if (!msgs.length) return;

    if (!('IntersectionObserver' in window)) {
      msgs.forEach(function (m) { m.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });

    msgs.forEach(function (m) { observer.observe(m); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
