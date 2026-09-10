(function () {
  // One button flips the ledger between oldest-first (as recorded) and
  // newest-first -- a straight DOM reverse of the <li> rows, including the
  // open-ended "19+" row, so it moves to the top once the newest week leads.
  var btn = document.getElementById('nbSort');
  var ledger = document.getElementById('nbLedger');
  if (!btn || !ledger) return;

  var label = btn.querySelector('.nb-sort-label');

  btn.addEventListener('click', function () {
    var asc = btn.getAttribute('data-order') === 'asc';
    var rows = Array.prototype.slice.call(ledger.children).reverse();
    var frag = document.createDocumentFragment();
    rows.forEach(function (row) { frag.appendChild(row); });
    ledger.appendChild(frag);

    btn.setAttribute('data-order', asc ? 'desc' : 'asc');
    label.textContent = asc ? 'Newest first' : 'Oldest first';
  });

  // Enabled only now: without this file it is a plain, inert label.
  btn.disabled = false;
})();
