(function () {
  "use strict";

  var SPAN = 94;
  function clamp(value) { return Math.max(0, Math.min(1, value)); }

  function track(block) {
    var figure = block.querySelector(".eng-cycle");
    var spark = block.querySelector(".eng-cycle-spark");
    var rail = block.querySelector(".eng-dbtl-rail");
    var stages = block.querySelector(".eng-dbtl-stages");
    var sections = Array.prototype.slice.call(block.querySelectorAll(".eng-dbtl-stage"));
    if (!figure || !rail || !stages || !sections.length) return null;
    rail.classList.add("is-tracked");

    var steps = sections.map(function (section) {
      var stage = section.getAttribute("data-stage");
      return {
        bearing: parseFloat(section.getAttribute("data-bearing")) || 0,
        sweep: figure.querySelector('.eng-cycle-sweep[data-stage="' + stage + '"]'),
        link: figure.querySelector('.eng-cycle-link[data-stage="' + stage + '"]'),
        label: figure.querySelector('.eng-cycle-label[data-stage="' + stage + '"]')
      };
    });

    function progress() {
      var y = window.pageYOffset;
      var bottom = stages.getBoundingClientRect().bottom + y;
      var end = Math.min(document.documentElement.scrollHeight - window.innerHeight,
                         bottom - window.innerHeight * 0.3);
      var starts = sections.map(function (section) {
        var margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
        return section.getBoundingClientRect().top + y - margin - 1;
      });
      var done = 0;
      for (var i = 0; i < starts.length; i++) {
        if (y < starts[i]) break;
        var next = i + 1 < starts.length ? starts[i + 1] : end;
        done = i + (next > starts[i] ? clamp((y - starts[i]) / (next - starts[i])) : 1);
      }
      return done;
    }

    return function update() {
      var p = progress();
      steps.forEach(function (step, index) {
        if (!step.sweep) return;
        var degrees = SPAN * clamp(p - index);
        step.sweep.setAttribute("stroke-dasharray", degrees + " " + (360 - degrees));
      });
      var current = Math.min(sections.length - 1, Math.floor(p));
      var edge = steps[current].bearing - SPAN / 2 + SPAN * clamp(p - current);
      if (spark) spark.setAttribute("transform", "rotate(" + edge + " 200 200)");
      figure.classList.toggle("is-started", p > 0);
      figure.classList.toggle("is-complete", p >= sections.length);

      figure.setAttribute("data-active", sections[current].getAttribute("data-stage"));
      steps.forEach(function (step, index) {
        if (step.link) {
          if (index === current) step.link.setAttribute("aria-current", "step");
          else step.link.removeAttribute("aria-current");
        }
        if (step.label) step.label.classList.toggle("is-lit", p >= index + 0.5);
      });

      var box = stages.getBoundingClientRect();
      rail.classList.toggle("is-in-view", box.top < window.innerHeight * 0.5 && box.bottom > window.innerHeight * 0.5);
    };
  }

  var updates = Array.prototype.slice.call(document.querySelectorAll(".eng-dbtl"))
    .map(track)
    .filter(Boolean);
  if (!updates.length) return;
  var ticking = false;

  function update() {
    ticking = false;
    updates.forEach(function (fn) { fn(); });
  }

  function request() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("load", request);
})();
