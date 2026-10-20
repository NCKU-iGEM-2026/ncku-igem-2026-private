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
    return page;
  }

  radios.forEach(function (r) {
    r.addEventListener("change", function () { if (r.checked) load(r); });
    if (r.checked) load(r);
  });

  function openFromHash() {
    var id = window.location.hash.slice(1);
    if (!id) return;
    var radioId = id.indexOf("content-") === 0 ? "page-" + id.slice(8) : id;
    var radio = document.getElementById(radioId);
    if (!radio || radio.name !== "team-page") return;
    radio.checked = true;
    var page = load(radio);
    if (page) page.scrollIntoView({ block: "start" });
  }

  openFromHash();
  window.addEventListener("hashchange", openFromHash);
})();
