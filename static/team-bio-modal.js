(function () {
  // Click (or Enter/Space) any .polaroid-has-bio card to open a modal with a
  // bigger version of its photo -- still flippable, same front/back images,
  // same hw-flip mechanism -- and the member's self-introduction below it.
  // The photo node is cloned from the card itself, square crop and all: the
  // same 1:1 ratio and per-photo object-position/zoom tuning as the grid
  // thumbnail, unchanged, just scaled up. That scaling works because those
  // tweaks are all percentage-based, not fixed pixels.

  function buildOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'team-bio-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="team-bio-card">' +
        '<button type="button" class="team-bio-close" aria-label="Close">&times;</button>' +
        '<div class="team-bio-photo"></div>' +
        '<div class="team-bio-text">' +
          '<h3 class="team-bio-name"></h3>' +
          '<div class="team-bio-paragraphs"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function init() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.polaroid-has-bio'));
    if (!cards.length) return;

    var overlay = buildOverlay();
    var photoSlot = overlay.querySelector('.team-bio-photo');
    var nameEl = overlay.querySelector('.team-bio-name');
    var paragraphsEl = overlay.querySelector('.team-bio-paragraphs');
    var closeBtn = overlay.querySelector('.team-bio-close');
    var lastFocused = null;

    function open(card) {
      var photo = card.querySelector('.polaroid-photo');
      var name = card.querySelector('.polaroid-caption');
      var bio = card.querySelector('.polaroid-bio');
      if (!photo || !bio) return;

      photoSlot.innerHTML = '';
      photoSlot.appendChild(photo.cloneNode(true));
      nameEl.textContent = name ? name.textContent : '';
      paragraphsEl.innerHTML = bio.innerHTML;

      lastFocused = document.activeElement;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('team-bio-locked');
      closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('team-bio-locked');
      photoSlot.innerHTML = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () { open(card); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(card);
        }
      });
    });

    closeBtn.addEventListener('click', close);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
