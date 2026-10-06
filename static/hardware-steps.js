(function () {
  "use strict";

  /* Hardware page — placing the cuvette, in photographs.
   *
   * Two decks of photographs stand side by side: the steps version 1 needed
   * to place a cuvette, and the one step version 2 needs. Every photograph
   * and its caption is in the page, in order, and that is the whole of it
   * without this file: two rows of small pictures.
   *
   * With it, each deck shows one photograph at a time and both keep the same
   * beat, turning by themselves like a slide show. Version 1 walks through
   * its steps; version 2 reaches its last photograph on the first step and
   * waits there, which is the comparison.
   *
   * It plays while it is on screen and keeps playing with the pointer over
   * it: only the Pause button stops it. The arrows turn it by hand and it
   * carries on from there. Where the system asks for less motion it does not
   * start by itself; Play starts it and the arrows still step it.
   */

  var roots = document.querySelectorAll("[data-hw-place]");
  if (!roots.length) return;

  var calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var STEP = 2400, HOLD = 3600;        /* ms on a step, and on the last one before starting over */

  Array.prototype.forEach.call(roots, function (root) {
    var decks = Array.prototype.map.call(root.querySelectorAll(".hw-place-slides"), function (list) {
      return Array.prototype.slice.call(list.children);
    }).filter(function (d) { return d.length; });
    if (!decks.length) return;

    var beats = Math.max.apply(null, decks.map(function (d) { return d.length; }));
    if (beats < 2) return;

    var beat = 0, timer = null;
    var playing = !calm;

    function button(cls, label, text, act) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hw-place-btn " + cls;
      b.setAttribute("aria-label", label);
      b.textContent = text;
      b.addEventListener("click", act);
      return b;
    }

    var ctrl = document.createElement("div");
    ctrl.className = "hw-place-ctrl";

    var at = document.createElement("span");
    at.className = "hw-place-at";

    /* one mark to a beat, so it can be seen how far along it is */
    var marks = document.createElement("span");
    marks.className = "hw-place-marks";
    marks.setAttribute("aria-hidden", "true");
    for (var m = 0; m < beats; m++) marks.appendChild(document.createElement("i"));

    var toggle = button("hw-place-toggle", "", "", function () {
      playing = !playing;
      label();
      run();
    });

    ctrl.appendChild(button("hw-place-prev", "Previous step", "‹", function () { show(beat - 1); run(); }));
    ctrl.appendChild(at);
    ctrl.appendChild(button("hw-place-next", "Next step", "›", function () { show(beat + 1); run(); }));
    ctrl.appendChild(toggle);
    ctrl.appendChild(marks);
    root.appendChild(ctrl);

    function label() {
      toggle.textContent = playing ? "Pause" : "Play";
      toggle.setAttribute("aria-label", playing ? "Pause the steps" : "Play the steps");
      /* read a step out when it was asked for, not while it plays by itself */
      at.setAttribute("aria-live", playing ? "off" : "polite");
    }

    function show(n) {
      beat = ((n % beats) + beats) % beats;
      decks.forEach(function (deck) {
        var on = Math.min(beat, deck.length - 1);
        deck.forEach(function (slide, i) {
          slide.classList.toggle("is-on", i === on);
          slide.setAttribute("aria-hidden", i === on ? "false" : "true");
        });
      });
      Array.prototype.forEach.call(marks.children, function (mark, i) {
        mark.classList.toggle("is-on", i === beat);
        mark.classList.toggle("is-done", i < beat);
      });
      at.textContent = beat === 0 ? "Before" : "Step " + beat + " of " + (beats - 1);
    }

    /* Is it where a reader can see it? Asked at each turn rather than left to
       an observer: a build that is not showing has no size, and a deck far
       off screen should not run through its steps unseen. */
    function onScreen() {
      if (document.hidden) return false;
      var r = root.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      return r.width > 0 && r.bottom > vh * 0.15 && r.top < vh * 0.85;
    }

    /* (Re)start the wait for the next turn. Called after every change, so a
       step turned by hand gets its full time before the next one. Off screen
       it keeps waiting and turns nothing. */
    function run() {
      clearTimeout(timer);
      if (!playing) return;
      timer = setTimeout(function () {
        if (onScreen()) show(beat + 1);
        run();
      }, beat === beats - 1 ? HOLD : STEP);
    }

    root.classList.add("is-live");
    label();
    show(0);
    run();
  });
})();
