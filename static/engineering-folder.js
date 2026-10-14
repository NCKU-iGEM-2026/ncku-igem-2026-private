(function () {
  "use strict";

  /* Engineering: each round's stages as a book of cards (engineering.html,
   * cycle_flows). One stage's line to a card, always in stage order.
   *
   * The card open lies in the middle at full width. The cards before it
   * fold away to the left until only their spines show; the cards after it
   * lie stacked behind it, each sticking out a spine's width further to the
   * right, so their edges show. Every card keeps its own place -- its spine
   * at its own step from the left, its edge at its own step from the right --
   * so whatever opens, the card under the pointer stays under it.
   *
   * Pointing at a spine or an edge opens that card, so a reader leafs
   * through without clicking; clicking keeps it open, and when the pointer
   * leaves the book the clicked card opens again. The spines are buttons:
   * focusing one opens its card, Enter keeps it, left/right step along.
   * The open card catches the light where the pointer is. (It does not lean
   * toward the pointer: a lean would move its edge out from under it, onto
   * the next card's, and open that one instead.)
   *
   * style.css does the folding from the classes set here: .is-before,
   * .is-open, .is-after, and --a (how far behind the open card an after
   * card lies). Without this script the cards stand one under another.
   */
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  Array.prototype.slice.call(document.querySelectorAll(".eng-folder")).forEach(function (folder) {
    var cards = Array.prototype.slice.call(folder.querySelectorAll(".eng-folder-page"));
    var spines = cards.map(function (card) { return card.querySelector(".eng-folder-spine"); });
    if (!cards.length || spines.indexOf(null) !== -1) return;

    /* the card clicked open: at first the first stage the round actually
       ran, not one carried over from the round before */
    var opened = Math.max(0, cards.findIndex(function (card) {
      return !card.classList.contains("is-skipped");
    }));
    var shown = -1;  /* the card open right now */

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
        /* the link to the full write-up does its own job */
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
    /* Leaving the book opens the card that was clicked open again. */
    folder.addEventListener("mouseleave", function () { show(opened); });
    folder.addEventListener("focusout", function (event) {
      if (!folder.contains(event.relatedTarget)) show(opened);
    });

    /* The open card catches the light where the pointer is. */
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
