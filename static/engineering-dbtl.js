(function () {
  // Engineering page: the four jigsaw pieces open the matching stage panel.
  // No library, no inline script -- everything the wiki loads comes from here.
  var root = document.getElementById('dbtl');
  if (!root) return;

  var puzzle = document.getElementById('dbtlPuzzle');
  var panels = document.getElementById('dbtlPanels');
  var back = document.getElementById('dbtlBack');
  var pieces = Array.prototype.slice.call(root.querySelectorAll('.dbtl-piece'));
  var articles = Array.prototype.slice.call(root.querySelectorAll('.dbtl-panel'));
  var tabs = Array.prototype.slice.call(root.querySelectorAll('.dbtl-switch button'));
  var STAGES = ['design', 'build', 'test', 'learn'];

  function show(stage) {
    if (STAGES.indexOf(stage) === -1) return;

    puzzle.hidden = true;
    panels.hidden = false;
    root.setAttribute('data-open', stage);

    articles.forEach(function (a) {
      a.hidden = a.getAttribute('data-stage') !== stage;
    });
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-goto') === stage;
      t.classList.toggle('is-current', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    // Move focus into the opened stage so a keyboard reader carries on from
    // there rather than from the top of the page.
    var open = articles.filter(function (a) { return !a.hidden; })[0];
    if (open) open.focus({ preventScroll: true });
  }

  function close() {
    panels.hidden = true;
    puzzle.hidden = false;
    root.removeAttribute('data-open');
    var stage = root.getAttribute('data-last') || 'design';
    var piece = pieces.filter(function (p) {
      return p.getAttribute('data-stage') === stage;
    })[0];
    if (piece && piece.focus) piece.focus();
  }

  pieces.forEach(function (piece) {
    var stage = piece.getAttribute('data-stage');
    function open() {
      root.setAttribute('data-last', stage);
      show(stage);
    }
    piece.addEventListener('click', open);
    // <g> is not a button, so spell out the keyboard contract ourselves.
    piece.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        open();
      }
    });
  });

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var stage = t.getAttribute('data-goto');
      root.setAttribute('data-last', stage);
      show(stage);
    });
  });

  if (back) back.addEventListener('click', close);

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !panels.hidden) close();
  });

  // A link straight to one stage, e.g. .../engineering#build, opens it.
  function fromHash() {
    var stage = (location.hash || '').replace('#', '');
    if (STAGES.indexOf(stage) !== -1) {
      root.setAttribute('data-last', stage);
      show(stage);
    }
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
