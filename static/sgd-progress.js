/* The board game walkthrough: the S draws itself as you read down it.
 *
 * Each stop holds two copies of the same arc -- a pale track that is always
 * there, and a copy on top of it in the ink colour whose bottom this cuts
 * away. How much of a stop's arc is showing is simply how far a reference
 * line down the middle of the viewport has travelled through that stop, so
 * the curve keeps pace with reading rather than with a timer.
 *
 * Cut rather than dashed: the arcs are stretched with
 * preserveAspectRatio="none" and stroked with non-scaling-stroke, which puts
 * a dash pattern in screen space while the path's length stays in user
 * space, and the arc comes out striped rather than part-drawn.
 *
 * A circle lights up once that line reaches it, which is halfway down its
 * stop, because that is where the arc's apex -- and so the circle -- sits.
 *
 * Nothing here is required to read the page. Without it, or under reduced
 * motion, every arc is drawn and every circle is lit from the start; the
 * stylesheet only hides them once this script has said it is running.
 */
(function () {
  'use strict';

  var root = document.querySelector('.sgd');
  if (!root) return;

  var stops = Array.prototype.slice.call(root.querySelectorAll('.sgd-stop'));
  if (!stops.length) return;

  var still = false;
  try {
    still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { still = true; }

  // Everything already reads correctly in its finished state, so a reader who
  // asked for less motion simply keeps it.
  if (still) return;

  var items = stops.map(function (stop) {
    var fill = stop.querySelector('.sgd-arc-fill');
    if (fill) fill.style.setProperty('--cut', '100%');
    return {stop: stop, fill: fill, lit: null};
  });

  // Only now: before this, the stylesheet leaves the finished state alone.
  root.classList.add('sgd-js');

  // The text arrives when its stop enters the viewport, which is well before
  // the circle lights up halfway down it. Tying the two together would leave
  // a stop's text invisible while it was being read.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('is-in');
      });
    }, {rootMargin: '0px 0px -12% 0px'});
    stops.forEach(function (st) { io.observe(st); });
  } else {
    stops.forEach(function (st) { st.classList.add('is-in'); });
  }

  var pending = false;

  function draw() {
    pending = false;
    var mid = window.scrollY + window.innerHeight * 0.55;

    items.forEach(function (it) {
      var box = it.stop.getBoundingClientRect();
      var top = box.top + window.scrollY;
      var h = box.height || 1;
      var p = (mid - top) / h;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);

      if (it.fill) {
        it.fill.style.setProperty('--cut', ((1 - p) * 100).toFixed(2) + '%');
      }
      // The apex, and so the circle, is halfway down the stop.
      var lit = p >= 0.5;
      if (lit !== it.lit) {
        it.lit = lit;
        it.stop.classList.toggle('is-reached', lit);
      }
    });
  }

  function onScroll() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(draw);
  }

  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', onScroll);
  draw();
})();
