(function () {
  'use strict';

  var section = document.getElementById('hpx-moments');
  var bar = section && section.querySelector('.hpx-moments-filter');
  if (!bar) return;

  var buttons = Array.prototype.slice.call(bar.querySelectorAll('.hpx-mf'));
  bar.hidden = false;

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dir = btn.getAttribute('data-dir');
      if (btn.getAttribute('aria-pressed') === 'true' && dir !== 'all') dir = 'all';
      if (dir === 'all') section.removeAttribute('data-filter');
      else section.setAttribute('data-filter', dir);
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-dir') === dir ? 'true' : 'false');
      });
    });
  });
})();
