(function () {
  'use strict';
  if (!window.rxRevealScan) return;
  document.querySelectorAll('.edu-session-block').forEach(function (block) {
    var kids = block.children, idx = 0;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.hasAttribute('data-reveal')) continue;
      if (el.classList.contains('edu-quote')) el.setAttribute('data-reveal', 'clip');
      else el.setAttribute('data-reveal', '');
      el.style.setProperty('--rx-d', String(Math.min(idx * 55, 330)));
      idx++;
    }
  });
  window.rxRevealScan();
})();
