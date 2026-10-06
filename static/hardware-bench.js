(function () {
  "use strict";

  /* Hardware page — the instrument panels.
   *
   * Five things live here: a shared tooltip, the light-path bench, the
   * AS7341 channel map, the development log and the switch between the
   * circuit's two states.
   *
   * No library, no network request, nothing from outside iGEM infrastructure.
   * The page is written so that losing this file costs a reader the
   * interaction and as little of the content as can be managed: each panel
   * built here carries a written fallback until it is replaced, and the light
   * path itself is drawn in the markup rather than by this script.
   */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  /* Nothing on this page? Then this is not the hardware page. */
  if (!$(".hwx-rig")) return;

  /* ======================================================================
     A SHARED TOOLTIP
     One element, moved around, rather than one per channel: the ten channels
     of the map are never explained two at a time. Focus opens it as well as
     hover, so the map is readable from the keyboard.
     ====================================================================== */

  var tip = document.createElement("div");
  tip.className = "hwx-tip";
  tip.setAttribute("role", "status");
  tip.hidden = true;
  document.body.appendChild(tip);

  function placeTip(x, y) {
    var w = tip.offsetWidth;
    var h = tip.offsetHeight;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2));
    /* Above the pointer, unless that would put it off the top. */
    var top = (y - h - 14 < 8) ? y + 22 : y - h - 14;
    /* Clamped on both axes, not just across. The tooltip is position:fixed, so
       an anchor the browser has not finished scrolling into view hands us a
       top of two or three thousand pixels and the tooltip lands below the
       window with nothing to say it is there. */
    top = Math.max(8, Math.min(window.innerHeight - h - 8, top));
    tip.style.left = Math.round(left) + "px";
    tip.style.top = Math.round(top) + "px";
  }

  /* What the tooltip is currently describing, so a scroll can tell a tooltip
     that is following the pointer from one anchored to a focused node. */
  var tipFor = null;

  function anchorTip(el) {
    var r = el.getBoundingClientRect();
    placeTip(r.left + r.width / 2, r.top);
  }

  function showTip(el, ev) {
    var body = el.getAttribute("data-tip");
    if (!body) return;
    var title = el.getAttribute("data-tip-t") || "";
    tip.innerHTML = (title ? '<b>' + title + "</b>" : "") + body;
    tip.hidden = false;
    tipFor = el;
    if (ev && ev.clientX !== undefined) placeTip(ev.clientX, ev.clientY);
    else anchorTip(el);
  }

  function hideTip() { tip.hidden = true; tipFor = null; }

  function bindTips(root) {
    $$("[data-tip]", root).forEach(function (el) {
      if (el.__hwxBound) return;
      el.__hwxBound = true;
      el.addEventListener("mouseenter", function (e) { showTip(el, e); });
      el.addEventListener("mousemove", function (e) {
        if (!tip.hidden) placeTip(e.clientX, e.clientY);
      });
      /* Only the element the tooltip currently belongs to may close it.
         Without this, tabbing to a channel scrolls the page, whatever the
         mouse was resting on slides out from under a pointer that never
         moved, and that stale mouseleave shuts the tooltip the focus had just
         opened. */
      el.addEventListener("mouseleave", function () {
        if (tipFor === el) hideTip();
      });
      el.addEventListener("focus", function () { showTip(el); });
      el.addEventListener("blur", function () {
        if (tipFor === el) hideTip();
      });
      /* A node reached by keyboard has to be dismissable by keyboard. */
      el.addEventListener("keydown", function (e) {
        if (e.key === "Escape") hideTip();
      });
    });
  }

  bindTips(document);

  window.addEventListener("scroll", function () {
    if (tip.hidden) return;
    /* Tabbing to a channel scrolls it into view, and that scroll must not
       close the tooltip the focus just opened -- which is the entire keyboard
       path through the map. A tooltip anchored to the focused channel follows
       it; one that was following the pointer goes, because after a scroll the
       pointer is no longer over what it was describing. */
    if (tipFor && tipFor === document.activeElement) { anchorTip(tipFor); return; }
    hideTip();
  }, { passive: true });

  /* ======================================================================
     1. THE LIGHT-PATH BENCH
     ====================================================================== */

  (function () {
    var rig = $("#hwxBench");
    if (!rig) return;

    var tabs = $("#hwxTabs");
    var ctrls = $("#hwxCtrls");
    var readout = $("#hwxReadout");
    var note = $("#hwxReadoutNote");
    var verdict = $("#hwxVerdict");
    if (!tabs || !ctrls || !readout || !verdict) return;

    /* Ten named channels. An all-channel read returns twelve values; these are
       the ten the sessions reported by name. */
    var CHANNELS = [
      ["F1", "415 nm", "v"], ["F2", "445 nm", "b"], ["F3", "480 nm", "b"],
      ["F4", "515 nm", "g"], ["F5", "555 nm", "g"], ["F6", "590 nm", "o"],
      ["F7", "630 nm", "r"], ["F8", "680 nm", "r"],
      ["Clear", "unfiltered", "k"], ["NIR", "910 nm", "k"]
    ];

    /* The record. Keys are led-sample-light, with @session after the sample
       for the cultures. A missing key is not an omission: it is a state
       nobody measured. The panel is built so that such a state cannot be
       selected in the first place -- see TESTS below -- rather than offered
       and then refused. */
    var REC = {
      "off-none-dark": {
        zero: true, tone: "ok",
        text: "Dark reference. Every channel reads zero, and holds at zero out to 25× integration with a monitor left on in the room.",
        src: "Room-light test, segment A · darkened room, LED de-energised, 200 ms at 512×"
      },
      "off-uvette-dark": {
        zero: true, tone: "ok",
        text: "Shielded with an opaque box, the transparent cuvette stops piping light. All channels return to zero.",
        src: "Room-light test, segment C"
      },
      "off-paper-dark": {
        zero: true, tone: "ok",
        text: "Dark reads before and after the first-light sequence were zero on every channel.",
        src: "First light, evidence §3"
      },
      "off-water-dark": {
        zero: true, tone: "ok",
        text: "Dark reads were zero on every channel in the stray-light decomposition.",
        src: "First light, evidence §6.6–6.7"
      },
      "off-gfp@0904-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark and post-dark reads were zero on all twelve channels in every cycle of this session.",
        src: "First fluorescence"
      },
      "off-ctrl@0904-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark and post-dark reads were zero on all twelve channels in every cycle of this session.",
        src: "First fluorescence"
      },
      "off-none-room": {
        vals: { F4: 4 }, tone: "warn",
        text: "The mechanism by itself leaks. Four counts appear on the emission channel with the lamp off and nothing at the sample — enough to matter against signals of this size.",
        src: "Room-light test, segments A and B · other channels not separately reported"
      },
      "off-uvette-room": {
        vals: { F4: 11, Clear: 53 }, tone: "warn",
        text: "Fails the operating requirement. The transparent UVette adds 7 counts on top of the mechanism's 4 by piping room light down the open +Z sample slot. The leak is not a stable offset: it scales non-proportionally with integration time, consistent with lamp flicker, so dark-frame subtraction does not remove it.",
        src: "Room-light test, segment B"
      },
      "on-none-dark": {
        zero: true, tone: "ok",
        text: "Bare-path stray light is below one count. With the LED energised and nothing at the sample position, every channel reads zero — the baffle and the light trap absorb the excitation essentially completely, bonded joints included.",
        src: "First light, excitation stray light §6.6"
      },
      "on-uvette-dark": {
        vals: { F3: 7, F4: 0 }, tone: "ok",
        text: "An empty cuvette in the beam scatters a little excitation into the blue channel. The emission channel stays at zero.",
        src: "First light, excitation stray light §6.6"
      },
      "on-paper-dark": {
        vals: { F2: 87, F3: 81, F4: 2, Clear: 116 }, tone: "ok",
        text: "First light. A paper scatterer at the sample position sends excitation into the detector, and the channel shape brackets the nominal 470 nm source. This establishes that excitation reaches the sample, that the detection path is open, and that 90° collection works. Alignment is demonstrated functional, not quantified.",
        src: "First light, optical coupling, PASS · evidence §3"
      },
      "on-water-dark": {
        vals: { F3: 1, F4: 0 }, tone: "ok",
        text: "Water blank. Excitation leakage into the emission channel sits below the quantisation floor: F4/F3 < 1.35%, i.e. under 0.0135 counts at working settings. That is an upper bound, not a measured leakage value — and it is 1600 µL of pure water, not the 200 µL assay volume.",
        src: "First light, excitation stray light §6.7"
      },
      "on-gfp@0904-dark": {
        vals: { F4: 19.58 }, changed: ["F3", "F5", "Clear"], tone: "ok",
        text: "A measured, reporter-associated green signal: 19.5833 ± 0.7930 raw counts over twelve consecutive cycles across four timepoints — not twelve independent samples. Neighbouring channels changed concurrently; their magnitudes are not reported. Conditional pass for this configuration and this batch only. It does not establish sfGFP specificity, and no induction was performed.",
        src: "First fluorescence, reporter-associated observation · CONDITIONAL"
      },
      "on-ctrl@0904-dark": {
        vals: { F4: 0 }, tone: "ok",
        text: "The control tube read zero on the emission channel under the same settings in the same session. What distinguished the two tubes in this session is not established — the earlier induced and uninduced description was withdrawn on 2026-09-13.",
        src: "First fluorescence, with its correction appendix"
      },

      /* The three mixing sessions, all at the 200 uL the assay uses.

         Each session contributes the same three reference samples and no
         more: its undiluted GFP stock, its undiluted non-GFP stock and its
         medium blank. That is one named acquisition per sample, with any
         replicate quoted in the text rather than averaged in, because a
         number on this panel is a recorded reading and not a summary. The
         other tubes of each session, fifty in the fits, are on the Model
         page; putting them here would turn a bench into a spreadsheet.

         Four channels are reported for these sessions. Source for 09-21 and
         09-29: the per-tube appendices of the team's data analysis
         (P1_DATA_ANALYSIS_2026-09-30, revision 2) and, for the 09-29 blanks,
         the control list of the four-channel study. */
      "off-gfp@0916-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on every channel in all three cycles of this acquisition.",
        src: "Mixing session 1, CAL_B12_d100_f100"
      },
      "off-ctrl@0916-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on every channel in all three cycles of this acquisition.",
        src: "Mixing session 1, CAL_A10_d100"
      },
      "off-med@0916-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on every channel in all three cycles of this acquisition.",
        src: "Mixing session 1, CAL_MEDIUM_BLANK"
      },
      "on-gfp@0916-dark": {
        vals: { F2: 6.00, F3: 12.00, F4: 29.67, Clear: 37.67 }, tone: "ok",
        text: "Undiluted GFP culture stock, displayed OD 1.56. At half this GFP fraction the emission channel read about 16 to 20 counts in the same session, and with no GFP present it read zero.",
        src: "Mixing session 1, CAL_B12_d100_f100, three cycles · session evidence, not a change of project status"
      },
      "on-ctrl@0916-dark": {
        vals: { F2: 5.67, F3: 4.67, F4: 0, Clear: 8.00 }, tone: "ok",
        text: "Undiluted non-GFP culture, displayed OD 1.01. The emission channel reads exactly zero while the scattering channels clearly see the cells — which is the behaviour the 90° geometry is supposed to produce. Every non-GFP sample in the session read F4 = 0.",
        src: "Mixing session 1, CAL_A10_d100, three cycles"
      },
      "on-med@0916-dark": {
        vals: { F2: 0, F3: 0, F4: 0, Clear: 0 }, tone: "ok",
        text: "Dilution medium alone, with the LED energised. All four reported channels read zero. This is the 200 µL blank the earlier water blank could not provide — though it is a medium blank in a lab cuvette, not a full blank characterisation.",
        src: "Mixing session 1, CAL_MEDIUM_BLANK, three cycles"
      },

      "off-gfp@0921-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on all twelve channels in every cycle of this session.",
        src: "Mixing session 2, CAL_C09r1_d100_f100"
      },
      "off-ctrl@0921-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on all twelve channels in every cycle of this session.",
        src: "Mixing session 2, CAL_C07r1_d100_f000"
      },
      "off-med@0921-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on all twelve channels in every cycle of this session.",
        src: "Mixing session 2, BLANK_MEDIUM_OPEN"
      },
      "on-gfp@0921-dark": {
        vals: { F2: 5.33, F3: 7.33, F4: 7.00, Clear: 19.33 }, tone: "ok",
        text: "Undiluted GFP stock again, and the same detector settings, but this stock was thin: a displayed OD of 0.49, against 1.56 five days earlier. It reads 7 where that one read 29.67, and its replicate tube read 5.33. How far the density of the stock accounts for the difference is worked through on the Model page.",
        src: "Mixing session 2, CAL_C09r1_d100_f100, three cycles · replicate CAL_C09r2 · session evidence, not a change of project status"
      },
      "on-ctrl@0921-dark": {
        vals: { F2: 0, F3: 0, F4: 0, Clear: 1.33 }, tone: "ok",
        text: "Undiluted non-GFP culture, displayed OD 0.54. The emission channel reads zero. In this cuvette the scatter channels read zero too, while the replicate in another cuvette read F2 = 9.00 and F3 = 8.00. Scatter readings differ this much between cuvettes and sessions, and no turbidity rule has been built on them.",
        src: "Mixing session 2, CAL_C07r1_d100_f000, three cycles · replicate CAL_C07r2"
      },
      "on-med@0921-dark": {
        vals: { F2: 0, F3: 0, F4: 0, Clear: 0.33 }, tone: "ok",
        text: "Medium alone at the start of the session. The blank read again at the end gave Clear = 0.67 and zero on the other three.",
        src: "Mixing session 2, BLANK_MEDIUM_OPEN, three cycles · closing blank BLANK_MEDIUM_CLOSE"
      },

      "off-gfp@0929-dark": {
        zero: true, tone: "ok",
        text: "No cycle of this session had a non-zero pre-dark read.",
        src: "Mixing session 3, ATN_D_1"
      },
      "off-ctrl@0929-dark": {
        zero: true, tone: "ok",
        text: "No cycle of this session had a non-zero pre-dark read.",
        src: "Mixing session 3, ATN_F_1"
      },
      "off-med@0929-dark": {
        zero: true, tone: "ok",
        text: "No cycle of this session had a non-zero pre-dark read.",
        src: "Mixing session 3, BLANK_MEDIUM_OPEN"
      },
      "on-gfp@0929-dark": {
        vals: { F2: 0.33, F3: 5.33, F4: 18.00, Clear: 21.67 }, tone: "ok",
        text: "Undiluted GFP stock, displayed OD 1.10. Its replicate tube read 20.00. At half this GFP fraction six tubes averaged 9.33, so doubling the GFP culture multiplied the reading by 2.04.",
        src: "Mixing session 3, ATN_D_1, three cycles · replicate ATN_D_2 · session evidence, not a change of project status"
      },
      "on-ctrl@0929-dark": {
        vals: { F2: 6.00, F3: 5.33, F4: 0, Clear: 10.00 }, tone: "ok",
        text: "Undiluted non-GFP culture at a displayed OD of 1.42, the densest sample without GFP the instrument has read. The emission channel still reads zero. Its replicate read F2 = 14.00, F3 = 12.00 and Clear = 20.33, with F4 at zero as well.",
        src: "Mixing session 3, ATN_F_1, three cycles · replicate ATN_F_2"
      },
      "on-med@0929-dark": {
        vals: { F2: 0, F3: 0, F4: 0, Clear: 0 }, tone: "ok",
        text: "Medium alone at the start of the session: all four reported channels zero. The blank read again at the end gave Clear = 0.33 and zero on the other three.",
        src: "Mixing session 3, BLANK_MEDIUM_OPEN · closing blank BLANK_MEDIUM_CLOSE"
      }
    };

    /* The samples that were read in more than one session. For these the
       sample position alone does not name a record; the session does. */
    var CULTURE = { gfp: true, ctrl: true, med: true };

    var SESSION = {
      "0904": "first fluorescence", "0916": "mixing session 1",
      "0921": "mixing session 2", "0929": "mixing session 3"
    };

    var LABEL = {
      led: { off: "LED de-energised", on: "LED energised" },
      sample: {
        none: "empty holder", uvette: "empty UVette", paper: "paper scatterer",
        water: "water blank, 1600 µL",
        gfp: "GFP culture, 200 µL", ctrl: "control culture, 200 µL",
        med: "medium blank, 200 µL"
      },
      light: { dark: "darkened or shielded", room: "room light, unshielded" }
    };

    /* What the sample well is filled with, per state. Not a measurement --
       it is the diagram telling you which state you are looking at. */
    var FILL = {
      none: "none",
      uvette: "rgba(140,190,215,.10)",
      paper: "rgba(232,240,244,.50)",
      water: "rgba(120,180,220,.22)",
      gfp: "rgba(110,205,150,.40)",
      ctrl: "rgba(150,170,160,.28)",
      med: "rgba(120,180,220,.14)"
    };

    /* ------------------------------------------------------------------
       THE THREE TESTS

       The bench used to offer four free switches -- lamp, sample, session,
       lighting -- and most of the hundred-odd combinations they allowed
       were never measured, so a reader could switch their way into "no
       dataset" in two clicks. The measurements were never a grid. They
       were three tests, each of which moved a couple of things and held
       the rest still, and that is how the panel is laid out: choose a
       test, and it shows only the switches that test actually moved.

       `fixed` is what a test held constant. `state` is where its switches
       stand, kept per test, so coming back to a test finds it as it was
       left. `scale` is the count the bars are drawn against: one scale per
       test, so bars compare within a test, where the comparison means
       something, and a culture's 18 counts is not drawn as a sliver against
       a paper scatterer's 116.

       An option with no record, the other switches being where they are,
       is greyed out instead of being left to lead nowhere.
       ------------------------------------------------------------------ */
    var LED = ["led", "Excitation LED", [["off", "Off"], ["on", "On", "hwx-hot"]]];

    var TESTS = [
      {
        id: "fluor", name: "Fluorescence", hint: "a GFP culture against one without",
        ask: "Does the emission channel tell a culture with GFP from one without? Every reading in this test was taken shielded, at 200 µL.",
        scale: 40,
        fixed: { light: "dark" },
        groups: [
          LED,
          ["sample", "In the cuvette", [["gfp", "GFP culture", "hwx-lit"], ["ctrl", "Control culture"], ["med", "Medium blank"]]],
          ["session", "Session", [["0904", "First fluorescence"], ["0916", "Mixing 1"], ["0921", "Mixing 2"], ["0929", "Mixing 3"]]]
        ],
        state: { led: "on", sample: "gfp", session: "0929" }
      },
      {
        id: "path", name: "Light path", hint: "the excitation, and where it ends up",
        ask: "Does the excitation reach the sample position, and does it stay out of the emission channel? Every reading in this test was taken shielded.",
        scale: 120,
        fixed: { light: "dark" },
        groups: [
          LED,
          ["sample", "At the sample position", [["none", "Empty holder"], ["uvette", "Empty UVette"], ["paper", "Paper scatterer"], ["water", "Water, 1600 µL"]]]
        ],
        state: { led: "on", sample: "paper" }
      },
      {
        id: "ambient", name: "Room light", hint: "with the shield and without it",
        ask: "Does room light reach the detector? The LED stays off throughout this test.",
        scale: 60,
        fixed: { led: "off" },
        groups: [
          ["sample", "At the sample position", [["none", "Empty holder"], ["uvette", "Empty UVette"]]],
          ["light", "Lighting", [["dark", "Darkened or shielded"], ["room", "Room light, no shield", "hwx-warm"]]]
        ],
        state: { sample: "uvette", light: "room" }
      }
    ];

    var test = TESTS[0];

    /* The whole state of the instrument for the test on show: what the test
       held fixed, where its switches stand, and optionally one switch moved,
       which is how an option is tried before it is offered. */
    function fullState(over) {
      var s = {}, k;
      for (k in test.fixed) s[k] = test.fixed[k];
      for (k in test.state) s[k] = test.state[k];
      for (k in over) s[k] = over[k];
      return s;
    }

    function keyOf(s) {
      return s.led + "-" + s.sample +
             (CULTURE[s.sample] ? "@" + s.session : "") + "-" + s.light;
    }

    tabs.innerHTML = TESTS.map(function (t) {
      return '<button type="button" class="hwx-tab" data-test="' + t.id + '">' +
        '<span class="hwx-tab-name">' + t.name + "</span>" +
        '<span class="hwx-tab-hint">' + t.hint + "</span></button>";
    }).join("");

    function buildControls() {
      ctrls.innerHTML = '<p class="hwx-ask">' + test.ask + "</p>" +
        test.groups.map(function (g, i) {
          var id = "hwxGroup" + i;
          return '<div class="hwx-cgroup">' +
            '<p class="hwx-clabel" id="' + id + '">' + g[1] + "</p>" +
            '<div class="hwx-seg" data-bench-key="' + g[0] + '" role="group" aria-labelledby="' + id + '">' +
            g[2].map(function (o) {
              return '<button type="button" data-v="' + o[0] + '"' +
                (o[2] ? ' class="' + o[2] + '"' : "") + ">" + o[1] + "</button>";
            }).join("") + "</div></div>";
        }).join("");
    }

    function syncControls() {
      $$(".hwx-tab", tabs).forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-test") === test.id));
      });
      $$(".hwx-seg", ctrls).forEach(function (seg) {
        var key = seg.getAttribute("data-bench-key");
        $$("button", seg).forEach(function (b) {
          var v = b.getAttribute("data-v");
          var over = {};
          over[key] = v;
          var have = !!REC[keyOf(fullState(over))];
          b.setAttribute("aria-pressed", String(test.state[key] === v));
          b.disabled = !have;
          if (have) b.removeAttribute("title");
          else b.title = "The panel holds no reading of this with the other switches where they are";
        });
      });
    }

    readout.innerHTML = CHANNELS.map(function (c) {
      return '<div class="hwx-ch" data-band="' + c[2] + '" data-ch="' + c[0] + '">' +
        '<p class="hwx-ch-name">' + c[0] + " <span>" + c[1] + "</span></p>" +
        '<p class="hwx-ch-val">0</p>' +
        '<span class="hwx-ch-bar" style="width:0"></span></div>';
    }).join("");

    var beamEx = $("#hwxBeamEx");
    var beamTh = $("#hwxBeamTh");
    var beamEm = $("#hwxBeamEm");
    var scatter = $("#hwxScatter");
    var ambient = $("#hwxAmbient");
    var fill = $("#hwxFill");

    function drawDiagram(rec, s) {
      var on = s.led === "on";
      var loaded = s.sample !== "none";

      beamEx.style.opacity = on ? 1 : 0;
      /* Paper stops the beam; everything else lets some of it through to the
         trap. */
      beamTh.style.opacity = (on && s.sample !== "paper") ? 0.9 : 0;
      scatter.style.opacity = (on && loaded) ? 0.85 : 0;
      scatter.setAttribute("r", (on && loaded) ? (s.sample === "paper" ? 18 : 10) : 0);

      /* The emission arm lights only where the record actually shows light on
         the emission channel. It is drawn from the data, not from the state. */
      var emitting = on && rec && rec.vals && rec.vals.F4 > 1;
      beamEm.style.opacity = emitting ? 1 : 0;

      ambient.style.opacity = s.light === "room" ? (loaded ? 1 : 0.45) : 0;
      fill.setAttribute("fill", FILL[s.sample]);
    }

    function render() {
      var s = fullState();
      var rec = REC[keyOf(s)];
      var culture = !!CULTURE[s.sample];
      var blanks = false;

      syncControls();

      $$(".hwx-ch", readout).forEach(function (el) {
        var name = el.getAttribute("data-ch");
        var val = $(".hwx-ch-val", el);
        var bar = $(".hwx-ch-bar", el);
        var v = rec && rec.vals ? rec.vals[name] : undefined;

        val.className = "hwx-ch-val";
        el.classList.remove("is-blank");
        bar.style.width = "0";

        if (rec && rec.zero) { val.textContent = "0"; return; }
        if (rec && rec.changed && rec.changed.indexOf(name) > -1) {
          val.classList.add("hwx-ch-nr");
          val.textContent = "moved";
          return;
        }
        if (v !== undefined) {
          val.textContent = v;
          bar.style.width = Math.min(100, v / test.scale * 100) + "%";
          return;
        }
        /* Not a zero. The record has no figure for this channel, and a dash
           is quieter than the words "not reported" six times in a row. */
        el.classList.add("is-blank");
        val.innerHTML = '<span aria-hidden="true">–</span>' +
                        '<span class="visually-hidden">not reported</span>';
        blanks = true;
      });

      if (note) {
        note.textContent =
          (blanks ? "A dash is a channel this record does not report. " : "") +
          (rec && rec.changed ? "“Moved” is a channel the record says changed along with F4, without giving a figure. " : "") +
          "Bars are drawn against " + test.scale + " counts in this test.";
      }

      var title = LABEL.led[s.led] + " · " + LABEL.sample[s.sample] +
                  (culture ? ", " + SESSION[s.session] : "") +
                  " · " + LABEL.light[s.light];

      if (rec) {
        verdict.className = "hwx-verdict is-" + rec.tone;
        verdict.innerHTML =
          '<p class="hwx-verdict-title">' + title + "</p>" +
          '<p class="hwx-verdict-text">' + rec.text + "</p>" +
          '<p class="hwx-verdict-src">' + rec.src + "</p>";
      } else {
        /* Not reachable through the controls, which only offer what was
           measured. Kept so that a record removed by mistake shows up as a
           gap and not as a row of zeros. */
        verdict.className = "hwx-verdict is-none";
        verdict.innerHTML =
          '<p class="hwx-verdict-title">No recorded dataset</p>' +
          '<p class="hwx-verdict-text">This state is not in the panel’s record, so the readout shows nothing rather than an estimate.</p>';
      }

      drawDiagram(rec, s);
    }

    tabs.addEventListener("click", function (e) {
      var b = e.target.closest(".hwx-tab");
      if (!b) return;
      var next = TESTS.filter(function (t) { return t.id === b.getAttribute("data-test"); })[0];
      if (!next || next === test) return;
      test = next;
      buildControls();
      render();
    });

    ctrls.addEventListener("click", function (e) {
      var b = e.target.closest(".hwx-seg button");
      if (!b || b.disabled) return;
      test.state[b.parentNode.getAttribute("data-bench-key")] = b.getAttribute("data-v");
      render();
    });

    buildControls();
    render();
  })();

  /* ======================================================================
     2. THE AS7341 CHANNEL MAP
     Built here rather than written out by hand: it is thirty-odd rectangles
     placed by wavelength, and a wavelength typed into markup is a wavelength
     that can disagree with the one in the label beside it.
     ====================================================================== */

  (function () {
    var box = $("#hwxSpecBox");
    if (!box) return;

    var X0 = 70, X1 = 660, NM0 = 400, NM1 = 700;
    function X(nm) { return X0 + (nm - NM0) / (NM1 - NM0) * (X1 - X0); }

    var CHANS = [
      [415, "F1", "Below the excitation band. It should sit near zero; a rise here points at a violet ambient source rather than at the assay."],
      [445, "F2", "Brackets the 470 nm source from below. At first light this channel read 87 counts off a paper scatterer."],
      [480, "F3", "Brackets the 470 nm source from above. This is the channel excitation shows up in, and the denominator of the leakage bound."],
      [515, "F4", "The emission channel. sfGFP emission falls here, and this is the number the assay depends on. It is also the channel room light leaks into."],
      [555, "F5", "The shoulder above the emission peak. It changed concurrently with F4 in the first fluorescence session."],
      [590, "F6", "Long-wavelength diagnostic. Not expected to carry assay signal."],
      [630, "F7", "Long-wavelength diagnostic. Useful for spotting warm ambient light."],
      [680, "F8", "Long-wavelength diagnostic. Useful for spotting warm ambient light."]
    ];

    var WIDE = [
      [700, "Clear", "Unfiltered total light across the visible range. A sanity check on the filtered channels, and the first place saturation shows up."],
      [762, "NIR", "Near-infrared. It responds to warm ambient sources such as incandescent lighting rather than to the assay."]
    ];

    function colourAt(nm) {
      if (nm < 430) return "#8E7BE8";
      if (nm < 490) return "#3E97E8";
      if (nm < 540) return "#3FCB79";
      if (nm < 600) return "#C9CC3F";
      if (nm < 650) return "#E08A46";
      return "#DC6154";
    }

    var s = '<svg class="hwx-spec" viewBox="0 0 820 220" role="img" ' +
      'aria-label="The AS7341 channel map across the visible spectrum. Eight filtered channels sit at nominal centres of 415, 445, 480, 515, 555, 590, 630 and 680 nanometres, with an unfiltered Clear channel and a near-infrared channel to their right. The nominal 470 nanometre excitation falls between F2 and F3; sfGFP emission is read on F4 at 515 nanometres.">';

    s += '<defs><linearGradient id="hwxSpecBand" x1="0" x2="1">' +
      '<stop offset="0" stop-color="#7B6BD8"/><stop offset=".22" stop-color="#3E97E8"/>' +
      '<stop offset=".42" stop-color="#3FCB79"/><stop offset=".62" stop-color="#D2D24A"/>' +
      '<stop offset=".8" stop-color="#E08A46"/><stop offset="1" stop-color="#D2564A"/>' +
      "</linearGradient></defs>";

    s += '<rect x="' + X0 + '" y="118" width="' + (X1 - X0) +
         '" height="14" rx="3" fill="url(#hwxSpecBand)" opacity=".5"/>';

    CHANS.forEach(function (c) {
      var x = X(c[0]);
      s += '<g class="hwx-chan" tabindex="0" role="button" data-tip-t="' +
        c[1] + " · " + c[0] + ' nm" data-tip="' + c[2] + '">' +
        '<rect x="' + (x - 15) + '" y="60" width="30" height="58" rx="4" fill="' +
        colourAt(c[0]) + '" opacity=".85"/>' +
        '<text class="hwx-chan-n" x="' + x + '" y="94">' + c[1] + "</text>" +
        '<text class="hwx-chan-nm" x="' + x + '" y="150">' + c[0] + "</text></g>";
    });

    WIDE.forEach(function (c) {
      s += '<g class="hwx-chan" tabindex="0" role="button" data-tip-t="' +
        c[1] + '" data-tip="' + c[2] + '">' +
        '<rect x="' + (c[0] - 26) + '" y="60" width="52" height="58" rx="4" fill="#4A5E68" opacity=".85"/>' +
        '<text class="hwx-chan-n" x="' + c[0] + '" y="94">' + c[1] + "</text></g>";
    });

    s += '<g><path d="M' + X(470) + " 26 L" + (X(470) - 6) + " 14 L" +
      (X(470) + 6) + ' 14 Z" fill="#5BAEFF"/>' +
      '<line x1="' + X(470) + '" y1="26" x2="' + X(470) +
      '" y2="56" stroke="#5BAEFF" stroke-width="2" stroke-dasharray="3 3"/>' +
      '<text class="hwx-spec-cue hwx-cue-ex" x="' + (X(470) - 104) + '" y="20">470 nm excitation</text></g>';

    s += '<g><path d="M' + X(515) + " 192 L" + (X(515) - 6) + " 204 L" +
      (X(515) + 6) + ' 204 Z" fill="#64DE9A"/>' +
      '<line x1="' + X(515) + '" y1="162" x2="' + X(515) +
      '" y2="192" stroke="#64DE9A" stroke-width="2" stroke-dasharray="3 3"/>' +
      '<text class="hwx-spec-cue hwx-cue-em" x="' + (X(515) + 14) + '" y="204">sfGFP emission is read here</text></g>';

    s += "</svg>";

    box.innerHTML = s;
    bindTips(box);
  })();
  /* ======================================================================
     3. THE DEVELOPMENT LOG
     The steps are written out in the markup, every one of them, so the
     section is a plain list if this never runs. Here they become a row of
     stops with one step shown at a time: the stop's label comes from the
     step's own data attributes, so there is nothing to keep in step with the
     text but the text.
     ====================================================================== */

  (function () {
    var log = $("#hwxLog");
    var track = $("#hwxLogTrack");
    if (!log || !track) return;

    var items = $$(".hwx-log-item", log);
    var count = $("#hwxLogCount");
    var nav = $$("[data-log-step]", log);
    if (!items.length) return;

    var at = 0;

    var stops = items.map(function (item, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hwx-log-stop";
      b.innerHTML =
        '<span class="hwx-log-dot" aria-hidden="true"></span>' +
        '<span class="hwx-log-when">' + item.getAttribute("data-when") + "</span>" +
        '<span class="hwx-log-name">' + item.getAttribute("data-name") + "</span>";
      b.addEventListener("click", function () { show(i, false); });
      track.appendChild(b);
      return b;
    });

    function show(i, focus) {
      at = Math.max(0, Math.min(items.length - 1, i));

      items.forEach(function (item, n) { item.classList.toggle("is-off", n !== at); });
      stops.forEach(function (b, n) {
        b.setAttribute("aria-pressed", String(n === at));
        b.classList.toggle("is-past", n < at);
      });
      nav.forEach(function (b) {
        var to = at + Number(b.getAttribute("data-log-step"));
        b.disabled = to < 0 || to > items.length - 1;
      });
      if (count) count.textContent = "Step " + (at + 1) + " of " + items.length;

      /* On a narrow screen the row of stops scrolls sideways. Bring the
         chosen one to the middle of it by moving the row, never the page. */
      var stop = stops[at];
      track.scrollLeft = stop.offsetLeft - (track.clientWidth - stop.offsetWidth) / 2;
      if (focus) stop.focus({ preventScroll: true });
    }

    track.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      show(at + (e.key === "ArrowRight" ? 1 : -1), true);
    });

    nav.forEach(function (b) {
      b.hidden = false;
      b.addEventListener("click", function () {
        show(at + Number(b.getAttribute("data-log-step")), false);
      });
    });

    /* On paper there is nothing to click, so every step is printed, as the
       plain list it is without this script. */
    window.addEventListener("beforeprint", function () { log.classList.remove("is-live"); });
    window.addEventListener("afterprint", function () { log.classList.add("is-live"); });

    log.classList.add("is-live");
    show(0, false);
  })();

  /* ======================================================================
     4. THE CIRCUIT, BEFORE AND AFTER
     One resistor was changed on 2026-10-03. Both states are written out in
     the markup: an element with data-v2 carries the later wording, a node
     with data-tip-v2 the later tooltip. All this does is swap between them.
     The switch itself is hidden until this runs, so a page without the
     script shows the circuit the readings were taken on and no dead buttons;
     the table under the schematic has both columns either way.
     ====================================================================== */

  (function () {
    var rig = $("#hwxCircuit");
    var ctrls = $("#hwxCircCtrls");
    if (!rig || !ctrls) return;

    var texts = $$("[data-v2]", rig);
    var tips = $$("[data-tip-v2]", rig);
    var buttons = $$("button[data-circ]", ctrls);
    if (!buttons.length) return;

    /* The first state is whatever the markup says. Keep it to come back to. */
    texts.forEach(function (el) { el.setAttribute("data-v1", el.textContent); });
    tips.forEach(function (el) { el.setAttribute("data-tip-v1", el.getAttribute("data-tip")); });

    function show(v) {
      texts.forEach(function (el) { el.textContent = el.getAttribute("data-" + v); });
      tips.forEach(function (el) { el.setAttribute("data-tip", el.getAttribute("data-tip-" + v)); });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-circ") === v));
      });
      /* A tooltip left open would go on describing the other state. */
      hideTip();
    }

    ctrls.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-circ]");
      if (b) show(b.getAttribute("data-circ"));
    });

    ctrls.hidden = false;
  })();

  /* ======================================================================
     FOLDED TABLES ON PAPER
     A shut <details> prints as a single line where the table should be. The
     stylesheet can override the display of a closed one in Chrome, but how a
     closed <details> hides its content is not the same in every engine --
     opening them outright is. The reader's own state is put back after.
     ====================================================================== */

  (function () {
    var folds = $$(".hw-fold");
    if (!folds.length) return;
    var was = null;
    window.addEventListener("beforeprint", function () {
      was = folds.map(function (f) { return f.open; });
      folds.forEach(function (f) { f.open = true; });
    });
    window.addEventListener("afterprint", function () {
      if (!was) return;
      folds.forEach(function (f, i) { f.open = was[i]; });
      was = null;
    });
  })();

})();
