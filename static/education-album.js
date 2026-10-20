(function () {

  var album = document.querySelector('.edu-album');
  if (!album) return;

  var panels = Array.prototype.slice.call(album.querySelectorAll('.edu-album-item'));
  if (panels.length < 2) return;

  var CHEVRON =
    '<svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" ' +
    'aria-hidden="true" focusable="false"><path d="M5.65 1.65a.6.6 0 0 0 0 .84' +
    'L11.16 8l-5.51 5.51a.6.6 0 1 0 .84.85l5.93-5.94a.6.6 0 0 0 0-.84L6.49 1.65' +
    'a.6.6 0 0 0-.84 0z"/></svg>';

  panels.forEach(function (panel, i) {
    var heading = panel.querySelector('figcaption h4');
    var date = panel.querySelector('.edu-heading-date');
    var photos = panel.querySelector('.edu-album-photos');

    var meta = document.createElement('div');
    meta.className = 'edu-album-meta';

    var num = document.createElement('p');
    num.className = 'edu-album-num';
    num.textContent = (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);
    num.setAttribute('aria-hidden', 'true');
    meta.appendChild(num);

    if (heading) meta.appendChild(heading);
    if (date) meta.appendChild(date);

    panel.insertBefore(meta, photos || panel.firstChild);
  });

  var track = document.createElement('div');
  track.className = 'edu-album-track';
  track.tabIndex = 0;
  track.setAttribute('role', 'group');
  track.setAttribute('aria-label', 'STEAM from Seed sessions');

  var frame = document.createElement('div');
  frame.className = 'edu-album-frame';
  album.appendChild(frame);
  frame.appendChild(track);
  panels.forEach(function (panel) { track.appendChild(panel); });

  function arrow(dir, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'edu-album-arrow edu-album-arrow-' + dir;
    b.innerHTML = CHEVRON;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', function () {
      goTo(current() + (dir === 'next' ? 1 : -1));
    });
    return b;
  }

  var prev = arrow('prev', 'Previous session');
  var next = arrow('next', 'Next session');

  frame.insertBefore(prev, track);
  frame.appendChild(next);

  var steps = document.createElement('div');
  steps.className = 'edu-album-steps';
  var bars = panels.map(function (panel, i) {
    var heading = panel.querySelector('.edu-album-meta h4');
    var name = heading ? heading.textContent.trim() : 'session ' + (i + 1);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'edu-album-step';
    b.setAttribute('aria-label', 'Show ' + name);
    b.addEventListener('click', function () { goTo(i); });
    steps.appendChild(b);
    return b;
  });

  album.appendChild(steps);

  function current() {
    var left = track.getBoundingClientRect().left;
    var best = 0;
    var bestD = Infinity;
    panels.forEach(function (panel, i) {
      var d = Math.abs(panel.getBoundingClientRect().left - left);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function goTo(i) {
    var panel = panels[Math.max(0, Math.min(panels.length - 1, i))];
    if (!panel) return;
    track.scrollLeft += panel.getBoundingClientRect().left -
                        track.getBoundingClientRect().left;
  }

  function paint() {
    var now = current();
    bars.forEach(function (b, i) {
      if (i === now) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });

    prev.disabled = now <= 0;
    next.disabled = now >= panels.length - 1;
    [now - 1, now + 1].forEach(function (i) {
      var panel = panels[i];
      if (!panel) return;
      Array.prototype.slice.call(panel.querySelectorAll('img')).forEach(function (img) {
        img.loading = 'eager';
      });
    });
  }

  var ticking = false;
  track.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; paint(); });
  }, { passive: true });

  window.addEventListener('resize', paint, { passive: true });

  album.classList.add('is-scroller');

  var wanted = window.location.hash.slice(1);
  if (wanted) {
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].id === wanted) {
        var easing = track.style.scrollBehavior;
        track.style.scrollBehavior = 'auto';
        goTo(i);
        track.style.scrollBehavior = easing;
        break;
      }
    }
  }

  paint();
})();
