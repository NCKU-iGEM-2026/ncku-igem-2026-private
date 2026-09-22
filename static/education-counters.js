(function () {
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    var suffix = el.getAttribute('data-count-suffix') || '';
    var duration = 900;
    var start = null;

    // 每次觸發都換一個新的 token，讓上一次還沒跑完的動畫自己停止，避免疊加
    var token = {};
    el._countToken = token;
    el.textContent = '0' + suffix;

    function tick(timestamp) {
      if (el._countToken !== token) return;
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function init() {
    var numbers = Array.prototype.slice.call(document.querySelectorAll('.edu-stat-number[data-count-to]'));
    if (!numbers.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
      });
    }, { threshold: 0.4 });

    numbers.forEach(function (el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
