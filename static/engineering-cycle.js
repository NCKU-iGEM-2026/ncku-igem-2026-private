(function () {
  "use strict";

  /* Engineering: the DBTL ring keeps pace with the reader.
   *
   * The ring never turns. Reading down the four stages lights it clockwise,
   * the way its arrows point: each arrow fills from its tail to its head while
   * its stage is read, with a bright point at the leading edge, and the head
   * of Learn is reached at the foot of the page. Progress is measured in
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
  var figure = document.getElementById("eng-cycle");
  var spark = document.getElementById("eng-cycle-spark");
  var rail = document.querySelector(".eng-dbtl-rail");
  var stages = document.querySelector(".eng-dbtl-stages");
  var sections = Array.prototype.slice.call(document.querySelectorAll(".eng-dbtl-stage"));
  if (!figure || !spark || !rail || !stages || !sections.length) return;
  rail.classList.add("is-tracked");

  var sweeps = Array.prototype.slice.call(figure.querySelectorAll(".eng-cycle-sweep"));
  var links = Array.prototype.slice.call(figure.querySelectorAll(".eng-cycle-link"));
  var labels = Array.prototype.slice.call(figure.querySelectorAll(".eng-cycle-label"));
  /* Each arrow spans 94deg, from its tail 47deg before its bearing to the tip
     of its head 47deg after; the bearings are a quarter turn apart, starting
     at 45deg for Design (engineering.html). */
  var SPAN = 94;
  var ticking = false;

  function clamp(value) { return Math.max(0, Math.min(1, value)); }

  function progress() {
    var y = window.pageYOffset;
    var end = document.documentElement.scrollHeight - window.innerHeight;
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

  function update() {
    ticking = false;
    var p = progress();
    sweeps.forEach(function (sweep, index) {
      var degrees = SPAN * clamp(p - index);
      sweep.setAttribute("stroke-dasharray", degrees + " " + (360 - degrees));
    });
    var current = Math.min(sections.length - 1, Math.floor(p));
    var edge = 45 + 90 * current - SPAN / 2 + SPAN * clamp(p - current);
    spark.setAttribute("transform", "rotate(" + edge + " 200 200)");
    figure.classList.toggle("is-started", p > 0);
    figure.classList.toggle("is-complete", p >= sections.length);

    figure.setAttribute("data-active", sections[current].getAttribute("data-stage"));
    links.forEach(function (link, index) {
      if (index === current) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    /* A label sits at the middle of its arrow, half a stage in. */
    labels.forEach(function (label, index) {
      label.classList.toggle("is-lit", p >= index + 0.5);
    });

    var box = stages.getBoundingClientRect();
    rail.classList.toggle("is-in-view", box.top < window.innerHeight * 0.75 && box.bottom > window.innerHeight * 0.25);
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
