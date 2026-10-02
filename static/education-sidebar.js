(function () {
  function init() {
    var sidebar = document.querySelector('.edu-sidebar');
    var links = Array.prototype.slice.call(document.querySelectorAll('.edu-sidebar-link'));
    if (!sidebar || !links.length) return;

    var groups = Array.prototype.slice.call(document.querySelectorAll('.edu-sidebar-group'));

    // One waypoint per link, in document order. Most links share a section
    // with several others (all ten STEAM from Seed schools are one
    // <section>), so each link's own waypoint is its data-scroll heading
    // when it has one, falling back to its section for the handful of links
    // that map straight to a whole section.
    var waypoints = links.map(function (link) {
      var id = link.getAttribute('data-scroll') || link.getAttribute('data-target');
      return { link: link, el: document.getElementById(id) };
    }).filter(function (w) { return w.el; });
    if (!waypoints.length) return;

    // Where "reached" is measured: just under the sticky navbar + a little
    // breathing room, same idea as .edu-sidebar's own `top: 84px`.
    var LINE = 120;

    function update() {
      // Walk in document order and keep the last waypoint whose heading has
      // scrolled up past the line -- that is the one currently being read.
      // Everything before it has been scrolled past already.
      var activeIndex = -1;
      for (var i = 0; i < waypoints.length; i++) {
        if (waypoints[i].el.getBoundingClientRect().top <= LINE) activeIndex = i;
        else break;
      }
      if (activeIndex === -1) activeIndex = 0;

      waypoints.forEach(function (w, i) {
        w.link.classList.toggle('passed', i < activeIndex);
        w.link.classList.toggle('active', i === activeIndex);
      });

      var activeGroup = waypoints[activeIndex].link.closest('.edu-sidebar-group');
      groups.forEach(function (group) { group.classList.toggle('active-group', group === activeGroup); });
    }

    var pending = 0;
    function onScroll() {
      if (pending) return;
      pending = requestAnimationFrame(function () { pending = 0; update(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var scrollId = link.getAttribute('data-scroll') || link.getAttribute('data-target');
        var target = document.getElementById(scrollId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
