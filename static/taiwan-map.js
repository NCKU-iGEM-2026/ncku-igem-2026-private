(function () {
  // 自己寫的最小 TopoJSON 解碼器（不引入外部函式庫），只處理畫地圖需要的
  // Polygon / MultiPolygon 兩種 geometry，把 arcs 還原成經緯度座標。
  // Kinmen, Matsu and Penghu sit far off the main island; their bounding
  // boxes would otherwise stretch the projection out and shrink the main
  // island down. The map is now the whole main island, not just the 5
  // counties the sessions happened in, so this needs leaving out explicitly
  // rather than just filtering down to a short list like before.
  var OUTLYING_ISLAND_IDS = ['09007', '09020', '10016'];

  // The only two counties any session pin actually sits in -- these are the
  // ones with a clickable overlay group that zooms in. Everywhere else on
  // the island is just geographic context.
  var INTERACTIVE_COUNTY_IDS = ['10007', '67000'];
  var INTERACTIVE_COLOR = '#f7f1de';      /* 淡米黃白：有活動的縣市 */
  var DEFAULT_COUNTY_COLOR = '#0b4a33';   /* 整島不透明深綠（適配 Collaboration 主視覺） */

  // 縣市名稱，滑鼠移到該縣市時顯示。英文取自 topojson 自己的 properties.name，
  // 中文是另外對照標準行政區代碼填的。
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
    { lon: 120.1084, lat: 23.2330, county: '67000' },  // 14 三慈國小，台南市北門區
    { lon: 120.1686, lat: 22.9966, county: '67000' }   // 15 安平國中，台南市安平區慶平路
  ];

  // 圖釘要顯示的學校名稱直接讀它連到的那一段的標題，不另外抄一份，
  // 以後改標題名稱時提示框會跟著改，不會兩邊對不起來。少數幾支圖釘（像
  // 展心底下那些國小）共用同一個 section，標題讀到的會是整個 section 的
  // 大標題而不是個別學校，這種情況才需要 data-title 覆蓋掉。
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

  // skipSmallParts drops individual polygons within a MultiPolygon that are
  // tiny offshore islets (Green Island, Orchid Island, Turtle Island, the
  // Diaoyutai Islands out past 123°E that were stretching the whole main-
  // island map to fit them in) rather than part of the main island's own
  // coastline -- real coastline has hundreds of points from all the inlets
  // and headlands; a standalone islet this small has a handful.
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

    // ---- 全島輪廓 hover 發光的資料準備 ------------------------------
    // （舊版曾用「海岸弧段拼接」畫描邊，但這份 TopoJSON 的海岸弧拆得
    //   不完整，任何容差都會在島上留下橫穿直線——已改用 SVG filter 從
    //   填色剪影生成光暈，見下方 twHaloWide／twHaloRim，這裡不再需要。）

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

    // ---- 全島輪廓 hover 發光（呼吸光暈）-----------------------------
    // 不做弧段拼接（這份資料的海岸弧拆得不完整，拼接必出橫穿直線）。
    // 改用 SVG filter：把整組縣市填色看作一個 alpha 形體，
    // feMorphology dilate 膨漲出外擴帶 → out 減掉原形體 → 只剩島的外圈
    // → blur 暈開 → flood 螢光綠上色。輪廓自動是「島_union_的邊」，
    // 縣市內界線不會出現。CSS 再加呼吸明暗動畫。
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
    // The glow is invisible until the pointer is over the map, but its two
    // blur filters are rasterised as soon as the layer is in the page -- that
    // alone froze the page for over a second on arrival. So the layer joins
    // the SVG on the first hover instead.

    container.insertBefore(svg, container.firstChild);

    // hover：亮起（呼吸動畫在 CSS），離開淡滅
    container.addEventListener('mouseenter', function () {
      if (!glowLayer.parentNode) {
        svg.appendChild(glowLayer);
        void glowLayer.getBoundingClientRect();   // so the fade-in still plays
      }
      glowLayer.classList.add('is-lit');
    });
    container.addEventListener('mouseleave', function () { glowLayer.classList.remove('is-lit'); });

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
      relayoutTimer = setTimeout(function () {
        layoutPins();
      }, 150);
    });

    // ---- Hover preview -------------------------------------------------
    // Clicking a pin jumps to that session further down the page; its details
    // are already always shown on the orbiting cards below, so there's no
    // hover tooltip here any more.

    // ---- Orbiting session cards (wide screens only; see .edu-map-row CSS) --
    // All 14 cards continuously circle the map on a fixed ellipse. The two
    // that land in the fixed left/right slots (angle 0 and pi, since 14 is
    // even every card has one directly opposite it) expand to full,
    // readable cards with a leader line to their pin; everywhere else on the
    // ellipse a card is just a small shrunk chip, so nothing overlaps no
    // matter how the rotation lines up.
    var row = container.closest('.edu-map-row');
    var orbitEl = row && row.querySelector('.edu-map-orbit');
    var leaderLayer = row && row.querySelector('.edu-map-leaders');
    var orbitItems = [];

    if (orbitEl && leaderLayer) {
      pinEls.forEach(function (pin, i) {
        // A real link, like the pin it stands for: one click goes to that
        // session's section, and the keyboard can reach it.
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
        if (photo) photoEl.src = photo;
        titleEl.textContent = schoolNameFor(pin) || '';
        var meta = [countyLabel((SESSIONS[i] || {}).county), pin.getAttribute('data-date')]
          .filter(Boolean).join(' · ');
        metaEl.textContent = meta;
        orbitEl.appendChild(item);

        // 連線是一條細長的 span，用 transform 平移＋旋轉到位（見 CSS）
        var line = document.createElement('span');
        line.className = 'edu-map-leader-line';
        leaderLayer.appendChild(line);

        line.style.opacity = '0';
        orbitItems.push({ pin: pin, el: item, line: line, active: false,
                          baseAngle: (2 * Math.PI * i) / pinEls.length });
      });
    }

    // Shortest signed distance from angle a to angle b, in radians.
    function angleDiff(a, b) {
      var d = (a - b) % (2 * Math.PI);
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      return d;
    }

    var ROTATION_PERIOD_MS = 48000;
    var ACTIVE_THRESHOLD = (10 * Math.PI) / 180;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 效能：每一幀都在跑，所以 (1) 所有量測（getBoundingClientRect）都放在
    // 寫入之前，避免「寫了又讀」逼瀏覽器每幀重排版；(2) 卡片位置改用
    // transform 移動（只需合成，不觸發 layout），不再改 left/top；
    // (3) class 與連線透明度只在狀態真的改變時才寫。
    function layoutOrbit(rotation) {
      if (!orbitItems.length) return;
      var rowRect = row.getBoundingClientRect();
      var cx = rowRect.width / 2;
      var cy = rowRect.height / 2;
      // half a card plus a little air; compact mode uses narrower cards
      var rx = Math.max(0, cx - (row.classList.contains('is-orbit-compact') ? 105 : 140));
      var ry = Math.max(0, cy - 24);

      // 先讀：算出每張卡的位置與狀態，啟用中的卡才量它的圖釘位置
      var frame = orbitItems.map(function (it) {
        var angle = it.baseAngle + rotation;
        var active = Math.abs(angleDiff(angle, 0)) < ACTIVE_THRESHOLD ||
                     Math.abs(angleDiff(angle, Math.PI)) < ACTIVE_THRESHOLD;
        return {
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle),
          active: active,
          pinRect: active ? it.pin.getBoundingClientRect() : null
        };
      });

      // 再寫
      orbitItems.forEach(function (it, i) {
        var f = frame[i];
        it.el.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px,0) translate(-50%,-50%)';

        if (f.active !== it.active) {
          it.active = f.active;
          it.el.classList.toggle('is-active', f.active);
          it.line.style.opacity = f.active ? '' : '0';
        }
        if (f.active) {
          // 從卡片中心拉到圖釘中心：長度給 width，方向給 rotate
          var dx = f.pinRect.left + f.pinRect.width / 2 - rowRect.left - f.x;
          var dy = f.pinRect.top + f.pinRect.height / 2 - rowRect.top - f.y;
          it.line.style.width = Math.sqrt(dx * dx + dy * dy).toFixed(1) + 'px';
          it.line.style.transform = 'translate(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px) rotate(' +
                                    Math.atan2(dy, dx).toFixed(4) + 'rad)';
        }
      });
    }

    // ---- Layout modes ---------------------------------------------------
    // 依「地圖這一列實際可用的寬度」(不是視窗寬度，頁面左側還有側邊欄) 選版面：
    //   orbit         ≥1010px  環繞卡片，左右各留 280px
    //   orbit-compact ≥760px   環繞卡片縮小，左右各留 190px，地圖維持 380px 不被擠小
    //   strip         其餘     地圖維持完整大小，下方放可橫向滑動的照片列
    var ORBIT_MIN = 1010, COMPACT_MIN = 760;
    var orbitOn = false;
    var rowVisible = true;
    var rafId = null, lastTs = null, elapsed = 0;

    // The ring holds still while the pointer is on one of its cards (or one has
    // keyboard focus), so it can be read and clicked. Asked of the browser each
    // frame, not remembered from enter/leave events: cards move under a still
    // pointer, and a click that jumps the page leaves no "leave" behind.
    var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    var orbitHeld = function () {
      if (canHover && orbitEl.querySelector('.edu-map-orbit-item:hover')) return true;
      var el = document.activeElement;
      return !!(el && orbitEl.contains(el) && el.matches(':focus-visible'));
    };
    var orbitTick = function (ts) {
      if (lastTs !== null && !orbitHeld()) elapsed += Math.min(ts - lastTs, 100);
      lastTs = ts;
      layoutOrbit((elapsed / ROTATION_PERIOD_MS) * 2 * Math.PI);
      rafId = requestAnimationFrame(orbitTick);
    };
    // 只在「環繞卡片有顯示＋地圖在畫面內」時才跑動畫，其餘時間整個停掉；
    // 旋轉角度以暫停前累積的進度接續，不會跳格。
    var syncOrbit = function () {
      if (reduceMotion) { if (orbitOn) layoutOrbit(0); return; }
      var shouldRun = orbitOn && rowVisible;
      if (shouldRun && rafId === null) {
        lastTs = null;
        rafId = requestAnimationFrame(orbitTick);
      } else if (!shouldRun && rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    if (orbitItems.length && !reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        rowVisible = entries[0].isIntersecting;
        syncOrbit();
      }, { rootMargin: '100px 0px' }).observe(row);
    }

    // ---- Photo strip (narrow screens) ----------------------------------
    // 窄螢幕沒有地方放環繞卡片，所以改成地圖下方一排可橫向滑動的照片。
    // 點圖釘 → 照片列捲到那一張並標示；點照片 → 圖釘亮起。
    // 已經選中的再點一次，才會跳到下方對應的活動段落。
    var strip = null;
    var oneTap = false;   // true once the strip is a marquee: a tap on a card goes straight to its section
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
          // A still row: the first tap picks the card (and brings it to the middle),
          // the second goes to the section. A marquee never holds still long
          // enough for that, so there one tap goes straight there.
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
      layoutPins();   // 地圖寬度變了，圖釘間距要重算
      syncOrbit();
    }

    if (row) {
      if ('ResizeObserver' in window) new ResizeObserver(applyMode).observe(row.parentElement || row);
      else window.addEventListener('resize', applyMode);
      applyMode();
    }

    // ---- 窄螢幕照片列：跑馬燈 ---------------------------------------
    // 手機上只看得到 1～2 張，其餘要滑才看得到。這裡讓照片列像跑馬燈一樣
    // 持續慢慢往左走，最後一張接回第一張，不用滑也看得到全部。
    // 做法：整排複製成前、中、後三份（複製的是純展示，螢幕閱讀器略過），
    // 一直待在中間那份，走出中間就減掉／加上一份的寬度，畫面上看不出接縫。
    // 滑鼠停在照片列上（或手指碰著、鍵盤聚焦）就停，卡片發光；
    // 看不到照片列、分頁在背景、或系統設定「減少動態效果」時不動。
    if (strip && stripItems.length > 1 && !reduceMotion) {
      var SPEED = 38;          // px per second
      var RESUME_MS = 2500;    // after a touch or scroll by hand
      var before = [], after = [];
      stripItems.forEach(function (el, k) {
        el.setAttribute('data-strip-idx', k);
        [before, after].forEach(function (list) {
          var c = el.cloneNode(true);
          c.classList.add('is-clone');
          c.setAttribute('aria-hidden', 'true');
          c.setAttribute('tabindex', '-1');
          c.addEventListener('click', function (e) {
            select(k, false);   // one tap: let the link carry on to the section
          });
          list.push(c);
        });
      });
      before.forEach(function (c) { strip.insertBefore(c, stripItems[0]); });
      after.forEach(function (c) { strip.appendChild(c); });
      strip.style.scrollSnapType = 'none';   // snapping would fight a moving strip
      oneTap = true;
      strip.classList.add('is-marquee');     // an endless loop has no end to show, so no scroll bar

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
      // Asked of the browser every frame rather than tracked from enter/leave
      // events: when a click jumps the page away, the pointer never "leaves",
      // and a remembered flag would keep the strip frozen for good.
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
          return;   // the watchdog below starts it again once the strip is back
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
          if (Math.abs(strip.scrollLeft - pos) > 2) pos = strip.scrollLeft;   // wrapped (or nudged)
        }
        rafId = requestAnimationFrame(tick);
      };
      var kick = function () { if (!rafId) { lastT = 0; rafId = requestAnimationFrame(tick); } };
      // Watchdog. The loop above stops itself while the strip is out of sight or
      // not in strip layout, and which event should wake it again (scrolling
      // back, a resize, a scroll bar appearing) is easy to get wrong -- it did
      // freeze for real readers. A cheap periodic check cannot miss.
      window.setInterval(function () { if (stripVisible) kick(); }, 400);

      var touched = function () { touchedAt = Date.now(); };
      // The card the reader clicked. A click may jump the page down to that
      // school's section; when they scroll back up the strip carries on from
      // that card instead of from wherever it had drifted to.
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
          stripVisible = entries[entries.length - 1].isIntersecting;   // the newest report, not the oldest
          if (stripVisible && returnTo >= 0) {
            var from = stripItems[returnTo];
            returnTo = -1;
            touchedAt = 0;
            driving = false;   // so the next frame reads the position set here
            strip.scrollTo({ left: from.offsetLeft - (strip.clientWidth - from.offsetWidth) / 2, behavior: 'instant' });
          }
          if (stripVisible) kick();
        }, { threshold: 0.2 }).observe(strip);
      } else { stripVisible = true; kick(); }
      // the strip is display:none until the map is narrow; start from the middle set once it has a size
      if ('ResizeObserver' in window) new ResizeObserver(function () { loopW = 0; measure(); }).observe(strip);
    }

    pinEls.forEach(function (pin, i) {
      var school = schoolNameFor(pin);
      var city = countyLabel((SESSIONS[i] || {}).county);
      if (school) {
        // the pin has no visible label, so spell it out for screen readers
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
