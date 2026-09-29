/* A Pseudomonas aeruginosa under the left end of the menu, leaving a trail
 * of AHL down the page behind it.
 *
 * It is the same bacterium and the same signal disc the online game uses, so
 * the two read as the same thing in two places.
 *
 * What it lets go does not fade. The dots run down the margin below the
 * cell, and how many there are is simply how far down the page you are --
 * none at the top, the full line at the bottom. Going back up shortens it
 * again, because the length is the position and not a tally of what has
 * been released.
 *
 * The marks are held against the window rather than against the document.
 * Laid into the document they would be correct -- each one sitting at the
 * depth it was left at -- and invisible: the cell rides 96px from the top of
 * the window, so anything left behind it is off the top of the screen within
 * a breath of being left.
 *
 * Everything is built here rather than put in the template: it is
 * decoration, and a page without JavaScript should simply not have it.
 *
 * Where the cell goes is measured, not guessed. The gap between the left
 * edge of the menu and the left edge of the page's own content runs from
 * 200px at 1920 down to nothing at all by 992, and three different things
 * sit in that gap on different pages -- the site logo, which hangs below the
 * bar; a full-bleed section, whose contents reach the viewport edge; and
 * left-hand controls. So the cell is sized to what is free, and asks the
 * page what is under it before showing itself at all.
 */
