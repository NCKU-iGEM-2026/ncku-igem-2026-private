/* ===========================================================================
   The Green Cabinet — online play transport

   Talks to a Firebase Realtime Database over its REST + SSE interface, using
   only fetch() and EventSource. No third-party script is loaded, so the wiki
   still serves every asset from iGEM infrastructure.

   TO ENABLE ONLINE PLAY: paste your database URL into ONLINE_CONFIG below.
   Create a Realtime Database at https://console.firebase.google.com and copy
   the URL shown there, for example
       https://the-green-cabinet-default-rtdb.asia-southeast1.firebasedatabase.app
   Leave it blank and the online button explains that it is not configured
   rather than failing, so the page never looks broken.

   Suggested database rules — rooms are readable/writable but self-expiring
   data only, and nothing else in the database is exposed:
       {
         "rules": {
           ".read": false,
           ".write": false,
           "rooms": { "$room": { ".read": true, ".write": true } }
         }
       }
   =========================================================================== */

var ONLINE_CONFIG = {
  databaseUrl: "https://igem-boardgame-default-rtdb.asia-southeast1.firebasedatabase.app"
};

/* Overridable for local testing without touching the shipped config. */
(function () {
  try {
    var override = window.localStorage.getItem("tgc_db_url");
    if (override) ONLINE_CONFIG.databaseUrl = override;
  } catch (e) { /* storage blocked; keep the shipped value */ }
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

  /* Subscribe to a path. onValue receives the whole subtree on every change.
     Firebase streams deltas, so the local mirror is patched and handed back
     complete — callers never have to reason about partial updates. */
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
        } catch (e) { /* ignore malformed frame */ }
      });
      es.addEventListener("patch", function (ev) {
        try {
          var m = JSON.parse(ev.data);
          var prefix = String(m.path || "/").split("/").filter(Boolean);
          Object.keys(m.data || {}).forEach(function (k) {
            applyAt("/" + prefix.concat(k).join("/"), m.data[k]);
          });
          onValue(mirror);
        } catch (e) { /* ignore malformed frame */ }
      });
      es.onerror = function () {
        // EventSource reconnects on its own; surface it so the UI can show
        // a reconnecting state rather than silently freezing.
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
    /* Reachability probe so the UI can degrade instead of hanging.
       Deliberately reads inside rooms/: the recommended rules close the
       database root, so probing the root would always look unreachable even
       when everything is configured correctly. */
    ping: function () {
      if (!configured()) return Promise.reject(new Error("not-configured"));
      return Promise.race([
        request("GET", "rooms/__ping"),
        new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, 6000); })
      ]);
    }
  };
})();

/* Room codes avoid characters that are easy to misread aloud (0/O, 1/I). */
function makeRoomCode() {
  var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var out = "";
  for (var i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/* Stable per-device identity so a refresh rejoins as the same seat. */
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
