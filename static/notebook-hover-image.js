(function () {
  // Any .nb-col carrying data-hover-img shows that photo after the pointer
  // rests on it for 1s, and hides it the moment the pointer leaves -- so a
  // quick pass across the ledger never flashes it, only a deliberate pause.
  var HOVER_DELAY = 300;

  var cols = Array.prototype.slice.call(document.querySelectorAll('.nb-col[data-hover-img]'));
  if (!cols.length) return;

  var popup = document.createElement('img');
  popup.className = 'nb-hover-img';
  popup.alt = '';
  document.body.appendChild(popup);

  var timer = null;
  var activeCol = null;

  function hide() {
    clearTimeout(timer);
    timer = null;
    activeCol = null;
    popup.classList.remove('is-visible');
  }

  cols.forEach(function (col) {
    col.addEventListener('mouseenter', function () {
      activeCol = col;
      timer = setTimeout(function () {
        if (activeCol !== col) return;
        popup.src = col.getAttribute('data-hover-img');
        var r = col.getBoundingClientRect();
        popup.style.left = (r.left + r.width / 2) + 'px';
        popup.style.top = (r.top - 12) + 'px';
        popup.classList.add('is-visible');
      }, HOVER_DELAY);
    });
    col.addEventListener('mouseleave', hide);
  });

  // A layout shift while the popup is showing would leave it pointing at the
  // wrong cell, so any scroll or resize just closes it.
  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('resize', hide);
})();
