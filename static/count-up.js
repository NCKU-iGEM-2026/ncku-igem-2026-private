/* Counts a figure up from zero the first time it comes into view.
 *
 * The real number is in the markup, and this script replaces it rather than
 * filling in a blank: without JavaScript, before this runs, or in a reduced
 * motion setting, the reader sees the actual figure and not a zero.
 *
 * Only whole positive numbers, written as data-count-to on the element whose
 * text is that number. Anything around it -- a dash between two of them, a
 * per-cent sign, a plus -- stays in the markup and is never touched.
 */
(function () {
  'use strict';

  var els = document.querySelectorAll('[data-count-to]');
  if (!els.length) return;

  // Somebody who has asked for less motion gets the number, not the count.
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { return; }

  var DURATION = 1400;

  function fmt(n) {
    // Pinned to en-US so the counting digits carry the same separators as the
    // number already written in the markup, whatever locale the browser is in.
    try { return n.toLocaleString('en-US'); } catch (e) { return String(n); }
  }

  function run(el) {
    var to = parseInt(el.getAttribute('data-count-to'), 10);
    if (!(to > 0)) return;

    // No width is reserved on purpose. The figure sits in a block that is
    // already the width of its column, so a number growing from one digit to
    // six moves nothing outside it. Reserving the finished width here instead
    // parks the number on the left of an empty box and strands the per-cent
    // sign and the plus out to the right of it for the whole count.

    var start = null;
    el.textContent = fmt(0);

    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / DURATION);
      // Fast away, settling onto the real number rather than stopping dead.
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
      io.unobserve(entry.target);   // once, not every time it scrolls past
      run(entry.target);
    });
  }, { threshold: 0.6 });

  Array.prototype.forEach.call(els, function (el) { io.observe(el); });
})();
