/* ============================================================
   MOTION.JS — 全站動態引擎
   這裡只做「裝飾層」：任何一支失敗或被擋，頁面都必須照常可讀。
   - 深淺色切換（localStorage + 系統偏好）
   - 閲讀進度條 #rxProgress
   - [data-reveal] 進場動畫（IO；reduced-motion 下 CSS 已直接顯示）
   - 自訂遊標（僅 pointer:fine + 無 reduced-motion）
   - .rx-magnetic 磁吸鈕
   - Lenis 平滑捲動（engineering/hardware 頁停用：
     dbtl 的滾輪翻頁與剖面圖有自己的 wheel 處理）
   - [data-rx-chapter] 章節軌道與 [data-rx-split] 拆字（不需 GSAP，見檔尾）
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- 深淺色切換 ----------
     暫時關閉：false＝不顯示太陽/月亮鈕、全站固定深夜綠。
     要恢復時改回 true，並把 wiki/layout.html 首幀腳本的 RX_THEME_TOGGLE 一起改回 true。 */
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

  /* 把切換鈕塞進導覽列（burger 旁邊；不碰 Bootstrap 結構） */
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

  /* ---------- 閲讀進度條 ---------- */
  var bar = document.createElement('div');
  bar.id = 'rxProgress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  /* Once per frame, not once per scroll event: a wheel or a trackpad can fire
     several scroll events in one frame, and each read of scrollHeight right
     after the last width was written made the browser lay the page out
     again on the spot. The page's height is read once a frame, before the
     bar is written. */
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

  /* ---------- reveal 進場（可重複掃描：其他腳本動態加入 data-reveal 後呼叫 window.rxRevealScan）---------- */
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

    /* ---------- 自訂遊標 ---------- */
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
    /* 大圈＝點得下去；小實心點＝點了沒反應。
       只認真正能點的東西：有 href 的連結、沒停用的按鈕與表單元件、summary、
       選單項目、帶 role/Bootstrap 開關的元件，以及 CSS 自己標成 cursor:pointer 的
       元素（拍立得卡、難度格、翻牌卡……）。純展示用的 .rx-card 不算——
       首頁那兩張文字卡本身點不下去，要點的是卡片裡的按鈕。 */
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

  /* ---------- Lenis 平滑捲動 ---------- */
  /* engineering（dbtl wheel 翻頁）、hardware（剖面 wheel）、
     board-game（內部捲動區）跳過，避免干擾既有互動。 */
  var skipLenis = /(^|\s)(engineering-page|hw-nexus|edu-nexus|board-game-page)(\s|$)/.test(' ' + document.body.className + ' ');
  if (!skipLenis && !reduceMotion && typeof window.Lenis === 'function') {
    try {
      var lenis = new window.Lenis({ duration: 0.9, smoothWheel: true });
      /* Lenis needs a frame only while a scroll is under way. The loop starts
         on the first wheel, touch, key or scroll, and stops once the page has
         been still for a second, instead of running every frame for the
         whole visit. */
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
    } catch (e) { /* 平滑捲動是.decor bonus，壞了就裸跑原生捲動 */ }
  }

  /* ---------- 章節軌道 + hero 拆字（不再用 GSAP）----------
     兩件事原本靠 GSAP + ScrollTrigger（116 KB），而 ScrollTrigger 只要存在，
     它的 ticker 就每一幀都要一次畫面更新，整頁跟著每幀重算。現在：
     章節進度由一個捲動監聽算，只在捲動、或進度還在追上時跑；拆字由 CSS。 */
  if (!reduceMotion) {
    /* [data-rx-chapter]：捲動綁定 --rx-chap 0→100%，CSS 依此揭開。
       起點＝區塊頂端到達視窗 75% 處，終點＝區塊底端到達視窗 55% 處（原
       ScrollTrigger 的 start/end），進度以約 0.25 秒的時間常數追上捲動
       （原 scrub: 0.6 的那點延遲）。 */
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
        /* The scroll position and the window height are read where they are
           free -- in the scroll and resize handlers -- not here. Read inside
           the frame, after the reading-progress bar has just written its
           width, each one forced the browser to lay the page out again on
           the spot: measured on the home page, 119 layouts in two seconds of
           scrolling past the video, for a tick that writes nothing there. */
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
      /* Nothing to schedule once every chapter has reached the end it is
         heading for: below the habitats section -- which is most of the
         page -- the tick had nothing to write and still ran every frame. */
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
      /* The listener itself is only attached while the section is within a
         couple of screens: reading the scroll position costs something on
         every scroll event, and on the rest of the page -- which is most of
         it -- there is no chapter to move. */
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
      /* 圖片晚到、區塊長高時，章節的位置也會變 */
      if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
    }

    /* [data-rx-split]：kinetic typography，逐字升起（motion.css 的 rx-rise）。
       延遲照原本：0.25 秒起，每字 0.035 秒、每詞 0.05 秒。 */
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
    /* reduced-motion：拆字容器保持靜態可讀 */
    document.querySelectorAll('[data-rx-split]').forEach(function (el) { el.classList.add('rx-done'); });
  }
})();
