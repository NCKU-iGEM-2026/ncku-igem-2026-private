/* ============================================================
   EDUCATION — the page's interactive layer (.edx-*)

   Everything here is an enhancement. Without JavaScript every figure shows
   its real value, every tab panel and both faces of every flip card are on
   the page, and every certificate link opens its PDF. The script adds the
   class edx-js to <html> first; the CSS only hides or zeroes anything under
   that class.

   1. figures count up      [data-edx-to]         (decimals kept as written)
   2. bars fill             .edx-bar               when scrolled into view
   3. tabs                  .edx-tabs              arrow keys move between them
   4. flip cards            .edx-flip              click / Enter / Space
   5. certificates          a[data-edx-cert]       opened in a <dialog> on wide
                                                   screens, a new tab otherwise
   6. timeline              .edx-timeline          marks the event being read
   7. quotes                .edu-quote             a 中文 / English switch on the
                                                   ones that carry both
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('edx-js');

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var hasIO = 'IntersectionObserver' in window;

  function onceVisible(els, fn, threshold) {
    if (!els.length) return;
    if (!hasIO) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        fn(en.target);
      });
    }, { threshold: threshold || 0.35 });
    els.forEach(function (el) { io.observe(el); });
  }

  function all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ---- 1. count-up ---------------------------------------------------- */
  onceVisible(all('[data-edx-to]'), function (el) {
    if (reduceMotion) return;
    var raw = el.getAttribute('data-edx-to');
    var to = parseFloat(raw);
    if (!(to > 0)) return;
    var dot = raw.indexOf('.');
    var places = dot === -1 ? 0 : raw.length - dot - 1;
    var start = null, DURATION = 1300;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / DURATION);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? (to * eased).toFixed(places) : raw;
      if (p < 1) window.requestAnimationFrame(step);
    }
    el.textContent = (0).toFixed(places);
    window.requestAnimationFrame(step);
  });

  /* ---- 2. bars -------------------------------------------------------- */
  onceVisible(all('.edx-bar'), function (el) { el.classList.add('is-in'); }, 0.5);

  /* ---- 3. tabs -------------------------------------------------------- */
  all('.edx-tabs').forEach(function (box) {
    var tabs = all('[role="tab"]', box);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[k]) panels[k].hidden = !on;
      });
      box.style.setProperty('--edx-step', String(i));
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j === null) return;
        e.preventDefault();
        select(j, true);
      });
    });

    var next = box.querySelector('.edx-tabs-next');
    if (next) next.addEventListener('click', function () {
      var cur = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
      select((cur + 1) % tabs.length, true);
    });

    select(0, false);
  });

  /* ---- 4. flip cards -------------------------------------------------- */
  all('.edx-flip').forEach(function (btn) {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      var on = btn.classList.toggle('is-flipped');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  /* ---- 5. certificates ------------------------------------------------ */
  var dlg = document.querySelector('.edx-cert-dialog');
  if (dlg && typeof dlg.showModal === 'function') {
    var frame = dlg.querySelector('iframe');
    var title = dlg.querySelector('.edx-cert-dialog-title');
    var newTab = dlg.querySelector('.edx-cert-dialog-newtab');
    var lastOpener = null;

    all('a[data-edx-cert]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        // A phone's browser does not render an embedded PDF reliably; there
        // the link just opens the file, as it does without this script.
        if (window.innerWidth < 760) return;
        e.preventDefault();
        lastOpener = a;
        title.textContent = a.getAttribute('data-edx-cert');
        frame.title = a.getAttribute('data-edx-cert') + ' certificate';
        frame.src = a.href + '#view=FitH&navpanes=0';
        newTab.href = a.href;
        dlg.showModal();
      });
    });

    dlg.querySelector('.edx-cert-dialog-close').addEventListener('click', function () { dlg.close(); });
    // A click on the dimmed backdrop (the dialog element itself, outside its box) closes it.
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      frame.src = 'about:blank';
      if (lastOpener) lastOpener.focus();
    });
  }

  /* ---- 6. timeline ---------------------------------------------------- */
  var tl = document.querySelector('.edx-timeline');
  if (tl) {
    var stops = all('a[data-edx-stop]', tl);
    var targets = stops.map(function (a) { return document.getElementById(a.getAttribute('data-edx-stop')); });
    var LINE = 140;

    var update = function () {
      var active = -1;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].getBoundingClientRect().top <= LINE) active = i;
      }
      stops.forEach(function (a, i) {
        a.classList.toggle('is-active', i === active);
        a.classList.toggle('is-past', i < active);
      });
      tl.style.setProperty('--edx-progress', active < 0 ? '0' : String(active / Math.max(1, stops.length - 1)));
    };

    var pending = 0;
    window.addEventListener('scroll', function () {
      if (pending) return;
      pending = window.requestAnimationFrame(function () { pending = 0; update(); });
    }, { passive: true });

    stops.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (!targets[i]) return;
        e.preventDefault();
        targets[i].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
    update();
  }

  /* ---- 7. bilingual quotes -------------------------------------------- */
  var CJK = /[㐀-鿿]/;
  all('.edu-quote').forEach(function (q) {
    var br = q.querySelector('br');
    if (!br) return;
    var before = [], after = [], seen = false;
    Array.prototype.slice.call(q.childNodes).forEach(function (n) {
      if (n === br) { seen = true; return; }
      (seen ? after : before).push(n);
    });
    var zhText = before.map(function (n) { return n.textContent; }).join('');
    if (!CJK.test(zhText) || !after.length) return;

    var zh = document.createElement('span');
    zh.className = 'edx-q-zh';
    zh.lang = 'zh-Hant';
    before.forEach(function (n) { zh.appendChild(n); });
    var en = document.createElement('span');
    en.className = 'edx-q-en';
    after.forEach(function (n) { en.appendChild(n); });
    br.remove();

    var sw = document.createElement('span');
    sw.className = 'edx-q-switch';
    sw.innerHTML = '<button type="button" aria-pressed="true">English</button>' +
                   '<button type="button" aria-pressed="false" lang="zh-Hant">中文原文</button>';
    q.textContent = '';
    q.appendChild(sw);
    q.appendChild(en);
    q.appendChild(zh);
    q.classList.add('edx-q', 'is-en');

    var btns = sw.querySelectorAll('button');
    function show(isEn) {
      q.classList.toggle('is-en', isEn);
      q.classList.toggle('is-zh', !isEn);
      btns[0].setAttribute('aria-pressed', isEn ? 'true' : 'false');
      btns[1].setAttribute('aria-pressed', isEn ? 'false' : 'true');
    }
    btns[0].addEventListener('click', function () { show(true); });
    btns[1].addEventListener('click', function () { show(false); });
  });
})();
