(function () {
  // Notebook: the three counts above the timeline are also its filter. All
  // three start on; pressing one hides that team, pressing it again brings it
  // back, and they do not affect each other.
  //
  // The hiding itself is CSS off data-hidden on the root, so this file only
  // maintains a list of which teams are switched off. The weeks are native
  // <details>; opening and closing them is the browser's job, not this file's.
  var root = document.getElementById('notebook');
  if (!root) return;

  var bar = document.getElementById('nbToggles');
  var status = document.getElementById('nbStatus');
  var toggles = Array.prototype.slice.call(root.querySelectorAll('.nb-toggle'));
  if (!bar || !toggles.length) return;

  var ORDER = ['wet', 'dry', 'hp'];
  var LABEL = { wet: 'Wet Lab', dry: 'Dry Lab', hp: 'Human Practices' };
  var on = { wet: true, dry: true, hp: true };

  function sentence(names) {
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function apply() {
    var shown = ORDER.filter(function (t) { return on[t]; });
    root.setAttribute('data-hidden', ORDER.filter(function (t) {
      return !on[t];
    }).join(' '));

    toggles.forEach(function (b) {
      var t = b.getAttribute('data-track');
      b.classList.toggle('is-off', !on[t]);
      b.setAttribute('aria-pressed', on[t] ? 'true' : 'false');
    });

    // Count what is left. Visibility is read off the week, never off the
    // entries: a shut week renders nothing inside it, so counting rendered
    // entries would report zero for a page the reader has not opened yet.
    // The trailing "week 18 onwards" node has not been through yet and is
    // left out of both totals.
    var weeks = root.querySelectorAll('.nb-week:not(.nb-week-open)');
    var nWeeks = 0, nEntries = 0;
    Array.prototype.forEach.call(weeks, function (w) {
      if (getComputedStyle(w).display === 'none') return;
      nWeeks++;
      shown.forEach(function (t) {
        nEntries += w.querySelectorAll('.nb-entry[data-track="' + t + '"]').length;
      });
    });

    if (!shown.length) {
      status.textContent =
        'No team is showing. Choose one above to bring it back.';
    } else if (shown.length === ORDER.length) {
      status.textContent = nEntries + ' milestones across ' + nWeeks + ' weeks.';
    } else {
      status.textContent = nEntries + ' milestones from '
        + sentence(shown.map(function (t) { return LABEL[t]; }))
        + ', across ' + nWeeks + ' weeks.';
    }
  }

  toggles.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-track');
      on[t] = !on[t];
      apply();
    });
  });

  // On paper the filter means nothing and a shut week prints as a bare line.
  // Show everything for the printer and put the reader's page back afterwards.
  var reopened = [], wasHidden = '';
  window.addEventListener('beforeprint', function () {
    reopened = Array.prototype.filter.call(
      root.querySelectorAll('details.nb-card'), function (d) { return !d.open; });
    reopened.forEach(function (d) { d.open = true; });
    wasHidden = root.getAttribute('data-hidden') || '';
    root.setAttribute('data-hidden', '');
  });
  window.addEventListener('afterprint', function () {
    reopened.forEach(function (d) { d.open = false; });
    reopened = [];
    root.setAttribute('data-hidden', wasHidden);
  });

  // Enabled only now: without this file they are three counts, not controls.
  toggles.forEach(function (b) { b.disabled = false; });
  apply();
}());
