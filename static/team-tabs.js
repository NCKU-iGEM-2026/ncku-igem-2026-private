(function () {
  "use strict";

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
