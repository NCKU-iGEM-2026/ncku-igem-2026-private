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

  /* Nothing of the mark shows before it plays -- the point is that it draws
     itself, and a reader who has already seen the finished logo sitting
     there has had the ending first. The stylesheet's resting state is still
     the finished mark, which is what no script, print and reduced motion
     get; this only hides it for the one case where it is about to be drawn. */
  stop.classList.add('is-armed');

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

  /* The section before goes out as this one comes in, so by the time the
     mark has the screen there is nothing else on it. One number, written to
     that section, and the stylesheet turns it into opacity.

     Both ends of that fade are worked out from the page rather than picked:
     it ENDS exactly where the mark takes over, and begins LEAD_VH of
     scrolling before that. Tying the end to the trigger is the point --
     measured before, the panel had finished dissolving 247px before the mark
     started, and that was 247px of scrolling with nothing on screen and
     nothing happening.

     LEAD_VH is the whole lead-in now, so it is the one number to change if
     this wants to be longer or shorter. Measured on a 1440x900 screen, it
     decides where the panel has got to when the dissolve starts:

         0.40  360px   panel's middle at 23% of the screen
         0.50  450px   at 33%
         0.60  540px   at 43%
         0.70  630px   at 53% -- the middle

     which is the trade: beginning with the panel dead centre is 630px of
     scrolling, and there is no way to have both that and a short lead-in.
     0.5 is the compromise, nearer the short end. */
  var LEAD_VH = 0.5;        /* how much scrolling the dissolve takes */
  var FIRE_VH = 0.15;       /* the mark takes over with its top this far down */

  var before = document.getElementById('hx-problem');
  var clear = -1, leave = -1;

  function ends() {
    var vh = window.innerHeight || 1;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var endY = section.getBoundingClientRect().top + y - vh * FIRE_VH;
    return { vh: vh, y: y, endY: endY, startY: endY - vh * LEAD_VH };
  }

  function fade() {
    var e = ends();

    if (before) {
      var c = (e.y - e.startY) / Math.max(1, e.endY - e.startY);
      c = c < 0 ? 0 : c > 1 ? 1 : c;
      c = Math.round(c * 100) / 100;
      if (c !== clear) {
        clear = c;
        before.style.setProperty('--meet-clear', String(c));
        /* A panel at opacity 0 that still takes a click is a trap, and this
           one has a slider in it. */
        before.style.pointerEvents = c >= 1 ? 'none' : '';
      }
      if (c >= 1) begin();
    }

    /* And out the other side: once it has played, the mark goes the way the
       panel went, so the next section arrives on a clear screen too. */
    if (played && !holding) {
      var top = section.getBoundingClientRect().top;
      var l = -top / (e.vh * 0.55);
      l = l < 0 ? 0 : l > 1 ? 1 : l;
      l = Math.round(l * 100) / 100;
      if (l !== leave) {
        leave = l;
        stop.style.setProperty('--meet-leave', String(l));
      }
    }
  }

  var fading = null;
  function onScroll() { if (fading === null) fading = requestAnimationFrame(function () { fading = null; fade(); }); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  /* Lenis as well as the window, because not every move it makes raises a
     scroll event: its own scrollTo with immediate fires none at all, which
     is how this was found -- a page moved to the right place with the
     dissolve still reading zero. A wheel does fire them, so this was never
     wrong for a reader, but an anchor jump or a restored scroll position
     would have left it stale. */
  if (window.rxLenis && window.rxLenis.on) window.rxLenis.on('scroll', onScroll);

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
    stop.classList.remove('is-armed');
    stop.classList.add('is-playing');
    hold();
    timer = setTimeout(release, PLAY_MS);
    ceiling = setTimeout(release, CEILING_MS);
  }

  /* The mark takes over the moment the dissolve finishes, rather than
     waiting for a ratio of its own: waiting was what left the gap. What is
     left to travel at that point is FIRE_VH of a screen, which the snap
     below closes. */
  fade();

  /* Leaving the page with the scroll still taken would be the one way to
     strand someone. */
  window.addEventListener('pagehide', release);
  window.addEventListener('blur', release);
})();
