(function () {

  const GERM_URL = 'https://static.igem.wiki/teams/6379/wiki/onlinegame/bacteria2.avif';

  const ROUND_MS = 60000;

  const LIFETIME = { easy: 3000, medium: 2000, hard: 1000 };

  const GAP = [0.16, 0.52];

  const MAX_LIVE = 6;

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

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  let state = 'idle';
  let level = 'medium';
  let score = 0;
  let deadline = 0;
  let nextAt = 0;
  let frameId = 0;
  let live = [];

  let paused = false;
  let pausedAt = 0;

  function setState(next) {
    state = next;
    root.dataset.state = next;
  }

  function fmtScore(n) {
    return n < 0 ? '\u2212' + Math.abs(n) : String(n);
  }

  function showScore() {
    scoreEl.textContent = fmtScore(score);
    scoreEl.classList.toggle('is-loss', score < 0);
  }

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

      let clash = false;
      for (let j = 0; j < live.length; j++) {
        if (Math.abs(x - live[j].x) < size * 1.08 &&
            Math.abs(y - live[j].y) < size * 1.08) { clash = true; break; }
      }
      if (!clash) return { x: x, y: y };
    }

    return fallback || { x: x, y: y };
  }

  function spawn(now, kind) {
    if (live.length >= MAX_LIVE) return;

    const decoy = kind ? kind === 'germ' : Math.random() < DECOY_CHANCE;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = decoy ? 'cap-target cap-target-germ' : 'cap-target cap-target-ahl';
    el.setAttribute('aria-label', decoy
      ? 'Pseudomonas aeruginosa, costs a point'
      : 'AHL, catch it for a point');

    if (decoy) {
      const img = document.createElement('img');
      img.src = GERM_URL;
      img.alt = '';
      el.appendChild(img);
    } else {
      const disc = document.createElement('span');
      disc.className = 'cap-ahl';
      disc.textContent = 'AHL';
      el.appendChild(disc);
    }

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

  function expire(target) {
    drop(target);
    const el = target.el;
    el.style.pointerEvents = 'none';
    if (calm.matches) { el.remove(); return; }
    el.classList.add('is-out');
    window.setTimeout(function () { el.remove(); }, 220);
  }

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
      if (!outside && !underHud) return;

      const at = place(l.size);
      l.x = at.x;
      l.y = at.y;
      l.el.style.left = Math.round(at.x) + 'px';
      l.el.style.top = Math.round(at.y) + 'px';
    });
  }

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
