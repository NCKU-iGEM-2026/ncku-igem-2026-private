(function () {
  // Capture — a one-minute catching game for the home page.
  //
  // Two things arrive in the dish on their own schedule, each one waits, and
  // each one goes. AHL is the signal the aptamer is raised against, so
  // catching one is worth a point; the bacterium that releases it is not what
  // the aptamer binds, so catching one costs a point. Difficulty is how long
  // a target waits.
  //
  // Everything here is self-contained: no library, no network request, nothing
  // loaded from outside iGEM infrastructure. If this file fails to load the
  // page still renders and explains itself; only the game is missing.

  // ------------------------------------------------------------- the targets
  // The bacterium, served from iGEM's own host. iGEM does not allow external
  // CDNs, so if this is ever changed it has to stay on static.igem.wiki.
  //
  // AHL has no file of its own: it is a labelled disc built in the DOM. At
  // 60px on a phone a picture of the letters "AHL" is a blurry picture of
  // text, where the letters themselves stay sharp -- and it keeps the game
  // down to the one remote asset it already had.
  const GERM_URL = 'https://static.igem.wiki/teams/6379/wiki/onlinegame/bacteria.avif';

  // --------------------------------------------------------------- the rules
  const ROUND_MS = 60000;                    // one minute, fixed

  // How long one target waits before it goes. This is the whole difference
  // between the levels.
  const LIFETIME = { easy: 3000, medium: 2000, hard: 1000 };

  // How long until the *next* one arrives, as a fraction of how long one lives.
  // Arrivals are not tied to departures: a target appears when its turn comes
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

  // How many arrivals are the bacterium rather than AHL. Roughly a third:
  // enough that clearing the dish indiscriminately loses to picking your
  // targets, few enough that the minute is still mostly about catching.
  const DECOY_CHANCE = 0.35;

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
  const pauseBtn = root.querySelector('.cap-pause');
  const resumeBtn = root.querySelector('.cap-resume');
  const quitBtn = root.querySelector('.cap-quit');
  const finalEl = root.querySelector('.cap-final-score');
  const finalUnit = root.querySelector('.cap-final-unit');
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
  let nextAt = 0;              // when the next target is due
  let frameId = 0;
  let live = [];               // every target currently in the dish

  // Paused is orthogonal to state rather than a fourth value of it: the round
  // is still "playing" underneath, just with its clock stopped, so resuming
  // does not have to reconstruct anything finish()/toStart() already own.
  let paused = false;
  let pausedAt = 0;

  function setState(next) {
    state = next;
    root.dataset.state = next;
  }

  // A round can finish below zero. Flooring the score at nought would mean
  // that once you were there the penalty stopped costing anything, which is
  // the point at which a player may as well click everything in the dish.
  function fmtScore(n) {
    return n < 0 ? '\u2212' + Math.abs(n) : String(n);
  }

  function showScore() {
    scoreEl.textContent = fmtScore(score);
    // A minus sign in the same green as every good score is a minus sign you
    // read a beat too late. Below zero the number changes colour as well.
    scoreEl.classList.toggle('is-loss', score < 0);
  }

  // ------------------------------------------------------------------ moving
  // Anywhere in the field, with three exceptions: not under the score and
  // clock, which would leave it unreadable and unclickable; not on top of a
  // target already out, which would make two look like one; and, failing
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
  // kind forces one or the other ('ahl' / 'germ'); left out, chance decides.
  function spawn(now, kind) {
    if (live.length >= MAX_LIVE) return;

    const decoy = kind ? kind === 'germ' : Math.random() < DECOY_CHANCE;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = decoy ? 'cap-target cap-target-germ' : 'cap-target cap-target-ahl';
    // Spelled out for a screen reader, which gets neither the colour nor the
    // picture: what this one is, and what taking it does to the score.
    el.setAttribute('aria-label', decoy
      ? 'Pseudomonas aeruginosa, costs a point'
      : 'AHL, catch it for a point');

    if (decoy) {
      const img = document.createElement('img');
      img.src = GERM_URL;
      img.alt = '';                  // the button carries the name
      el.appendChild(img);
    } else {
      const disc = document.createElement('span');
      disc.className = 'cap-ahl';
      disc.textContent = 'AHL';
      el.appendChild(disc);
    }

    // Appended, measured and positioned inside one task, so the browser never
    // paints it at the corner on its way to where it belongs.
    field.appendChild(el);
    const size = el.offsetWidth || 76;
    const at = place(size);
    el.style.left = Math.round(at.x) + 'px';
    el.style.top = Math.round(at.y) + 'px';
    el.classList.add('is-in');

    const target = {
      el: el,
      x: at.x,
      y: at.y,
      size: size,
      decoy: decoy,
      diesAt: now + LIFETIME[level],
      gone: false
    };
    el.addEventListener('click', function () { grab(target); });
    live.push(target);
  }

  function drop(target) {
    target.gone = true;
    live = live.filter(function (l) { return l !== target; });
  }

  // ---------------------------------------------------------------- leaving
  // Caught: gone at once, because the ring and the number are the feedback
  // and a target still sitting under them reads as a miss. Missed: a short
  // fade, so that with several in the dish you can see which one you lost.
  //
  // A bacterium left to expire costs nothing. Only clicking one does, which
  // is the whole reason leaving one alone is a move.
  function expire(target) {
    drop(target);
    const el = target.el;
    el.style.pointerEvents = 'none';
    if (calm.matches) { el.remove(); return; }
    el.classList.add('is-out');
    window.setTimeout(function () { el.remove(); }, 220);
  }

  // The ring and the number are all that separates a catch worth a point from
  // one that costs you one, and they are on screen for about half a second,
  // so they carry the difference twice over: green and +1, or brown and a
  // minus.
  function burst(target) {
    if (calm.matches) return;
    const x = target.x + target.size / 2;
    const y = target.y + target.size / 2;

    const ring = document.createElement('span');
    ring.className = target.decoy ? 'cap-burst is-loss' : 'cap-burst';
    const plus = document.createElement('span');
    plus.className = target.decoy ? 'cap-plus is-loss' : 'cap-plus';
    plus.textContent = target.decoy ? '\u22121' : '+1';

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

  function grab(target) {
    if (state !== 'playing' || paused || target.gone) return;
    score += target.decoy ? -1 : 1;
    showScore();
    burst(target);
    drop(target);
    target.el.remove();
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
    if (state !== 'playing' || paused) return;

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
    showScore();
    timeEl.textContent = String(ROUND_MS / 1000);
    paused = false;
    root.removeAttribute('data-paused');
    setState('playing');

    const now = performance.now();
    deadline = now + ROUND_MS;
    // One straight away, so the round opens on something -- and an AHL rather
    // than a coin toss, because a round that opens by punishing the first
    // click is a poor way to teach the rule.
    spawn(now, 'ahl');
    nextAt = now + nextGap();
    frameId = window.requestAnimationFrame(frame);
  }

  function finish() {
    window.cancelAnimationFrame(frameId);
    paused = false;
    root.removeAttribute('data-paused');
    setState('over');
    clearField();
    finalEl.textContent = fmtScore(score);
    finalEl.classList.toggle('is-loss', score < 0);
    finalUnit.textContent = Math.abs(score) === 1 ? 'point' : 'points';
    finalLevel.textContent = LEVEL_NAME[level];
    // The running score is deliberately not announced -- once a second for a
    // minute is unusable. The final one is.
    liveEl.textContent = 'Time up. Final score ' + score +
                         ' on ' + LEVEL_NAME[level] + '.';
    replayBtn.focus();
  }

  function toStart() {
    window.cancelAnimationFrame(frameId);
    paused = false;
    root.removeAttribute('data-paused');
    setState('idle');
    clearField();
    liveEl.textContent = '';
    startBtn.focus();
  }

  // ------------------------------------------------------------------- pause
  // Stopping the animation frame already freezes what is on screen; the part
  // that takes care is the clock and every live target's own death time, both
  // stored as absolute performance.now() timestamps. Resuming shifts all of
  // them forward by exactly how long the pause lasted, so nothing that was
  // one second from expiring is suddenly overdue the moment play resumes.
  function pause() {
    if (state !== 'playing' || paused) return;
    paused = true;
    pausedAt = performance.now();
    window.cancelAnimationFrame(frameId);
    root.setAttribute('data-paused', 'true');
    resumeBtn.focus();
  }

  function resume() {
    if (!paused) return;
    const elapsed = performance.now() - pausedAt;
    deadline += elapsed;
    nextAt += elapsed;
    live.forEach(function (l) { l.diesAt += elapsed; });
    paused = false;
    root.removeAttribute('data-paused');
    frameId = window.requestAnimationFrame(frame);
    pauseBtn.focus();
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
  pauseBtn.addEventListener('click', pause);
  resumeBtn.addEventListener('click', resume);
  quitBtn.addEventListener('click', toStart);

  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (state === 'over') { toStart(); return; }
    if (state === 'playing') { if (paused) resume(); else pause(); }
  });

  // The field is sized in vh and %, so a rotate or a resize can leave a
  // target outside it, or under the score and clock once they move. Those are
  // put back; the rest are left exactly where they are.
  //
  // Moving every target on every resize is what made this feel unstable. A phone
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
