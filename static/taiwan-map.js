(function () {
  var OUTLYING_ISLAND_IDS = ['09007', '09020', '10016'];

  var INTERACTIVE_COUNTY_IDS = ['10007', '67000'];
  var INTERACTIVE_COLOR = '#f7f1de';
  var DEFAULT_COUNTY_COLOR = '#0b4a33';

  var COUNTY_NAME = {
    '09007': { en: 'Lienchiang', zh: '連江' },
    '09020': { en: 'Kinmen', zh: '金門' },
    '10002': { en: 'Yilan', zh: '宜蘭' },
    '10007': { en: 'Changhua', zh: '彰化' },
    '10008': { en: 'Nantou', zh: '南投' },
    '10009': { en: 'Yunlin', zh: '雲林' },
    '10013': { en: 'Pingtung', zh: '屏東' },
    '10014': { en: 'Taitung', zh: '台東' },
    '10015': { en: 'Hualien', zh: '花蓮' },
    '10016': { en: 'Penghu', zh: '澎湖' },
    '10017': { en: 'Keelung', zh: '基隆' },
    '10018': { en: 'Hsinchu City', zh: '新竹市' },
    '63000': { en: 'Taipei', zh: '台北' },
    '65000': { en: 'New Taipei', zh: '新北' },
    '66000': { en: 'Taichung', zh: '台中' },
    '67000': { en: 'Tainan', zh: '台南' },
    '68000': { en: 'Taoyuan', zh: '桃園' },
    '10005': { en: 'Miaoli', zh: '苗栗' },
    '10004': { en: 'Hsinchu County', zh: '新竹縣' },
    '10020': { en: 'Chiayi City', zh: '嘉義市' },
    '10010': { en: 'Chiayi', zh: '嘉義' },
    '64000': { en: 'Kaohsiung', zh: '高雄' }
  };

  var SESSIONS = [
    { lon: 120.4737, lat: 23.9581, county: '10007' },
    { lon: 120.4353, lat: 23.9384, county: '10007' },
    { lon: 120.2211, lat: 23.1531, county: '67000' },
    { lon: 120.1298, lat: 23.1483, county: '67000' },
    { lon: 120.2211, lat: 23.1531, county: '67000' },
    { lon: 120.2837, lat: 23.3011, county: '67000' },
    { lon: 120.2039, lat: 23.2394, county: '67000' },
    { lon: 120.2170, lat: 22.9970, county: '67000' },
    { lon: 120.5730, lat: 23.2000, county: '67000' },
    { lon: 120.1980, lat: 23.0450, county: '67000' },
    { lon: 120.2610, lat: 23.3218, county: '67000' },
    { lon: 120.1980, lat: 23.0450, county: '67000' },
    { lon: 120.1568, lat: 23.1530, county: '67000' },
    { lon: 120.1084, lat: 23.2330, county: '67000' },
    { lon: 120.1686, lat: 22.9966, county: '67000' },
    { lon: 120.2063, lat: 22.9877, county: '67000' },
    { lon: 120.2250, lat: 22.9800, county: '67000' }
  ];

  function schoolNameFor(pin) {
    var override = pin.getAttribute('data-title');
    if (override) return override;

    var href = pin.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return '';
    var section = document.getElementById(href.slice(1));
    if (!section) return '';
    var heading = section.querySelector('h3, h2');
    return heading ? heading.textContent.trim() : '';
  }

  function countyLabel(id) {
    var c = COUNTY_NAME[id];
    return c ? c.en + ' (' + c.zh + ')' : '';
  }

  function decodeArc(arc, transform) {
    var sx = transform.scale[0], sy = transform.scale[1];
    var tx = transform.translate[0], ty = transform.translate[1];
    var x = 0, y = 0;
    return arc.map(function (delta) {
      x += delta[0];
      y += delta[1];
      return [x * sx + tx, y * sy + ty];
    });
  }

  function arcCoords(index, arcs) {
    var reversed = index < 0;
    var i = reversed ? ~index : index;
    var coords = arcs[i].slice();
    if (reversed) coords.reverse();
    return coords;
  }

  function ringCoords(indices, arcs) {
    var coords = [];
    indices.forEach(function (idx, i) {
      var pts = arcCoords(idx, arcs);
      if (i > 0) pts = pts.slice(1);
      coords = coords.concat(pts);
    });
    return coords;
  }

  function geometryToRings(geometry, arcs, skipSmallParts) {
    var rings = [];
    if (geometry.type === 'Polygon') {
      geometry.arcs.forEach(function (ring) {
        rings.push(ringCoords(ring, arcs));
      });
    } else if (geometry.type === 'MultiPolygon') {
      geometry.arcs.forEach(function (polygon) {
        var polyRings = polygon.map(function (ring) { return ringCoords(ring, arcs); });
        if (skipSmallParts) {
          var totalPoints = polyRings.reduce(function (sum, r) { return sum + r.length; }, 0);
          if (totalPoints < 50) return;
        }
        rings = rings.concat(polyRings);
      });
    }
    return rings;
  }

  function ringsToPath(rings, project) {
    return rings.map(function (ring) {
      var d = ring.map(function (pt, i) {
        var p = project(pt[0], pt[1]);
        return (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2);
      }).join(' ');
      return d + ' Z';
    }).join(' ');
  }

  function renderMap(topo, container) {
    var transform = topo.transform;
    var decodedArcs = topo.arcs.map(function (arc) { return decodeArc(arc, transform); });

    var geometries = topo.objects.map.geometries.filter(function (g) {
      return OUTLYING_ISLAND_IDS.indexOf(g.properties.id) === -1;
    });

    var minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    var geoRings = geometries.map(function (g) {
      var rings = geometryToRings(g, decodedArcs, true);
      rings.forEach(function (ring) {
        ring.forEach(function (pt) {
          if (pt[0] < minLon) minLon = pt[0];
          if (pt[0] > maxLon) maxLon = pt[0];
          if (pt[1] < minLat) minLat = pt[1];
          if (pt[1] > maxLat) maxLat = pt[1];
        });
      });
      return { id: g.properties.id, rings: rings };
    });

    var padding = 0.03;
    minLon -= padding; maxLon += padding;
    minLat -= padding; maxLat += padding;

    var width = 460, height = 640;
    var lonRange = maxLon - minLon;
    var latRange = maxLat - minLat;
    var scale = Math.min(width / lonRange, height / latRange);
    var offsetX = (width - lonRange * scale) / 2;
    var offsetY = (height - latRange * scale) / 2;

    function project(lon, lat) {
      return [(lon - minLon) * scale + offsetX, (maxLat - lat) * scale + offsetY];
    }

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('class', 'edu-map-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    geoRings.forEach(function (g) {
      var isInteractive = INTERACTIVE_COUNTY_IDS.indexOf(g.id) !== -1;
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', ringsToPath(g.rings, project));
      path.setAttribute('fill', isInteractive ? INTERACTIVE_COLOR : DEFAULT_COUNTY_COLOR);
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('class', 'edu-map-county' + (isInteractive ? ' edu-map-county-interactive' : ''));
      path.setAttribute('data-county', g.id);
      svg.appendChild(path);
    });

    var defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML =
      '<filter id="twHaloWide" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feMorphology operator="dilate" radius="6" in="SourceAlpha" result="sp"/>' +
      '<feComposite in="sp" in2="SourceAlpha" operator="out" result="rim"/>' +
      '<feGaussianBlur in="rim" stdDeviation="7" result="bl"/>' +
      '<feFlood flood-color="#a0e860" flood-opacity="0.9"/>' +
      '<feComposite in2="bl" operator="in"/>' +
      '</filter>' +
      '<filter id="twHaloRim" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feMorphology operator="dilate" radius="1.6" in="SourceAlpha" result="sp"/>' +
      '<feComposite in="sp" in2="SourceAlpha" operator="out" result="rim"/>' +
      '<feGaussianBlur in="rim" stdDeviation="1.4" result="bl"/>' +
      '<feFlood flood-color="#d7f5b8" flood-opacity="1"/>' +
      '<feComposite in2="bl" operator="in"/>' +
      '</filter>';
    svg.appendChild(defs);

    function silhouetteCopy(filterId) {
      var g = document.createElementNS(svgNS, 'g');
      g.setAttribute('filter', 'url(#' + filterId + ')');
      g.setAttribute('pointer-events', 'none');
      geoRings.forEach(function (rg) {
        var p = document.createElementNS(svgNS, 'path');
        p.setAttribute('d', ringsToPath(rg.rings, project));
        p.setAttribute('fill', '#fff');
        p.setAttribute('fill-rule', 'evenodd');
        g.appendChild(p);
      });
      return g;
    }
    var glowLayer = document.createElementNS(svgNS, 'g');
    glowLayer.setAttribute('class', 'tw-coast-glow-group');
    glowLayer.setAttribute('aria-hidden', 'true');
    glowLayer.appendChild(silhouetteCopy('twHaloWide'));
    glowLayer.appendChild(silhouetteCopy('twHaloRim'));

    container.insertBefore(svg, container.firstChild);

    container.addEventListener('mouseenter', function () {
      if (!glowLayer.parentNode) {
        svg.appendChild(glowLayer);
        void glowLayer.getBoundingClientRect();
      }
      glowLayer.classList.add('is-lit');
    });
    container.addEventListener('mouseleave', function () { glowLayer.classList.remove('is-lit'); });

    var pinEls = Array.prototype.slice.call(container.querySelectorAll('.edu-pin'));

    function requiredGap() {
      var rendered = container.clientWidth || width;
      var unitsPerPx = width / rendered;
      var pinPx = (pinEls[0] && pinEls[0].offsetWidth) || 26;
      return (pinPx + 4) * unitsPerPx;
    }

    var countyPolys = {};
    geoRings.forEach(function (g) {
      countyPolys[g.id] = g.rings.map(function (ring) {
        return ring.map(function (c) { return project(c[0], c[1]); });
      });
    });

    function insideCounty(id, x, y) {
      var rings = countyPolys[id];
      if (!rings) return true;
      var inside = false;
      for (var r = 0; r < rings.length; r++) {
        var ring = rings[r];
        for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
          if ((yi > y) !== (yj > y) &&
              x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
        }
      }
      return inside;
    }

    var countyCentre = {};
    Object.keys(countyPolys).forEach(function (id) {
      var sx = 0, sy = 0, n = 0;
      countyPolys[id].forEach(function (ring) {
        ring.forEach(function (p) { sx += p[0]; sy += p[1]; n++; });
      });
      countyCentre[id] = n ? [sx / n, sy / n] : null;
    });

    function layoutPins() {
      var gap = requiredGap();
      var pts = SESSIONS.map(function (s, i) {
        var p = project(s.lon, s.lat);
        return { el: pinEls[i], x: p[0], y: p[1], county: s.county };
      });

      var groups = [];
      pts.forEach(function (pt) {
        var g = null;
        for (var k = 0; k < groups.length; k++) {
          if (Math.hypot(groups[k].x - pt.x, groups[k].y - pt.y) < 0.5) { g = groups[k]; break; }
        }
        if (g) g.points.push(pt);
        else groups.push({ x: pt.x, y: pt.y, points: [pt] });
      });
      groups.forEach(function (group) {
        var n = group.points.length;
        if (n === 1) return;
        var radius = gap * 0.55;
        group.points.forEach(function (pt, i) {
          var a = (2 * Math.PI * i) / n - Math.PI / 2;
          pt.x = group.x + radius * Math.cos(a);
          pt.y = group.y + radius * Math.sin(a);
        });
      });

      for (var pass = 0; pass < 80; pass++) {
        var moved = false;
        for (var i = 0; i < pts.length; i++) {
          for (var j = i + 1; j < pts.length; j++) {
            var a = pts[i], b = pts[j];
            var dx = b.x - a.x, dy = b.y - a.y;
            var d = Math.hypot(dx, dy);
            if (d >= gap) continue;
            if (d < 0.001) { dx = 1; dy = 0; d = 1; }
            var push = (gap - d) / 2 + 0.01;
            a.x -= (dx / d) * push; a.y -= (dy / d) * push;
            b.x += (dx / d) * push; b.y += (dy / d) * push;
            moved = true;
          }
        }
        if (!moved) break;
      }

      pts.forEach(function (pt) {
        var c = countyCentre[pt.county];
        if (!c || insideCounty(pt.county, pt.x, pt.y)) return;
        for (var t = 0.08; t <= 1.0001; t += 0.08) {
          var nx = pt.x + (c[0] - pt.x) * t;
          var ny = pt.y + (c[1] - pt.y) * t;
          if (insideCounty(pt.county, nx, ny)) { pt.x = nx; pt.y = ny; return; }
        }
        pt.x = c[0]; pt.y = c[1];
      });

      var half = gap / 2;
      pts.forEach(function (pt) {
        pt.x = Math.max(half, Math.min(pt.x, width - half));
        pt.y = Math.max(half, Math.min(pt.y, height - half));
        if (!pt.el) return;
        pt.el.style.left = (pt.x / width * 100).toFixed(2) + '%';
        pt.el.style.top = (pt.y / height * 100).toFixed(2) + '%';
      });
    }

    layoutPins();

    var relayoutTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(relayoutTimer);
      relayoutTimer = setTimeout(function () {
        layoutPins();
      }, 150);
    });

    var row = container.closest('.edu-map-row');
    var orbitEl = row && row.querySelector('.edu-map-orbit');
    var leaderLayer = row && row.querySelector('.edu-map-leaders');
    var orbitItems = [];

    if (orbitEl && leaderLayer) {
      pinEls.forEach(function (pin, i) {
        var item = document.createElement('a');
        item.className = 'edu-map-orbit-item';
        item.href = pin.getAttribute('href') || '#';
        item.innerHTML = '<img class="edu-map-info-photo" alt="">' +
                          '<span class="edu-map-info-body">' +
                          '<span class="edu-map-info-title"></span>' +
                          '<span class="edu-map-info-meta"></span>' +
                          '</span>';
        var photoEl = item.querySelector('.edu-map-info-photo');
        var titleEl = item.querySelector('.edu-map-info-title');
        var metaEl = item.querySelector('.edu-map-info-meta');
        var photo = pin.getAttribute('data-photo');
        photoEl.style.display = photo ? '' : 'none';
        photoEl.decoding = 'async';
        if (photo) photoEl.src = photo;
        titleEl.textContent = schoolNameFor(pin) || '';
        var meta = [countyLabel((SESSIONS[i] || {}).county), pin.getAttribute('data-date')]
          .filter(Boolean).join(' · ');
        metaEl.textContent = meta;
        orbitEl.appendChild(item);

        var line = document.createElement('span');
        line.className = 'edu-map-leader-line';
        leaderLayer.appendChild(line);

        line.style.opacity = '0';
        orbitItems.push({ pin: pin, el: item, line: line, active: false,
                          baseAngle: (2 * Math.PI * i) / pinEls.length });
      });
    }

    function angleDiff(a, b) {
      var d = (a - b) % (2 * Math.PI);
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      return d;
    }

    var ROTATION_PERIOD_MS = 40000;
    var ACTIVE_THRESHOLD = (10 * Math.PI) / 180;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var geom = null, geomAt = -1e9;
    var LEADER_MAX = 1400;
    function measureOrbit() {
      var rr = row.getBoundingClientRect();
      geom = {
        w: rr.width, h: rr.height,
        compact: row.classList.contains('is-orbit-compact'),
        pins: orbitItems.map(function (it) {
          var p = it.pin.getBoundingClientRect();
          return { x: p.left + p.width / 2 - rr.left, y: p.top + p.height / 2 - rr.top };
        })
      };
    }

    function layoutOrbit(rotation, now) {
      if (!orbitItems.length) return;
      if (!geom || now === undefined || now - geomAt > 1000) { measureOrbit(); geomAt = now || 0; }
      var cx = geom.w / 2;
      var cy = geom.h / 2;
      var rx = Math.max(0, cx - (geom.compact ? 105 : 140));
      var ry = Math.max(0, cy - 24);

      var frame = orbitItems.map(function (it, i) {
        var angle = it.baseAngle + rotation;
        var active = Math.abs(angleDiff(angle, 0)) < ACTIVE_THRESHOLD ||
                     Math.abs(angleDiff(angle, Math.PI)) < ACTIVE_THRESHOLD;
        return {
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle),
          active: active,
          pin: geom.pins[i]
        };
      });

      orbitItems.forEach(function (it, i) {
        var f = frame[i];
        it.el.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px,0) translate(-50%,-50%)';

        if (f.active !== it.active) {
          it.active = f.active;
          it.el.classList.toggle('is-active', f.active);
          it.line.style.opacity = f.active ? '' : '0';
        }
        if (f.active) {
          var dx = f.pin.x - f.x;
          var dy = f.pin.y - f.y;
          var len = Math.sqrt(dx * dx + dy * dy);
          it.line.style.clipPath = 'inset(0 ' + Math.max(0, LEADER_MAX - len).toFixed(1) + 'px 0 0)';
          it.line.style.transform = 'translate(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px) rotate(' +
                                    Math.atan2(dy, dx).toFixed(4) + 'rad)';
        }
      });
    }

    var ORBIT_MIN = 1010, COMPACT_MIN = 760;
    var orbitOn = false;
    var rowVisible = true;
    var rafId = null, lastTs = null, elapsed = 0;
    var ORBIT_FRAME_MS = 1000 / 30, orbitTimer = null;

    var reached = false;
    document.addEventListener('pointermove', function (e) {
      reached = e.pointerType === 'mouse' && !!(e.target.closest &&
                e.target.closest('.edu-map-orbit-item'));
    }, { passive: true });
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget) reached = false;
    });
    var focusAt = -1e9, focused = false;
    var orbitHeld = function (ts) {
      if (ts - focusAt >= 120) {
        focusAt = ts;
        var el = document.activeElement;
        focused = !!(el && orbitEl.contains(el) && el.matches(':focus-visible'));
      }
      return reached || focused;
    };
    var EASE_MS = 2000, speed = 1;
    var orbitTick = function (ts) {
      if (lastTs !== null) {
        var dt = Math.min(ts - lastTs, 100);
        var goal = orbitHeld(ts) ? 0 : 1;
        var step = dt / EASE_MS;
        speed = goal > speed ? Math.min(goal, speed + step) : Math.max(goal, speed - step);
        elapsed += dt * speed;
      }
      lastTs = ts;
      layoutOrbit((elapsed / ROTATION_PERIOD_MS) * 2 * Math.PI, ts);
      rafId = null;
      orbitTimer = setTimeout(function () {
        orbitTimer = null;
        rafId = requestAnimationFrame(orbitTick);
      }, ORBIT_FRAME_MS - 8);
    };
    var syncOrbit = function () {
      if (reduceMotion) { if (orbitOn) layoutOrbit(0); return; }
      var shouldRun = orbitOn && rowVisible;
      var running = rafId !== null || orbitTimer !== null;
      if (shouldRun && !running) {
        lastTs = null;
        rafId = requestAnimationFrame(orbitTick);
      } else if (!shouldRun && running) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        if (orbitTimer !== null) clearTimeout(orbitTimer);
        rafId = null;
        orbitTimer = null;
      }
    };

    if (orbitItems.length && !reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        rowVisible = entries[0].isIntersecting;
        syncOrbit();
      }, { rootMargin: '100px 0px' }).observe(row);
    }

    var strip = null;
    var oneTap = false;
    var stripItems = [];
    var selectedIdx = -1;

    function select(i, scrollStrip) {
      if (selectedIdx >= 0) {
        stripItems[selectedIdx].classList.remove('is-selected');
        pinEls[selectedIdx].classList.remove('is-selected');
      }
      selectedIdx = i;
      if (i < 0) return;
      stripItems[i].classList.add('is-selected');
      pinEls[i].classList.add('is-selected');
      if (scrollStrip && strip) {
        var it = stripItems[i];
        strip.scrollTo({
          left: it.offsetLeft - (strip.clientWidth - it.offsetWidth) / 2,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      }
    }

    if (row && pinEls.length) {
      strip = document.createElement('div');
      strip.className = 'edu-map-strip';
      strip.setAttribute('role', 'list');
      pinEls.forEach(function (pin, i) {
        var a = document.createElement('a');
        a.className = 'edu-strip-item';
        a.setAttribute('role', 'listitem');
        a.href = pin.getAttribute('href') || '#';
        var photo = pin.getAttribute('data-photo');
        if (photo) {
          var img = document.createElement('img');
          img.className = 'edu-strip-photo';
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          img.src = photo;
          a.appendChild(img);
        }
        var name = document.createElement('span');
        name.className = 'edu-strip-title';
        name.textContent = schoolNameFor(pin) || '';
        var meta = document.createElement('span');
        meta.className = 'edu-strip-meta';
        meta.textContent = [countyLabel((SESSIONS[i] || {}).county), pin.getAttribute('data-date')]
          .filter(Boolean).join(' · ');
        a.appendChild(name);
        a.appendChild(meta);
        a.addEventListener('click', function (e) {
          if (oneTap) { select(i, false); return; }
          if (selectedIdx !== i) { e.preventDefault(); select(i, true); }
        });
        strip.appendChild(a);
        stripItems.push(a);

        pin.addEventListener('click', function (e) {
          if (!row.classList.contains('is-strip')) return;
          if (selectedIdx !== i) { e.preventDefault(); select(i, true); }
        });
      });
      row.parentNode.insertBefore(strip, row.nextSibling);
    }

    var currentMode = '';
    function applyMode() {
      var w = (row.parentElement || row).clientWidth;
      var mode = w >= ORBIT_MIN ? 'orbit' : (w >= COMPACT_MIN ? 'orbit-compact' : 'strip');
      if (mode === currentMode) return;
      currentMode = mode;
      row.classList.toggle('is-orbit', mode === 'orbit');
      row.classList.toggle('is-orbit-compact', mode === 'orbit-compact');
      row.classList.toggle('is-strip', mode === 'strip');
      if (mode !== 'strip') select(-1);
      orbitOn = mode !== 'strip' && orbitItems.length > 0;
      layoutPins();
      geom = null;
      syncOrbit();
    }

    if (row) {
      if ('ResizeObserver' in window) new ResizeObserver(applyMode).observe(row.parentElement || row);
      else window.addEventListener('resize', applyMode);
      applyMode();
    }

    if (strip && stripItems.length > 1 && !reduceMotion) {
      var SPEED = 38;
      var RESUME_MS = 2500;
      var before = [], after = [];
      stripItems.forEach(function (el, k) {
        el.setAttribute('data-strip-idx', k);
        [before, after].forEach(function (list) {
          var c = el.cloneNode(true);
          c.classList.add('is-clone');
          c.setAttribute('aria-hidden', 'true');
          c.setAttribute('tabindex', '-1');
          c.addEventListener('click', function (e) {
            select(k, false);
          });
          list.push(c);
        });
      });
      before.forEach(function (c) { strip.insertBefore(c, stripItems[0]); });
      after.forEach(function (c) { strip.appendChild(c); });
      strip.style.scrollSnapType = 'none';
      oneTap = true;
      strip.classList.add('is-marquee');

      var loopW = 0, pos = 0, driving = false;
      var touchedAt = 0, stripVisible = false, lastT = 0, rafId = 0;

      var measure = function () {
        loopW = after[0].offsetLeft - stripItems[0].offsetLeft;
        if (loopW > 0 && (strip.scrollLeft < loopW || strip.scrollLeft >= loopW * 2)) {
          strip.scrollLeft = loopW + (((strip.scrollLeft % loopW) + loopW) % loopW);
        }
      };
      var wrap = function () {
        if (!loopW) return;
        if (strip.scrollLeft >= loopW * 2) strip.scrollLeft -= loopW;
        else if (strip.scrollLeft < loopW) strip.scrollLeft += loopW;
      };
      var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
      var pointerOn = function () { return canHover && strip.matches(':hover'); };
      var keyboardOn = function () {
        var el = document.activeElement;
        return !!(el && strip.contains(el) && el.matches(':focus-visible'));
      };
      var paused = function () {
        return pointerOn() || keyboardOn() || document.hidden || !stripVisible ||
               !row.classList.contains('is-strip') || Date.now() - touchedAt < RESUME_MS;
      };
      var tick = function (t) {
        rafId = 0;
        if (!stripVisible || !row.classList.contains('is-strip')) {
          driving = false;
          return;
        }
        var dt = Math.min((t - (lastT || t)) / 1000, 0.1);
        lastT = t;
        if (paused()) {
          driving = false;
        } else {
          if (!driving) { pos = strip.scrollLeft; driving = true; }
          if (!loopW) measure();
          pos += SPEED * dt;
          strip.scrollLeft = pos;
          wrap();
          if (Math.abs(strip.scrollLeft - pos) > 2) pos = strip.scrollLeft;
        }
        rafId = requestAnimationFrame(tick);
      };
      var kick = function () { if (!rafId) { lastT = 0; rafId = requestAnimationFrame(tick); } };
      window.setInterval(function () { if (stripVisible) kick(); }, 400);

      var touched = function () { touchedAt = Date.now(); };
      var returnTo = -1;
      strip.addEventListener('click', function (e) {
        var card = e.target.closest && e.target.closest('.edu-strip-item');
        if (card) returnTo = +card.getAttribute('data-strip-idx');
      });
      ['pointerdown', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) {
        strip.addEventListener(ev, touched, { passive: true });
      });
      strip.addEventListener('scroll', function () {
        if (!driving) { if (Date.now() - touchedAt < RESUME_MS) touched(); wrap(); }
      }, { passive: true });
      window.addEventListener('resize', function () { loopW = 0; });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          stripVisible = entries[entries.length - 1].isIntersecting;
          if (stripVisible && returnTo >= 0) {
            var from = stripItems[returnTo];
            returnTo = -1;
            touchedAt = 0;
            driving = false;
            strip.scrollTo({ left: from.offsetLeft - (strip.clientWidth - from.offsetWidth) / 2, behavior: 'instant' });
          }
          if (stripVisible) kick();
        }, { threshold: 0.2 }).observe(strip);
      } else { stripVisible = true; kick(); }
      if ('ResizeObserver' in window) new ResizeObserver(function () { loopW = 0; measure(); }).observe(strip);
    }

    pinEls.forEach(function (pin, i) {
      var school = schoolNameFor(pin);
      var city = countyLabel((SESSIONS[i] || {}).county);
      if (school) {
        pin.setAttribute('aria-label', city ? school + ' - ' + city : school);
      }
    });

    var counties = svg.querySelectorAll('.edu-map-county');
    counties.forEach(function (el) {
      el.addEventListener('mouseenter', function () { el.classList.add('edu-map-county-active'); });
      el.addEventListener('mouseleave', function () { el.classList.remove('edu-map-county-active'); });
    });
  }

  function init() {
    var container = document.getElementById('edu-map');
    if (!container) return;

    fetch(container.getAttribute('data-src') || '/static/taiwan-counties.topo.json')
      .then(function (res) { return res.json(); })
      .then(function (topo) { renderMap(topo, container); })
      .catch(function (err) { console.error('Taiwan map failed to load', err); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
