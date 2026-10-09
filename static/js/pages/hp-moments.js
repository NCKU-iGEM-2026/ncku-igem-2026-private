/* Human Practices, "Moments Along the Way": the direction chips.
 *
 * The chips ship hidden and this script shows them, so a reader without
 * JavaScript never meets a button that does nothing. Choosing a direction
 * sets data-filter on the section; the CSS (hp-hub.css) dims every photo
 * from another direction and leaves its own at full strength.
 */
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
      // Choosing the active direction again goes back to all of them.
      if (btn.getAttribute('aria-pressed') === 'true' && dir !== 'all') dir = 'all';
      if (dir === 'all') section.removeAttribute('data-filter');
      else section.setAttribute('data-filter', dir);
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-dir') === dir ? 'true' : 'false');
      });
    });
  });
})();
