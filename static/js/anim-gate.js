/* ============================================================
   ANIM-GATE -- endless CSS animations stop while they are out of sight.

   Every page runs a few animations that never end: the sponsors' ticker in
   the footer, drifting photo strips, turning rings. Chrome hands one to the
   compositor only if it can see it when it starts. The footer's ticker
   starts while the footer is far below the fold and its logos have not
   loaded, so Chrome keeps it on the main thread for the whole visit, and it
   costs a style recalculation every frame on every page.

   This finds every endless CSS animation, watches the block it sits in, and
   pauses it while that block is out of view. When the block comes back the
   animation resumes from where it stopped -- and, started again while
   visible, it goes to the compositor. Nothing on screen changes.

   Paused with an attribute (data-anim-off), not with element.pause(): once
   script has paused a CSS animation the page's own :hover rules can no
   longer pause or resume it, and several rely on that.
   ============================================================ */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window) || !document.getAnimations) return;

  var hosts = new Map();     /* block watched -> the animated elements in it */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var targets = hosts.get(e.target);
      if (!targets) return;
      targets.forEach(function (t) {
        if (e.isIntersecting) t.removeAttribute('data-anim-off');
        else t.setAttribute('data-anim-off', '');
      });
    });
  }, { rootMargin: '200px 0px' });

  /* The block whose visibility decides: the nearest section-like ancestor,
     or failing that the element's parent. */
  function hostOf(el) {
    return el.closest('footer, header, section, aside, figure, nav, li, article') || el.parentElement;
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
      if (el.closest('#siteLoader')) return;               /* gone once the page has loaded */
      if (fixed(el)) return;                                /* always in view: nothing to save */
      el.setAttribute('data-anim-gated', '');
      var host = hostOf(el);
      if (!host) return;
      var set = hosts.get(host);
      if (!set) { set = []; hosts.set(host, set); io.observe(host); }
      set.push(el);
    });
  }

  /* Once the page is up, and again a little later for animations that only
     start when a script adds a class. */
  function start() { scan(); setTimeout(scan, 2500); }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
