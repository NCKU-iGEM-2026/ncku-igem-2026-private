(function () {
  'use strict';
  if (!('IntersectionObserver' in window) || !document.getAnimations) return;

  var hosts = new Map();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var targets = hosts.get(e.target);
      if (!targets) return;
      targets.forEach(function (t) {
        if (e.isIntersecting) t.removeAttribute('data-anim-off');
        else t.setAttribute('data-anim-off', '');
      });
    });
  }, { rootMargin: '120px 0px' });

  function hostOf(el) {
    return (el instanceof SVGElement && el.ownerSVGElement) ? el.ownerSVGElement : el;
  }
  function fixed(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (getComputedStyle(n).position === 'fixed') return true;
    }
    return false;
  }

  function scan() {
    document.getAnimations().forEach(function (a) {
      if (typeof CSSAnimation !== 'undefined' && !(a instanceof CSSAnimation)) return;
      var el = a.effect && a.effect.target;
      if (!el || el.nodeType !== 1 || el.hasAttribute('data-anim-gated')) return;
      var timing = a.effect.getTiming ? a.effect.getTiming() : null;
      if (!timing || timing.iterations !== Infinity) return;
      if (el.closest('#siteLoader')) return;
      if (fixed(el)) return;
      el.setAttribute('data-anim-gated', '');
      var host = hostOf(el);
      if (!host) return;
      var set = hosts.get(host);
      if (!set) { set = []; hosts.set(host, set); io.observe(host); }
      set.push(el);
    });
  }

  function start() { scan(); setTimeout(scan, 2500); }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
