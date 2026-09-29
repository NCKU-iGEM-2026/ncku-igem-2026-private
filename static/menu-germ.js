/* A Pseudomonas aeruginosa under the left end of the menu, letting AHL go as
 * the page is scrolled.
 *
 * It is the same bacterium and the same signal disc the online game uses, so
 * the two read as the same thing in two places.
 *
 * Everything it needs is built here rather than put in the template: it is
 * decoration, and a page without JavaScript should simply not have it.
 *
 * Where it goes is measured, not guessed. The gap between the left edge of
 * the menu and the left edge of the page's own content runs from 200px at
 * 1920 down to nothing at all by 992, so the cell is sized to whatever is
 * actually free on the page it is on, and stays away entirely when that is
 * too little to hold it without reaching the text.
 */
(function () {
  'use strict';

  var GERM = 'https://static.igem.wiki/teams/6379/wiki/onlinegame/bacteria.avif';

  var MIN = 40;          // below this there is no room worth using
  var MAX = 62;
  var EVERY = 300;       // one signal per this many pixels scrolled down
  var LIVE = 5;          // at most this many in the air at once

  var navbar = document.querySelector('.navbar');
  if (!navbar) return;

  var still = false;
  try {
    still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { still = true; }

  /* What counts as being in the way: anything a reader looks at or uses. */
  var INUSE = 'a,button,input,select,textarea,img,svg,h1,h2,h3,h4,h5,h6,p,li,'
            + 'td,th,label,summary,code,pre,figure,table,details';

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

  /* The content's left edge, taken from the widest thing the page actually
     lays out in. Its padding counts as free: nothing is drawn there. */
  function contentLeft() {
    /* Not simply the first container on the page: the menu has one of its
       own, and taking that one leaves no room anywhere and the cell never
       appears. The first that belongs to the page itself is the one whose
       left edge matters. */
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

  /* Where the menu's own logo ends, in layout terms. Two things make this
     the right anchor rather than the bar's own bottom edge: the logo hangs
     below the bar, and it is large at the top of a page and shrinks once
     the page is scrolled -- 209px down to 86px. offsetTop inside the navbar
     is not touched by the transform that slides the bar away, so this holds
     whether the menu is showing or not. The cell follows it; the stylesheet
     puts a transition on top so it travels rather than jumps. */
  function logoBottom() {
    var brand = navbar.querySelector('.navbar-brand');
    if (!brand) return navbar.offsetTop + navbar.offsetHeight;
    return navbar.offsetTop + brand.offsetTop + brand.offsetHeight;
  }

  /* Is the box free? Asked of the page rather than assumed: the gap beside
     the menu holds the logo on one page, a full-bleed section on another and
     a row of controls on a third. The cell is pointer-events: none, so what
     comes back is whatever is underneath it. */
  function free(x, y, size) {
    var i = Math.max(4, size * 0.18);
    var pts = [[x + size / 2, y + size / 2],
               [x + i, y + i], [x + size - i, y + i],
               [x + i, y + size - i], [x + size - i, y + size - i]];
    for (var k = 0; k < pts.length; k++) {
      var e = document.elementFromPoint(pts[k][0], pts[k][1]);
      if (!e || host.contains(e)) continue;
      if (e.closest(INUSE)) return false;
    }
    return true;
  }

  var shown = false;

  function hide() {
    if (shown) { host.classList.remove('is-on'); shown = false; }
  }

  function place() {
    var n = navbar.getBoundingClientRect();
    var room = contentLeft() - n.left - 6;
    var size = Math.min(MAX, Math.floor(room));

    if (size < MIN) { hide(); return; }
    host.style.setProperty('--gm-size', size + 'px');
    /* x from the rect, y from the layout box. The menu slides away on the
       way down with transform: translate(-50%, -150%), so its rect's top
       goes with it and anything anchored to that leaves the screen. The
       -50% across is its resting transform either way, so the rect's left
       is right whether it is showing or not; offsetTop and offsetHeight
       are not touched by either. */
    var x = Math.round(n.left);
    var y = Math.round(logoBottom() + 10);

    if (!free(x, y, size)) { hide(); return; }

    host.style.setProperty('--gm-x', x + 'px');
    host.style.setProperty('--gm-y', y + 'px');
    if (!shown) { host.classList.add('is-on'); shown = true; }
  }

  /* ---- the signal ---- */
  var live = 0;

  function release() {
    if (!shown || live >= LIVE) return;
    var d = document.createElement('span');
    /* cap-ahl is the game's own disc, so the colour and the lettering have
       one definition between the two places they appear. */
    d.className = 'cap-ahl gm-ahl';
    d.textContent = 'AHL';
    /* A little spread, so they do not come out in single file. */
    /* Wider spread, and each one starts from a slightly different spot: a
       fast scroll releases several at once, and without this they come out
       stacked on each other. */
    d.style.left = (30 + Math.random() * 34).toFixed(0) + '%';
    d.style.top = (48 + Math.random() * 24).toFixed(0) + '%';
    d.style.setProperty('--gm-dx', (2 + Math.random() * 48).toFixed(1) + 'px');
    d.style.setProperty('--gm-dy', (46 + Math.random() * 56).toFixed(1) + 'px');
    d.style.setProperty('--gm-turn', (Math.random() * 40 - 20).toFixed(1) + 'deg');
    host.appendChild(d);
    live++;
    var done = function () { d.remove(); live--; };
    d.addEventListener('animationend', done, {once: true});
    /* animationend does not fire on a background tab, and the count would
       stick at the cap for good. */
    window.setTimeout(function () {
      if (d.isConnected) { done(); }
    }, 4000);
  }

  var last = window.scrollY;
  var carried = 0;
  var pending = false;

  function onScroll() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      var y = window.scrollY;
      var moved = y - last;
      last = y;
      place();
      if (still || moved <= 0) return;   // only on the way down
      carried += moved;
      while (carried >= EVERY) {
        carried -= EVERY;
        release();
      }
    });
  }

  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', place);

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
