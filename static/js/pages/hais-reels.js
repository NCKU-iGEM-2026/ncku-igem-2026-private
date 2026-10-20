(function () {
  'use strict';

  var figures = document.querySelectorAll('.hx-hais-figure');
  if (!figures.length) return;

  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { return; }

  if (!('IntersectionObserver' in window)) return;

  var CYCLES = 2;
  var EXTRA = 3;
  var BASE_MS = 950;
  var STEP_MS = 120;
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
        shown.appendChild(reelOf([cell(ch)]).reel);
        continue;
      }

      var passes = CYCLES + Math.min(nth, EXTRA);
      var cells = [];
      for (var p = 0; p < passes; p++) {
        for (var d = 0; d < 10; d++) cells.push(cell(String(d)));
      }
      cells.push(cell(ch));

      var made = reelOf(cells);
      shown.appendChild(made.reel);
      reels.push({
        strip: made.strip,
        stops: passes * 10,
        start: Number(ch),
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

  function rewind(reels) {
    reels.forEach(function (r) {
      r.step = r.strip.firstChild.getBoundingClientRect().height;
      at(r, r.start, 0);
    });
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
