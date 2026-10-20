(function () {
  'use strict';
  var reduce = false, fine = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) {}
  if (reduce) return;

  if (fine) {
    document.querySelectorAll('.sgd-stop').forEach(function (stop) {
      var node = stop.querySelector('.sgd-node');
      if (!node) return;
      stop.addEventListener('pointermove', function (e) {
        var r = node.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / Math.max(r.width, 1);
        var dy = (e.clientY - (r.top + r.height / 2)) / Math.max(r.height, 1);
        dx = Math.max(-1.2, Math.min(1.2, dx));
        dy = Math.max(-1.2, Math.min(1.2, dy));
        node.style.setProperty('--ry', (dx * 14).toFixed(1) + 'deg');
        node.style.setProperty('--rx', (-dy * 14).toFixed(1) + 'deg');
      });
      stop.addEventListener('pointerleave', function () {
        node.style.removeProperty('--rx');
        node.style.removeProperty('--ry');
      });
    });
  }

  var layer = document.querySelector('.bgm-cards');
  if (layer) {
    var ticking = false;
    var apply = function () {
      ticking = false;
      layer.style.transform = 'translate3d(0,' + (-window.scrollY * 0.06).toFixed(1) + 'px,0)';
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }
})();
