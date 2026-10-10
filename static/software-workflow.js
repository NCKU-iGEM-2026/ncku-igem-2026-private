// Software page: the interactive workflow.
//
// The seven steps are written out in full in the page; this turns them into
// tabs. One panel shows at a time, chosen from the step bar, the Previous /
// Next buttons, or the arrow keys on the step bar. Without JavaScript every
// panel stays visible, one after another, and nothing is lost.
(function () {
  "use strict";

  const root = document.getElementById("swFlow");
  if (!root) return;

  const bar = root.querySelector(".sw-flow-steps");
  const tabs = Array.from(bar.querySelectorAll("button"));
  const panels = tabs.map((t) => document.getElementById("swFlow-" + t.dataset.step));
  const nav = root.querySelector(".sw-flow-nav");
  const count = nav.querySelector(".sw-flow-count");
  const prev = nav.querySelector('[data-move="-1"]');
  const next = nav.querySelector('[data-move="1"]');
  if (panels.some((p) => !p)) return;

  bar.setAttribute("role", "tablist");
  bar.setAttribute("aria-label", "Workflow steps");
  tabs.forEach((tab, i) => {
    tab.id = "swFlowTab-" + i;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[i].id);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", tab.id);
    panels[i].tabIndex = 0;
  });
  root.classList.add("is-live");
  bar.hidden = false;
  nav.hidden = false;

  let current = 0;

  function show(i, focusTab) {
    current = Math.max(0, Math.min(tabs.length - 1, i));
    tabs.forEach((tab, j) => {
      const on = j === current;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle("is-done", j < current);
      panels[j].hidden = !on;
    });
    count.textContent = `Step ${current + 1} of ${tabs.length}`;
    prev.disabled = current === 0;
    next.disabled = current === tabs.length - 1;
    if (focusTab) tabs[current].focus();
  }

  tabs.forEach((tab, i) => tab.addEventListener("click", () => show(i)));
  prev.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  bar.addEventListener("keydown", (e) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (move) { e.preventDefault(); show(current + move, true); }
    else if (e.key === "Home") { e.preventDefault(); show(0, true); }
    else if (e.key === "End") { e.preventDefault(); show(tabs.length - 1, true); }
  });

  show(0);
})();
