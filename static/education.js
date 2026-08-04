(function () {
  function filterCards(category, buttons, cards) {
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });

    cards.forEach(function (card) {
      var match = category === 'all' || card.getAttribute('data-category') === category;
      card.classList.toggle('edu-hidden', !match);
    });
  }

  function init() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.edu-filter-btn'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.edu-pin, .edu-legend-item'));
    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterCards(btn.getAttribute('data-category'), buttons, cards);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
