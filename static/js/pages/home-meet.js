(function () {
  'use strict';

  /* Meet Capture: the mark plays once, and the page is held still while it
   * does, so nobody scrolls past a half-drawn logo.
   *
   * Holding a reader still is a thing worth doing carefully, so:
   *   - reduced motion never starts it, and neither does a second visit to
   *     the section; it happens once,
   *   - Esc, Tab and the back/forward keys all end it on the spot,
   *   - a hard ceiling ends it regardless, so a bug here cannot strand
   *     anyone on this section,
   *   - and the scroll is given back exactly as it was taken.
   *
   * It also takes the section before out as this one comes in, so the mark
   * never starts over something that is still on screen.
   *
   * With no script the stylesheet's resting state -- the finished mark --
   * is simply there, nothing is ever held, and nothing fades.
   */

  var PLAY_MS = 4650;          /* the timeline in home-meet.css */
  var CEILING_MS = 7000;       /* never hold longer than this, whatever happens */

  var stop = document.querySelector('[data-meet-stop]');
  if (!stop) return;
  var section = stop.closest('.hx-meet') || stop.parentNode;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) return;

  var played = false, holding = false, timer = null, ceiling = null;

  /* ---------------------------------------------------- holding still -- */

  function swallow(e) { e.preventDefault(); }

  /* Space, page up/down, home/end and the arrows are the keys that scroll.
     Everything else is let through, Tab especially: a reader who wants out
     by keyboard gets out, and taking the focus elsewhere ends the hold. */
  var SCROLL_KEYS = [32, 33, 34, 35, 36, 37, 38, 39, 40];
  function onKey(e) {
    if (e.keyCode === 27 || e.keyCode === 9) { release(); return; }
    if (SCROLL_KEYS.indexOf(e.keyCode) !== -1) e.preventDefault();
  }

  function hold() {
    if (holding) return;
    holding = true;
    if (window.rxLenis && window.rxLenis.stop) window.rxLenis.stop();
    window.addEventListener('wheel', swallow, { passive: false });
    window.addEventListener('touchmove', swallow, { passive: false });
    window.addEventListener('keydown', onKey, true);
    document.documentElement.classList.add('rx-meet-holding');
  }

  function release() {
    if (!holding) return;
    holding = false;
    if (timer) { clearTimeout(timer); timer = null; }
    if (ceiling) { clearTimeout(ceiling); ceiling = null; }
    window.removeEventListener('wheel', swallow, { passive: false });
    window.removeEventListener('touchmove', swallow, { passive: false });
    window.removeEventListener('keydown', onKey, true);
    document.documentElement.classList.remove('rx-meet-holding');
    if (window.rxLenis && window.rxLenis.start) window.rxLenis.start();
    /* Whatever was skipped, the mark ends up finished rather than frozen
       halfway: the class stays on and the animations have fill: both. */
  }

  /* --------------------------------------------- clearing the way -- */

  /* The section before does not simply scroll away: it goes out as this one
     comes in, so by the time the mark has the screen there is nothing else
     left on it. One number, written to that section, and the stylesheet
     turns it into opacity -- doing it here rather than in a second observer
     keeps it on the same frame as everything else.

     It is fully gone by the time this section is 85% of the way up, which is
     before the hold begins at 90%: the mark should never start over a panel
     that is still dissolving. */
  var before = document.getElementById('hx-problem');
  var clear = -1;

  function fade() {
    if (!before) return;
    var vh = window.innerHeight || 1;
    var top = section.getBoundingClientRect().top;
    var c = (vh - top) / (vh * 0.85);
    c = c < 0 ? 0 : c > 1 ? 1 : c;
    c = Math.round(c * 100) / 100;
    if (c === clear) return;
    clear = c;
    before.style.setProperty('--meet-clear', String(c));
    /* A panel at opacity 0 that still takes a click is a trap, and this one
       has a slider in it. */
    before.style.pointerEvents = c >= 1 ? 'none' : '';
  }

  var fading = null;
  function onScroll() { if (fading === null) fading = requestAnimationFrame(function () { fading = null; fade(); }); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  fade();

  /* ------------------------------------------------------- the moment -- */

  function begin() {
    if (played) return;
    played = true;
    /* Square the section to the viewport first, so the mark is not held
       half off the top of the screen. */
    var y = (window.pageYOffset || document.documentElement.scrollTop) +
            section.getBoundingClientRect().top;
    if (window.rxLenis && window.rxLenis.scrollTo) {
      window.rxLenis.scrollTo(y, { immediate: true });
    } else {
      window.scrollTo(0, y);
    }
    stop.classList.add('is-playing');
    hold();
    timer = setTimeout(release, PLAY_MS);
    ceiling = setTimeout(release, CEILING_MS);
  }

  /* Starts when the section has all but filled the screen, so it begins on
     a reader who has arrived rather than one still passing the panel above. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.intersectionRatio >= 0.9) { io.disconnect(); begin(); }
      });
    }, { threshold: [0.9] });
    io.observe(section);
  } else {
    stop.classList.add('is-playing');       /* no observer: play, do not hold */
  }

  /* Leaving the page with the scroll still taken would be the one way to
     strand someone. */
  window.addEventListener('pagehide', release);
  window.addEventListener('blur', release);
})();
