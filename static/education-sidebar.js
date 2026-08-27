(function () {
  function init() {
    var sidebar = document.querySelector('.edu-sidebar');
    var indicator = document.querySelector('.edu-sidebar-indicator');
    var links = Array.prototype.slice.call(document.querySelectorAll('.edu-sidebar-link'));
    var sections = Array.prototype.slice.call(document.querySelectorAll('.edu-session-block'));
    if (!sidebar || !indicator || !links.length || !sections.length) return;

    var groups = Array.prototype.slice.call(document.querySelectorAll('.edu-sidebar-group'));
    var linkByTarget = {};
    links.forEach(function (link) {
      linkByTarget[link.getAttribute('data-target')] = link;
    });

    function setActive(id) {
      var activeLink = linkByTarget[id];
      if (!activeLink) return;

      links.forEach(function (link) { link.classList.remove('active'); });
      activeLink.classList.add('active');

      var activeGroup = activeLink.closest('.edu-sidebar-group');
      groups.forEach(function (group) { group.classList.toggle('active-group', group === activeGroup); });

      // 展開的動畫需要一個 frame 讓 max-height 生效，位置才會算對
      requestAnimationFrame(function () {
        var centerY = activeLink.offsetTop + activeLink.offsetHeight / 2 - sidebar.offsetTop;
        indicator.style.opacity = '1';
        indicator.style.top = centerY + 'px';
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setActive(visible[0].target.id);
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var scrollId = link.getAttribute('data-scroll') || link.getAttribute('data-target');
        var target = document.getElementById(scrollId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    setActive(sections[0].id);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
