/* ============================================================
   EDITORIAL.JS — 內頁編輯式互動（自動偵測，不改各頁 HTML）
   1) 章節 ≥3 的內頁：注入 sticky 導覽條 + scroll-spy
   2) 空白頁：注入「即將上線」骨架（不改原文，不改寫內容）
   3) 通用：給 .container 直下章節補 data-reveal（纯装饰）
   保護名單：engineering / hw-nexus / edu-nexus（自有互動）一律跳過。
   ============================================================ */
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

  /* ---- 空白頁偵測：page_content 無任何實質內容 → 注入骨架 ---- */
  var content = main.textContent.replace(/\s+/g, '');
  var hasInteractive = main.querySelector('canvas, iframe, table, .cap-game, svg');
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
    return; /* 空白頁不準再加 spy/reveal，視覺保持安靜 */
  }

  if (isHome) return; /* 首頁有自己的沉浸式腳本 */

  /* 已有自製側欄（education 三件套）或整頁遊戲（桌遊）的頁面不再注入第二套導航 */
  if (main.querySelector('.edu-sidebar, aside, .board-game-page')) return;

  /* ---- 收集章節標題 ---- */
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

  /* ---- 注入 sticky 導覽條 ---- */
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
  if (reduce) { /* 靜態模式下仍給導航，但不吸頂（CSS 覆蓋） */ bar.style.position = 'relative'; }

  /* 放在 .container 內最前面（hero 在 .container 之外） */
  main.insertBefore(bar, main.firstChild);
  body.classList.add('rx-editorial');

  /* ---- scroll-spy ---- */
  var links = bar.querySelectorAll('a');
  function setActive(id) {
    links.forEach(function (l) {
      var on = l.getAttribute('href') === '#' + id;
      l.classList.toggle('active', on);
      if (on && !reduce && bar.getBoundingClientRect) {
        /* 讓 active chip 維持在可視范围 */
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

  /* ---- 平滑滚到錨點（统一點擊體驗；reduced 則直跳）---- */
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

  /* ---- 章節漸顯：給頂層 section 加 data-reveal（裝饰性）---- */
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
    /* 没有章節容器的直接子元素們也給一次淡入節奏 */
    var kids = main.querySelectorAll(':scope > article, :scope > .row');
    kids.forEach(function (s) {
      s.setAttribute('data-reveal', '');
      io.observe(s);
    });
  }
})();
