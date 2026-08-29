(function () {
  // Capture — a one-minute catching game for the Online Game page.
  //
  // The logo appears at a random point in the field, waits, and is gone. Catch
  // it with the net for a point. Difficulty is how long it waits.
  //
  // Everything here is self-contained: no library, no network request, nothing
  // loaded from outside iGEM infrastructure. If this file fails to load the
  // page still renders and explains itself; only the game is missing.

  // ---------------------------------------------------------------- the logo
  // REPLACE THIS with the team logo once it is uploaded through the iGEM
  // uploads tool, e.g.
  //   const LOGO_URL = 'https://static.igem.wiki/teams/6379/wiki/logo/logo-only.avif';
  // The default below is a placeholder drawn in SVG and inlined as a data URI,
  // so nothing is fetched from a third-party host while it is still a
  // placeholder. iGEM does not allow external CDNs -- when you swap this, point
  // it at static.igem.wiki and nowhere else.
  const LOGO_URL = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='96'%20height='96'%20viewBox='0%200%2096%2096'%3E%3Ccircle%20cx='48'%20cy='48'%20r='44'%20fill='%23eaf7dd'%20stroke='%23075a3e'%20stroke-width='3'%20stroke-dasharray='7%205'/%3E%3Cpath%20d='M34%2026c16%209%2016%2031%200%2040M62%2026c-16%209-16%2031%200%2040'%20fill='none'%20stroke='%23075a3e'%20stroke-width='3.5'%20stroke-linecap='round'/%3E%3Cpath%20d='M37%2036h22M36%2046h24M37%2056h22'%20stroke='%23d8b26a'%20stroke-width='3'%20stroke-linecap='round'/%3E%3Ctext%20x='48'%20y='82'%20font-family='sans-serif'%20font-size='11'%20font-weight='700'%20fill='%23075a3e'%20text-anchor='middle'%3ELOGO%3C/text%3E%3C/svg%3E";

  // --------------------------------------------------------------- the rules
  const ROUND_MS = 60000;                    // one minute, fixed
  const LIFETIME = {                         // how long the logo waits, per level
    easy: 3000,
    medium: 2000,
    hard: 1000
  };
  const LEVEL_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

  const root = document.querySelector('.cap-game');
  if (!root) return;

  const field = root.querySelector('.cap-field');
  const target = root.querySelector('.cap-target');
  const logoImg = root.querySelector('.cap-target img');
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

  logoImg.src = LOGO_URL;

  // Someone who has asked their system for less motion still gets the game and
  // the score; what they do not get is the pop, the drifting +1 and the ring.
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  let state = 'idle';          // idle | playing | over
  let level = 'medium';
  let score = 0;
  let deadline = 0;            // performance.now() at which the round ends
  let shownAt = 0;             // when the logo now on screen appeared
  let frameId = 0;
  let last = null;             // where it was, so it does not reappear there

  function setState(next) {
    state = next;
    root.dataset.state = next;
  }

  // ------------------------------------------------------------------ moving
  // Anywhere in the field, with two exceptions: not under the score and clock,
  // which would make it unreadable and unclickable, and not on the spot it has
  // just left, which reads as "it never moved" rather than as a new target.
  function place() {
    const fb = field.getBoundingClientRect();
    const size = target.offsetWidth || 72;
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

      const dx = last ? x - last.x : Infinity;
      const dy = last ? y - last.y : Infinity;
      if (Math.sqrt(dx * dx + dy * dy) > size * 1.25) break;
    }

    // Every try landed on the clock or on top of itself -- a very short field.
    // Clearing the clock matters more than moving a good distance.
    if (fallback) { x = fallback.x; y = fallback.y; }

    last = { x: x, y: y };
    target.style.left = Math.round(x) + 'px';
    target.style.top = Math.round(y) + 'px';
  }

  function show() {
    place();
    shownAt = performance.now();
    target.hidden = false;
    // Restarting the pop needs the class off, a reflow, then the class on.
    target.classList.remove('is-in');
    void target.offsetWidth;
    target.classList.add('is-in');
  }

  // ----------------------------------------------------------------- catching
  function burst() {
    if (calm.matches) return;
    const fb = field.getBoundingClientRect();
    const tb = target.getBoundingClientRect();
    const x = tb.left - fb.left + tb.width / 2;
    const y = tb.top - fb.top + tb.height / 2;

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

  function caught() {
    if (state !== 'playing' || target.hidden) return;
    score += 1;
    scoreEl.textContent = String(score);
    burst();
    show();                       // gone from here, and already somewhere else
  }

  // -------------------------------------------------------------- the minute
  // The clock is read off a deadline rather than counted down a tick at a time,
  // so a dropped frame or a backgrounded tab cannot buy anyone extra seconds.
  function frame(now) {
    if (state !== 'playing') return;

    const left = deadline - now;
    if (left <= 0) {
      timeEl.textContent = '0';
      finish();
      return;
    }
    timeEl.textContent = String(Math.ceil(left / 1000));

    if (now - shownAt >= LIFETIME[level]) show();   // not caught in time

    frameId = window.requestAnimationFrame(frame);
  }

  function start() {
    score = 0;
    scoreEl.textContent = '0';
    timeEl.textContent = String(ROUND_MS / 1000);
    last = null;
    setState('playing');
    deadline = performance.now() + ROUND_MS;
    show();
    frameId = window.requestAnimationFrame(frame);
  }

  function finish() {
    window.cancelAnimationFrame(frameId);
    setState('over');
    target.hidden = true;
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
    target.hidden = true;
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

  // The target is a real button, so a click, a tap and Enter all catch it.
  target.addEventListener('click', caught);

  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state === 'over') toStart();
  });

  // The field is sized in vh and % , so a rotate or a resize mid-round can
  // leave the logo outside it.
  window.addEventListener('resize', function () {
    if (state === 'playing') place();
  });

  setState('idle');
})();
