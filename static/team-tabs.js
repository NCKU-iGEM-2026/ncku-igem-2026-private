(function () {
  "use strict";

  /* The Team page's six tabs sit on top of each other and the hidden ones
     are only transparent (the page-turn needs them laid out), so to the
     browser every photo in every tab is on screen, and loading="lazy" loaded
     all of them -- 23 MB -- the moment the page opened. The photos outside
     the Leader tab are written with data-src instead (wiki/pages/team.html);
     this gives a tab's photos their address when that tab is chosen, and on
     arrival for whichever tab the browser has restored. */
  var radios = Array.prototype.slice.call(document.querySelectorAll('input[name="team-page"]'));
  if (!radios.length) return;

  function load(radio) {
    var page = document.getElementById(radio.id.replace(/^page-/, "content-"));
    if (!page) return;
    Array.prototype.forEach.call(page.querySelectorAll("img[data-src]"), function (img) {
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
    });
  }

  radios.forEach(function (r) {
    r.addEventListener("change", function () { if (r.checked) load(r); });
    if (r.checked) load(r);
  });
})();
