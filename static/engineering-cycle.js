(function () {
  "use strict";

  /* Engineering: the DBTL ring keeps pace with the reader.
   *
   * The ring never turns. Reading down the four stages lights it clockwise,
   * the way its arrows point: each arrow fills from its tail to its head while
   * its stage is read, with a bright point at the leading edge, and the head
   * of Learn is reached at the foot of its part. Progress is measured in
   * stages -- 0 before Design, 1.5 halfway through Build, 4 at the end -- and
   * each stage runs from the moment its heading reaches the spot a click on
   * its arrow would scroll it to, until the next one does.
   *
   * The stage being read is marked (aria-current) and its arrow stands out
   * from the dimmed ones ahead; a label turns dark once the sweep has passed
   * under it. Without this script every arrow shows lit.
   *
   * On a narrow screen the ring floats in a corner (style.css); it is shown
   * only while the stages themselves are on screen, so it does not sit over
   * the banner or the footer.
   */
  /* The page can hold more than one cycle (Detect, then Inhibition): each
   * .eng-dbtl block is tracked on its own, against its own four stages. */
  var SPAN = 94;
  function clamp(value) { return Math.max(0, Math.min(1, value)); }

  function track(block) {
    var figure = block.querySelector(".eng-cycle");
    var spark = block.querySelector(".eng-cycle-spark");
    var rail = block.querySelector(".eng-dbtl-rail");
    var stages = block.querySelector(".eng-dbtl-stages");
    var sections = Array.prototype.slice.call(block.querySelectorAll(".eng-dbtl-stage"));
    if (!figure || !spark || !rail || !stages || !sections.length) return null;
    rail.classList.add("is-tracked");

    /* A round that skipped a stage has fewer sweeps than the ring has arrows,
       so each is matched to its section by stage name rather than by position,
       and each stage lights from its own bearing on the ring. */
    var steps = sections.map(function (section) {
      var stage = section.getAttribute("data-stage");
      return {
        bearing: parseFloat(section.getAttribute("data-bearing")) || 0,
        sweep: figure.querySelector('.eng-cycle-sweep[data-stage="' + stage + '"]'),
        link: figure.querySelector('.eng-cycle-link[data-stage="' + stage + '"]'),
        label: figure.querySelector('.eng-cycle-label[data-stage="' + stage + '"]')
      };
    });
    /* Each arrow spans 94deg, from its tail 47deg before its bearing to the tip
       of its head 47deg after; the bearings are a quarter turn apart, starting
       at 45deg for Design (engineering.html). */

    function progress() {
      var y = window.pageYOffset;
      /* The last stage ends when this block's foot is most of the way up the
         screen, or at the foot of the page, whichever comes first. */
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
      spark.setAttribute("transform", "rotate(" + edge + " 200 200)");
      figure.classList.toggle("is-started", p > 0);
      figure.classList.toggle("is-complete", p >= sections.length);

      figure.setAttribute("data-active", sections[current].getAttribute("data-stage"));
      steps.forEach(function (step, index) {
        if (step.link) {
          if (index === current) step.link.setAttribute("aria-current", "step");
          else step.link.removeAttribute("aria-current");
        }
        /* A label sits at the middle of its arrow, half a stage in. */
        if (step.label) step.label.classList.toggle("is-lit", p >= index + 0.5);
      });

      var box = stages.getBoundingClientRect();
      rail.classList.toggle("is-in-view", box.top < window.innerHeight * 0.75 && box.bottom > window.innerHeight * 0.25);
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
