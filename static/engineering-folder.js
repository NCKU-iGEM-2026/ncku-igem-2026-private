(function () {
  "use strict";

  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  Array.prototype.slice.call(document.querySelectorAll(".eng-folder")).forEach(function (folder) {
    var cards = Array.prototype.slice.call(folder.querySelectorAll(".eng-folder-page"));
    var spines = cards.map(function (card) { return card.querySelector(".eng-folder-spine"); });
    if (!cards.length || spines.indexOf(null) !== -1) return;

    var opened = Math.max(0, cards.findIndex(function (card) {
      return !card.classList.contains("is-skipped");
    }));
    var shown = -1;

    function show(index) {
      if (index === shown) return;
      shown = index;
      cards.forEach(function (card, i) {
        card.classList.toggle("is-before", i < index);
        card.classList.toggle("is-open", i === index);
        card.classList.toggle("is-after", i > index);
        card.style.setProperty("--a", String(Math.max(0, i - index)));
      });
      spines.forEach(function (spine, i) {
        spine.setAttribute("aria-pressed", i === index ? "true" : "false");
      });
    }

    function open(index) {
      opened = index;
      show(index);
    }

    cards.forEach(function (card, index) {
      card.addEventListener("mouseenter", function () { show(index); });
      card.addEventListener("click", function (event) {
        if (event.target.closest("a")) return;
        open(index);
      });
      spines[index].addEventListener("focus", function () { show(index); });
      spines[index].addEventListener("keydown", function (event) {
        var step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        var next = Math.max(0, Math.min(cards.length - 1, index + step));
        open(next);
        spines[next].focus();
      });
    });
    folder.addEventListener("mouseleave", function () { show(opened); });
    folder.addEventListener("focusout", function (event) {
      if (!folder.contains(event.relatedTarget)) show(opened);
    });

    if (!still) {
      folder.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        var card = cards[shown];
        var box = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((event.clientX - box.left) / box.width * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((event.clientY - box.top) / box.height * 100).toFixed(1) + "%");
      });
    }

    folder.classList.add("is-book");
    open(opened);
  });
})();
