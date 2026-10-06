(function () {
  "use strict";

  /* Hardware page — the small drawings that move.
   *
   * Each drawing is complete in the markup: every dot, bar and step is there
   * and in its final place, so the page says the same thing without this
   * file. All this does is hold a drawing back until it scrolls into view
   * and then let its marks arrive one after another: an insertion at a time,
   * a step at a time.
   *
   * It does nothing for a reader who has asked the system for less motion.
   */

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
