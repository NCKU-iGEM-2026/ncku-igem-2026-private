(function () {
  // Home page: four questions, then two or three pages this visitor is most
  // likely to want. It is a way in, not a personality test -- nothing is
  // stored about the answers and nothing is sent anywhere.
  //
  // No library, no inline script: everything the wiki loads comes from here.
  var quiz = document.getElementById('siteQuiz');
  var pool = document.getElementById('quizPages');
  if (!quiz || !pool) return;

  var card = quiz.querySelector('.quiz-card');
  var stage = document.getElementById('quizStage');
  var heading = document.getElementById('quizHeading');
  var lead = document.getElementById('quizLead');
  var optionBox = document.getElementById('quizOptions');
  var resultBox = document.getElementById('quizResults');
  var count = document.getElementById('quizCount');
  var back = document.getElementById('quizBack');
  var restart = document.getElementById('quizRestart');
  var skip = document.getElementById('quizSkip');
  var opener = document.getElementById('quizOpen');
  var langButtons = Array.prototype.slice.call(
    quiz.querySelectorAll('[data-quiz-lang]')
  );

  // ---------------------------------------------------------------- the model
  //
  // Every answer adds weight to some traits; every page carries the traits it
  // serves. The recommendation is the dot product of the two. Six traits:
  //
  //   build   making a physical thing work
  //   think   why the project exists at all
  //   talk    people, teaching, working with others
  //   data    numbers, code, evidence
  //   play    something you can actually play with
  //   people  the team and how the season ran
  //
  // To add a page later: give it an <a data-quiz-page> in the markup (so
  // url_for builds the link), then add a row here and its copy in COPY.pages.
  var PAGES = {
    hardware:      { section: 'dry',     tags: { build: 3, data: 1 } },
    software:      { section: 'dry',     tags: { data: 3, build: 1 } },
    engineering:   { section: 'project', tags: { build: 2, think: 2, data: 1 } },
    'lab-book':    { section: 'wet',     tags: { build: 2, people: 1 } },
    description:   { section: 'project', tags: { think: 3 } },
    notebook:      { section: 'project', tags: { people: 3, think: 1 } },
    'board-game':  { section: 'hp',      tags: { play: 3, talk: 2 } },
    education:     { section: 'hp',      tags: { talk: 3, play: 1 } },
    promotion:     { section: 'hp',      tags: { talk: 3 } },
    collaboration: { section: 'hp',      tags: { talk: 3, people: 1 } },
    team:          { section: 'team',    tags: { people: 3 } }
  };

  // Answer weights, in the order the options are written in COPY.
  var WEIGHTS = [
    [{ data: 2, play: 1 }, { build: 3 }, { build: 2, people: 2 }, { talk: 3 }],
    [{ build: 3 }, { think: 3 }, { talk: 3 }, { data: 3 }],
    [{ build: 2, data: 1 }, { think: 3 }, { talk: 3 }, { data: 3 }],
    [{ build: 3 }, { think: 3 }, { talk: 2, play: 2 }, { data: 3 }]
  ];

  var COPY = {
    en: {
      open: 'Still looking for something?',
      title: 'Find your way in',
      lead: 'Four questions, then two or three pages you are most likely to want.',
      of: 'of',
      back: 'Back',
      skip: 'Close',
      again: 'Start over',
      resultTitle: 'Start with these',
      resultLead: 'Based on your answers. The menu at the top has everything else.',
      go: 'Open this page',
      questions: [
        {
          q: 'Which lab life sounds most like you?',
          a: ['Working from home, online',
              'A short, intense stint at the bench',
              'The all-nighter in the lab',
              'Out in the field, with society as the lab']
        },
        {
          q: 'What kind of iGEMer are you?',
          a: ['The one who builds things',
              'The one who imagines things',
              'The one who talks things through',
              'The one who analyses things']
        },
        {
          q: 'Faced with a project you have never seen, what do you ask first?',
          a: ['How was it built?',
              'Why does it exist at all?',
              'Who is it actually for?',
              'What is the evidence that it works?']
        },
        {
          q: 'How would you show this project to a friend?',
          a: ['Put the device on the table and switch it on',
              'Tell the story from the beginning',
              'Run an activity and let them play',
              'Show them the numbers']
        }
      ],
      pages: {
        hardware: ['Hardware',
          'The reader we built, how its optics work, and an honest list of what it has not yet been shown to do.'],
        software: ['Software',
          'The telemetry link for the sensor, with its source and a demonstration.'],
        engineering: ['Engineering',
          'The Design, Build, Test and Learn cycle the project is being run through.'],
        'lab-book': ['Lab Book',
          'The bench protocols, written out as sheets you could follow.'],
        description: ['Description',
          'Two systems built on one signal: one that hears it and reports, one that takes it away.'],
        notebook: ['Notebook',
          'How the season actually ran.'],
        'board-game': ['Board Game',
          'The Green Cabinet, our SDG board game, playable online with other people.'],
        education: ['Education',
          'The workshops and sessions we ran with schools.'],
        promotion: ['Promotion',
          'Talks, a podcast, and the sharing sessions we joined.'],
        collaboration: ['Collaboration',
          'What we did together with other teams and schools.'],
        team: ['Team', 'The people behind all of it.']
      }
    },

    zh: {
      open: '還在找有興趣的內容嗎？',
      title: '找到適合你的入口',
      lead: '四個問題，然後推薦你兩三個最可能想看的頁面。',
      of: '／',
      back: '上一題',
      skip: '關閉',
      again: '重新測驗',
      resultTitle: '從這幾頁開始',
      resultLead: '依照你的作答推薦。其餘內容都在上方選單裡。',
      go: '前往這一頁',
      questions: [
        {
          q: '哪一種實驗室風格最像你？',
          a: ['居家線上辦公',
              '實驗室短期密集訓練',
              '實驗室過夜加班',
              '社會實驗室']
        },
        {
          q: '你是哪一種 iGEMer？',
          a: ['喜歡動手實作型',
              '喜歡想像型',
              '喜歡交流討論型',
              '喜歡分析型']
        },
        {
          q: '看到一個沒看過的專案，你第一個想問什麼？',
          a: ['這東西是怎麼做出來的？',
              '為什麼要做這個？',
              '誰真的會用到它？',
              '有什麼證據說它有效？']
        },
        {
          q: '要把這個專案介紹給朋友，你會怎麼做？',
          a: ['直接把裝置擺出來打開給他看',
              '從頭講一次我們為什麼要做',
              '辦一場活動讓他自己玩',
              '把數據和圖表拿給他看']
        }
      ],
      pages: {
        hardware: ['Hardware 硬體',
          '我們自己做的讀取儀：光路怎麼運作、怎麼組起來，以及還沒被證明的部分。'],
        software: ['Software 軟體',
          '感測器的傳輸連線，附上原始碼與實際示範。'],
        engineering: ['Engineering 工程',
          '這個專案正在跑的 Design–Build–Test–Learn 循環。'],
        'lab-book': ['Lab Book 實驗記錄',
          '實驗檯上的 protocol，寫成可以照著做的表單。'],
        description: ['Description 專案介紹',
          '同一個訊號，兩套系統：一套聽見它並回報，一套把它攔下來。'],
        notebook: ['Notebook 團隊日誌',
          '這一季實際上是怎麼過的。'],
        'board-game': ['Board Game 桌遊',
          'The Green Cabinet：我們的 SDG 桌遊，可以線上跟別人一起玩。'],
        education: ['Education 教育',
          '我們和學校一起辦的工作坊與課程。'],
        promotion: ['Promotion 推廣',
          '演講、Podcast，以及我們參加的分享會。'],
        collaboration: ['Collaboration 合作',
          '我們和其他隊伍、學校一起做的事。'],
        team: ['Team 團隊', '做出這一切的人。']
      }
    }
  };

  // ---------------------------------------------------------------- the state
  var LANG_KEY = 'ncku2026_quiz_lang';
  // The wiki is written in English and its first readers are the judges, so
  // English is the default; one tap switches the whole quiz to Chinese and the
  // choice is remembered.
  var lang = 'en';
  var at = 0;
  var answers = [];
  var returnTo = null;
  // Which of the two screens is up. Inferring it from `at` does not work:
  // answering the last question calls renderResults() directly and leaves `at`
  // on that question, so switching language at the results threw the reader
  // back to question four.
  var showingResults = false;

  // A browser can refuse storage entirely (private windows, blocked site data).
  // Losing the remembered language should cost a visitor one tap, never a
  // script error on the home page.
  function rememberLang() {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* not worth failing over */ }
  }
  function restoreLang() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      if (v === 'zh' || v === 'en') lang = v;
    } catch (e) { /* keep the default */ }
  }

  function t() { return COPY[lang]; }

  // Links live in the markup so url_for builds them and the static build keeps
  // them; the script only reads the href back out.
  function hrefFor(key) {
    var a = pool.querySelector('[data-quiz-page="' + key + '"]');
    return a ? a.getAttribute('href') : null;
  }

  // ---------------------------------------------------------------- scoring
  function score() {
    var traits = {};
    answers.forEach(function (choice, qi) {
      if (choice === null || choice === undefined) return;
      var w = WEIGHTS[qi][choice];
      for (var k in w) { if (w.hasOwnProperty(k)) traits[k] = (traits[k] || 0) + w[k]; }
    });

    var ranked = Object.keys(PAGES)
      .filter(hrefFor)                       // never offer a page that is not linked
      .map(function (key) {
        var tags = PAGES[key].tags;
        var total = 0;
        for (var k in tags) {
          if (tags.hasOwnProperty(k)) total += (traits[k] || 0) * tags[k];
        }
        return { key: key, section: PAGES[key].section, score: total };
      })
      .sort(function (a, b) { return b.score - a.score || a.key.localeCompare(b.key); });

    // Three pages from the same corner of the wiki is a worse answer than three
    // that between them cover more of it, so a page whose section is already
    // represented is discounted while the next pick is chosen.
    var picks = [];
    var used = {};
    while (picks.length < 3 && ranked.length) {
      var best = null;
      var bestAt = -1;
      ranked.forEach(function (item, i) {
        var value = item.score * (used[item.section] ? 0.6 : 1);
        if (!best || value > best.value) { best = { item: item, value: value }; bestAt = i; }
      });
      if (!best || best.item.score <= 0) break;
      picks.push(best.item);
      used[best.item.section] = true;
      ranked.splice(bestAt, 1);
    }
    return picks;
  }

  // ---------------------------------------------------------------- rendering
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function renderQuestion() {
    var copy = t();
    var q = copy.questions[at];
    showingResults = false;

    resultBox.hidden = true;
    optionBox.hidden = false;
    restart.hidden = true;
    back.hidden = false;
    back.disabled = at === 0;
    back.textContent = copy.back;
    skip.textContent = copy.skip;
    count.textContent = (at + 1) + ' ' + copy.of + ' ' + copy.questions.length;
    heading.textContent = q.q;
    lead.textContent = at === 0 ? copy.lead : '';
    lead.hidden = at !== 0;

    clear(optionBox);
    q.a.forEach(function (label, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-option';
      b.textContent = label;
      if (answers[at] === i) b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', function () {
        answers[at] = i;
        if (at < copy.questions.length - 1) { at += 1; renderQuestion(); }
        else renderResults();
      });
      optionBox.appendChild(b);
    });
  }

  function renderResults() {
    var copy = t();
    var picks = score();
    showingResults = true;

    optionBox.hidden = true;
    resultBox.hidden = false;
    restart.hidden = false;
    restart.textContent = copy.again;
    back.hidden = false;
    back.disabled = false;
    back.textContent = copy.back;
    skip.textContent = copy.skip;
    count.textContent = '';
    heading.textContent = copy.resultTitle;
    lead.textContent = copy.resultLead;
    lead.hidden = false;

    clear(resultBox);
    picks.forEach(function (pick) {
      var text = copy.pages[pick.key];
      if (!text) return;

      var item = document.createElement('article');
      item.className = 'quiz-result';

      var h = document.createElement('h3');
      h.textContent = text[0];

      var p = document.createElement('p');
      p.textContent = text[1];

      var a = document.createElement('a');
      a.className = 'quiz-go';
      a.href = hrefFor(pick.key);
      a.textContent = copy.go;

      item.appendChild(h);
      item.appendChild(p);
      item.appendChild(a);
      resultBox.appendChild(item);
    });
  }

  function render() {
    if (showingResults) renderResults(); else renderQuestion();
  }

  function setLang(next) {
    lang = next;
    rememberLang();
    langButtons.forEach(function (b) {
      var on = b.getAttribute('data-quiz-lang') === lang;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    quiz.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');
    if (opener) opener.querySelector('[data-quiz-label]').textContent = t().open;
    if (!quiz.hidden) render();
  }

  // ---------------------------------------------------------------- open/close
  function open() {
    returnTo = document.activeElement;
    at = 0;
    answers = [];
    quiz.hidden = false;
    document.body.classList.add('quiz-active');
    renderQuestion();
    card.focus();
  }

  function close() {
    quiz.hidden = true;
    document.body.classList.remove('quiz-active');
    if (returnTo && document.contains(returnTo)) returnTo.focus();
    returnTo = null;
  }

  // ---------------------------------------------------------------- wiring
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      setLang(b.getAttribute('data-quiz-lang'));
    });
  });

  back.addEventListener('click', function () {
    if (!resultBox.hidden) { at = COPY.en.questions.length - 1; renderQuestion(); return; }
    if (at > 0) { at -= 1; renderQuestion(); }
  });

  restart.addEventListener('click', function () {
    at = 0;
    answers = [];
    renderQuestion();
  });

  quiz.querySelectorAll('[data-quiz-dismiss]').forEach(function (el) {
    el.addEventListener('click', close);
  });

  quiz.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;

    // Keep Tab inside the dialog: it is modal, and everything behind it is
    // covered, so tabbing out would put the focus ring somewhere invisible.
    var focusable = card.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    var live = Array.prototype.filter.call(focusable, function (el) {
      return el.offsetParent !== null;
    });
    if (!live.length) return;
    var first = live[0];
    var last = live[live.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // ---------------------------------------------------------------- entry
  restoreLang();
  setLang(lang);

  if (opener) {
    opener.hidden = false;                 // only offer it once the script is here
    opener.addEventListener('click', open);
  }
})();
