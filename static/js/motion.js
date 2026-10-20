(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var THEME_TOGGLE_ENABLED = false;
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('rx-theme', t); } catch (e) {}
    document.querySelectorAll('.rx-theme-toggle').forEach(function (b) {
      b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }
  var current = THEME_TOGGLE_ENABLED ? (root.getAttribute('data-theme') || 'dark') : 'dark';

  var nav = THEME_TOGGLE_ENABLED ? document.querySelector('.navbar .container-fluid') : null;
  if (nav) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rx-theme-toggle';
    btn.innerHTML =
      '<svg class="rx-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></svg>' +
      '<svg class="rx-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    btn.addEventListener('click', function () {
      current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(current);
    });
    var toggler = nav.querySelector('.navbar-toggler');
    if (toggler) nav.insertBefore(btn, toggler.nextSibling);
    else nav.appendChild(btn);
  }
  applyTheme(current);

  var bar = document.createElement('div');
  bar.id = 'rxProgress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var progressQueued = false;
  function progress() {
    progressQueued = false;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';
  }
  function queueProgress() {
    if (progressQueued) return;
    progressQueued = true;
    requestAnimationFrame(progress);
  }
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress);
  requestAnimationFrame(function () {
    document.body.classList.add('rx-ready');
    progress();
  });

  var revealIO = null;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('rx-in');
        revealIO.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  function revealScan() {
    var els = document.querySelectorAll('[data-reveal]:not(.rx-in)');
    if (!revealIO) { els.forEach(function (el) { el.classList.add('rx-in'); }); return; }
    els.forEach(function (el) { revealIO.observe(el); });
  }
  revealScan();
  window.rxRevealScan = revealScan;

  var fine = false;
  try { fine = window.matchMedia('(pointer: fine)').matches; } catch (e) {}
  if (fine && !reduceMotion) {
    document.querySelectorAll('.rx-magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        var dx = (ev.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (ev.clientY - (r.top + r.height / 2)) * 0.3;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    var cur = document.createElement('div');
    cur.id = 'rxCursor';
    cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    root.classList.add('rx-cursor');
    var cx = -100, cy = -100, ticking = false;
    function move() {
      cur.style.setProperty('--cx', cx + 'px');
      cur.style.setProperty('--cy', cy + 'px');
      ticking = false;
    }
    document.addEventListener('pointermove', function (ev) {
      cx = ev.clientX; cy = ev.clientY;
      if (!ticking) { ticking = true; requestAnimationFrame(move); }
    });
    var CLICKABLE = 'a[href],button:not([disabled]),input:not([type="hidden"]):not([disabled]),' +
                    'select,textarea,summary,label[for],.dropdown-item,' +
                    '[role="button"],[role="tab"],[role="link"],[data-bs-toggle]';
    function clickable(t) {
      for (var el = t; el && el.nodeType === 1 && el !== document.body; el = el.parentElement) {
        if (el.matches(CLICKABLE)) return true;
        if (el.tagName === 'LABEL' && el.querySelector('input:not([disabled]),select,textarea')) return true;
        if (getComputedStyle(el).cursor === 'pointer') return true;
      }
      return false;
    }
    document.addEventListener('pointerover', function (ev) {
      cur.classList.toggle('rx-big', clickable(ev.target));
    });
    document.addEventListener('pointerdown', function () { cur.style.opacity = '0.4'; });
    document.addEventListener('pointerup', function () { cur.style.opacity = '1'; });
  }

  var skipLenis = /(^|\s)(engineering-page|hw-nexus|edu-nexus|board-game-page)(\s|$)/.test(' ' + document.body.className + ' ');
  if (!skipLenis && !reduceMotion && typeof window.Lenis === 'function') {
    try {
      var lenis = new window.Lenis({ duration: 0.9, smoothWheel: true });
      // Reachable so a page can hand the scroll back and forth: the home
      // page's Meet section stops it while the mark plays. Nothing else
      // should need it.
      window.rxLenis = lenis;
      var rafOn = false, stillSince = 0;
      function raf(t) {
        lenis.raf(t);
        if (lenis.isScrolling) stillSince = t;
        if (t - stillSince > 1000) { rafOn = false; return; }
        requestAnimationFrame(raf);
      }
      function wake() {
        if (rafOn) return;
        rafOn = true;
        stillSince = performance.now();
        requestAnimationFrame(raf);
      }
      ['wheel', 'touchstart', 'keydown', 'pointerdown', 'scroll'].forEach(function (type) {
        window.addEventListener(type, wake, { passive: true });
      });
      wake();
      if (window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
      }

      // Lenis drives the scroll itself, so the browser's own jump to #id is
      // swallowed and every in-page link -- the citation numerals, the table
      // of contents, the figure links -- does nothing. Route them through
      // lenis.scrollTo instead. Pages where Lenis is skipped keep the native
      // behaviour and never reach this.
      function anchorOffset(el) {
        var sm = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        if (sm) return sm;
        var nav = document.querySelector('.navbar');
        if (!nav) return 0;
        var pos = getComputedStyle(nav).position;
        if (pos !== 'fixed' && pos !== 'sticky') return 0;
        return nav.getBoundingClientRect().height + 16;
      }
      document.addEventListener('click', function (ev) {
        if (ev.defaultPrevented || ev.button !== 0) return;
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
        if (!a || a.target === '_blank') return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) !== '#' || href.length < 2) return;
        var el;
        try { el = document.getElementById(decodeURIComponent(href.slice(1))); }
        catch (err) { el = document.getElementById(href.slice(1)); }
        if (!el) return;
        ev.preventDefault();
        // The raf loop parks itself after a second of stillness, and
        // lenis.scrollTo needs it running to animate at all.
        wake();
        var startY = window.pageYOffset;
        lenis.scrollTo(el, { offset: -anchorOffset(el) });
        // If Lenis does not take -- a parked frame loop, a version that
        // refuses the call -- the reader still gets there.
        setTimeout(function () {
          if (Math.abs(window.pageYOffset - startY) < 2) el.scrollIntoView();
        }, 700);
        if (window.history && history.pushState) history.pushState(null, '', href);
        // Keep the keyboard with the reader, without a second jump.
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      });
    } catch (e) { }
  }

  if (!reduceMotion) {
    var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-rx-chapter]')).map(function (el) {
      return { el: el, cur: -1, top: 0, bottom: 0 };
    });
    if (chapters.length) {
      var chapRaf = null, chapLast = 0;
      var lastY = window.pageYOffset, lastVh = window.innerHeight;
      var measureChapters = function () {
        var y = window.pageYOffset;
        chapters.forEach(function (c) {
          var r = c.el.getBoundingClientRect();
          c.top = r.top + y; c.bottom = r.bottom + y;
        });
      };
      var chapTick = function (t) {
        chapRaf = null;
        var dt = chapLast ? Math.min(0.1, (t - chapLast) / 1000) : 1;
        chapLast = t;
        var y = lastY, vh = lastVh, moving = false;
        chapters.forEach(function (c) {
          var start = c.top - 0.75 * vh, end = c.bottom - 0.55 * vh;
          var target = Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start)));
          var next = c.cur < 0 ? target : c.cur + (target - c.cur) * (1 - Math.exp(-dt / 0.25));
          if (Math.abs(target - next) < 0.0005) next = target; else moving = true;
          if (next !== c.cur) { c.cur = next; c.el.style.setProperty('--rx-chap', (next * 100).toFixed(2) + '%'); }
        });
        if (moving) chapRaf = requestAnimationFrame(chapTick); else chapLast = 0;
      };
      var chapSettled = function () {
        for (var i = 0; i < chapters.length; i++) {
          var c = chapters[i];
          var start = c.top - 0.75 * lastVh, end = c.bottom - 0.55 * lastVh;
          var target = lastY <= start ? 0 : (lastY >= end ? 1 : -1);
          if (target < 0 || c.cur !== target) return false;
        }
        return true;
      };
      var chapKick = function () {
        if (chapRaf || chapSettled()) return;
        chapRaf = requestAnimationFrame(chapTick);
      };
      measureChapters(); chapKick();
      var onChapScroll = function () {
        lastY = window.pageYOffset;
        chapKick();
      };
      var listening = false;
      var listen = function (on) {
        if (on === listening) return;
        listening = on;
        if (on) window.addEventListener('scroll', onChapScroll, { passive: true });
        else window.removeEventListener('scroll', onChapScroll);
      };
      if ('IntersectionObserver' in window) {
        var near = new IntersectionObserver(function (entries) {
          var any = false;
          entries.forEach(function (e) { if (e.isIntersecting) any = true; });
          listen(any);
          if (any) onChapScroll();
        }, { rootMargin: '200% 0px' });
        chapters.forEach(function (c) { near.observe(c.el); });
      } else {
        listen(true);
      }
      var remeasure = function () {
        lastY = window.pageYOffset; lastVh = window.innerHeight;
        measureChapters(); chapKick();
      };
      window.addEventListener('resize', remeasure);
      window.addEventListener('load', remeasure);
      if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
    }

    document.querySelectorAll('[data-rx-split]').forEach(function (el) {
      var text = el.textContent;
      el.textContent = '';
      el.classList.add('rx-split');
      text.split(' ').forEach(function (word, wi) {
        var w = document.createElement('span');
        w.className = 'rx-word';
        word.split('').forEach(function (ch, ci) {
          var c = document.createElement('span');
          c.className = 'rx-char';
          c.textContent = ch;
          c.style.setProperty('--rx-d', (0.25 + wi * 0.05 + ci * 0.035).toFixed(3) + 's');
          w.appendChild(c);
        });
        w.appendChild(document.createTextNode(' '));
        el.appendChild(w);
      });
      el.classList.add('rx-go');
    });
  } else {
    document.querySelectorAll('[data-rx-split]').forEach(function (el) { el.classList.add('rx-done'); });
  }
})();
