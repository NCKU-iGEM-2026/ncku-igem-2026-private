(function () {
  'use strict';

  /* The two teaching items as tabs, and inside each one a pair of cards the
   * reader turns through left and right.
   *
   * Both follow what the rest of the site already does: the tabs are the
   * home page's (roving tabindex, arrow keys, panels hidden rather than
   * merely unpainted), and the deck is the Education gallery's (arrows, and
   * a live region that only speaks when the reader worked the control).
   *
   * Nothing here runs without JavaScript, and nothing is hidden by the
   * stylesheet until it does: both panels and all their cards are stacked
   * and readable, and the controls that would do nothing are not shown.
   */

  var root = document.querySelector('[data-ctb-teach]');
  if (!root) return;

  /* ---------------------------------------------------------- the tabs -- */

  var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) {
    return document.getElementById(t.getAttribute('aria-controls'));
  });
  if (!tabs.length || panels.indexOf(null) !== -1) return;

  root.classList.add('is-live');

  function select(i, focus) {
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
      if (on && focus) t.focus();
    });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      select(j, true);
    });
  });

  select(0);

  /* --------------------------------------------------------- the decks -- */

  [].forEach.call(root.querySelectorAll('[data-ctb-deck]'), function (deck) {
    var slides = [].slice.call(deck.querySelectorAll('.ctb-slide'));
    if (slides.length < 2) return;

    var prev = deck.querySelector('[data-dir="prev"]');
    var next = deck.querySelector('[data-dir="next"]');
    var dots = [].slice.call(deck.querySelectorAll('[data-go]'));
    var status = deck.querySelector('[data-ctb-status]');
    var at = 0;

    function go(n, byHand) {
      at = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.hidden = i !== at; });
      dots.forEach(function (d, i) {
        var on = i === at;
        d.setAttribute('aria-current', on ? 'true' : 'false');
      });
      if (status) {
        /* Only speak when the reader asked for the change; announcing the
           first card as the page settles is noise. */
        status.setAttribute('aria-live', byHand ? 'polite' : 'off');
        status.textContent = (at + 1) + ' of ' + slides.length + ': ' +
          (slides[at].getAttribute('data-label') || '');
      }
    }

    if (prev) prev.addEventListener('click', function () { go(at - 1, true); });
    if (next) next.addEventListener('click', function () { go(at + 1, true); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { go(i, true); });
    });

    deck.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1, true); }
    });

    go(0);
  });
})();
