/* ============================================================
   MOTION.JS — 全站動態引擎
   這裡只做「裝飾層」：任何一支失敗或被擋，頁面都必须照常可讀。
   - 深淺色切換（localStorage + 系統偏好）
   - 閲讀進度條 #rxProgress
   - [data-reveal] 進場動畫（IO；reduced-motion 下 CSS 已直接顯示）
   - 自訂游標（僅 pointer:fine + 無 reduced-motion）
   - .rx-magnetic 磁吸鈕
   - Lenis 平滑捲動（engineering/hardware 頁停用：
     dbtl 的滾輪翻頁與剖面圖有自己的 wheel 處理）
   - GSAP ScrollTrigger：存在 [data-rx-chapter] 時綁章節軌道
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- 深淺色切換 ---------- */
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('rx-theme', t); } catch (e) {}
    document.querySelectorAll('.rx-theme-toggle').forEach(function (b) {
      b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }
  var current = root.getAttribute('data-theme') || 'light';

  /* 把切換鈕塞進導覽列（burger 旁边；不碰 Bootstrap 結構） */
  var nav = document.querySelector('.navbar .container-fluid');
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

  /* ---------- 閲讀進度條 ---------- */
  var bar = document.createElement('div');
  bar.id = 'rxProgress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function progress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', progress, { passive: true });
  window.addEventListener('resize', progress);
  requestAnimationFrame(function () {
    document.body.classList.add('rx-ready');
    progress();
  });

  /* ---------- reveal 進場 ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('rx-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('rx-in');
          io.unobserve(en.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- 磁吸按鈕（pointer:fine）---------- */
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

    /* ---------- 自訂游標 ---------- */
    var cur = document.createElement('div');
    cur.id = 'rxCursor';
    cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    root.classList.add('rx-cursor');
    var cx = -100, cy = -100, ticking = false;
    function move() { cur.style.left = cx + 'px'; cur.style.top = cy + 'px'; ticking = false; }
    document.addEventListener('pointermove', function (ev) {
      cx = ev.clientX; cy = ev.clientY;
      if (!ticking) { ticking = true; requestAnimationFrame(move); }
    });
    document.addEventListener('pointerover', function (ev) {
      var hit = ev.target.closest && ev.target.closest('a,button,.rx-card,input,summary,.dropdown-item');
      cur.classList.toggle('rx-big', !!hit);
    });
    document.addEventListener('pointerdown', function () { cur.style.opacity = '0.4'; });
    document.addEventListener('pointerup', function () { cur.style.opacity = '1'; });
  }

  /* ---------- Lenis 平滑捲動 ---------- */
  /* engineering（dbtl wheel 翻頁）、hardware（剖面 wheel）、
     board-game（內部捲動區）跳過，避免干擾既有互動。 */
  var skipLenis = /(^|\s)(engineering-page|hw-nexus|edu-nexus|board-game-page)(\s|$)/.test(' ' + document.body.className + ' ');
  if (!skipLenis && !reduceMotion && typeof window.Lenis === 'function') {
    try {
      var lenis = new window.Lenis({ duration: 0.9, smoothWheel: true });
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      if (window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
      }
    } catch (e) { /* 平滑捲動是.decor bonus，壞了就裸跑原生捲動 */ }
  }

  /* ---------- GSAP：章節軌道 + hero 拆字 ---------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    /* [data-rx-chapter]：捲動綁定 --rx-chap 0→100%，CSS 軌道依此著色 */
    document.querySelectorAll('[data-rx-chapter]').forEach(function (sec) {
      gsap.to(sec, {
        '--rx-chap': '100%',
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 }
      });
    });

    /* [data-rx-split]：kinetic typography，逐字升起 */
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
          if (!reduceMotion) {
            gsap.to(c, {
              y: '0%',
              duration: 0.9,
              delay: 0.25 + wi * 0.05 + ci * 0.035,
              ease: 'expo.out'
            });
          }
          w.appendChild(c);
        });
        w.appendChild(document.createTextNode(' '));
        el.appendChild(w);
      });
    });
  } else {
    /* 無 GSAP / 有 reduced-motion：拆字容器保持靜態可讀 */
    document.querySelectorAll('[data-rx-split]').forEach(function (el) { el.classList.add('rx-done'); });
  }
})();
