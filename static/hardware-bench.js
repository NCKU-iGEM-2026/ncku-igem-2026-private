(function () {
  "use strict";

  /* Hardware page — the instrument panels.
   *
   * Three things live here: a shared tooltip, the light-path bench and the
   * AS7341 channel map.
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

    var readout = $("#hwxReadout");
    var verdict = $("#hwxVerdict");
    if (!readout || !verdict) return;

    /* Ten named channels. An all-channel read returns twelve values; these are
       the ten the sessions reported by name. */
    var CHANNELS = [
      ["F1", "415 nm", "v"], ["F2", "445 nm", "b"], ["F3", "480 nm", "b"],
      ["F4", "515 nm", "g"], ["F5", "555 nm", "g"], ["F6", "590 nm", "o"],
      ["F7", "630 nm", "r"], ["F8", "680 nm", "r"],
      ["Clear", "unfiltered", "k"], ["NIR", "910 nm", "k"]
    ];

    /* Full scale for the bar under each channel. 116 counts (Clear, at first
       light) is the largest figure on record, so one common scale keeps the
       bars comparable between states instead of rescaling under the reader. */
    var FULL_SCALE = 120;

    /* The record. Keys are led-sample-light. A missing key is not an omission:
       it is a state nobody measured, and the panel says so rather than
       interpolating between the states either side of it. */
    var REC = {
      "off-none-dark": {
        zero: true, tone: "ok",
        text: "Dark reference. Every channel reads zero, and holds at zero out to 25× integration with a monitor left on in the room.",
        src: "Ambient light rejection, segment A, 2026-08-27 · darkened room, LED de-energised, 200 ms at 512×"
      },
      "off-uvette-dark": {
        zero: true, tone: "ok",
        text: "Shielded with an opaque box, the transparent cuvette stops piping light. All channels return to zero.",
        src: "Ambient light rejection, segment C, 2026-08-27"
      },
      "off-paper-dark": {
        zero: true, tone: "ok",
        text: "Dark reads before and after the first-light sequence were zero on every channel.",
        src: "First-light evidence §3, 2026-08-25"
      },
      "off-water-dark": {
        zero: true, tone: "ok",
        text: "Dark reads were zero on every channel in the stray-light decomposition.",
        src: "First-light evidence §6.6–6.7, 2026-08-25"
      },
      "off-cultA-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark and post-dark reads were zero on all twelve channels in every cycle of this session.",
        src: "Fluorescence session, 2026-09-04"
      },
      "off-cultB-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark and post-dark reads were zero on all twelve channels in every cycle of this session.",
        src: "Fluorescence session, 2026-09-04"
      },
      "off-none-room": {
        vals: { F4: 4 }, tone: "warn",
        text: "The mechanism by itself leaks. Four counts appear on the emission channel with the lamp off and nothing at the sample — enough to matter against signals of this size.",
        src: "Ambient light rejection, segments A and B, 2026-08-27 · other channels not separately reported"
      },
      "off-uvette-room": {
        vals: { F4: 11, Clear: 53 }, tone: "warn",
        text: "Fails the operating requirement. The transparent UVette adds 7 counts on top of the mechanism's 4 by piping room light down the open +Z sample slot. The leak is not a stable offset: it scales non-proportionally with integration time, consistent with lamp flicker, so dark-frame subtraction does not remove it.",
        src: "Ambient light rejection, segment B, 2026-08-27"
      },
      "on-none-dark": {
        zero: true, tone: "ok",
        text: "Bare-path stray light is below one count. With the LED energised and nothing at the sample position, every channel reads zero — the baffle and the light trap absorb the excitation essentially completely, bonded joints included.",
        src: "Excitation stray light §6.6, 2026-08-25"
      },
      "on-uvette-dark": {
        vals: { F3: 7, F4: 0 }, tone: "ok",
        text: "An empty cuvette in the beam scatters a little excitation into the blue channel. The emission channel stays at zero.",
        src: "Excitation stray light §6.6, 2026-08-25"
      },
      "on-paper-dark": {
        vals: { F2: 87, F3: 81, F4: 2, Clear: 116 }, tone: "ok",
        text: "First light. A paper scatterer at the sample position sends excitation into the detector, and the channel shape brackets the nominal 470 nm source. This establishes that excitation reaches the sample, that the detection path is open, and that 90° collection works. Alignment is demonstrated functional, not quantified.",
        src: "Optical coupling, PASS · first-light evidence §3, 2026-08-25"
      },
      "on-water-dark": {
        vals: { F3: 1, F4: 0 }, tone: "ok",
        text: "Water blank. Excitation leakage into the emission channel sits below the quantisation floor: F4/F3 < 1.35%, i.e. under 0.0135 counts at working settings. That is an upper bound, not a measured leakage value — and it is 1600 µL of pure water, not the 200 µL assay volume.",
        src: "Excitation stray light §6.7, 2026-08-25"
      },
      "on-cultA-dark": {
        vals: { F4: 19.58 }, changed: ["F3", "F5", "Clear"], tone: "ok",
        text: "A measured, reporter-associated green signal: 19.5833 ± 0.7930 raw counts over twelve consecutive cycles across four timepoints — not twelve independent samples. Neighbouring channels changed concurrently; their magnitudes are not reported. Conditional pass for this configuration and this batch only. It does not establish sfGFP specificity, and no induction was performed.",
        src: "Fluorescence signal, reporter-associated observation, 2026-09-04 · CONDITIONAL"
      },
      "on-cultB-dark": {
        vals: { F4: 0 }, tone: "ok",
        text: "The control tube read zero on the emission channel under the same settings in the same session. What distinguished the two tubes on this date is not established — the earlier induced and uninduced description was withdrawn on 2026-09-13.",
        src: "Fluorescence session, 2026-09-04, with its 2026-09-05 correction appendix"
      },

      /* The 2026-09-16 calibration session, at the 200 uL the assay actually
         uses. These three are the top, the bottom and the blank of the matrix
         plotted further down the page; the other thirty are in its table. */
      "off-gfp200-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on every channel in all three cycles of this acquisition.",
        src: "Calibration matrix session, CAL_B12_d100_f100, 2026-09-16"
      },
      "off-nogfp200-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on every channel in all three cycles of this acquisition.",
        src: "Calibration matrix session, CAL_A10_d100, 2026-09-16"
      },
      "off-med200-dark": {
        zero: true, tone: "ok",
        text: "Pre-dark reads were zero on every channel in all three cycles of this acquisition.",
        src: "Calibration matrix session, CAL_MEDIUM_BLANK, 2026-09-16"
      },
      "on-gfp200-dark": {
        vals: { F2: 6.00, F3: 12.00, F4: 29.67, Clear: 37.67 }, tone: "ok",
        text: "Undiluted GFP culture stock at the 200 µL assay volume — the fill the assay actually uses, measured for the first time in this session. At half this GFP fraction the emission channel read about 16 to 20 counts in the same session, and with no GFP present it read zero.",
        src: "Calibration matrix session, CAL_B12_d100_f100, three cycles, 2026-09-16 · session evidence, not a change of project status"
      },
      "on-nogfp200-dark": {
        vals: { F2: 5.67, F3: 4.67, F4: 0, Clear: 8.00 }, tone: "ok",
        text: "Undiluted non-GFP culture at 200 µL. The emission channel reads exactly zero while the scattering channels clearly see the cells — which is the behaviour the 90° geometry is supposed to produce. Every non-GFP sample in the session read F4 = 0.",
        src: "Calibration matrix session, CAL_A10_d100, three cycles, 2026-09-16"
      },
      "on-med200-dark": {
        vals: { F2: 0, F3: 0, F4: 0, Clear: 0 }, tone: "ok",
        text: "Dilution medium alone at 200 µL, with the LED energised. All four reported channels read zero. This is the 200 µL blank the earlier water blank could not provide — though it is a medium blank in a lab cuvette, not a full blank characterisation.",
        src: "Calibration matrix session, CAL_MEDIUM_BLANK, three cycles, 2026-09-16"
      }
    };

    var LABEL = {
      led: { off: "LED de-energised", on: "LED energised" },
      sample: {
        none: "empty holder", uvette: "empty UVette", paper: "paper scatterer",
        water: "water blank, 1600 µL",
        cultA: "GFP culture, 2026-09-04", cultB: "control, 2026-09-04",
        gfp200: "GFP culture at 200 µL, 2026-09-16",
        nogfp200: "non-GFP culture at 200 µL, 2026-09-16",
        med200: "medium blank at 200 µL, 2026-09-16"
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
      cultA: "rgba(110,205,150,.34)",
      cultB: "rgba(150,170,160,.22)",
      gfp200: "rgba(110,205,150,.40)",
      nogfp200: "rgba(150,170,160,.28)",
      med200: "rgba(120,180,220,.14)"
    };

    var state = { led: "off", sample: "none", light: "dark" };

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

    function drawDiagram(rec) {
      var on = state.led === "on";
      var loaded = state.sample !== "none";

      beamEx.style.opacity = on ? 1 : 0;
      /* Paper stops the beam; everything else lets some of it through to the
         trap. */
      beamTh.style.opacity = (on && state.sample !== "paper") ? 0.9 : 0;
      scatter.style.opacity = (on && loaded) ? 0.85 : 0;
      scatter.setAttribute("r", (on && loaded) ? (state.sample === "paper" ? 18 : 10) : 0);

      /* The emission arm lights only where the record actually shows light on
         the emission channel. It is drawn from the data, not from the state. */
      var emitting = on && rec && rec.vals && rec.vals.F4 > 1;
      beamEm.style.opacity = emitting ? 1 : 0;

      ambient.style.opacity = state.light === "room" ? (loaded ? 1 : 0.45) : 0;
      fill.setAttribute("fill", FILL[state.sample]);
    }

    function render() {
      var key = state.led + "-" + state.sample + "-" + state.light;
      var rec = REC[key];

      $$(".hwx-ch", readout).forEach(function (el) {
        var name = el.getAttribute("data-ch");
        var val = $(".hwx-ch-val", el);
        var bar = $(".hwx-ch-bar", el);
        val.className = "hwx-ch-val";
        bar.style.width = "0";

        if (!rec) { val.classList.add("hwx-ch-nr"); val.textContent = "no data"; return; }
        if (rec.zero) { val.textContent = "0"; return; }
        if (rec.changed && rec.changed.indexOf(name) > -1) {
          val.classList.add("hwx-ch-nr");
          val.textContent = "changed, not reported";
          return;
        }
        if (rec.vals && rec.vals[name] !== undefined) {
          val.textContent = rec.vals[name];
          bar.style.width = Math.min(100, rec.vals[name] / FULL_SCALE * 100) + "%";
          return;
        }
        val.classList.add("hwx-ch-nr");
        val.textContent = "not reported";
      });

      var title = LABEL.led[state.led] + " · " + LABEL.sample[state.sample] +
                  " · " + LABEL.light[state.light];

      if (rec) {
        verdict.className = "hwx-verdict is-" + rec.tone;
        verdict.innerHTML =
          '<p class="hwx-verdict-title">' + title + "</p>" +
          '<p class="hwx-verdict-text">' + rec.text + "</p>" +
          '<p class="hwx-verdict-src">' + rec.src + "</p>";
      } else {
        verdict.className = "hwx-verdict is-none";
        verdict.innerHTML =
          '<p class="hwx-verdict-title">No recorded dataset</p>' +
          '<p class="hwx-verdict-text">' + (state.light === "room"
            ? "This combination was never measured, and it is outside the operating requirement: readings are taken in a darkened room or under an opaque shield. The panel shows nothing rather than an estimate."
            : "This combination is not in the evidence set. Rather than interpolate a plausible number, the readout reports that no dataset exists.") +
          "</p>";
      }

      drawDiagram(rec);
    }

    $$(".hwx-seg", rig).forEach(function (seg) {
      var key = seg.getAttribute("data-bench-key");
      seg.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn || !seg.contains(btn)) return;
        $$("button", seg).forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        state[key] = btn.getAttribute("data-v");
        render();
      });
    });

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
      [555, "F5", "The shoulder above the emission peak. It changed concurrently with F4 in the 2026-09-04 session."],
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
})();
