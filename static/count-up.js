(function () {
  'use strict';

  var els = document.querySelectorAll('[data-count-to]');
  if (!els.length) return;

  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { return; }

  var DURATION = 1400;

  function fmt(n) {
    try { return n.toLocaleString('en-US'); } catch (e) { return String(n); }
  }

  function run(el) {
    var to = parseInt(el.getAttribute('data-count-to'), 10);
    if (!(to > 0)) return;

    var start = null;
    el.textContent = fmt(0);

    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / DURATION);
      var eased = 1 - Math.pow(1 - p, 3);
      if (p < 1) {
        el.textContent = fmt(Math.round(to * eased));
        window.requestAnimationFrame(step);
      } else {
        el.textContent = fmt(to);
      }
    }
    window.requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(els, run);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      run(entry.target);
    });
  }, { threshold: 0.6 });

  Array.prototype.forEach.call(els, function (el) { io.observe(el); });
})();
