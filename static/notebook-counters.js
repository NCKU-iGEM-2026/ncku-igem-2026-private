(function () {
  // Same count-up as education-counters.js: the tallies and the season total
  // count from zero once they scroll into view, rather than just appearing.
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    var duration = 900;
    var start = null;

    var token = {};
    el._countToken = token;
    el.textContent = '0';

    function tick(timestamp) {
      if (el._countToken !== token) return;
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function init() {
    var numbers = Array.prototype.slice.call(document.querySelectorAll('.nb-tally-n[data-count-to], .nb-status-n[data-count-to]'));
    if (!numbers.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    numbers.forEach(function (el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
