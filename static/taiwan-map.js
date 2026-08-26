(function () {
  // 自己寫的最小 TopoJSON 解碼器（不引入外部函式庫），只處理畫地圖需要的
  // Polygon / MultiPolygon 兩種 geometry，把 arcs 還原成經緯度座標。
  var COUNTY_IDS = ['10007', '10009', '10010', '67000', '64000'];
  var COUNTY_COLOR = {
    '10007': '#ecffb5', // 彰化
    '10009': '#eaf6ed', // 雲林
    '10010': '#eaf6ed', // 嘉義
    '67000': '#ecffb5', // 台南
    '64000': '#ecffb5'  // 高雄
  };

  // 縣市名稱，滑鼠移到該縣市時顯示。英文取自 topojson 自己的 properties.name，
  // 中文對應上面 COUNTY_COLOR 的註解，兩邊都不是另外編出來的。
  var COUNTY_NAME = {
    '10007': { en: 'Changhua', zh: '彰化' },
    '10009': { en: 'Yunlin', zh: '雲林' },
    '10010': { en: 'Chiayi', zh: '嘉義' },
    '67000': { en: 'Tainan', zh: '台南' },
    '64000': { en: 'Kaohsiung', zh: '高雄' }
  };

  // 每場活動地點的概略經緯度（依鄉鎮位置估算，用於地圖圖釘定位，非精確地址）
  // 順序跟 .edu-map 裡的圖釘 DOM 順序（1~14）一一對應，用 index 配對而不是用連結
  // 配對，因為西港、和順各去了兩次，兩支圖釘會連到同一個 session 錨點。
  var SESSIONS = [
    { lon: 120.4737, lat: 23.9581, county: '10007' },  // 1 溪湖高中，彰化縣溪湖鎮
    { lon: 120.4353, lat: 23.9384, county: '10007' },  // 2 埔鹽國小，彰化縣埔鹽鄉
    { lon: 120.2211, lat: 23.1531, county: '67000' },  // 3 西港國小，台南市西港區
    { lon: 120.1298, lat: 23.1483, county: '67000' },  // 4 篤加國小，台南市七股區
    { lon: 120.2211, lat: 23.1531, county: '67000' },  // 5 西港國小（二）
    { lon: 120.2837, lat: 23.3011, county: '67000' },  // 6 歡雅國小，台南市鹽水區
    { lon: 120.2039, lat: 23.2394, county: '67000' },  // 7 學甲區，台南市
    { lon: 120.2170, lat: 22.9970, county: '67000' },  // 8 成功大學，台南市
    { lon: 120.5730, lat: 23.2000, county: '67000' },  // 9 小太陽協會，台南市楠西區
    { lon: 120.1980, lat: 23.0450, county: '67000' },  // 10 和順國小，台南市安南區
    { lon: 120.2610, lat: 23.3218, county: '67000' },  // 11 安內國小，台南市鹽水區
    { lon: 120.1980, lat: 23.0450, county: '67000' },  // 12 和順國小（二）
    { lon: 120.1568, lat: 23.1530, county: '67000' },  // 13 竹橋國小，台南市七股區
    { lon: 120.1084, lat: 23.2330, county: '67000' }   // 14 三慈國小，台南市北門區
  ];

  // 圖釘要顯示的學校名稱直接讀它連到的那一段的標題，不另外抄一份，
  // 以後改標題名稱時提示框會跟著改，不會兩邊對不起來。
  function schoolNameFor(pin) {
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

  function geometryToRings(geometry, arcs) {
    var rings = [];
    if (geometry.type === 'Polygon') {
      geometry.arcs.forEach(function (ring) {
        rings.push(ringCoords(ring, arcs));
      });
    } else if (geometry.type === 'MultiPolygon') {
      geometry.arcs.forEach(function (polygon) {
        polygon.forEach(function (ring) {
          rings.push(ringCoords(ring, arcs));
        });
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
      return COUNTY_IDS.indexOf(g.properties.id) !== -1;
    });

    var minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    var geoRings = geometries.map(function (g) {
      var rings = geometryToRings(g, decodedArcs);
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
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', ringsToPath(g.rings, project));
      path.setAttribute('fill', COUNTY_COLOR[g.id] || '#eee');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('class', 'edu-map-county');
      path.setAttribute('data-county', g.id);
      svg.appendChild(path);
    });

    container.insertBefore(svg, container.firstChild);

    var pinEls = Array.prototype.slice.call(container.querySelectorAll('.edu-pin'));

    // 把投影後的座標算出來，再確保任何兩支圖釘都不會疊在一起。
    //
    // 原本只把「同一群」的點沿小圓周展開，展開後沒有再檢查一次，所以被推出去
    // 的點可能正好落在另一群的點上——西港的圖釘就這樣整個蓋住學甲那支，讓它
    // 完全點不到也 hover 不到。另外原本的 30 是地圖座標，圖釘卻是固定 26 CSS
    // px，地圖在手機上縮小之後 30 個單位還不到一顆圖釘寬。
    // 現在依實際渲染尺寸換算需要的間距，再把所有太近的成對推開。
    function requiredGap() {
      var rendered = container.clientWidth || width;
      var unitsPerPx = width / rendered;
      var pinPx = (pinEls[0] && pinEls[0].offsetWidth) || 26;
      return (pinPx + 4) * unitsPerPx;
    }

    function layoutPins() {
      var gap = requiredGap();
      var pts = SESSIONS.map(function (s, i) {
        var p = project(s.lon, s.lat);
        return { el: pinEls[i], x: p[0], y: p[1] };
      });

      // 完全同座標的點（同一所學校去了兩次）距離是 0，沒有方向可以推，
      // 先散成一個小圓圈，給下面的推擠一個起點。
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

      // 再把仍然靠太近的成對互相推開，直到全部達到間距。
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

      // 圖釘以座標為中心（CSS 有 transform: translate(-50%, -50%)），留半顆邊界
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

    // 圖釘是固定像素、地圖會隨版面縮放，所以視窗大小改變後要重新算一次間距。
    var relayoutTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(relayoutTimer);
      relayoutTimer = setTimeout(layoutPins, 150);
    });

    // ---- Hover preview -------------------------------------------------
    // Clicking a pin jumps to that session further down the page; hovering one
    // says which school it is first, so the map can be read without leaving it.
    var tip = document.createElement('div');
    tip.className = 'edu-map-tip';
    tip.setAttribute('role', 'status');
    tip.setAttribute('aria-live', 'polite');
    tip.innerHTML = '<span class="edu-map-tip-title"></span>' +
                    '<span class="edu-map-tip-city"></span>';
    container.appendChild(tip);
    var tipTitle = tip.querySelector('.edu-map-tip-title');
    var tipCity = tip.querySelector('.edu-map-tip-city');
    var activePin = null;

    function hideTip() {
      tip.classList.remove('is-visible');
    }

    // x, y are in container pixels; the tip is centred on them and clamped so
    // it never hangs off the map and widens the page.
    function showTip(title, city, x, y) {
      tipTitle.textContent = title || '';
      tipCity.textContent = city || '';
      tipCity.style.display = city ? '' : 'none';
      tip.classList.add('is-visible');

      var cw = container.clientWidth;
      var tw = tip.offsetWidth;
      var th = tip.offsetHeight;
      var left = Math.max(4, Math.min(x - tw / 2, cw - tw - 4));
      var top = y - th - 10;
      var below = top < 0;
      if (below) top = y + 10;
      tip.classList.toggle('is-below', below);
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }

    pinEls.forEach(function (pin, i) {
      var school = schoolNameFor(pin);
      var city = countyLabel((SESSIONS[i] || {}).county);
      if (school) {
        // the pin's own text is just a number, so spell it out for screen readers
        pin.setAttribute('aria-label', city ? school + ' - ' + city : school);
      }
      function show() {
        activePin = pin;
        // translate(-50%,-50%) centres the pin on its left/top, so that IS its
        // centre; its visible top edge is half a pin above.
        showTip(school, city, pin.offsetLeft, pin.offsetTop - pin.offsetHeight / 2);
      }
      function hide() {
        if (activePin === pin) activePin = null;
        hideTip();
      }
      pin.addEventListener('mouseenter', show);
      pin.addEventListener('focus', show);
      pin.addEventListener('mouseleave', hide);
      pin.addEventListener('blur', hide);
    });

    var counties = svg.querySelectorAll('.edu-map-county');
    var mapRect = null;
    counties.forEach(function (el) {
      el.addEventListener('mouseenter', function () { el.classList.add('edu-map-county-active'); });
      el.addEventListener('mouseleave', function () {
        el.classList.remove('edu-map-county-active');
        if (!activePin) hideTip();
      });
      // Counties are large irregular shapes, so the label follows the pointer
      // rather than sitting at some arbitrary centre.
      el.addEventListener('mousemove', function (ev) {
        if (activePin) return;                 // a pin's own preview wins
        var name = countyLabel(el.getAttribute('data-county'));
        if (!name) return;
        mapRect = container.getBoundingClientRect();
        showTip(name, '', ev.clientX - mapRect.left, ev.clientY - mapRect.top);
      });
    });

    // Leaving the map entirely always clears it.
    container.addEventListener('mouseleave', function () {
      activePin = null;
      hideTip();
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
