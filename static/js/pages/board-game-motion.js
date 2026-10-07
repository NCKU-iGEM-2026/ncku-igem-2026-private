/* ============================================================
   BOARD-GAME-MOTION.JS — Board Game 頁的互動小動作
   1. 每一站的圓形圖示會朝滑鼠方向微傾（3D tilt）
   2. 背景那些飄浮的卡牌跟著捲動輕微視差
   全部是裝飾：沒有這支檔案，頁面照常運作；
   prefers-reduced-motion 或觸控裝置（沒有 hover）時整支不啟動。
   ============================================================ */
(function () {
  'use strict';
  var reduce = false, fine = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) {}
  if (reduce) return;

  // 1. tilt ------------------------------------------------------------
  if (fine) {
    document.querySelectorAll('.sgd-stop').forEach(function (stop) {
      var node = stop.querySelector('.sgd-node');
      if (!node) return;
      stop.addEventListener('pointermove', function (e) {
        var r = node.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / Math.max(r.width, 1);
        var dy = (e.clientY - (r.top + r.height / 2)) / Math.max(r.height, 1);
        // clamp so a pointer far across the row does not spin the circle
        dx = Math.max(-1.2, Math.min(1.2, dx));
        dy = Math.max(-1.2, Math.min(1.2, dy));
        node.style.setProperty('--ry', (dx * 14).toFixed(1) + 'deg');
        node.style.setProperty('--rx', (-dy * 14).toFixed(1) + 'deg');
      });
      stop.addEventListener('pointerleave', function () {
        node.style.removeProperty('--rx');
        node.style.removeProperty('--ry');
      });
    });
  }

  // 2. parallax on the drifting cards --------------------------------------
  var layer = document.querySelector('.bgm-cards');
  if (layer) {
    var ticking = false;
    var apply = function () {
      ticking = false;
      layer.style.transform = 'translate3d(0,' + (-window.scrollY * 0.06).toFixed(1) + 'px,0)';
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }
})();