(function () {
  'use strict';

  var GERM = 'https://static.igem.wiki/teams/6379/wiki/onlinegame/bacteria.avif';

  var MIN = 40;          // below this there is no room worth using
  var MAX = 62;
  var SPACING = 110;     // one mark per this much depth: close enough to read
                         // as a line rather than as scattered dots
  var KEEP = 140;        // a ceiling, so a very long page cannot grow forever

  /* What counts as being in the way: anything a reader looks at or uses. */
  var INUSE = 'a,button,input,select,textarea,img,svg,h1,h2,h3,h4,h5,h6,p,li,'
            + 'td,th,label,summary,code,pre,figure,table,details';

  var navbar = document.querySelector('.navbar');
  if (!navbar) return;

  var still = false;
  try {
    still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { still = true; }

  var host = document.createElement('div');
  host.className = 'gm-host';
  host.setAttribute('aria-hidden', 'true');

  var cell = document.createElement('img');
  cell.className = 'gm-cell';
  cell.src = GERM;
  cell.alt = '';
  cell.decoding = 'async';
  host.appendChild(cell);
  document.body.appendChild(host);

  /* The trail is laid in the document, not in the viewport, which is the
     whole point: a mark stays at the depth it was left at while the cell
     carries on down. */
  var trail = document.createElement('div');
  trail.className = 'gm-trail';
  trail.setAttribute('aria-hidden', 'true');
  document.body.appendChild(trail);

  /* The content's left edge. Not simply the first container on the page: the
     menu has one of its own, full width, and taking that one leaves no room
     anywhere and the cell never appears. Padding counts as free -- nothing
     is drawn there. */
  function contentLeft() {
    var all = document.querySelectorAll('.container, .container-fluid');
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if (c.closest('.navbar') || c.closest('footer')) continue;
      var r = c.getBoundingClientRect();
      if (!r.width) continue;
      return r.left + (parseFloat(getComputedStyle(c).paddingLeft) || 0);
    }
    return window.innerWidth;
  }

  /* How far the bar has been slid vertically, if at all. It goes away with
     transform: translate(-50%, -150%) on the way down the page; the -50%
     across is its resting transform either way. */
  function navShift() {
    var t = getComputedStyle(navbar).transform;
    if (!t || t === 'none') return 0;
    try { return new DOMMatrix(t).f; } catch (e) { return 0; }
  }

  /* Where the menu's own logo ends, with the bar in its resting place. The
     logo is the right anchor rather than the bar's own bottom edge: it hangs
     below the bar, and it is large at the top of a page and shrinks once the
     page is scrolled -- 209px down to 86px. The cell follows it, and the
     stylesheet transitions top so it travels rather than jumps.

     Taken from the rendered box and corrected for that slide, not built up
     from offsetTop. offsetTop said 160 on the engineering page where the
     logo really ends at 181, and the cell sat on it. */
  function logoBottom() {
    var img = navbar.querySelector('.navbar-brand img')
           || navbar.querySelector('.navbar-brand');
    if (!img) return navbar.offsetTop + navbar.offsetHeight;
    var r = img.getBoundingClientRect();
    if (!r.height) return navbar.offsetTop + navbar.offsetHeight;
    return r.bottom - navShift();
  }

  /* Is that box free? Asked of the page rather than assumed. Both the cell
     and the marks are pointer-events: none, so what comes back is whatever
     is underneath them. */
  function freeAt(x, y, size) {
    var i = Math.max(3, size * 0.18);
    var pts = [[x + size / 2, y + size / 2],
               [x + i, y + i], [x + size - i, y + i],
               [x + i, y + size - i], [x + size - i, y + size - i]];
    for (var k = 0; k < pts.length; k++) {
      var e = document.elementFromPoint(pts[k][0], pts[k][1]);
      if (!e || host.contains(e) || trail.contains(e)) continue;
      if (e.closest(INUSE)) return false;
    }
    return true;
  }

  var shown = false;
  var atX = 0, atY = 0, atSize = 0;

  function hide() {
    if (shown) { host.classList.remove('is-on'); shown = false; }
  }

  function place() {
    var n = navbar.getBoundingClientRect();
    var room = contentLeft() - n.left - 6;
    var size = Math.min(MAX, Math.floor(room));

    if (size < MIN) { hide(); return; }

    var x = Math.round(n.left);
    var y = Math.round(logoBottom() + 10);

    if (!freeAt(x, y, size)) { hide(); return; }

    atX = x; atY = y; atSize = size;
    host.style.setProperty('--gm-size', size + 'px');
    host.style.setProperty('--gm-x', x + 'px');
    host.style.setProperty('--gm-y', y + 'px');
    if (!shown) { host.classList.add('is-on'); shown = true; }
  }

  /* ---- the trail ---- */
  var MARK = 15;         // the dot itself
  var SLOT = 24;         // and the pitch of the line it joins
  var TAIL = 70;         // clear of the bottom of the window
  var marks = [];

  function slotY(i) { return atY + atSize + 16 + i * SLOT; }

  function slots() {
    return Math.max(0, Math.floor(
      (window.innerHeight - TAIL - (atY + atSize + 16)) / SLOT));
  }

  /* How much of the page has gone by, 0 at the top and 1 at the bottom. The
     length of the line is this and nothing else: it is not a tally of what
     has been released, so going back up shortens it again. */
  function progress() {
    var d = document.documentElement;
    var span = (d.scrollHeight || 0) - window.innerHeight;
    if (span <= 0) return 0;
    var p = window.scrollY / span;
    return p < 0 ? 0 : (p > 1 ? 1 : p);
  }

  /* The column the line runs down, sampled rather than assumed. The dots are
     held against the window, so the page slides underneath them -- a spot
     that was empty when a dot was placed does not stay empty. */
  function columnFree() {
    var x = atX + atSize * 0.5 - MARK / 2;
    var n = Math.min(marks.length, 6);
    for (var k = 0; k < n; k++) {
      var i = Math.floor(k * marks.length / n);
      if (!freeAt(x, slotY(i), MARK)) return false;
    }
    return true;
  }

  function add() {
    var i = marks.length;
    var d = document.createElement('span');
    /* cap-ahl is the game's own disc, so the colour has one definition
       between the two places it appears. No lettering at this size: at 15px
       "AHL" is a smudge, and the line is what is being read here. */
    d.className = 'cap-ahl gm-mark';
    d.style.left = Math.round(atX + atSize * 0.5 - MARK / 2) + 'px';
    d.style.top = Math.round(slotY(i)) + 'px';
    if (still) { d.style.animation = 'none'; }
    trail.appendChild(d);
    marks.push(d);
  }

  function drop() {
    var d = marks.pop();
    if (!d) return;
    /* Off the list at once, so the count is right the instant it is asked
       for, and out of the page a moment later so it fades rather than
       blinks. */
    d.classList.add('is-out');
    window.setTimeout(function () { d.remove(); }, 260);
  }

  function retune() {
    var want = Math.round(progress() * slots());
    var guard = 0;
    while (marks.length < want && guard++ < 200) add();
    while (marks.length > want && guard++ < 200) drop();
  }

  function reflow() {
    var x = Math.round(atX + atSize * 0.5 - MARK / 2) + 'px';
    for (var i = 0; i < marks.length; i++) {
      marks[i].style.left = x;
      marks[i].style.top = Math.round(slotY(i)) + 'px';
    }
  }

  var pending = false;

  function onScroll() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      place();
      if (!shown) { trail.classList.remove('is-on'); return; }
      retune();
      reflow();
      trail.classList.toggle('is-on', columnFree());
    });
  }

  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', function () { place(); retune(); reflow(); });

  /* The logo hangs below the bar and is a remote image, so the first
     placement happens before it has any height and lands the cell too high.
     Place again once it is in, and once more when everything is. */
  var logo = navbar.querySelector('.navbar-brand img');
  if (logo && !logo.complete) {
    logo.addEventListener('load', place, {once: true});
    logo.addEventListener('error', place, {once: true});
  }
  window.addEventListener('load', place, {once: true});

  place();
})();
