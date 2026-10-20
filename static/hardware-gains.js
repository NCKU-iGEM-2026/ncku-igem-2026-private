(function () {
  "use strict";

  var drawings = Array.prototype.slice.call(document.querySelectorAll("[data-hw-anim]"));
  if (!drawings.length) return;
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-seen");
      seen.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  drawings.forEach(function (el) {
    el.classList.add("is-armed");
    seen.observe(el);
  });
})();
