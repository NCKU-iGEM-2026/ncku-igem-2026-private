(function () {
  // Notebook: the chips pick one part of the team out of the timeline.
  // The hiding itself is CSS off [data-filter] on the root, so this file only
  // sets an attribute -- and the whole record stays readable with JavaScript
  // switched off, which is why the chip bar starts hidden in the markup.
  //
  // The weeks themselves are native <details>; opening and closing them is the
  // browser's job, not this file's.
  var root = document.getElementById('notebook');
  if (!root) return;

  var bar = document.getElementById('nbFilter');
  var status = document.getElementById('nbStatus');
  var chips = Array.prototype.slice.call(root.querySelectorAll('.nb-chip'));
  if (!bar || !chips.length) return;

  var LABEL = { all: 'all three teams', wet: 'Wet Lab', dry: 'Dry Lab',
                hp: 'Human Practices' };

  function apply(track) {
    if (!LABEL[track]) return;
    root.setAttribute('data-filter', track);

    chips.forEach(function (c) {
      var on = c.getAttribute('data-track') === track;
      c.classList.toggle('is-current', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // Count what the filter left rather than trusting the numbers on the chips.
    // Visibility is read off the week, never off the entries: a shut week
    // renders nothing inside it, so counting rendered entries would report
    // zero for a page the reader has simply not opened yet.
    //
    // The trailing "week 18 onwards" node is always on screen and has not been
    // through yet, so it is left out of both totals.
    var weeks = root.querySelectorAll('.nb-week:not(.nb-week-open)');
    var shown = 0, entries = 0;
    var sel = track === 'all' ? '.nb-entry' : '.nb-entry[data-track="' + track + '"]';
    Array.prototype.forEach.call(weeks, function (w) {
      if (getComputedStyle(w).display === 'none') return;
      shown++;
      entries += w.querySelectorAll(sel).length;
    });

    status.textContent = track === 'all'
      ? entries + ' milestones across ' + shown + ' weeks.'
      : entries + ' ' + LABEL[track] + ' milestones, in ' + shown + ' weeks.';
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      apply(c.getAttribute('data-track'));
    });
  });

  // A shut week prints as a bare line. Open them all for the printer and put
  // them back as they were, so printing does not disturb the reader's page.
  var reopened = [];
  window.addEventListener('beforeprint', function () {
    reopened = Array.prototype.filter.call(
      root.querySelectorAll('details.nb-card'), function (d) { return !d.open; });
    reopened.forEach(function (d) { d.open = true; });
  });
  window.addEventListener('afterprint', function () {
    reopened.forEach(function (d) { d.open = false; });
    reopened = [];
  });

  bar.hidden = false;
  apply('all');
}());
