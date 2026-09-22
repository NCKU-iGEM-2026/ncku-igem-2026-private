// =========================================================
// Software page: CAPTURE-Screen live spectrum.
// Ported from LasReader's frontend/js/device_live.js (the software repo), with
// two changes for the wiki:
//   - The chart is drawn as inline SVG instead of Chart.js, because the wiki
//     may not load scripts from external CDNs.
//   - The backend URL is fixed to the deployed Render backend; the wiki has no
//     local LasReader backend to switch to.
//
// Target elements:
//   #live-toggle / #live-dot / #live-dot-label
//   #live-f4
//   #live-empty / #live-spectrum / #live-chart / #live-settings
//
// Connects to WS /api/live/spectrum as soon as the page opens, so device
// presence is known right away; live_start is only sent while the Live switch
// is on AND the tab is in the foreground. The device's LED only lights up
// while someone is watching (leaving it on heats and bleaches the sample), so
// the switch defaults off, and a backgrounded tab turns it off until it returns.
//
// Rules:
//   - Live data is only ever drawn; never stored
//   - Only the sfGFP channel F4 is called out
//   - The chart is cleared whenever the device goes offline or the connection
//     drops, so the last frame is never left looking current
//   - Reconnects automatically (a sleeping Render backend can take up to a
//     minute to wake)
// =========================================================

