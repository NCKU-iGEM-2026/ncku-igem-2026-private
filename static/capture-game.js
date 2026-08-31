(function () {
  // Capture — a one-minute catching game for the Online Game page.
  //
  // Logos arrive on their own schedule, each one waits, and each one goes.
  // Catch one with the net for a point. Difficulty is how long a logo waits.
  //
  // Everything here is self-contained: no library, no network request, nothing
  // loaded from outside iGEM infrastructure. If this file fails to load the
  // page still renders and explains itself; only the game is missing.

  // ---------------------------------------------------------------- the logo
  // The team logo, the same file the navbar wears in the top-left corner, and
  // served from iGEM's own host. iGEM does not allow external CDNs, so if this
  // is ever changed it has to stay on static.igem.wiki.
  const LOGO_URL = 'https://static.igem.wiki/teams/6379/wiki/logo/logo-ncku.avif';

  // --------------------------------------------------------------- the rules
  const ROUND_MS = 60000;                    // one minute, fixed

  // How long one logo waits before it goes. This is the whole difference
  // between the levels.
  const LIFETIME = { easy: 3000, medium: 2000, hard: 1000 };

  // How long until the *next* one arrives, as a fraction of how long one lives.
  // Arrivals are not tied to departures: a logo appears when its turn comes
  // round, whether or not the one before it is still there, so there are
  // usually two or three in the dish and sometimes one or none.
  //
  // A range rather than a single number, and a wide one, so the rhythm never
  // settles into a metronome -- two can land almost together and then nothing
  // for a beat. Both ends scale with the difficulty, so what changes between
  // levels is how fast you have to be, not how crowded the dish gets.
  const GAP = [0.16, 0.52];

  // A backgrounded or janky tab can leave the clock and the spawner out of
  // step. This is the ceiling that stops that turning into a screen full.
  // Raised with the faster arrivals: at the old four the ceiling, not the
  // schedule, was deciding how busy the dish got.
  const MAX_LIVE = 6;

  const LEVEL_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

  const root = document.querySelector('.cap-game');
  if (!root) return;

  const field = root.querySelector('.cap-field');
  const hud = root.querySelector('.cap-hud');
  const scoreEl = root.querySelector('.cap-score-value');
  const timeEl = root.querySelector('.cap-time-value');
  const startBtn = root.querySelector('.cap-start');
  const replayBtn = root.querySelector('.cap-replay');
  const changeBtn = root.querySelector('.cap-change');
  const finalEl = root.querySelector('.cap-final-score');
  const finalLevel = root.querySelector('.cap-final-level');
  const liveEl = root.querySelector('.cap-live');
  const levelInputs = Array.prototype.slice.call(
    root.querySelectorAll('input[name="cap-level"]')
  );

  // Someone who has asked their system for less motion still gets the game and
  // the score; what they do not get is the pop, the fade, the drifting +1 and
  // the ring.
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  let state = 'idle';          // idle | playing | over
  let level = 'medium';
  let score = 0;
  let deadline = 0;            // performance.now() at which the round ends
  let nextAt = 0;              // when the next logo is due
  let frameId = 0;
  let live = [];               // every logo currently in the dish

  function setState(next) {
    state = next;
    root.dataset.state = next;
  }

  // ------------------------------------------------------------------ moving
  // Anywhere in the field, with three exceptions: not under the score and
  // clock, which would leave it unreadable and unclickable; not on top of a
  // logo that is already out, which would make two look like one; and, failing
  // both, clearing the corner matters more than keeping them apart.
  function place(size) {
    const fb = field.getBoundingClientRect();
    const pad = 10;
    const maxX = Math.max(pad, fb.width - size - pad);
    const maxY = Math.max(pad, fb.height - size - pad);

    const h = hud.getBoundingClientRect();
    const keepOut = {
      l: h.left - fb.left - 12,
      t: h.top - fb.top - 12,
      r: h.right - fb.left + 12,
      b: h.bottom - fb.top + 12
    };

    let x = pad;
    let y = pad;
    let fallback = null;

    for (let i = 0; i < 60; i++) {
      x = pad + Math.random() * (maxX - pad);
      y = pad + Math.random() * (maxY - pad);

      const underHud = x < keepOut.r && x + size > keepOut.l &&
                       y < keepOut.b && y + size > keepOut.t;
      if (underHud) continue;
      if (!fallback) fallback = { x: x, y: y };

      // Box against box, not centre-to-centre distance: two squares set apart
      // diagonally can clear a radius check and still overlap, which showed up
      // as the occasional pair sitting on each other.
      let clash = false;
      for (let j = 0; j < live.length; j++) {
        if (Math.abs(x - live[j].x) < size * 1.08 &&
            Math.abs(y - live[j].y) < size * 1.08) { clash = true; break; }
      }
      if (!clash) return { x: x, y: y };
    }

    return fallback || { x: x, y: y };
  }

  // ---------------------------------------------------------------- arriving
  function spawn(now) {
    if (live.length >= MAX_LIVE) return;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'cap-target';
    el.setAttribute('aria-label', 'Catch the logo');

    const img = document.createElement('img');
    img.src = LOGO_URL;
    img.alt = '';                    // the button carries the name
    el.appendChild(img);

    // Appended, measured and positioned inside one task, so the browser never
    // paints it at the corner on its way to where it belongs.
    field.appendChild(el);
    const size = el.offsetWidth || 76;
    const at = place(size);
    el.style.left = Math.round(at.x) + 'px';
    el.style.top = Math.round(at.y) + 'px';
    el.classList.add('is-in');

    const logo = {
      el: el,
      x: at.x,
      y: at.y,
      size: size,
      diesAt: now + LIFETIME[level],
      gone: false
    };
    el.addEventListener('click', function () { grab(logo); });
    live.push(logo);
  }

  function drop(logo) {
    logo.gone = true;
    live = live.filter(function (l) { return l !== logo; });
  }

  // ---------------------------------------------------------------- leaving
  // Caught: gone at once, because the ring and the +1 are the feedback and a
  // logo still sitting under them reads as a miss. Missed: a short fade, so
  // that with several in the dish you can see which one you lost.
  function expire(logo) {
    drop(logo);
    const el = logo.el;
    el.style.pointerEvents = 'none';
    if (calm.matches) { el.remove(); return; }
    el.classList.add('is-out');
    window.setTimeout(function () { el.remove(); }, 220);
  }

  function burst(logo) {
    if (calm.matches) return;
    const x = logo.x + logo.size / 2;
    const y = logo.y + logo.size / 2;

    const ring = document.createElement('span');
    ring.className = 'cap-burst';
    const plus = document.createElement('span');
    plus.className = 'cap-plus';
    plus.textContent = '+1';

    [ring, plus].forEach(function (el) {
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.setAttribute('aria-hidden', 'true');
      field.appendChild(el);
    });

    window.setTimeout(function () {
      ring.remove();
      plus.remove();
    }, 800);
  }

  function grab(logo) {
    if (state !== 'playing' || logo.gone) return;
    score += 1;
    scoreEl.textContent = String(score);
    burst(logo);
    drop(logo);
    logo.el.remove();
  }

  function clearField() {
    live.forEach(function (l) { l.el.remove(); });
    live = [];
    Array.prototype.forEach.call(
      field.querySelectorAll('.cap-target, .cap-burst, .cap-plus'),
      function (el) { el.remove(); }
    );
  }

  // -------------------------------------------------------------- the minute
  // The clock is read off a deadline rather than counted down a tick at a time,
  // so a dropped frame or a backgrounded tab cannot buy anyone extra seconds.
  function nextGap() {
    const life = LIFETIME[level];
    return life * (GAP[0] + Math.random() * (GAP[1] - GAP[0]));
  }

  function frame(now) {
    if (state !== 'playing') return;

    const left = deadline - now;
    if (left <= 0) {
      timeEl.textContent = '0';
      finish();
      return;
    }
    timeEl.textContent = String(Math.ceil(left / 1000));

    for (let i = live.length - 1; i >= 0; i--) {
      if (now >= live[i].diesAt) expire(live[i]);
    }

    if (now >= nextAt) {
      spawn(now);
      nextAt = now + nextGap();
    }

    frameId = window.requestAnimationFrame(frame);
  }

  function start() {
    clearField();
    score = 0;
    scoreEl.textContent = '0';
    timeEl.textContent = String(ROUND_MS / 1000);
    setState('playing');

    const now = performance.now();
    deadline = now + ROUND_MS;
    spawn(now);                  // one straight away, so the round opens on it
    nextAt = now + nextGap();
    frameId = window.requestAnimationFrame(frame);
  }

  function finish() {
    window.cancelAnimationFrame(frameId);
    setState('over');
    clearField();
    finalEl.textContent = String(score);
    finalLevel.textContent = LEVEL_NAME[level];
    // The running score is deliberately not announced -- once a second for a
    // minute is unusable. The final one is.
    liveEl.textContent = 'Time up. Final score ' + score +
                         ' on ' + LEVEL_NAME[level] + '.';
    replayBtn.focus();
  }

  function toStart() {
    window.cancelAnimationFrame(frameId);
    setState('idle');
    clearField();
    liveEl.textContent = '';
    startBtn.focus();
  }

  // ------------------------------------------------------------------- wiring
  levelInputs.forEach(function (input) {
    if (input.checked) level = input.value;
    input.addEventListener('change', function () {
      if (input.checked) level = input.value;
    });
  });

  startBtn.addEventListener('click', start);
  replayBtn.addEventListener('click', start);
  changeBtn.addEventListener('click', toStart);

  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state === 'over') toStart();
  });

  // The field is sized in vh and %, so a rotate or a resize can leave a logo
  // outside it, or under the score and clock once they move. Those are put
  // back; the rest are left exactly where they are.
  //
  // Moving every logo on every resize is what made this feel unstable. A phone
  // fires resize continuously while the address bar slides in and out of view,
  // so simply scrolling teleported everything on screen -- including whatever
  // you were reaching for.
  function tidyAfterResize() {
    if (state !== 'playing') return;
    const fb = field.getBoundingClientRect();
    const h = hud.getBoundingClientRect();
    const pad = 10;

    live.forEach(function (l) {
      const outside = l.x < 0 || l.y < 0 ||
                      l.x + l.size > fb.width - pad + 1 ||
                      l.y + l.size > fb.height - pad + 1;
      const underHud = l.x < h.right - fb.left + 12 && l.x + l.size > h.left - fb.left - 12 &&
                       l.y < h.bottom - fb.top + 12 && l.y + l.size > h.top - fb.top - 12;
      if (!outside && !underHud) return;      // still fine where it is

      const at = place(l.size);
      l.x = at.x;
      l.y = at.y;
      l.el.style.left = Math.round(at.x) + 'px';
      l.el.style.top = Math.round(at.y) + 'px';
    });
  }

  // Once per frame at most: resize fires far faster than it is worth reacting
  // to, and reading getBoundingClientRect on every one of them is what turns a
  // drag into jank.
  let resizePending = 0;
  window.addEventListener('resize', function () {
    if (resizePending) return;
    resizePending = window.requestAnimationFrame(function () {
      resizePending = 0;
      tidyAfterResize();
    });
  });

  setState('idle');
})();
