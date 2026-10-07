/* ============================================================
   HP-NEXUS — 三頁共用：文字說明逐段浮現
   把 .edu-session-block 的直接子元素依序標上 data-reveal＋錯開延遲，
   交給 motion.js 的 IntersectionObserver（window.rxRevealScan）執行。
   reduced-motion：motion.js 會直接全部顯示，這裡不做事。
   ============================================================ */
(function () {
  'use strict';
  if (!window.rxRevealScan) return;
  document.querySelectorAll('.edu-session-block').forEach(function (block) {
    var kids = block.children, idx = 0;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.hasAttribute('data-reveal')) continue;
      /* 圖片與引言給較重的揭露效果 */
      if (el.classList.contains('edu-quote')) el.setAttribute('data-reveal', 'clip');
      else el.setAttribute('data-reveal', '');
      el.style.setProperty('--rx-d', String(Math.min(idx * 55, 330)));
      idx++;
    }
  });
  window.rxRevealScan();
})();
