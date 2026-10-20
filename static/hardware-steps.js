(function () {
  "use strict";

  var roots = document.querySelectorAll("[data-hw-place]");
  if (!roots.length) return;

  var calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var STEP = 2400, HOLD = 3600;

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

    function onScreen() {
      if (document.hidden) return false;
      var r = root.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      return r.width > 0 && r.bottom > vh * 0.15 && r.top < vh * 0.85;
    }

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
