(function () {
  // Turns the ten STEAM from Seed figures into one card you scroll along:
  // each school gets its number, its name, its dates and both of its photos,
  // and a bar of ten segments underneath says where in the ten you are and
  // jumps to one.
  //
  // The markup in education.html is untouched -- it is still ten complete
  // <figure>s. If this file fails to load they lay out as a contact sheet
  // and every photo is still on screen; .is-scroller, set at the end, is
  // what switches the stylesheet over. Same arrangement as
  // education-gallery.js and its .is-carousel.
  //
  // Nothing here is hidden, which is the point: the sidebar's ten deep links
  // find their school with getElementById and scrollIntoView, and because
  // that walks every scrollable ancestor it scrolls this track sideways on
  // its own. No id juggling and no click handler of ours in the way.

  var album = document.querySelector('.edu-album');
  if (!album) return;

  var panels = Array.prototype.slice.call(album.querySelectorAll('.edu-album-item'));
  if (panels.length < 2) return;   // nothing to scroll between

  // Drawn pointing right; the back arrow is the same path turned over in CSS,
  // so the two are never slightly different shapes.
  var CHEVRON =
    '<svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" ' +
    'aria-hidden="true" focusable="false"><path d="M5.65 1.65a.6.6 0 0 0 0 .84' +
    'L11.16 8l-5.51 5.51a.6.6 0 1 0 .84.85l5.93-5.94a.6.6 0 0 0 0-.84L6.49 1.65' +
    'a.6.6 0 0 0-.84 0z"/></svg>';

  // ---- each school gets its number, name and dates in one column ----
  panels.forEach(function (panel, i) {
    var heading = panel.querySelector('figcaption h4');
    var date = panel.querySelector('.edu-heading-date');
    var photos = panel.querySelector('.edu-album-photos');

    var meta = document.createElement('div');
    meta.className = 'edu-album-meta';

    var num = document.createElement('p');
    num.className = 'edu-album-num';
    num.textContent = (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);
    // Reads as "01" to anyone looking and says nothing to a screen reader,
    // which is getting the position from the bar below instead.
    num.setAttribute('aria-hidden', 'true');
    meta.appendChild(num);

    // Moved, not copied: these are the school's only heading, and a second
    // copy would have a reader hear every name twice.
    if (heading) meta.appendChild(heading);
    if (date) meta.appendChild(date);

    panel.insertBefore(meta, photos || panel.firstChild);
  });

  // ---- the track ----
  var track = document.createElement('div');
  track.className = 'edu-album-track';
  // A scrollable region is operated with the arrow keys, so it needs to be
  // somewhere the keyboard can land, and it needs to say what it is once it
  // gets there.
  track.tabIndex = 0;
  track.setAttribute('role', 'group');
  track.setAttribute('aria-label', 'STEAM from Seed sessions');

  // One row: the back arrow, the card, the forward arrow.
  var frame = document.createElement('div');
  frame.className = 'edu-album-frame';
  album.appendChild(frame);
  frame.appendChild(track);
  // Moved, not rebuilt: these figures already carry the lightbox's click
  // handlers, and recreating them would drop those on the floor.
  panels.forEach(function (panel) { track.appendChild(panel); });

  // ---- the arrows, one either side of the card ----
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

  // Put into the row in the order they are read in, rather than left where
  // they were made and shuffled by CSS: tabbing follows the markup, and a
  // back arrow that is on the left but reached last is a trap for anyone
  // not using a mouse.
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
    // Without this each of the ten is an unlabelled button; the school's own
    // name is the only thing that tells them apart.
    b.setAttribute('aria-label', 'Show ' + name);
    b.addEventListener('click', function () { goTo(i); });
    steps.appendChild(b);
    return b;
  });

  album.appendChild(steps);

  // Measured off the rendered boxes rather than off offsetLeft: the track
  // carries padding and is its own offset parent only by accident of the
  // stylesheet, and this stays right either way.
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
    // Clamped, not wrapped. This is a row of ten you move along, and the
    // scrollbar under it says so -- stepping off the end and reappearing at
    // the other one would contradict what the reader can see.
    var panel = panels[Math.max(0, Math.min(panels.length - 1, i))];
    if (!panel) return;
    // A relative nudge, not scrollIntoView: that would also scroll the page
    // vertically to bring the card into view, and clicking a segment should
    // move the track and nothing else.
    track.scrollLeft += panel.getBoundingClientRect().left -
                        track.getBoundingClientRect().left;
  }

  function paint() {
    var now = current();
    bars.forEach(function (b, i) {
      if (i === now) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });

    // disabled, not hidden: a control that vanishes at the end of the row
    // shifts everything beside it, and a reader who has tabbed to it loses
    // their place. Greyed out, it stays where it was and says why.
    prev.disabled = now <= 0;
    next.disabled = now >= panels.length - 1;
    // The school either side of the one showing is the next thing anyone is
    // going to ask for, so it is fetched now rather than on arrival.
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

  // A sidebar link scrolls the track from the outside, and that fires the
  // handler above -- but a resize changes which school sits at the left edge
  // without any scrolling at all.
  window.addEventListener('resize', paint, { passive: true });

  album.classList.add('is-scroller');

  // Arriving on a link straight to one school should open on that school.
  // The browser makes its own jump to the fragment, but it does so before
  // this script lifts the figures into the track above, so that position is
  // thrown away with the old layout -- the track has to be put back on the
  // right school here. Sidebar clicks later on need none of this: by then
  // nothing is being re-parented and scrollIntoView reaches the track on its
  // own.
  var wanted = window.location.hash.slice(1);
  if (wanted) {
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].id === wanted) {
        // Straight there. Animating a scroll the reader did not ask for,
        // before the page has even settled, is just a page that looks broken.
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
