(function () {
  function isDecorationMode() {
    return document.body.classList.contains('decoration-mode');
  }

  function startDrag(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (!isDecorationMode()) return;

    var card = e.currentTarget;
    var page = card.closest('.notebook-page');
    if (!page) return;

    var pageRect = page.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();

    if (!card.classList.contains('is-dragged')) {
      card.style.position = 'absolute';
      card.style.left = (cardRect.left - pageRect.left) + 'px';
      card.style.top = (cardRect.top - pageRect.top) + 'px';
      card.style.margin = '0';
      card.classList.add('is-dragged');
    }

    var startX = e.clientX;
    var startY = e.clientY;
    var startLeft = parseFloat(card.style.left);
    var startTop = parseFloat(card.style.top);

    card.setPointerCapture(e.pointerId);
    card.classList.add('dragging');

    function onMove(ev) {
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      var maxLeft = Math.max(page.clientWidth - card.offsetWidth, 0);
      var maxTop = Math.max(page.clientHeight - card.offsetHeight, 0);
      var newLeft = Math.min(Math.max(startLeft + dx, 0), maxLeft);
      var newTop = Math.min(Math.max(startTop + dy, 0), maxTop);
      card.style.left = newLeft + 'px';
      card.style.top = newTop + 'px';
    }

    function onUp(ev) {
      card.releasePointerCapture(ev.pointerId);
      card.classList.remove('dragging');
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
    }

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerup', onUp);
  }

  function resetNotebook() {
    document.querySelectorAll('.polaroid.is-dragged').forEach(function (card) {
      card.style.position = '';
      card.style.left = '';
      card.style.top = '';
      card.style.margin = '';
      card.classList.remove('is-dragged');
    });
  }

  function toggleDecorationMode() {
    var toggleBtn = document.querySelector('.notebook-mode-toggle');
    if (!toggleBtn) return;

    var icon = toggleBtn.querySelector('.notebook-icon');
    var tooltip = toggleBtn.querySelector('.notebook-tooltip');

    var active = document.body.classList.toggle('decoration-mode');
    if (icon) icon.textContent = active ? '🏃‍♀️' : '🎨';
    if (tooltip) tooltip.textContent = active ? 'Exit Decoration Mode' : 'Decoration Mode';
    toggleBtn.setAttribute('aria-pressed', active ? 'true' : 'false');

    if (!active) {
      resetNotebook();
    }
  }

  function init() {
    document.querySelectorAll('.polaroid').forEach(function (card) {
      card.addEventListener('pointerdown', startDrag);
    });

    var resetBtn = document.querySelector('.notebook-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetNotebook);
    }

    var toggleBtn = document.querySelector('.notebook-mode-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleDecorationMode);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
