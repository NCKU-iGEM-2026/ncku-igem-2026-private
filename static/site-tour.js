(function () {
  // Home page: a first look at the wiki, one section at a time.
  // No library, no inline script -- everything the wiki loads comes from here.
  var tour = document.getElementById('siteTour');
  if (!tour) return;

  var steps = Array.prototype.slice.call(tour.querySelectorAll('[data-tour-step]'));
  if (!steps.length) return;

  var card = tour.querySelector('.tour-card');
  var dots = document.getElementById('tourDots');
  var back = document.getElementById('tourBack');
  var next = document.getElementById('tourNext');
  var now = document.getElementById('tourNow');
  var total = document.getElementById('tourTotal');
  var opener = document.getElementById('tourOpen');
  var navbar = document.querySelector('.navbar');

  var SEEN = 'ncku2026_tour_seen';
  var LAST = 'Start exploring';
  var at = 0;
  var returnTo = null;

  // A browser can refuse storage entirely (private windows, blocked site data).
  // Losing the "already seen" flag should cost the visitor a tour they can
  // skip, never a script error on the home page.
  function remember() {
    try { localStorage.setItem(SEEN, '1'); } catch (e) { /* not important enough to fail over */ }
  }
  function alreadySeen() {
    try { return localStorage.getItem(SEEN) === '1'; } catch (e) { return false; }
  }

  // The navbar is the thing the tour is teaching, so the matching menu is lifted
  // out of the dimmed background while its step is showing. Only where the menu
  // is actually on screen -- below lg it is collapsed behind the toggler, and
  // pointing at something invisible would be worse than pointing at nothing.
  function menusVisible() {
    return window.matchMedia('(min-width: 992px)').matches;
  }

  function highlight(step) {
    if (!navbar) return;
    var id = step.getAttribute('data-tour-target');
    navbar.querySelectorAll('.nav-item').forEach(function (item) {
      item.classList.remove('tour-lit');
    });
    document.body.classList.toggle('tour-guiding', !!id && menusVisible());
    if (!id || !menusVisible()) return;
    var link = document.getElementById(id);
    var item = link && link.closest('.nav-item');
    if (item) item.classList.add('tour-lit');
  }

  function render() {
    steps.forEach(function (s, i) { s.hidden = i !== at; });
    Array.prototype.slice.call(dots.children).forEach(function (d, i) {
      d.classList.toggle('is-at', i === at);
    });
    now.textContent = String(at + 1);
    back.disabled = at === 0;
    next.textContent = at === steps.length - 1 ? LAST : 'Next';
    highlight(steps[at]);
  }

  // Changing step does not move focus. The stage is a polite live region, so a
  // screen reader hears the new step anyway, and Next stays under the pointer
  // and under the keyboard -- moving focus to the heading each time would make
  // a keyboard visitor tab back to Next for every single step.
  function go(to) {
    at = Math.max(0, Math.min(steps.length - 1, to));
    render();
  }

  function open(startAt) {
    returnTo = document.activeElement;
    tour.hidden = false;
    document.body.classList.add('tour-active');
    if (navbar) navbar.classList.add('tour-above');
    go(typeof startAt === 'number' ? startAt : 0);
    card.focus();
  }

  function close() {
    tour.hidden = true;
    document.body.classList.remove('tour-active', 'tour-guiding');
    if (navbar) {
      navbar.classList.remove('tour-above');
      navbar.querySelectorAll('.nav-item').forEach(function (item) {
        item.classList.remove('tour-lit');
      });
    }
    remember();
    if (returnTo && document.contains(returnTo)) returnTo.focus();
    returnTo = null;
  }

  // ---- build the dots ----
  steps.forEach(function () {
    var d = document.createElement('span');
    d.className = 'tour-dot';
    dots.appendChild(d);
  });
  total.textContent = String(steps.length);

  // ---- wiring ----
  next.addEventListener('click', function () {
    if (at === steps.length - 1) close(); else go(at + 1);
  });
  back.addEventListener('click', function () { go(at - 1); });
  tour.querySelectorAll('[data-tour-dismiss]').forEach(function (el) {
    el.addEventListener('click', close);
  });

  // A link inside a step is a real destination: let it navigate, but do not
  // leave the "seen" flag unset, or the tour reopens on the way back.
  tour.addEventListener('click', function (e) {
    if (e.target.closest('.tour-links a')) remember();
  });

  tour.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowRight' && at < steps.length - 1) { e.preventDefault(); go(at + 1); return; }
    if (e.key === 'ArrowLeft' && at > 0) { e.preventDefault(); go(at - 1); return; }
    if (e.key !== 'Tab') return;

    // Keep Tab inside the dialog: it is modal, and everything behind it is
    // covered, so tabbing out would land the focus ring somewhere invisible.
    var focusable = card.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    var live = Array.prototype.filter.call(focusable, function (el) {
      return el.offsetParent !== null;
    });
    if (!live.length) return;
    var first = live[0];
    var last = live[live.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // Crossing the lg breakpoint mid-tour changes whether the menu is on screen.
  window.addEventListener('resize', function () {
    if (!tour.hidden) highlight(steps[at]);
  });

  // ---- entry points ----
  if (opener) {
    opener.hidden = false;                 // only offer it once the script is here
    opener.addEventListener('click', function () { open(0); });
  }

  if (!alreadySeen()) open(0);
})();
