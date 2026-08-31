(function () {
  // Notebook: the chips pick one part of the team out of the timeline.
  // The hiding itself is CSS off [data-filter] on the root, so this file only
  // sets an attribute -- and the whole record stays readable with JavaScript
  // switched off, which is why the chip bar starts hidden in the markup.
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

    // Count what is left rather than trusting the numbers written into the
    // chips: those are maintained by hand as entries are added, and this line
    // is what a screen reader hears.
    // The trailing "week 18 onwards" node is always on screen and is not a
    // week that has been through yet, so it is left out of both totals.
    var weeks = root.querySelectorAll('.nb-week:not(.nb-week-open)');
    var shown = 0, entries = 0;
    Array.prototype.forEach.call(weeks, function (w) {
      if (w.offsetParent === null) return;
      shown++;
      Array.prototype.forEach.call(w.querySelectorAll('.nb-entry'), function (e) {
        if (e.offsetParent !== null) entries++;
      });
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

  bar.hidden = false;
  apply('all');
}());
