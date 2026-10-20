(function () {
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

  btn.disabled = false;
})();
