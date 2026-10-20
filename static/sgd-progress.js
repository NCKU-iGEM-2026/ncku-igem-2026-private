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

  if (still) return;

  var items = stops.map(function (stop) {
    var fill = stop.querySelector('.sgd-arc-fill');
    if (fill) fill.style.setProperty('--cut', '100%');
    return {stop: stop, fill: fill, lit: null};
  });

  root.classList.add('sgd-js');

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
