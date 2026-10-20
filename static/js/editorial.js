(function () {
  'use strict';

  var body = document.body;
  var cn = ' ' + body.className + ' ';
  var protectedPage = /(^|\s)(engineering-page|hw-nexus|edu-nexus)(\s|$)/.test(cn);
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var main = document.querySelector('.container');
  if (!main || protectedPage) return;

  var isHome = location.pathname.replace(/\/+$/, '') === '' || /\/index\.html$/.test(location.pathname);

  var contentMain = document.querySelector('body > .container') || main;

  var content = contentMain.textContent.replace(/\s+/g, '');
  var hasInteractive = contentMain.querySelector('canvas, iframe, table, .cap-game, svg, img');
  if (!isHome && content.length < 40 && !hasInteractive) {
    var mount = document.createElement('div');
    mount.className = 'rx-empty-mount';
    mount.innerHTML =
      '<div class="rx-coming-soon">' +
      '<strong>Content coming soon</strong>' +
      'This page is part of the redesigned wiki shell. Its content is still with the team.' +
      '<br><span class="rx-todo">TODO: 內容待團隊提供</span>' +
      '</div>';
    main.insertBefore(mount, main.firstChild);
    return;
  }

  if (isHome) return;

  if (main.querySelector('.edu-sidebar, aside, .board-game-page')) return;

  var heads = [];
  var seen = {};
  main.querySelectorAll(':scope > section > h2, :scope > div > h2, :scope > h2, :scope > section > h3:not([class*="page-tag"]), :scope > div > h3:not([class*="page-tag"])').forEach(function (h) {
    var text = (h.textContent || '').trim();
    if (!text || text.length > 60) return;
    if (!h.id) {
      var slug = 'rx-' + text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
      var id = slug, k = 2;
      while (seen[id] || document.getElementById(id)) { id = slug + '-' + (k++); }
      h.id = id;
    }
    if (seen[h.id]) return; seen[h.id] = 1;
    heads.push(h);
  });
  if (heads.length < 3) return;

  var bar = document.createElement('nav');
  bar.className = 'rx-tocbar';
  bar.setAttribute('aria-label', 'On this page');
  var inner = document.createElement('div');
  inner.className = 'rx-tocbar-inner';
  heads.forEach(function (h) {
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = (h.textContent || '').trim().slice(0, 28);
    inner.appendChild(a);
  });
  bar.appendChild(inner);
  if (reduce) { bar.style.position = 'relative'; }

  main.insertBefore(bar, main.firstChild);
  body.classList.add('rx-editorial');

  var links = bar.querySelectorAll('a');
  function setActive(id) {
    links.forEach(function (l) {
      var on = l.getAttribute('href') === '#' + id;
      l.classList.toggle('active', on);
      if (on && !reduce && bar.getBoundingClientRect) {
        try { l.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); } catch (e) {}
      }
    });
  }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    heads.forEach(function (h) { spy.observe(h); });
  }

  bar.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    var target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    ev.preventDefault();
    var y = target.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    setActive(a.getAttribute('href').slice(1));
  });

  if (!reduce && 'IntersectionObserver' in window) {
    var secs = main.querySelectorAll(':scope > section');
    secs.forEach(function (s) { s.setAttribute('data-reveal', ''); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('rx-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.08 });
    secs.forEach(function (s) { io.observe(s); });
    var kids = main.querySelectorAll(':scope > article, :scope > .row');
    kids.forEach(function (s) {
      s.setAttribute('data-reveal', '');
      io.observe(s);
    });
  }
})();
