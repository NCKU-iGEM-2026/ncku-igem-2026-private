(function () {

  var DELAY = 2000;
  var galleries = Array.prototype.slice.call(document.querySelectorAll('.edu-gallery'));
  if (!galleries.length) return;

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var ARROW = '<svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" ' +
              'aria-hidden="true" focusable="false"><path d="%d"/></svg>';
  var LEFT = 'M10.35 1.65a.6.6 0 0 1 0 .84L4.84 8l5.51 5.51a.6.6 0 1 1-.84.85l-5.93-5.94a.6.6 0 0 1 0-.84l5.93-5.93a.6.6 0 0 1 .84 0z';
  var RIGHT = 'M5.65 1.65a.6.6 0 0 0 0 .84L11.16 8l-5.51 5.51a.6.6 0 1 0 .84.85l5.93-5.94a.6.6 0 0 0 0-.84L6.49 1.65a.6.6 0 0 0-.84 0z';

  function label(gallery) {
    var n = gallery.previousElementSibling;
    while (n) {
      if (/^H[2-4]$/.test(n.tagName)) return n.textContent.trim() + ' photos';
      n = n.previousElementSibling;
    }
    var block = gallery.closest('.edu-session-block');
    var h = block && block.querySelector('h2, h3');
    return h ? h.textContent.trim() + ' photos' : 'Photos';
  }

  function build(gallery) {
    var slides = Array.prototype.slice.call(gallery.querySelectorAll('img'));
    if (slides.length < 2) return;

    var name = label(gallery);
    var at = 0;
    var timer = null;
    var stopped = calm.matches;
    var hovering = false;
    var focused = false;
    var onScreen = true;

    var wrap = document.createElement('div');
    wrap.className = 'edu-carousel';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-roledescription', 'carousel');
    wrap.setAttribute('aria-label', name);
    gallery.parentNode.insertBefore(wrap, gallery);

    var frame = document.createElement('div');
    frame.className = 'edu-carousel-frame';

    function arrow(dir, path, text) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'edu-arrow edu-arrow-' + dir;
      b.innerHTML = ARROW.replace('%d', path);
      b.setAttribute('aria-label', text + ' photo');
      b.addEventListener('click', function () {
        stop();
        go(at + (dir === 'next' ? 1 : -1), true);
      });
      return b;
    }

    var prev = arrow('prev', LEFT, 'Previous');
    var next = arrow('next', RIGHT, 'Next');

    frame.appendChild(prev);
    frame.appendChild(gallery);
    frame.appendChild(next);
    wrap.appendChild(frame);
    gallery.classList.add('is-carousel');

    slides.forEach(function (img, i) {
      img.classList.add('edu-slide');
      if (i === 0) img.loading = 'eager';
    });

    var controls = document.createElement('div');
    controls.className = 'edu-carousel-controls';

    var dots = document.createElement('div');
    dots.className = 'edu-carousel-dots';
    var buttons = slides.map(function (img, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'edu-dot';
      b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () {
        stop();
        go(i, true);
      });
      dots.appendChild(b);
      return b;
    });

    var status = document.createElement('p');
    status.className = 'edu-carousel-status';
    status.setAttribute('aria-live', 'off');

    controls.appendChild(dots);
    controls.appendChild(status);
    wrap.appendChild(controls);

    function paint() {
      slides.forEach(function (img, i) {
        img.classList.toggle('is-current', i === at);
      });
      buttons.forEach(function (b, i) {
        if (i === at) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      status.textContent = (at + 1) + ' / ' + slides.length;
    }

    function go(to, byHand) {
      at = (to + slides.length) % slides.length;
      var after = slides[(at + 1) % slides.length];
      if (after) after.loading = 'eager';
      status.setAttribute('aria-live', byHand ? 'polite' : 'off');
      paint();
    }

    function tick() { go(at + 1, false); }

    function start() {
      if (timer || stopped || hovering || focused || !onScreen || document.hidden) return;
      timer = window.setInterval(tick, DELAY);
    }

    function pause() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    function stop() { stopped = true; pause(); }

    wrap.addEventListener('mouseenter', function () { hovering = true; pause(); });
    wrap.addEventListener('mouseleave', function () { hovering = false; start(); });
    wrap.addEventListener('focusin', function () { focused = true; pause(); });
    wrap.addEventListener('focusout', function () { focused = false; start(); });

    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); stop(); go(at + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(at - 1, true); }
    });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) start(); else pause();
      }, { threshold: 0.25 }).observe(wrap);
    }

    if (calm.addEventListener) {
      calm.addEventListener('change', function (e) {
        if (e.matches) stop(); else { stopped = false; start(); }
      });
    }

    go(0, false);
    start();
    return { start: start, pause: pause };
  }

  var running = [];
  galleries.forEach(function (g) {
    var made = build(g);
    if (made) running.push(made);
  });

  document.addEventListener('visibilitychange', function () {
    running.forEach(function (c) {
      if (document.hidden) c.pause(); else c.start();
    });
  });
})();
