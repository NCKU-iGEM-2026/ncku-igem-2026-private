(function () {
  'use strict';

  var context = document.getElementById('engineering-context');
  var iterationName = document.getElementById('engineering-iteration-name');
  var buildSlot = document.querySelector('#engineering-record-build [data-field="gallery"]');
  var testSlot = document.querySelector('#engineering-record-test [data-field="gallery"]');
  if (!context || !iterationName || !buildSlot || !testSlot) return;

  var base = 'https://static.igem.wiki/teams/6379/wiki/engineering/detection/';
  var galleries = {
    2: {
      stage: 'build', kind: 'carousel', title: 'Twist codon-optimization workflow',
      note: 'Five distinct views from the six source screenshots document the optimization workflow. The near-duplicate 20:40:55 view is omitted; these are not sequence verification or a completed construct.',
      figures: [
        ['i2/2026-05-17-202611.avif', '01 · Open the tool', 'Open Twist Codon Optimization to enter a DNA sequence.'],
        ['i2/2026-05-17-203032.avif', '02 · Select organism', 'Choose Escherichia coli general as the expression organism.'],
        ['i2/2026-05-17-203559.avif', '03 · Select sequence type', 'Set the sequence type to Other protein type.'],
        ['i2/2026-05-17-203841.avif', '04 · Run optimization', 'The 20:38:41 and near-duplicate 20:40:55 screenshots show the LasR row and Optimize control; one view represents both.'],
        ['i2/2026-05-17-204610.avif', '05 · Compare sequences', 'Compare the original and optimized sequences.']
      ]
    },
    3: {
      stage: 'test', kind: 'grid', title: 'Streak assay plate photographs',
      note: 'Control and Experiment labels follow the source record. Plate conditions and streak identities still need confirmation.',
      figures: [
        ['i3/img-4195.avif', 'Control 1 · IMG_4195', 'Plate photographed under blue light.'],
        ['i3/img-4194.avif', 'Experiment 1 · IMG_4194', 'Plate photographed under blue light.'],
        ['i3/img-4196.avif', 'Control 2 · IMG_4196', 'Plate photographed under blue light.'],
        ['i3/img-4193.avif', 'Experiment 2 · IMG_4193', 'Plate photographed under blue light.']
      ]
    },
    4: {
      stage: 'test', kind: 'grid', title: 'Liquid coculture photographs',
      note: 'Photos are ordered as in the original v1 record. Confirm each sample, condition, date, and plate-readout group before interpreting the images.',
      figures: [
        ['i4/pao1placi.avif', 'PAO1pLacI', 'Culture photograph; group assignment pending confirmation.'],
        ['i4/pao1.avif', 'PAO1', 'Culture photograph; group assignment pending confirmation.'],
        ['i4/top10.avif', 'TOP10', 'Culture photograph; group assignment pending confirmation.'],
        ['i4/pao1plasrv.avif', 'PAO1pLasRV', 'Culture photograph; group assignment pending confirmation.']
      ]
    },
    5: {
      stage: 'test', kind: 'grid', title: 'Resuspension assay summary chart',
      note: 'This uploaded v2 chart is shown for review, not as validated quantitative evidence. Its original workbook and group-to-well mapping still need reconciliation before interpreting differences or significance.',
      figures: [
        ['i5/image.avif', 'image.png · v2 summary chart', 'RFU/OD group summary on a log scale; calculations and sample mapping have not yet been verified.']
      ]
    }
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function padded(number) { return String(number).padStart(2, '0'); }
  function caption(figure) { return figure[1] + (figure[2] ? ' — ' + figure[2] : ''); }
  function heading(slot, gallery) {
    slot.appendChild(el('h5', 'engineering-gallery-title', gallery.title));
    slot.appendChild(el('p', 'engineering-gallery-note', gallery.note));
  }
  function renderGrid(slot, gallery) {
    var grid = el('div', 'engineering-figure-gallery-grid');
    if (gallery.figures.length === 1) grid.classList.add('is-single');
    if (gallery === galleries[3] || gallery === galleries[4]) grid.classList.add('is-uniform-photos');
    if (gallery === galleries[3]) grid.classList.add('is-streak');
    gallery.figures.forEach(function (figure) {
      var item = el('figure', 'engineering-gallery-item');
      var link = el('a');
      link.href = base + figure[0];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Open ' + figure[1] + ' at full size');
      var image = el('img');
      image.src = link.href;
      image.alt = caption(figure);
      image.loading = 'lazy';
      image.decoding = 'async';
      link.appendChild(image);
      var figcaption = el('figcaption');
      figcaption.appendChild(el('span', 'engineering-figure-label', figure[1]));
      if (figure[2]) figcaption.appendChild(document.createTextNode(' ' + figure[2]));
      item.append(link, figcaption);
      grid.appendChild(item);
    });
    slot.appendChild(grid);
  }
  function arrow(className, label, symbol) {
    var button = el('button', className, symbol);
    button.type = 'button';
    button.setAttribute('aria-label', label);
    return button;
  }
  function renderCarousel(slot, gallery) {
    var figures = gallery.figures;
    var active = 0;
    var carousel = el('div', 'engineering-carousel');
    carousel.tabIndex = 0;
    carousel.setAttribute('aria-label', gallery.title + '; use left and right arrow keys to browse');
    var stage = el('div', 'engineering-carousel-stage');
    var cards = figures.map(function (figure, index) {
      var card = el('button', 'engineering-carousel-card');
      card.type = 'button';
      var paper = el('span', 'engineering-carousel-paper');
      var image = el('img');
      image.src = base + figure[0];
      image.alt = caption(figure);
      image.loading = 'eager';
      image.decoding = 'async';
      var cardCaption = el('span', 'engineering-carousel-card-caption');
      cardCaption.appendChild(el('span', 'engineering-carousel-card-label', figure[1]));
      cardCaption.appendChild(el('span', 'engineering-carousel-card-description', figure[2]));
      paper.append(image, cardCaption);
      card.appendChild(paper);
      card.addEventListener('click', function () {
        if (index === active) viewer.showModal();
        else show(index);
      });
      stage.appendChild(card);
      return card;
    });
    var previous = arrow('engineering-carousel-arrow is-previous', 'Previous screenshot', '‹');
    var next = arrow('engineering-carousel-arrow is-next', 'Next screenshot', '›');
    stage.append(previous, next);
    var count = el('p', 'engineering-carousel-count');
    carousel.append(stage, count);

    var viewer = el('dialog', 'engineering-gallery-viewer');
    viewer.setAttribute('aria-label', gallery.title + ' enlarged image');
    var close = arrow('engineering-gallery-viewer-close', 'Close enlarged image', '×');
    var body = el('div', 'engineering-gallery-viewer-body');
    var viewPrevious = arrow('engineering-gallery-viewer-arrow', 'Previous screenshot', '‹');
    var viewNext = arrow('engineering-gallery-viewer-arrow', 'Next screenshot', '›');
    var viewImage = el('img');
    var viewCount = el('span', 'engineering-gallery-viewer-count');
    var viewCaption = el('p', 'engineering-gallery-viewer-caption');
    body.append(viewPrevious, viewImage, viewNext);
    viewer.append(close, body, viewCount, viewCaption);
    slot.append(carousel, viewer);

    function show(index) {
      active = (index + figures.length) % figures.length;
      cards.forEach(function (card, cardIndex) {
        var role = cardIndex === active ? 'current'
          : cardIndex === (active - 1 + figures.length) % figures.length ? 'previous'
          : cardIndex === (active + 1) % figures.length ? 'next' : '';
        card.hidden = !role;
        card.className = 'engineering-carousel-card' + (role ? ' is-' + role : '');
        card.setAttribute('aria-label', figureLabel(cardIndex, role));
        card.setAttribute('aria-current', role === 'current' ? 'true' : 'false');
      });
      count.textContent = padded(active + 1) + ' / ' + padded(figures.length);
      viewImage.src = base + figures[active][0];
      viewImage.alt = caption(figures[active]);
      viewCount.textContent = count.textContent;
      viewCaption.textContent = caption(figures[active]);
    }
    function figureLabel(index, role) {
      return (role === 'current' ? 'Enlarge ' : 'Show ') + caption(figures[index]);
    }
    function turn(delta) { show(active + delta); }
    previous.addEventListener('click', function () { turn(-1); });
    next.addEventListener('click', function () { turn(1); });
    viewPrevious.addEventListener('click', function () { turn(-1); });
    viewNext.addEventListener('click', function () { turn(1); });
    close.addEventListener('click', function () { viewer.close(); });
    viewer.addEventListener('click', function (event) { if (event.target === viewer) viewer.close(); });
    viewer.addEventListener('close', function () { cards[active].focus(); });
    carousel.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      event.stopPropagation();
      turn(event.key === 'ArrowRight' ? 1 : -1);
    });
    viewer.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      event.stopPropagation();
      turn(event.key === 'ArrowRight' ? 1 : -1);
    });
    function swipe(element) {
      var startX = null;
      element.addEventListener('touchstart', function (event) { startX = event.changedTouches[0].clientX; }, { passive: true });
      element.addEventListener('touchend', function (event) {
        if (startX === null) return;
        var change = event.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(change) > 45) turn(change < 0 ? 1 : -1);
      }, { passive: true });
    }
    swipe(stage);
    swipe(body);
    show(0);
  }

  var currentKey = null;
  function render() {
    var number = context.textContent.trim() === 'Detecting 3-oxo-C12-HSL'
      ? Number((iterationName.textContent.match(/^Iteration (\d+)/) || [])[1]) : 0;
    if (number === currentKey) return;
    currentKey = number;
    [buildSlot, testSlot].forEach(function (slot) {
      slot.hidden = true;
      slot.replaceChildren();
    });
    var gallery = galleries[number];
    if (!gallery) return;
    var slot = gallery.stage === 'build' ? buildSlot : testSlot;
    heading(slot, gallery);
    if (gallery.kind === 'carousel') renderCarousel(slot, gallery);
    else renderGrid(slot, gallery);
    slot.hidden = false;
  }
  var observer = new MutationObserver(render);
  observer.observe(context, { childList: true, characterData: true, subtree: true });
  observer.observe(iterationName, { childList: true, characterData: true, subtree: true });
  render();
})();