(function () {
  const BACKEND_BASE_URL = "https://igem-ncku-software.onrender.com";
  const LIVE_URL = `${BACKEND_BASE_URL.replace(/^http/, "ws")}/api/live/spectrum`;
  const LIVE_RECONNECT_MIN_MS = 1000;
  const LIVE_RECONNECT_MAX_MS = 15000;
  // While online the backend sends presence every 5 s; this long without one
  // means the browser-to-backend connection has quietly dropped.
  const LIVE_PRESENCE_STALE_MS = 20000;
  const LIVE_TICK_MS = 1000;
  // Same formulas as LasReader's hardware_processing.js.
  const LIVE_ADC_MAX_COUNTS = 65535;
  const LIVE_ASTEP_UNIT_MS = 2.78e-3;
  // Below this chart width, switch to a taller ratio and channel codes only.
  const LIVE_NARROW_CHART_PX = 480;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const LIVE_CHANNELS = [
    { key: "F1", nm: 415 },
    { key: "F2", nm: 445 },
    { key: "F3", nm: 480 },
    { key: "F4", nm: 515 },
    { key: "F5", nm: 555 },
    { key: "F6", nm: 590 },
    { key: "F7", nm: 630 },
    { key: "F8", nm: 680 },
    { key: "CLR", name: "Clear", short: "Clr" },
    { key: "NIR", name: "NIR", short: "NIR" },
  ];

  let liveSocket = null;
  let liveReconnectMs = LIVE_RECONNECT_MIN_MS;
  let liveReconnectTimer = null;
  let liveRetryAt = 0;        // time of the next reconnect attempt; 0 means not waiting
  let liveWanted = false;     // the user has Live switched on
  let liveOnline = false;     // the backend's latest word on whether the device is online
  let liveDevice = null;      // the device's most recently reported status
  let liveLastSeen = null;
  let liveLastPresenceMs = 0;
  let liveStreaming = false;  // a frame has arrived since Live was turned on
  let liveLastRaw = null;     // latest frame, kept only to redraw on resize
  let liveYMax = 0;           // y axis only grows until the chart is cleared

  // ---- Small helpers --------------------------------------------------------

  function liveEl(id) {
    return document.getElementById(id);
  }

  // #live-dot-label is aria-live: only touch it when the text changes.
  function setLiveText(id, text) {
    const el = liveEl(id);
    if (el.textContent !== text) el.textContent = text;
  }

  function liveCssVar(name) {
    return getComputedStyle(liveEl("live-card")).getPropertyValue(name).trim();
  }

  function liveCounts(value) {
    return value.toLocaleString("en-US");
  }

  function liveAgo(iso) {
    const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    if (seconds < 60) return `${seconds} s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
  }

  function liveChannelLines({ key, nm, name }) {
    return nm ? [key, `${nm} nm`] : [name];
  }

  function liveChannelName(channel) {
    return liveChannelLines(channel).join(" ");
  }

  function liveFullScale(config) {
    return Math.min(LIVE_ADC_MAX_COUNTS, (config.atime + 1) * (config.astep + 1));
  }

  function liveIntegrationMs(config) {
    return (config.atime + 1) * (config.astep + 1) * LIVE_ASTEP_UNIT_MS;
  }

  function liveWatching() {
    return liveWanted && !document.hidden;
  }

  // ---- Status ---------------------------------------------------------------

  function liveStatus() {
    if (!liveSocket || liveSocket.readyState !== WebSocket.OPEN) {
      const retryS = Math.ceil((liveRetryAt - Date.now()) / 1000);
      return {
        dot: "reconnecting",
        label: "Connecting",
        message: liveRetryAt && retryS > 0
          ? `Connection lost. Retrying in ${retryS} s`
          : "Connecting to backend (up to 1 min after idle)...",
      };
    }
    if (!liveOnline) {
      return {
        dot: "off",
        label: "Offline",
        message: liveDevice && liveLastSeen ? `CAPTURE-Screen last seen ${liveAgo(liveLastSeen)}` : "Waiting for CAPTURE-Screen to connect",
      };
    }
    const measuring = liveDevice && liveDevice.state === "MEASURING";
    if (!liveWanted) {
      return { dot: "off", label: measuring ? "Measuring" : "Online", message: "Turn on Live to switch on the LED and stream" };
    }
    if (measuring) {
      return { dot: "reconnecting", label: "Measuring", message: "Stream starts after the measurement" };
    }
    if (!liveStreaming) {
      return { dot: "reconnecting", label: "Starting", message: "Waiting for first frame..." };
    }
    return { dot: "streaming", label: "Streaming", message: "" };
  }

  function renderSettings() {
    const el = liveEl("live-settings");
    el.hidden = !liveDevice;
    if (!liveDevice) return;

    const { config } = liveDevice;
    const items = [
      ["Build", liveDevice.build_id],
      ["Firmware", liveDevice.firmware_version],
      // Wi-Fi strength is stale once offline, so it's left out.
      ...(liveOnline ? [["Wi-Fi", `${liveDevice.wifi_rssi} dBm`]] : []),
      ["Gain", `${config.gain}×`],
      ["Integration", `${liveIntegrationMs(config).toFixed(2)} ms`],
      ["LED", `${config.led_current_mA} mA`],
      ["Full scale", `${liveCounts(liveFullScale(config))} counts`],
    ];
    const text = items.map(([label, value]) => `${label} ${value}`).join("|");
    if (el.dataset.text === text) return;
    el.dataset.text = text;
    el.replaceChildren(...items.map(([label, value]) => {
      const item = document.createElement("span");
      const name = document.createElement("b");
      name.textContent = `${label} `;
      item.append(name, String(value));
      return item;
    }));
  }

  function renderLive() {
    const { dot, label, message } = liveStatus();
    liveEl("live-dot").className = `lv-dot is-${dot}`;
    setLiveText("live-dot-label", label);
    setLiveText("live-empty", message);
    // No new frames arrive during a measurement: fade the last one.
    liveEl("live-card").classList.toggle("is-paused", liveStreaming && liveDevice && liveDevice.state === "MEASURING");
    renderSettings();
  }

  function clearLiveChart() {
    liveStreaming = false;
    liveLastRaw = null;
    liveYMax = 0;
    liveEl("live-chart").replaceChildren();
    liveEl("live-spectrum").hidden = true;
    liveEl("live-f4").textContent = "--";
    liveEl("live-empty").hidden = false;
  }

  // ---- Chart (inline SVG) ---------------------------------------------------

  function svgEl(tag, attrs, text) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    if (text !== undefined) el.textContent = text;
    return el;
  }

  // Rounds up to 1, 2, 5 × 10^n so the axis has readable ticks.
  function niceStep(value) {
    const exponent = Math.pow(10, Math.floor(Math.log10(value)));
    const fraction = value / exponent;
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return nice * exponent;
  }

  function drawLiveChart() {
    const svg = liveEl("live-chart");
    const raw = liveLastRaw;
    if (!raw) return;

    const plate = getComputedStyle(svg.parentElement);
    const inner = svg.parentElement.clientWidth - parseFloat(plate.paddingLeft) - parseFloat(plate.paddingRight);
    const width = Math.max(260, Math.round(inner));
    const narrow = width < LIVE_NARROW_CHART_PX;
    const height = Math.round(width / (narrow ? 1.3 : 2.4));
    const accent = liveCssVar("--lv-accent");
    const muted = liveCssVar("--lv-muted");
    const ink = liveCssVar("--lv-ink");
    const rule = liveCssVar("--lv-rule");

    const pad = { left: 62, right: 8, top: 10, bottom: narrow ? 42 : 56 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const step = niceStep(Math.max(liveYMax, 1) / 4);
    const top = Math.max(step, Math.ceil(liveYMax / step) * step);
    const y = (v) => pad.top + plotH - (v / top) * plotH;

    const nodes = [];
    // Grid and y ticks
    for (let v = 0; v <= top + step / 2; v += step) {
      nodes.push(svgEl("line", { x1: pad.left, x2: width - pad.right, y1: y(v), y2: y(v), stroke: rule, "stroke-width": 1 }));
      nodes.push(svgEl("text", { x: pad.left - 6, y: y(v), fill: muted, "font-size": 10, "text-anchor": "end", "dominant-baseline": "middle" }, liveCounts(v)));
    }
    nodes.push(svgEl("text", {
      x: 12, y: pad.top + plotH / 2, fill: ink, "font-size": 12, "text-anchor": "middle",
      transform: `rotate(-90 12 ${pad.top + plotH / 2})`,
    }, "Raw counts"));

    // Bars and x labels
    const slot = plotW / LIVE_CHANNELS.length;
    const barW = slot * 0.7;
    LIVE_CHANNELS.forEach((channel, i) => {
      const value = raw[channel.key];
      const x = pad.left + i * slot + (slot - barW) / 2;
      const barTop = y(value);
      const bar = svgEl("rect", {
        x, y: barTop, width: barW, height: Math.max(0, pad.top + plotH - barTop), rx: 3,
        fill: channel.key === "F4" ? accent : muted,
      });
      bar.append(svgEl("title", {}, `${liveChannelName(channel)}: ${liveCounts(value)} raw counts`));
      nodes.push(bar);

      const cx = pad.left + i * slot + slot / 2;
      const lines = narrow ? [channel.short || channel.key] : liveChannelLines(channel);
      lines.forEach((line, n) => {
        nodes.push(svgEl("text", { x: cx, y: pad.top + plotH + 14 + n * 13, fill: muted, "font-size": 10, "text-anchor": "middle" }, line));
      });
    });
    nodes.push(svgEl("text", { x: pad.left + plotW / 2, y: height - 4, fill: ink, "font-size": 12, "text-anchor": "middle" }, "Channel"));

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.replaceChildren(...nodes);
  }

  function drawLiveFrame(raw) {
    liveLastRaw = raw;
    liveYMax = Math.max(liveYMax, ...LIVE_CHANNELS.map(({ key }) => raw[key]));
    drawLiveChart();
    liveEl("live-f4").textContent = liveCounts(raw.F4);
  }

  // ---- Messages -------------------------------------------------------------

  function onLivePresence(message) {
    liveOnline = message.online === true;
    if (message.device) liveDevice = message.device;
    if (message.last_seen) liveLastSeen = message.last_seen;
    liveLastPresenceMs = Date.now();

    if (!liveOnline) clearLiveChart();
    renderLive();
  }

  function onLiveFrame(message) {
    const { raw } = message;
    const valid = raw && LIVE_CHANNELS.every(({ key }) => Number.isFinite(raw[key]))
      && Number.isFinite(message.seq) && Number.isFinite(message.t_ms);
    if (!valid) {
      console.error("Unexpected live frame:", message);
      return;
    }
    if (!liveWatching()) return;

    // Show before drawing: the chart sizes itself to the container's width.
    liveStreaming = true;
    liveEl("live-empty").hidden = true;
    liveEl("live-spectrum").hidden = false;
    drawLiveFrame(raw);
    renderLive();
  }

  // ---- Connection -----------------------------------------------------------

  function sendLiveCommand() {
    if (liveSocket && liveSocket.readyState === WebSocket.OPEN) {
      liveSocket.send(JSON.stringify({ cmd: liveWatching() ? "live_start" : "live_stop" }));
    }
  }

  function openLiveSocket() {
    clearTimeout(liveReconnectTimer);
    liveRetryAt = 0;
    const socket = new WebSocket(LIVE_URL);
    liveSocket = socket;
    renderLive();

    socket.onopen = () => {
      if (socket !== liveSocket) return;
      liveReconnectMs = LIVE_RECONNECT_MIN_MS;
      if (liveWatching()) sendLiveCommand();
      renderLive();
    };

    socket.onmessage = (event) => {
      if (socket !== liveSocket) return;
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (err) {
        console.error("Unexpected message from the live backend:", event.data);
        return;
      }
      if (message.mode === "presence") onLivePresence(message);
      else if (message.mode === "live") onLiveFrame(message);
      else if (message.mode === "error") console.error("The live backend rejected a command:", message);
    };

    socket.onclose = () => {
      if (socket !== liveSocket) return;
      liveSocket = null;
      liveOnline = false;
      clearLiveChart();
      liveRetryAt = Date.now() + liveReconnectMs;
      liveReconnectTimer = setTimeout(openLiveSocket, liveReconnectMs);
      liveReconnectMs = Math.min(liveReconnectMs * 2, LIVE_RECONNECT_MAX_MS);
      renderLive();
    };
  }

  function setLiveWanted(wanted) {
    liveWanted = wanted;
    sendLiveCommand();
    clearLiveChart();
    renderLive();
  }

  function tickLive() {
    if (liveOnline && Date.now() - liveLastPresenceMs > LIVE_PRESENCE_STALE_MS) {
      liveOnline = false;
      clearLiveChart();
    }
    renderLive();
  }

  function init() {
    if (!liveEl("live-card")) return;
    const toggle = liveEl("live-toggle");
    toggle.checked = false;
    toggle.addEventListener("change", () => setLiveWanted(toggle.checked));

    clearLiveChart();
    openLiveSocket();
    setInterval(tickLive, LIVE_TICK_MS);

    if ("ResizeObserver" in window) {
      let lastWidth = 0;
      new ResizeObserver(([entry]) => {
        const width = Math.round(entry.contentRect.width);
        if (width === lastWidth) return;
        lastWidth = width;
        drawLiveChart();
      }).observe(liveEl("live-spectrum"));
    }

    // A backgrounded tab can't be seen: LED off, back on when it returns.
    document.addEventListener("visibilitychange", () => {
      if (!liveWanted) return;
      sendLiveCommand();
      clearLiveChart();
      renderLive();
    });
    // Leaving the page closes the socket, so the backend counts one fewer viewer.
    window.addEventListener("pagehide", () => {
      clearTimeout(liveReconnectTimer);
      const socket = liveSocket;
      liveSocket = null;
      if (socket) socket.close();
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted && !liveSocket) openLiveSocket();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
