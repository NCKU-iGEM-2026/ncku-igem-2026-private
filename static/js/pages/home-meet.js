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

  /* ------------------------------------------------- the hours gate -- */

  /* The page is held at the wait panel until the hours have run to 72. They
     run on their own the first time the panel is seen -- home.js does that
     -- so nobody has to touch anything to get past; the gate is only in the
     way of someone who scrolls faster than the four and a half seconds it
     takes, or who grabbed the slider and stopped short, which cancels the
     automatic run.
     
     Not under reduced motion. The automatic run is switched off there too,
     so the slider would sit at zero and the gate would never lift: a hold
     with no way out is the one thing this must not be.

     Nothing on screen says the page is being held -- that line was taken
     out. For almost everyone there is nothing to explain, since the hours
     run by themselves and the hold is over before it is noticed. The one
     who is left guessing is the reader who grabbed the slider, stopped part
     way, and then tried to scroll; the ceiling below is all they have, so
     it is short rather than generous. */
  var stage = document.querySelector('[data-wait-stage]');
  var range = document.querySelector('.hx-wait-range');
  var gateOpen = false, gateHolding = false, gateCeiling = null;

  function gateDone() {
    return !range || +range.value >= +range.max;
  }

  function gateRelease() {
    if (gateOpen) return;
    gateOpen = true;
    gateUnhold();
    if (gateCeiling) { clearTimeout(gateCeiling); gateCeiling = null; }
  }

  function gateHold() {
    if (gateHolding || gateOpen) return;
    gateHolding = true;
    if (window.rxLenis && window.rxLenis.stop) window.rxLenis.stop();
    window.addEventListener('wheel', swallow, { passive: false });
    window.addEventListener('touchmove', swallow, { passive: false });
    window.addEventListener('keydown', onGateKey, true);
    document.documentElement.classList.add('rx-wait-holding');
    /* However this goes wrong, it lets go of the page -- and with no line on
       screen to explain the hold, sooner rather than later. */
    if (!gateCeiling) gateCeiling = setTimeout(gateRelease, 9000);
  }

  function gateUnhold() {
    if (!gateHolding) return;
    gateHolding = false;
    window.removeEventListener('wheel', swallow, { passive: false });
    window.removeEventListener('touchmove', swallow, { passive: false });
    window.removeEventListener('keydown', onGateKey, true);
    document.documentElement.classList.remove('rx-wait-holding');
    if (window.rxLenis && window.rxLenis.start) window.rxLenis.start();
  }

  function onGateKey(e) {
    if (e.keyCode === 27 || e.keyCode === 9) { gateRelease(); return; }
    /* The arrows belong to the slider while it has the focus -- taking them
       would make the one thing the reader is being asked to do impossible. */
    if (d_owns(e.target)) return;
    if (SCROLL_KEYS.indexOf(e.keyCode) !== -1) e.preventDefault();
  }
  function d_owns(el) { return el === range; }

  if (range) {
    range.addEventListener('input', function () { if (gateDone()) gateRelease(); });
    /* The automatic run writes .value without raising input, so it has to be
       watched rather than listened to -- and the watch stops the moment it
       has its answer, rather than ticking for the rest of the visit. */
    var watch = setInterval(function () {
      if (gateDone()) { gateRelease(); clearInterval(watch); }
    }, 200);
  } else {
    gateOpen = true;
  }

  /* --------------------------------------------- clearing the way -- */

  /* The wait panel does not scroll away: it is pinned for one screen while
     it goes out, and Meet is pulled up over it. So the number written here
     is how far through that pinned screen the reader is -- 0 with the panel
     whole, 1 with it gone and Meet exactly filling the screen.

     The gate rides on the same measurement. While the panel is pinned and
     the hours have not finished, the page is held; the moment they do, it
     is let go. */
  var before = document.getElementById('hx-problem');
  var clear = -1, leave = -1;

  function fade() {
    var vh = window.innerHeight || 1;

    if (stage) {
      var sr = stage.getBoundingClientRect();
      var exit = Math.max(1, (before ? before.getBoundingClientRect().bottom : sr.bottom) - sr.bottom);
      var c = -sr.top / Math.max(1, exit);
      c = c < 0 ? 0 : c > 1 ? 1 : c;
      c = Math.round(c * 100) / 100;
      if (c !== clear) {
        clear = c;
        stage.style.setProperty('--wait-leave', String(c));
        /* A panel at opacity 0 that still takes a click is a trap, and this
           one is the slider. */
        stage.style.pointerEvents = c >= 1 ? 'none' : '';
      }
      /* Pinned, and the hours unfinished: hold. Pinned begins the moment its
         top reaches the viewport top. */
      if (!gateOpen) {
        if (sr.top <= 0) gateHold(); else gateUnhold();
      }
      if (c >= 1) begin();
    }

    /* And the mark out the other side, the same way. */
    if (played && !holding) {
      var top = section.getBoundingClientRect().top;
      var mexit = Math.max(1, section.offsetHeight - stop.offsetHeight);
      var l = -top / mexit;
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
     scroll event: its own scrollTo with immediate fires none at all. A wheel
     does raise them, so this was never wrong for a reader, but an anchor
     jump or a restored scroll position would have left it stale. */
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
