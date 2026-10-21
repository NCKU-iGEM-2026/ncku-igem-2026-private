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

  /* Skip: the mark jumps to its finished state and the scroll is given back
     at once. Only shown while the page is held, so it never sits on screen
     with nothing to skip. */
  var skip = stop.querySelector('[data-meet-skip]');
  if (skip) {
    skip.hidden = false;
    skip.addEventListener('click', function () {
      stop.classList.add('is-skipped');
      release();
    });
  }

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

  /* ------------------------------------------------- the wait panel -- */

  /* The hours run on their own the first time the panel is seen -- home.js
     does that -- and the reader is free to leave at any point in the run.
     The page used to be held here until the hours reached 72; it is not any
     more, because a reader who has read the figures and wants to move on
     should not have to wait out an animation to do it. The panel still goes
     out the way it did, over the room box below. */
  var stage = document.querySelector('[data-wait-stage]');

  /* --------------------------------------------- clearing the way -- */

  /* The wait panel scrolls away on its own, rising out of the screen over
     the room box below it while Meet is pulled up behind. So the number
     written here is how far through that room the reader is -- 0 with the
     panel whole and low, 1 with it gone and Meet exactly filling the
     screen. */
  var before = document.getElementById('hx-problem');
  var clear = -1, leave = -1;

  function fade() {
    var vh = window.innerHeight || 1;

    if (stage) {
      /* Read off the room box below the panel rather than off the panel, so
         the fade and the mark's arrival are measured against the same thing:
         the room is exactly the distance the mark climbs through, so the
         panel reaches nothing at the moment the mark reaches the top of the
         screen. The panel's own travel over that distance takes it from low
         on the screen to well above the middle, which is where it has
         finished going. */
      var room = document.querySelector('.hx-wait-room');
      var exit = Math.max(1, room ? room.offsetHeight : 1);
      var c = room ? (vh - room.getBoundingClientRect().top) / exit : 0;
      c = c < 0 ? 0 : c > 1 ? 1 : c;
      c = Math.round(c * 100) / 100;
      if (c !== clear) {
        clear = c;
        stage.style.setProperty('--wait-leave', String(c));
        /* A panel at opacity 0 that still takes a click is a trap, and this
           one is the slider. */
        stage.style.pointerEvents = c >= 1 ? 'none' : '';
      }
      /* The mark is only ever on screen once the panel's turn is finished.
         Going down that is the moment it starts; going back up it is the
         moment it should leave again, because the two sections overlap by a
         whole screen and the mark, having played, would otherwise sit on top
         of the panel with both fully opaque. Tying it to the same number
         covers both directions without either knowing about the other. */
      stop.classList.toggle('is-behind', c < 1);

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
