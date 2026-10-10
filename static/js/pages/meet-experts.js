/* Meet with Experts: the lineup at the top of the page.
 *
 * Each stop is a plain link to its card and works without this script. Here
 * the link scrolls smoothly, and the stop whose card is being read lights up
 * (.is-active) as the page scrolls.
 */
(function () {
  'use strict';

  var stops = Array.prototype.slice.call(document.querySelectorAll('.mx-lineup a[data-mx-stop]'));
  if (!stops.length) return;
  var cards = stops.map(function (a) { return document.getElementById(a.getAttribute('data-mx-stop')); });

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var LINE = 160;
  function update() {
    var active = -1;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i] && cards[i].getBoundingClientRect().top <= LINE) active = i;
    }
    stops.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
  }

  var pending = 0;
  window.addEventListener('scroll', function () {
    if (pending) return;
    pending = window.requestAnimationFrame(function () { pending = 0; update(); });
  }, { passive: true });

  stops.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      if (!cards[i]) return;
      e.preventDefault();
      cards[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#' + cards[i].id);
    });
  });

  update();
})();
