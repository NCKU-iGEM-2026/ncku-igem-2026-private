(function () {
  // Click any photo in an .edu-gallery to open it full-size, with arrow
  // keys / on-screen arrows to step through the rest of that gallery.
  // The markup is untouched -- this only adds a click handler per <img>
  // and one shared overlay appended to <body>.

  function buildOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'edu-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<button type="button" class="edu-lightbox-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="edu-lightbox-prev" aria-label="Previous photo">&#10094;</button>' +
      '<img class="edu-lightbox-img" alt="">' +
      '<button type="button" class="edu-lightbox-next" aria-label="Next photo">&#10095;</button>' +
      '<p class="edu-lightbox-count"></p>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function init() {
    var galleries = Array.prototype.slice.call(document.querySelectorAll('.edu-gallery'));
    if (!galleries.length) return;

    var overlay = buildOverlay();
    var img = overlay.querySelector('.edu-lightbox-img');
    var count = overlay.querySelector('.edu-lightbox-count');
    var closeBtn = overlay.querySelector('.edu-lightbox-close');
    var prevBtn = overlay.querySelector('.edu-lightbox-prev');
    var nextBtn = overlay.querySelector('.edu-lightbox-next');

    var slides = [];
    var index = 0;
    var lastFocused = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      var el = slides[index];
      img.src = el.currentSrc || el.src;
      img.alt = el.alt || '';
      count.textContent = (index + 1) + ' / ' + slides.length;
    }

    function open(gallery, startEl) {
      slides = Array.prototype.slice.call(gallery.querySelectorAll('img'));
      var multi = slides.length > 1;
      prevBtn.style.display = multi ? '' : 'none';
      nextBtn.style.display = multi ? '' : 'none';
      count.style.display = multi ? '' : 'none';

      lastFocused = document.activeElement;
      show(slides.indexOf(startEl));
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('edu-lightbox-locked');
      closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('edu-lightbox-locked');
      img.src = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    galleries.forEach(function (gallery) {
      Array.prototype.slice.call(gallery.querySelectorAll('img')).forEach(function (el) {
        el.classList.add('edu-gallery-zoomable');
        el.addEventListener('click', function () { open(gallery, el); });
      });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(index - 1); });
    nextBtn.addEventListener('click', function () { show(index + 1); });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
