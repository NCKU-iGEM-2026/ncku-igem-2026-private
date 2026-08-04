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

  // 每場活動地點的概略經緯度（依鄉鎮位置估算，用於地圖圖釘定位，非精確地址）
  // 順序跟 .edu-map 裡的圖釘 DOM 順序（1~14）一一對應，用 index 配對而不是用連結
  // 配對，因為西港、和順各去了兩次，兩支圖釘會連到同一個 session 錨點。
  var SESSIONS = [
    { lon: 120.4737, lat: 23.9581 },  // 1 溪湖高中，彰化縣溪湖鎮
    { lon: 120.4353, lat: 23.9384 },  // 2 埔鹽國小，彰化縣埔鹽鄉
    { lon: 120.2211, lat: 23.1531 },  // 3 西港國小，台南市西港區
    { lon: 120.1298, lat: 23.1483 },  // 4 篤加國小，台南市七股區
    { lon: 120.2211, lat: 23.1531 },  // 5 西港國小（二）
    { lon: 120.2837, lat: 23.3011 },  // 6 歡雅國小，台南市鹽水區
    { lon: 120.2039, lat: 23.2394 },  // 7 學甲區，台南市
    { lon: 120.2170, lat: 22.9970 },  // 8 成功大學，台南市
    { lon: 120.2980, lat: 22.7938 },  // 9 小太陽協會
    { lon: 120.1980, lat: 23.0450 },  // 10 和順國小，台南市安南區
    { lon: 120.2610, lat: 23.3218 },  // 11 安內國小，台南市鹽水區
    { lon: 120.1980, lat: 23.0450 },  // 12 和順國小（二）
    { lon: 120.1568, lat: 23.1530 },  // 13 竹橋國小，台南市七股區
    { lon: 120.1084, lat: 23.2330 }   // 14 三慈國小，台南市北門區
  ];

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

    // 把投影後的像素座標算出來，同一群太靠近的點用小圓周展開，避免疊在一起
    var points = SESSIONS.map(function (s, i) {
      var p = project(s.lon, s.lat);
      return { el: pinEls[i], x: p[0], y: p[1] };
    });

    var minGap = 30;
    var groups = [];
    points.forEach(function (pt) {
      var group = groups.find(function (g) {
        return Math.hypot(g.x - pt.x, g.y - pt.y) < minGap;
      });
      if (group) {
        group.points.push(pt);
      } else {
        groups.push({ x: pt.x, y: pt.y, points: [pt] });
      }
    });

    groups.forEach(function (group) {
      var n = group.points.length;
      if (n === 1) return;
      var radius = minGap * 0.65;
      group.points.forEach(function (pt, i) {
        var angle = (2 * Math.PI * i) / n - Math.PI / 2;
        pt.x = group.x + radius * Math.cos(angle);
        pt.y = group.y + radius * Math.sin(angle);
      });
    });

    points.forEach(function (pt) {
      if (!pt.el) return;
      pt.el.style.left = (pt.x / width * 100).toFixed(2) + '%';
      pt.el.style.top = (pt.y / height * 100).toFixed(2) + '%';
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
