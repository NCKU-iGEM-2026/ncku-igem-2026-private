var ONLINE_CONFIG = {
  databaseUrl: "https://igem-boardgame-default-rtdb.asia-southeast1.firebasedatabase.app"
};

(function () {
  try {
    var override = window.localStorage.getItem("tgc_db_url");
    if (override) ONLINE_CONFIG.databaseUrl = override;
  } catch (e) { }
})();

var Net = (function () {
  var base = function () { return (ONLINE_CONFIG.databaseUrl || "").replace(/\/+$/, ""); };

  function configured() { return !!base(); }

  function url(path) {
    return base() + "/" + String(path).replace(/^\/+/, "") + ".json";
  }

  function request(method, path, body) {
    if (!configured()) return Promise.reject(new Error("not-configured"));
    var opts = { method: method, headers: { "Content-Type": "application/json" } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(url(path), opts).then(function (r) {
      if (!r.ok) throw new Error("http-" + r.status);
      return r.status === 204 ? null : r.json();
    });
  }

  function subscribe(path, onValue, onError) {
    if (!configured()) {
      if (onError) onError(new Error("not-configured"));
      return { close: function () {} };
    }
    var mirror = null;
    var closed = false;
    var es;

    function applyAt(relPath, data) {
      var parts = String(relPath || "/").split("/").filter(Boolean);
      if (!parts.length) { mirror = data; return; }
      if (mirror === null || typeof mirror !== "object") mirror = {};
      var node = mirror;
      for (var i = 0; i < parts.length - 1; i++) {
        if (typeof node[parts[i]] !== "object" || node[parts[i]] === null) node[parts[i]] = {};
        node = node[parts[i]];
      }
      if (data === null) delete node[parts[parts.length - 1]];
      else node[parts[parts.length - 1]] = data;
    }

    function open() {
      if (closed) return;
      es = new EventSource(url(path));
      es.addEventListener("put", function (ev) {
        try {
          var m = JSON.parse(ev.data);
          applyAt(m.path, m.data);
          onValue(mirror);
        } catch (e) { }
      });
      es.addEventListener("patch", function (ev) {
        try {
          var m = JSON.parse(ev.data);
          var prefix = String(m.path || "/").split("/").filter(Boolean);
          Object.keys(m.data || {}).forEach(function (k) {
            applyAt("/" + prefix.concat(k).join("/"), m.data[k]);
          });
          onValue(mirror);
        } catch (e) { }
      });
      es.onerror = function () {
        if (onError) onError(new Error("stream-interrupted"));
      };
    }

    open();
    return {
      close: function () {
        closed = true;
        if (es) es.close();
      }
    };
  }

  return {
    configured: configured,
    get: function (p) { return request("GET", p); },
    put: function (p, v) { return request("PUT", p, v); },
    patch: function (p, v) { return request("PATCH", p, v); },
    push: function (p, v) { return request("POST", p, v); },
    remove: function (p) { return request("DELETE", p); },
    subscribe: subscribe,
    ping: function () {
      if (!configured()) return Promise.reject(new Error("not-configured"));
      return Promise.race([
        request("GET", "rooms/__ping"),
        new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, 6000); })
      ]);
    }
  };
})();

function makeRoomCode() {
  var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var out = "";
  for (var i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function localPlayerId() {
  var id;
  try {
    id = window.localStorage.getItem("tgc_player_id");
    if (!id) {
      id = "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      window.localStorage.setItem("tgc_player_id", id);
    }
  } catch (e) {
    id = "p" + Math.floor(Math.random() * 1e9).toString(36);
  }
  return id;
}
