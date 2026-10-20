(function () {
  'use strict';

  /* Meet Capture, scrubbed by the scroll.
   *
   * The mark's beats are ordinary CSS animations on a 6.2s timeline. This
   * does not re-implement them; it pauses them and seeks them. A paused
   * animation with a negative delay renders the frame at that point in its
   * own time, so writing one number -- how far the reader is through this
   * section -- is enough to put every beat where it belongs. The arithmetic
   * per beat is in the stylesheet, next to the beat it belongs to.
   *
   * The section is a tall track with a view pinned inside it. Scrolling the
   * track's length is what plays the piece, which is also what stops the
   * reader leaving before it has finished: there is nothing to prevent,
   * because getting past it is the same act as watching it.
   *
   * Without this script nothing is paused and nothing is seeked, and the
   * stylesheet's resting state -- the finished mark -- is simply there. The
   * track collapses to one screen so there is no empty scrolling to do.
   */

  var track = document.querySelector('[data-meet-track]');
  if (!track) return;

  var pin = track.querySelector('.hx-meet-pin');
  if (!pin) return;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) return;        /* the stylesheet already holds the finished mark */

  track.classList.add('is-scrubbed');

  var prog = -1, raf = null, top = 0, span = 1;

  function measure() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var r = track.getBoundingClientRect();
    top = r.top + y;
    /* The pinned view fills the screen, so the travel that actually scrubs
       is whatever the track has over and above it. */
    span = Math.max(1, r.height - pin.offsetHeight);
  }

  function write() {
    raf = null;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var p = (y - top) / span;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    /* Three decimals is finer than a frame at this length and keeps the
       property from being rewritten on every pixel of scroll. */
    p = Math.round(p * 1000) / 1000;
    if (p === prog) return;
    prog = p;
    pin.style.setProperty('--meet-prog', String(p));
  }

  function onScroll() { if (raf === null) raf = requestAnimationFrame(write); }

  measure();
  write();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); prog = -1; onScroll(); });
  /* The images decide the section's height as they land, and the track is
     measured in svh, so one pass after load is not enough. */
  window.addEventListener('load', function () { measure(); prog = -1; onScroll(); });
})();
