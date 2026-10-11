(function () {
  'use strict';

  /* Rolls the three HAIs figures to their value the way a slot machine
   * lands, once, the first time they are scrolled to. Every digit spins
   * through whole passes of 0-9 and the ones further right spin longer, so
   * the number settles from the left.
   *
   * The real figure is in the markup and this replaces it rather than
   * filling in a blank. Without JavaScript, before this runs, with reduced
   * motion asked for, or on a browser with no IntersectionObserver, the
   * reader sees the actual number and never a row of zeroes.
   *
   * Same contract as count-up.js, which could not be used here: that only
   * animates whole numbers, and "4.9 Million" and ">$855 Billion" are not.
   *
   * Every character becomes a cell of the same height, punctuation and
   * spaces included, so the line has no mix of inline text and
   * overflow-hidden boxes to align -- those two sit on different baselines
   * and the digits would ride low against the words beside them.
   */

  var figures = document.querySelectorAll('.hx-hais-figure');
  if (!figures.length) return;

  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { return; }

  /* No observer, no way to know when it is on screen: leave the markup
     alone rather than freeze three reels part-spun. */
  if (!('IntersectionObserver' in window)) return;

  var CYCLES = 2;        // whole 0-9 passes before the first digit lands
  var EXTRA = 3;         // most additional passes a later digit may take
  var BASE_MS = 950;
  var STEP_MS = 120;     // each digit to the right spins this much longer
  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

  function cell(text) {
    var s = document.createElement('span');
    s.className = 'hais-cell';
    s.textContent = text;
    return s;
  }

  function reelOf(cells) {
    var reel = document.createElement('span');
    reel.className = 'hais-reel';
    var strip = document.createElement('span');
    strip.className = 'hais-strip';
    for (var i = 0; i < cells.length; i++) strip.appendChild(cells[i]);
    reel.appendChild(strip);
    return { reel: reel, strip: strip };
  }

  function build(fig) {
    var real = fig.textContent.replace(/\s+/g, ' ').trim();

    var spoken = document.createElement('span');
    spoken.className = 'visually-hidden';
    spoken.textContent = real;

    var shown = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');

    var reels = [];
    var nth = 0;

    for (var i = 0; i < real.length; i++) {
      var ch = real.charAt(i);

      if (ch < '0' || ch > '9') {
        /* Still a cell, just one deep and going nowhere. */
        shown.appendChild(reelOf([cell(ch)]).reel);
        continue;
      }

      var passes = CYCLES + Math.min(nth, EXTRA);
      var cells = [];
      for (var p = 0; p < passes; p++) {
        for (var d = 0; d < 10; d++) cells.push(cell(String(d)));
      }
      cells.push(cell(ch));          // where it stops

      var made = reelOf(cells);
      shown.appendChild(made.reel);
      reels.push({
        strip: made.strip,
        stops: passes * 10,          // index of the cell it lands on
        start: Number(ch),           // the same digit, one pass in
        nth: nth,
        step: 0
      });
      nth++;
    }

    fig.textContent = '';
    fig.appendChild(spoken);
    fig.appendChild(shown);
    return reels;
  }

  function at(r, index, ms) {
    r.strip.style.transition = ms ? ('transform ' + ms + 'ms ' + EASE) : 'none';
    r.strip.style.transform = 'translateY(' + (-index * r.step) + 'px)';
  }

  /* Parks the reel on its answer with most of the strip still below it.
     Index `start` is the same digit as the one it will land on, so the
     figure reads correctly before it has spun and the jump to this point
     is invisible. */
  function rewind(reels) {
    reels.forEach(function (r) {
      /* Measured, not assumed: the cell's height is whatever the figure's
         line-height works out to, and reading it back means the CSS can
         change without this having to be told. */
      r.step = r.strip.firstChild.getBoundingClientRect().height;
      at(r, r.start, 0);
    });
    /* One read, after the whole set is parked, so the browser cannot roll
       the jump and the spin into a single style pass and skip the spin. */
    if (reels.length) void reels[0].strip.offsetHeight;
  }

  function spin(reels) {
    reels.forEach(function (r) {
      at(r, r.stops, BASE_MS + r.nth * STEP_MS);
    });
  }

  function roll(reels) {
    rewind(reels);
    spin(reels);
  }

  var built = [];
  [].forEach.call(figures, function (fig) {
    var reels = build(fig);
    built.push({ el: fig, reels: reels, done: false });
    /* Park on the answer straight away, so a figure scrolled past before
       its first spin still reads correctly rather than showing zeroes. */
    rewind(reels);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      for (var i = 0; i < built.length; i++) {
        if (built[i].el === entry.target && !built[i].done) {
          built[i].done = true;
          roll(built[i].reels);
        }
      }
      io.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  built.forEach(function (b) { io.observe(b.el); });
})();
