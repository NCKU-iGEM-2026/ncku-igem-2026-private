/* ========== strings ========== */
var STRINGS = {
  title: "SDG Board Game", chooseMode: "Choose Game Mode", pvc: "Solo / Bot Mode (PVC)", pvp: "Multiplayer (PVP)",
  pvpTitle: "Multiplayer", localPlay: "Same Device (Local)", onlinePlay: "Online Rooms", back: "Back",
  setup: "Game Setup", playerCount: "Players", enterDraft: "Enter SDG Draft", draftTitle: "SDG Goal Draft",
  confirmSDG: "Confirm SDG Selection", discardMode: "Discard Mode", playMode: "Play Cards", cancel: "Cancel",
  deck: "Deck", discard: "Discard", hand: "Current Hand", confirmAction: "Confirm Action", log: "Game Log",
  victory: "Victory!", playAgain: "Play Again", human: "Human", easyBot: "Easy Bot", basicBot: "Basic Bot", advanceBot: "Advance Bot",
  player: "Player", turnOf: "Turn:", select2: "pick 2 SDGs", selected: "Selected", actionPhase: "Action Phase",
  botThinking: "Bot thinking...", discardPhase: "Discard: select then confirm", playPhase: "Play mode (max", cards: "cards)",
  gameStart: "Draft complete. Game start!", pleaseStart: "Please take action.", reshuffle: "Deck empty. Reshuffled.",
  discarded: "discarded", played: "played", forward: "Forward", backward: "Backward", special: "Special",
  historyEvent: "Event", specialCard: "Special", sanctioned: "Sanctioned", goal: "GOAL",
  selectTarget: "Select target player", selectOwnCard: "Select your card to give", selectTheirCard: "Select card to take",
  selectOwnSDG: "Select your SDG", selectTheirSDG: "Select opponent's SDG", selectFromDiscard: "Pick a card from discard",
  selectSDGSwap: "Select SDG to swap", noValid: "No valid cards", aidChoose: "Hand over a move card that helps them",
  useVeto: "Use Veto?", yes: "Yes", no: "No", capacityChoose: "Capacity: choose one to discard",
  aiDraft: "is choosing 2 SDG goals...", aiPlay: "is deciding plays...", aiTarget: "is selecting targets...",
  onlineSoon: "Online mode scaffold reserved. Local play for now."
};

function t(key) { return STRINGS[key] || key; }

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    var key = el.getAttribute("data-i18n");
    if (STRINGS[key]) el.textContent = STRINGS[key];
  });
  if (document.getElementById("gameScreen").classList.contains("active")) updateUI();
  if (document.getElementById("draftScreen").classList.contains("active")) renderDraft();
  if (document.getElementById("setupScreen").classList.contains("active")) {
    renderNameInputs(state.mode === "pvp-local" ? "pvp" : "pvc");
  }
}

/* ========== DATA ========== */
var eventCards = [
  {name:"2008 Financial Crisis",forward:[],backward:[1,8],desc:"A global financial market crash."},
  {name:"Typhoon Morakot (2009)",forward:[],backward:[11],desc:"Record flooding hit southern Taiwan."},
  {name:"Burning of Books",forward:[],backward:[4],desc:"Book burning suppresses knowledge and learning."},
  {name:"Cape Town Day Zero",forward:[],backward:[6],desc:"A reservoir crisis nearly ran the city dry."},
  {name:"Ukraine War",forward:[],backward:[2,17],desc:"Food supply chains and cooperation disrupted."},
  {name:"East Africa Famine",forward:[17],backward:[1,2],desc:"Drought triggers a severe food crisis."},
  {name:"Afghanistan Girls Education Ban",forward:[],backward:[4,5,10],desc:"Girls' right to education is stripped away."},
  {name:"HK Lead Water Scandal",forward:[],backward:[3,6,11],desc:"Lead contamination in the water supply."},
  {name:"Oil Crisis",forward:[7],backward:[9],desc:"Energy supply chains disrupted."},
  {name:"COVID Lockdowns",forward:[3],backward:[8,17],desc:"Businesses close and unemployment rises."},
  {name:"Fukushima Disaster",forward:[],backward:[3,7,14],desc:"A nuclear plant disaster."},
  {name:"Apartheid",forward:[],backward:[4,10,16],desc:"Racial segregation entrenches inequality."},
  {name:"Fast Fashion Boom",forward:[],backward:[12,13],desc:"Resource consumption surges."},
  {name:"Australia Bushfires",forward:[],backward:[13,15],desc:"Large-scale wildfires."},
  {name:"Gulf Oil Spill",forward:[],backward:[6,14],desc:"An offshore oil spill fouls the coast."},
  {name:"Illegal Logging",forward:[],backward:[12,15],desc:"Illegal deforestation."},
  {name:"Black Death",forward:[],backward:[1],desc:"A pandemic causes mass death."},
  {name:"Cold War",forward:[],backward:[9,17],desc:"Global division and distrust."},
  {name:"Suez Blockage 2021",forward:[],backward:[8,9,17],desc:"Global trade disrupted."},
  {name:"Foot Binding",forward:[],backward:[5,16],desc:"A practice that oppressed women."},
  {name:"Honor Killing",forward:[],backward:[5,16],desc:"Violence against women and family members."},
  {name:"Blackout",forward:[],backward:[7],desc:"A major power outage."},
  {name:"Over-packaging",forward:[],backward:[12,15],desc:"Resource waste from excess packaging."},
  {name:"Ghost Nets",forward:[5,10,16],backward:[12,14],desc:"Abandoned fishing nets keep killing marine life."},
  {name:"Witch Hunts",forward:[],backward:[5],desc:"Persecution of women."},
  {name:"Same-sex Marriage Law",forward:[5,10,16],backward:[],desc:"Marriage equality is legalized."},
  {name:"Public Water System",forward:[3,6],backward:[],desc:"A public water supply system is built."},
  {name:"Earth Hour",forward:[7,12,13],backward:[],desc:"A global call to cut energy and carbon use."},
  {name:"Iceland Equal Pay",forward:[5,10],backward:[],desc:"Equal pay legislation."},
  {name:"Universal Healthcare 1995",forward:[3,10],backward:[],desc:"Universal health coverage begins."},
  {name:"France Anti-Waste Law",forward:[2,12],backward:[],desc:"Bans discarding edible unsold food."},
  {name:"EU 2035 ICE Ban",forward:[7,11],backward:[],desc:"Combustion-engine vehicles phased out."},
  {name:"Expo 2025 Osaka",forward:[9,17],backward:[],desc:"A showcase of sustainable technology."},
  {name:"Coldplay Tour",forward:[7,13],backward:[],desc:"A low-carbon world tour."},
  {name:"MDG Poverty Drive",forward:[1,8],backward:[],desc:"Extreme poverty rates fall."},
  {name:"Green Revolution",forward:[1,2,9],backward:[],desc:"Agricultural yields rise sharply."},
  {name:"NZ Women Vote 1893",forward:[5,10,16],backward:[],desc:"Women win the right to vote."},
  {name:"Internet Boom",forward:[4,9],backward:[10],desc:"Information exchange and innovation accelerate."},
  {name:"HSR Launch 2007",forward:[8,9,11],backward:[],desc:"High-speed rail transforms transportation."},
  {name:"Sponge City",forward:[11,13],backward:[],desc:"Stormwater and drainage systems modernized."},
  {name:"Earth Day",forward:[12,14,15],backward:[],desc:"A global day for environmental protection."},
  {name:"Single-use Plastic Ban",forward:[12,14,15],backward:[],desc:"Reduces single-use plastic waste."},
  {name:"Whaling Ban",forward:[14],backward:[],desc:"Protects whale populations."},
  {name:"Beach Cleanup",forward:[11,14,15],backward:[],desc:"Coastal and marine cleanup efforts."},
  {name:"National Parks",forward:[15],backward:[],desc:"Protects natural forests and habitats."},
  {name:"Species Recovery",forward:[15],backward:[],desc:"Biodiversity restoration."},
  {name:"UDHR 1948",forward:[5,10,16],backward:[],desc:"Human rights are formally protected."},
  {name:"COVID Vaccine Co-op",forward:[3,17],backward:[],desc:"International vaccine cooperation."},
  {name:"Human Genome Project",forward:[3,9,17],backward:[],desc:"The human genome is decoded."},
  {name:"Yu the Great Flood Control",forward:[6,9,11],backward:[],desc:"Major flood control works."},
  {name:"Shang Yang Reforms",forward:[8,16],backward:[],desc:"Institutional reform."},
  {name:"Imperial Exam System",forward:[4,8,16],backward:[],desc:"A public civil-service exam system."},
  {name:"Athenian Democracy",forward:[10,16],backward:[],desc:"Public participation in governance."},
  {name:"Renaissance",forward:[4,9],backward:[],desc:"A flourishing of arts and ideas."},
  {name:"Gutenberg Press",forward:[4,10],backward:[],desc:"Knowledge spreads widely."},
  {name:"Steam Engine",forward:[7,8],backward:[],desc:"Sparks the Industrial Revolution."},
  {name:"Industrial Revolution",forward:[8],backward:[13],desc:"Mechanization boosts production."},
  {name:"Columbus 1492",forward:[8,17],backward:[10],desc:"Cross-continental contact and exchange."},
  {name:"Social Housing",forward:[1],backward:[],desc:"Affordable housing programs."},
  {name:"Bolsa Família",forward:[1,2,4],backward:[],desc:"Support for vulnerable families."},
  {name:"IRRI Founded",forward:[2,9],backward:[],desc:"Rice research improves food security."},
  {name:"Wikipedia Launch",forward:[4,17],backward:[],desc:"Open knowledge sharing."},
  {name:"Iceland First Elected Woman President",forward:[5],backward:[],desc:"A milestone for women in politics."},
  {name:"London Sewer System",forward:[3,6,11],backward:[],desc:"A modern sanitation system."},
  {name:"Desalination Spread",forward:[6,9],backward:[],desc:"Seawater converted into fresh water."},
  {name:"LED Lighting",forward:[7,12],backward:[],desc:"Energy-efficient lighting technology."},
  {name:"Coral Restoration",forward:[13,14],backward:[],desc:"Coral reef rehabilitation."},
  {name:"Shark Fin Ban",forward:[12,14],backward:[],desc:"Protects shark populations."},
  {name:"Sea Turtle Protection",forward:[14,15],backward:[],desc:"Protects sea turtles."},
  {name:"Natural Forest Ban",forward:[13,15],backward:[],desc:"Bans logging of natural forests."},
  {name:"Minimum Wage",forward:[1],backward:[],desc:"Protects workers' basic income."},
  {name:"Drip Irrigation",forward:[2,6],backward:[],desc:"Precision irrigation technology."},
  {name:"Food Bank",forward:[1,2,12],backward:[],desc:"Helps distribute surplus food."},
  {name:"International Women's Day",forward:[5],backward:[],desc:"Championing women's rights."},
  {name:"Child Marriage Ban",forward:[3,5,16],backward:[],desc:"Bans marriage before adulthood."},
  {name:"Girls Who Code",forward:[4,5],backward:[],desc:"Encourages girls to learn programming."},
  {name:"Rainwater Harvesting",forward:[6,11],backward:[],desc:"Collects and reuses rainwater."}
];

var specialCards = [
  {name:"Sustainable Transition",type:"sustain",desc:"Trade one of your unused SDGs for a new one, keeping its progress."},
  {name:"Veto",type:"veto",desc:"Blocks an incoming negative effect."},
  {name:"Policy Immunity",type:"immunity",desc:"Protects one of your own SDGs from negative effects this round."},
  {name:"Freeze Plan",type:"freeze",desc:"Freezes a target SDG so it cannot change."},
  {name:"MOU",type:"tradeHand",desc:"Trade one card in hand with another player."},
  {name:"International Sanction",type:"sanction",desc:"A target player may only play 1 card next turn."},
  {name:"Capacity Building",type:"capacity",desc:"Draw an extra card, then discard one."},
  {name:"Aid Request",type:"aid",desc:"A target player hands over a card that would help your SDGs."},
  {name:"History Mirror",type:"history",desc:"Pick one extra card from the discard pile."},
  {name:"Goal Realignment",type:"swapSDG",desc:"Swap one SDG with another player, keeping progress."}
];

var SDG_NAMES = {1:"No Poverty",2:"Zero Hunger",3:"Good Health",4:"Quality Education",5:"Gender Equality",6:"Clean Water",7:"Affordable Energy",8:"Decent Work",9:"Industry Innovation",10:"Reduced Inequalities",11:"Sustainable Cities",12:"Responsible Consumption",13:"Climate Action",14:"Life Below Water",15:"Life on Land",16:"Peace & Justice",17:"Partnerships"};

function sdgName(id) {
  return SDG_NAMES[id] || id;
}

/* ========== STATE ========== */
var state = {
  mode: "local", isGameOver: false, timers: [], inputLocked: false,
  players: [], currentPlayer: 0, phase: "action",
  deck: [], discard: [], unusedSDGs: [],
  selectedCards: [], modeAction: null, maxPlay: 2,
  capacityActive: false, isAIThinking: false,
  draftAvailable: [], draftCurrentPlayer: 0, draftSelected: [],
  previewDeltas: {}
};

function trackTimeout(fn, ms) {
  if (state.isGameOver) return null;
  var id = setTimeout(function() {
    state.timers = state.timers.filter(function(t) { return t !== id; });
    if (!state.isGameOver) fn();
  }, ms);
  state.timers.push(id);
  return id;
}
function clearAllTimers() {
  state.timers.forEach(function(id) { clearTimeout(id); });
  state.timers = [];
}
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function log(msg, type) {
  type = type || "";
  var el = document.getElementById("logContent");
  if (!el) return;
  var d = document.createElement("div");
  d.className = "log-entry " + type;
  d.textContent = msg;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function(s) { s.classList.remove("active"); });
  document.getElementById(id).classList.add("active");
}
function getCurrentPlayer() { return state.players[state.currentPlayer]; }
function delay(ms) { return new Promise(function(r) { trackTimeout(r, ms); }); }
function randChoice(a) { return a[Math.floor(Math.random() * a.length)]; }

function showModal(title, bodyHtml, actions) {
  if (state.isGameOver) return;
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  var act = document.getElementById("modalActions");
  act.innerHTML = "";
  (actions || []).forEach(function(a) {
    var b = document.createElement("button");
    b.textContent = a.label;
    if (a.class) b.className = a.class;
    b.onclick = function() { hideModal(); a.fn(); };
    act.appendChild(b);
  });
  document.getElementById("modal").classList.add("show");
}
function hideModal() { document.getElementById("modal").classList.remove("show"); }

function showAINotice(text) {
  document.getElementById("aiNoticeText").textContent = text;
  document.getElementById("ai-notice").classList.add("show");
}
function hideAINotice() {
  document.getElementById("ai-notice").classList.remove("show");
}

function showCardAnnouncement(playerName, card, options) {
  options = options || {};
  return new Promise(function(resolve) {
    if (state.isGameOver) { resolve(); return; }
    state.inputLocked = true;
    document.getElementById("announcePlayer").textContent = playerName + " " + t("played");
    document.getElementById("announceCardName").textContent = card.name;
    var targetEl = document.getElementById("announceTarget");
    if (options.targetName) {
      targetEl.style.display = "block";
      targetEl.textContent = "-> " + options.targetName;
    } else {
      targetEl.style.display = "none";
    }
    document.getElementById("announceDesc").textContent = card.desc || "";
    var effectsEl = document.getElementById("announceEffects");
    effectsEl.innerHTML = "";
    var affected = options.affectedSDGs || [];
    if (affected.length) {
      affected.forEach(function(a) {
        var tag = document.createElement("span");
        tag.className = "effect-tag " + (a.delta > 0 ? "up" : "down");
        tag.textContent = "SDG " + a.id + " " + (a.delta > 0 ? "+" : "") + a.delta;
        effectsEl.appendChild(tag);
      });
    } else if (card.kind === "event") {
      (card.forward || []).forEach(function(id) {
        var tag = document.createElement("span");
        tag.className = "effect-tag up";
        tag.textContent = "SDG " + id + " +1";
        effectsEl.appendChild(tag);
      });
      (card.backward || []).forEach(function(id) {
        var tag = document.createElement("span");
        tag.className = "effect-tag down";
        tag.textContent = "SDG " + id + " -1";
        effectsEl.appendChild(tag);
      });
    } else {
      var tag = document.createElement("span");
      tag.className = "effect-tag special";
      tag.textContent = t("special");
      effectsEl.appendChild(tag);
    }
    var modal = document.getElementById("card-play-modal");
    modal.classList.remove("fade-out");
    modal.classList.add("show");
    trackTimeout(function() {
      modal.classList.add("fade-out");
      trackTimeout(function() {
        modal.classList.remove("show", "fade-out");
        state.inputLocked = false;
        resolve();
      }, 320);
    }, 3000);
  });
}

/* ========== NAV ========== */
document.getElementById("btnPVC").onclick = function() {
  state.mode = "local";
  showScreen("setupScreen");
  renderNameInputs("pvc");
};
document.getElementById("btnPVP").onclick = function() { showScreen("pvpMenu"); };
document.getElementById("btnBackMain").onclick = function() { showScreen("mainMenu"); };
document.getElementById("btnLocal").onclick = function() {
  state.mode = "pvp-local";
  showScreen("setupScreen");
  renderNameInputs("pvp");
};
document.getElementById("btnOnline").onclick = function() { alert(t("onlineSoon")); };
document.getElementById("btnBackFromSetup").onclick = function() { showScreen("mainMenu"); };

function renderNameInputs(mode) {
  var count = parseInt(document.getElementById("playerCount").value, 10);
  var box = document.getElementById("nameInputs");
  box.innerHTML = "";
  for (var i = 0; i < count; i++) {
    var div = document.createElement("div");
    div.className = "player-setup";
    if (mode === "pvp") {
      div.innerHTML = "<label>" + t("player") + " " + (i+1) + "</label>" +
        "<input type=\"text\" id=\"pname" + i + "\" value=\"" + t("player") + (i+1) + "\" maxlength=\"12\">" +
        "<select id=\"ptype" + i + "\" disabled><option value=\"human\" selected>" + t("human") + "</option></select>";
    } else {
      var def = i === 0 ? "human" : "basic";
      div.innerHTML = "<label>" + t("player") + " " + (i+1) + "</label>" +
        "<input type=\"text\" id=\"pname" + i + "\" value=\"" + (i===0 ? t("player")+"1" : "Bot"+i) + "\" maxlength=\"12\">" +
        "<select id=\"ptype" + i + "\">" +
        "<option value=\"human\"" + (def==="human"?" selected":"") + ">" + t("human") + "</option>" +
        "<option value=\"easy\">" + t("easyBot") + "</option>" +
        "<option value=\"basic\"" + (def==="basic"?" selected":"") + ">" + t("basicBot") + "</option>" +
        "<option value=\"advance\">" + t("advanceBot") + "</option></select>";
    }
    box.appendChild(div);
  }
}
document.getElementById("playerCount").onchange = function() {
  renderNameInputs(state.mode === "pvp-local" ? "pvp" : "pvc");
};
document.getElementById("startBtn").onclick = startLocalDraft;

function startLocalDraft() {
  var count = parseInt(document.getElementById("playerCount").value, 10);
  var names = [], types = [];
  for (var i = 0; i < count; i++) {
    names.push(document.getElementById("pname"+i).value.trim() || (t("player")+(i+1)));
    types.push(document.getElementById("ptype"+i).value);
  }
  state.players = names.map(function(n, i) {
    var isAI = types[i] !== "human";
    return { name: n, isAI: isAI, difficulty: isAI ? types[i] : "basic", sdgs: [], hand: [], sanctioned: false, capacityNext: false };
  });
  state.isGameOver = false;
  clearAllTimers();
  state.draftAvailable = [];
  for (var k = 1; k <= 17; k++) state.draftAvailable.push(k);
  shuffle(state.draftAvailable);
  state.draftCurrentPlayer = 0;
  state.draftSelected = [];
  showScreen("draftScreen");
  renderDraft();
}

/* ========== DRAFT ========== */
function renderDraft() {
  if (state.isGameOver) return;
  var p = state.players[state.draftCurrentPlayer];
  document.getElementById("draftStatus").textContent = t("turnOf") + " " + p.name + (p.isAI ? " (Bot)" : "") + " " + t("select2");
  document.getElementById("draftCount").textContent = t("selected") + " " + state.draftSelected.length + " / 2";
  var grid = document.getElementById("draftGrid");
  grid.innerHTML = "";
  for (var id = 1; id <= 17; id++) {
    var avail = state.draftAvailable.indexOf(id) !== -1;
    var sel = state.draftSelected.indexOf(id) !== -1;
    var div = document.createElement("div");
    div.className = "sdg-pick" + (!avail ? " disabled" : "") + (sel ? " selected" : "");
    div.innerHTML = "<strong>SDG " + id + "</strong><br><span style=\"font-size:0.74rem;color:#8a7a6a;\">" + sdgName(id) + "</span>";
    if (avail && !p.isAI) {
      (function(sid) { div.onclick = function() { toggleDraftSelect(sid); }; })(id);
    }
    grid.appendChild(div);
  }
  document.getElementById("draftPicks").textContent = state.players.map(function(pl) {
    return pl.name + ": " + (pl.sdgs.map(function(x){return "SDG "+x.id;}).join(", ") || "-");
  }).join(" | ");
  document.getElementById("btnConfirmDraft").disabled = state.draftSelected.length !== 2 || p.isAI;
  if (p.isAI) {
    showAINotice("[" + p.name + "] " + t("aiDraft"));
    log("[" + p.name + "] " + t("aiDraft"), "ai");
    trackTimeout(function() {
      hideAINotice();
      aiDraftPick();
    }, 1000);
  }
}
function toggleDraftSelect(id) {
  var idx = state.draftSelected.indexOf(id);
  if (idx >= 0) state.draftSelected.splice(idx, 1);
  else if (state.draftSelected.length < 2) state.draftSelected.push(id);
  renderDraft();
}
document.getElementById("btnConfirmDraft").onclick = function() {
  if (state.draftSelected.length !== 2) return;
  confirmDraftPick(state.draftSelected.slice());
};
function confirmDraftPick(ids) {
  var p = state.players[state.draftCurrentPlayer];
  ids.forEach(function(id) {
    p.sdgs.push({ id: id, progress: 0, frozen: false, immune: false });
    state.draftAvailable = state.draftAvailable.filter(function(x) { return x !== id; });
  });
  state.draftSelected = [];
  state.draftCurrentPlayer++;
  if (state.draftCurrentPlayer >= state.players.length) {
    startGameAfterDraft();
    return;
  }
  renderDraft();
}
function aiDraftPick() {
  if (state.isGameOver) return;
  var p = state.players[state.draftCurrentPlayer];
  if (!p.isAI || state.draftAvailable.length < 2) return;
  var picks = p.difficulty === "easy"
    ? shuffle(state.draftAvailable.slice()).slice(0, 2)
    : state.draftAvailable.slice().sort(function(a,b){ return Math.abs(a-8.5)-Math.abs(b-8.5); }).slice(0, 2);
  state.draftSelected = picks;
  renderDraft();
  trackTimeout(function() { confirmDraftPick(picks); }, 400);
}

function startGameAfterDraft() {
  state.unusedSDGs = state.draftAvailable.slice();
  shuffle(state.unusedSDGs);
  state.deck = [];
  eventCards.forEach(function(c) {
    state.deck.push({ name: c.name, forward: c.forward.slice(), backward: c.backward.slice(), desc: c.desc, kind: "event", id: Math.random().toString(36).slice(2) });
  });
  specialCards.forEach(function(c) {
    for (var i = 0; i < 2; i++) {
      state.deck.push({ name: c.name, type: c.type, desc: c.desc, kind: "special", id: Math.random().toString(36).slice(2) + i });
    }
  });
  shuffle(state.deck);
  state.discard = [];
  state.players.forEach(function(p) {
    for (var i = 0; i < 5; i++) {
      if (state.deck.length === 0) reshuffle();
      p.hand.push(state.deck.pop());
    }
  });
  state.currentPlayer = 0;
  state.phase = "action";
  state.modeAction = null;
  state.selectedCards = [];
  state.maxPlay = 2;
  state.capacityActive = false;
  state.isAIThinking = false;
  state.previewDeltas = {};
  state.isGameOver = false;
  showScreen("gameScreen");
  log(t("gameStart"), "sys");
  log(getCurrentPlayer().name + " " + t("pleaseStart"), "sys");
  updateUI();
  maybeTriggerAI();
}
function reshuffle() {
  if (state.discard.length === 0) return;
  state.deck = state.discard.splice(0);
  shuffle(state.deck);
  log(t("reshuffle"), "sys");
}

/* ========== UI ========== */
function computePreview() {
  state.previewDeltas = {};
  var p = getCurrentPlayer();
  if (state.modeAction !== "play" || !state.selectedCards.length || p.isAI) return;
  state.selectedCards.forEach(function(idx) {
    var card = p.hand[idx];
    if (!card || card.kind !== "event") return;
    (card.forward || []).forEach(function(id) {
      state.players.forEach(function(pl, pi) {
        pl.sdgs.forEach(function(s, si) {
          if (s.id === id && s.progress < 3 && !s.frozen) {
            if (!state.previewDeltas[pi]) state.previewDeltas[pi] = {};
            state.previewDeltas[pi][si] = (state.previewDeltas[pi][si] || 0) + 1;
          }
        });
      });
    });
    (card.backward || []).forEach(function(id) {
      state.players.forEach(function(pl, pi) {
        pl.sdgs.forEach(function(s, si) {
          if (s.id === id && s.progress < 3 && !s.frozen && !s.immune) {
            if (!state.previewDeltas[pi]) state.previewDeltas[pi] = {};
            state.previewDeltas[pi][si] = (state.previewDeltas[pi][si] || 0) - 1;
          }
        });
      });
    });
  });
}

function updateUI() {
  if (state.isGameOver) return;
  var p = getCurrentPlayer();
  if (!p) return;
  document.getElementById("turnInfo").textContent = t("turnOf") + " " + p.name + (p.isAI ? " (Bot)" : "");
  document.getElementById("deckCount").textContent = state.deck.length;
  document.getElementById("discardCount").textContent = state.discard.length;
  document.getElementById("handCount").textContent = "(" + p.hand.length + "/5)";
  var phaseText = t("actionPhase");
  if (state.isAIThinking) phaseText = t("botThinking");
  else if (state.modeAction === "discard") phaseText = t("discardPhase");
  else if (state.modeAction === "play") phaseText = t("playPhase") + " " + state.maxPlay + " " + t("cards");
  document.getElementById("phaseLabel").textContent = phaseText;
  document.getElementById("phaseLabel").className = "phase-label" + (state.isAIThinking ? " ai-thinking" : "");

  var humanTurn = !p.isAI && state.phase === "action" && !state.isAIThinking && !state.inputLocked && !state.isGameOver;
  var btnD = document.getElementById("btnDiscardMode");
  var btnP = document.getElementById("btnPlayMode");
  var btnC = document.getElementById("btnCancelAction");
  var conf = document.getElementById("confirmBar");
  if (humanTurn && !state.modeAction) {
    btnD.style.display = ""; btnP.style.display = ""; btnC.style.display = "none"; conf.style.display = "none";
  } else if (humanTurn && (state.modeAction === "discard" || state.modeAction === "play")) {
    btnD.style.display = "none"; btnP.style.display = "none"; btnC.style.display = "";
    conf.style.display = state.selectedCards.length ? "flex" : "none";
  } else {
    btnD.style.display = "none"; btnP.style.display = "none"; btnC.style.display = "none"; conf.style.display = "none";
  }

  computePreview();
  var grid = document.getElementById("playersGrid");
  grid.innerHTML = "";
  state.players.forEach(function(pl, idx) {
    var div = document.createElement("div");
    div.className = "player-card" + (idx === state.currentPlayer ? " current" : "") + (pl.sanctioned ? " sanctioned" : "") + (pl.isAI ? " ai-tag" : "");
    div.setAttribute("data-sanction", t("sanctioned"));
    var html = "<div class=\"player-name\">" + pl.name + (idx === state.currentPlayer ? " (current)" : "") + (pl.isAI ? " [" + pl.difficulty + "]" : "") + "</div>";
    pl.sdgs.forEach(function(s, si) {
      var cur = s.progress;
      var delta = (state.previewDeltas[idx] && state.previewDeltas[idx][si]) || 0;
      var preview = clamp(cur + delta, -2, 3);
      var pct = ((cur + 2) / 5) * 100;
      var previewPct = ((preview + 2) / 5) * 100;
      html += "<div class=\"sdg-row\"><div class=\"sdg-badge " + (cur >= 3 ? "goal" : "") + (s.frozen ? " frozen" : "") + "\">SDG " + s.id + "</div>" +
        "<div class=\"progress-bar\"><div class=\"progress-fill " + (cur < 0 ? "negative" : "") + "\" style=\"width:" + pct + "%\"></div>" +
        (delta !== 0 ? "<div class=\"progress-preview " + (delta < 0 ? "negative" : "") + "\" style=\"left:0;width:" + Math.max(pct, previewPct) + "%;\"></div>" : "") +
        "<div class=\"progress-text\">" + (cur >= 3 ? t("goal") : cur) + (delta ? " -> " + preview : "") + (s.frozen ? " [frozen]" : "") + (s.immune ? " [immune]" : "") + "</div></div></div>" +
        "<div class=\"progress-labels\"><span>-2</span><span>-1</span><span>0</span><span>1</span><span>2</span><span>GOAL</span></div>" +
        "<div style=\"font-size:0.66rem;color:#8a7a6a;margin-bottom:2px;\">" + sdgName(s.id) + "</div>";
    });
    div.innerHTML = html;
    grid.appendChild(div);
  });

  var handEl = document.getElementById("handCards");
  handEl.innerHTML = "";
  p.hand.forEach(function(card, idx) {
    var cannot = state.modeAction === "play" && card.type === "veto";
    var div = document.createElement("div");
    div.className = "card " + (card.kind === "event" ? "event" : "special") +
      (state.selectedCards.indexOf(idx) !== -1 ? " selected" : "") + (cannot ? " disabled-card" : "");
    var effect = "";
    if (card.kind === "event") {
      effect = "<div class=\"card-fwd\">" + (card.forward.length ? t("forward") + ":" + card.forward.join(",") : "") + "</div>" +
               "<div class=\"card-bwd\">" + (card.backward.length ? t("backward") + ":" + card.backward.join(",") : "") + "</div>";
    } else {
      effect = "<div class=\"card-effect\">" + (card.desc || "") + "</div>";
    }
    div.innerHTML = "<div class=\"card-header\">" + (card.kind === "event" ? t("historyEvent") : t("specialCard")) + "</div>" +
      "<div class=\"card-body\"><div class=\"card-name\">" + card.name + "</div>" + effect + "</div>";
    if (!p.isAI && !cannot && !state.inputLocked && !state.isGameOver) {
      (function(i) { div.onclick = function() { onCardClick(i); }; })(idx);
    }
    handEl.appendChild(div);
  });
}

/* ========== ACTIONS ========== */
document.getElementById("btnDiscardMode").onclick = function() {
  if (state.inputLocked || state.isGameOver) return;
  state.modeAction = "discard"; state.selectedCards = []; updateUI();
};
document.getElementById("btnPlayMode").onclick = function() {
  if (state.inputLocked || state.isGameOver) return;
  state.modeAction = "play";
  state.maxPlay = getCurrentPlayer().sanctioned ? 1 : 2;
  state.selectedCards = []; updateUI();
};
document.getElementById("btnCancelAction").onclick = function() {
  state.modeAction = null; state.selectedCards = []; state.previewDeltas = {}; updateUI();
};
document.getElementById("btnConfirmAction").onclick = function() {
  if (state.inputLocked || state.isGameOver || !state.selectedCards.length) return;
  if (state.modeAction === "discard") executeDiscard();
  else executePlay();
};

function onCardClick(idx) {
  if (state.inputLocked || state.isGameOver || state.phase !== "action" || !state.modeAction || getCurrentPlayer().isAI) return;
  var card = getCurrentPlayer().hand[idx];
  if (state.modeAction === "play" && card.type === "veto") return;
  if (state.modeAction === "discard") {
    var pos = state.selectedCards.indexOf(idx);
    if (pos >= 0) state.selectedCards.splice(pos, 1); else state.selectedCards.push(idx);
  } else {
    var pos2 = state.selectedCards.indexOf(idx);
    if (pos2 >= 0) state.selectedCards.splice(pos2, 1);
    else {
      if (state.selectedCards.length >= state.maxPlay) state.selectedCards.shift();
      state.selectedCards.push(idx);
    }
  }
  updateUI();
}

function executeDiscard() {
  var p = getCurrentPlayer();
  state.selectedCards.slice().sort(function(a,b){return b-a;}).forEach(function(i) {
    var c = p.hand.splice(i, 1)[0];
    state.discard.push(c);
    log(p.name + " " + t("discarded") + ": " + c.name);
  });
  state.selectedCards = []; state.modeAction = null;
  endActionPhase();
}

async function executePlay() {
  var p = getCurrentPlayer();
  var sorted = state.selectedCards.slice().sort(function(a,b){return b-a;});
  var cards = [];
  sorted.forEach(function(i) { cards.unshift(p.hand.splice(i, 1)[0]); });
  cards.forEach(function(c) { state.discard.push(c); });
  state.selectedCards = []; state.modeAction = null;
  for (var ci = 0; ci < cards.length; ci++) {
    if (state.isGameOver) break;
    var card = cards[ci];
    var affected = [];
    if (card.kind === "event") {
      (card.forward || []).forEach(function(id) { affected.push({id:id, delta:1}); });
      (card.backward || []).forEach(function(id) { affected.push({id:id, delta:-1}); });
    }
    await showCardAnnouncement(p.name, card, { affectedSDGs: affected });
    log(p.name + " " + t("played") + ": " + card.name, card.kind === "event" ? "up" : "special");
    updateUI();
    await new Promise(function(r) { resolveCard(card, false, r); });
    await delay(120);
  }
  if (!state.isGameOver) endActionPhase();
}

function endActionPhase() {
  if (state.isGameOver) return;
  state.modeAction = null; state.selectedCards = [];
  getCurrentPlayer().sdgs.forEach(function(s) { s.immune = false; });
  state.phase = "draw";
  doDrawPhase();
}

function doDrawPhase() {
  if (state.isGameOver) return;
  var p = getCurrentPlayer();
  var need = 5 - p.hand.length;
  if (p.capacityNext) { need += 1; p.capacityNext = false; state.capacityActive = true; }
  var drawn = [];
  for (var i = 0; i < need; i++) {
    if (state.deck.length === 0) reshuffle();
    if (state.deck.length === 0) break;
    drawn.push(state.deck.pop());
  }
  if (state.capacityActive && drawn.length) {
    state.capacityActive = false;
    if (p.isAI) {
      var ri = Math.floor(Math.random() * drawn.length);
      state.discard.push(drawn.splice(ri, 1)[0]);
      p.hand = p.hand.concat(drawn);
      finishTurn();
    } else {
      var body = "<div class=\"modal-list\">" + drawn.map(function(c, i) {
        return "<button data-i=\"" + i + "\">" + c.name + "</button>";
      }).join("") + "</div>";
      showModal(t("capacityChoose"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var i = parseInt(btn.getAttribute("data-i"), 10);
            state.discard.push(drawn.splice(i, 1)[0]);
            p.hand = p.hand.concat(drawn);
            hideModal();
            finishTurn();
          };
        });
      }, 30);
    }
  } else {
    p.hand = p.hand.concat(drawn);
    if (drawn.length) log(p.name + " +" + drawn.length);
    finishTurn();
  }
}

function finishTurn() {
  if (state.isGameOver) return;
  var next = (state.currentPlayer + 1) % state.players.length;
  getCurrentPlayer().sanctioned = false;
  state.players[next].sdgs.forEach(function(s) { s.frozen = false; });
  state.currentPlayer = next;
  state.phase = "action";
  state.modeAction = null;
  log("--- " + t("turnOf") + " " + getCurrentPlayer().name + " ---", "sys");
  checkWin();
  if (!state.isGameOver) { updateUI(); maybeTriggerAI(); }
}

/* ========== AI ========== */
async function maybeTriggerAI() {
  if (state.isGameOver) return;
  var p = getCurrentPlayer();
  if (!p || !p.isAI || state.phase !== "action") return;
  state.isAIThinking = true;
  updateUI();
  showAINotice("[" + p.name + "] " + t("aiPlay"));
  log("[" + p.name + "] " + t("aiPlay"), "ai");
  await delay(1000);
  hideAINotice();
  if (state.isGameOver) return;

  var playable = [];
  p.hand.forEach(function(c, i) { if (c.type !== "veto") playable.push(i); });
  if (playable.length && Math.random() > 0.28) {
    var n = Math.min(playable.length, p.sanctioned ? 1 : 2);
    shuffle(playable);
    var idxs = playable.slice(0, n);
    var cards = [];
    idxs.sort(function(a,b){return b-a;}).forEach(function(i) { cards.unshift(p.hand.splice(i, 1)[0]); });
    cards.forEach(function(c) { state.discard.push(c); });
    for (var ci = 0; ci < cards.length; ci++) {
      if (state.isGameOver) break;
      var card = cards[ci];
      var affected = [];
      if (card.kind === "event") {
        (card.forward || []).forEach(function(id) { affected.push({id:id, delta:1}); });
        (card.backward || []).forEach(function(id) { affected.push({id:id, delta:-1}); });
      }
      await showCardAnnouncement(p.name, card, { affectedSDGs: affected });
      log(p.name + " " + t("played") + ": " + card.name, "ai");
      await new Promise(function(r) { resolveCard(card, true, r); });
    }
  } else {
    var n2 = Math.min(2, p.hand.length);
    for (var j = 0; j < n2; j++) {
      var c = p.hand.pop();
      state.discard.push(c);
      log(p.name + " " + t("discarded") + ": " + c.name, "ai");
    }
  }
  state.isAIThinking = false;
  if (!state.isGameOver) endActionPhase();
}

/* ========== RESOLVE + INTERACTIVE MODALS ========== */
function isValidNegativeTarget(s) { return s.progress < 3 && !s.immune && !s.frozen; }

function resolveCard(card, isAI, done) {
  if (state.isGameOver) { done(); return; }
  if (card.kind === "event") resolveEvent(card, isAI, done);
  else resolveSpecial(card, isAI, done);
}

function resolveEvent(card, isAI, done) {
  (card.forward || []).forEach(function(id) {
    state.players.forEach(function(pl) {
      pl.sdgs.forEach(function(s) {
        if (s.id === id && s.progress < 3 && !s.frozen) {
          s.progress = clamp(s.progress + 1, -2, 3);
          log(pl.name + " SDG " + id + " -> " + s.progress, "up");
        }
      });
    });
  });
  if (!card.backward || !card.backward.length) { done(); return; }
  var targets = [];
  state.players.forEach(function(pl) {
    pl.sdgs.forEach(function(s) {
      if (card.backward.indexOf(s.id) !== -1 && isValidNegativeTarget(s)) targets.push({pl:pl, s:s});
    });
  });
  if (!targets.length) { log(t("noValid")); done(); return; }
  var i = 0;
  function next() {
    if (state.isGameOver || i >= targets.length) { done(); return; }
    var tObj = targets[i++];
    var vIdx = -1;
    for (var vi = 0; vi < tObj.pl.hand.length; vi++) {
      if (tObj.pl.hand[vi].type === "veto") { vIdx = vi; break; }
    }
    if (vIdx >= 0 && !tObj.pl.isAI) {
      showModal(t("useVeto"), "<p>" + tObj.pl.name + " SDG " + tObj.s.id + "</p>", [
        { label: t("yes"), class: "success", fn: function() {
          tObj.pl.hand.splice(vIdx, 1);
          state.discard.push({type:"veto"});
          log(tObj.pl.name + " Veto", "special");
          next();
        }},
        { label: t("no"), class: "danger", fn: function() {
          tObj.s.progress = clamp(tObj.s.progress - 1, -2, 3);
          log(tObj.pl.name + " SDG " + tObj.s.id + " -> " + tObj.s.progress, "down");
          next();
        }}
      ]);
    } else {
      if (vIdx >= 0 && tObj.pl.isAI && tObj.pl.difficulty === "advance") {
        tObj.pl.hand.splice(vIdx, 1);
        log(tObj.pl.name + " Veto", "ai");
      } else {
        tObj.s.progress = clamp(tObj.s.progress - 1, -2, 3);
        log(tObj.pl.name + " SDG " + tObj.s.id + " -> " + tObj.s.progress, "down");
      }
      next();
    }
  }
  next();
}

function resolveSpecial(card, isAI, done) {
  var p = getCurrentPlayer();

  if (card.type === "capacity") {
    p.capacityNext = true;
    log(p.name + " Capacity", "special");
    done();
    return;
  }

  if (card.type === "immunity") {
    if (isAI) {
      p.sdgs[0].immune = true;
      log(p.name + " Immunity", "ai");
      done();
    } else {
      var body = "<div class=\"modal-list\">" + p.sdgs.map(function(s, i) {
        return "<button data-i=\"" + i + "\">SDG " + s.id + " (" + sdgName(s.id) + ")</button>";
      }).join("") + "</div>";
      showModal(t("selectOwnSDG"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var i = parseInt(btn.getAttribute("data-i"), 10);
            p.sdgs[i].immune = true;
            log(p.name + " SDG " + p.sdgs[i].id + " immune", "special");
            hideModal();
            done();
          };
        });
      }, 30);
    }
    return;
  }

  if (card.type === "freeze" || card.type === "sanction") {
    var opps = state.players.filter(function(pl) { return pl !== p; });
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        if (card.type === "freeze") {
          var best = null;
          opps.forEach(function(pl) {
            pl.sdgs.forEach(function(s) {
              if (isValidNegativeTarget(s) && (!best || s.progress > best.s.progress)) best = {pl:pl, s:s};
            });
          });
          if (best) { best.s.frozen = true; log("[" + p.name + "] -> [" + best.pl.name + "] Freeze", "special"); }
        } else {
          var bestP = null, max = -99;
          opps.forEach(function(pl) {
            var tot = pl.sdgs.reduce(function(a,s){return a+s.progress;},0);
            if (tot > max) { max = tot; bestP = pl; }
          });
          if (bestP) { bestP.sanctioned = true; log("[" + p.name + "] -> [" + bestP.name + "] Sanction", "special"); }
        }
        done();
      }, 1000);
    } else {
      var body = "<div class=\"modal-list\">" + opps.map(function(pl, i) {
        return "<button data-i=\"" + state.players.indexOf(pl) + "\">" + pl.name + "</button>";
      }).join("") + "</div>";
      showModal(t("selectTarget"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var ti = parseInt(btn.getAttribute("data-i"), 10);
            var target = state.players[ti];
            hideModal();
            if (card.type === "freeze") {
              var valid = target.sdgs.filter(function(s) { return isValidNegativeTarget(s); });
              if (!valid.length) { log(t("noValid")); done(); return; }
              var body2 = "<div class=\"modal-list\">" + target.sdgs.map(function(s, si) {
                if (!isValidNegativeTarget(s)) return "";
                return "<button data-si=\"" + si + "\">SDG " + s.id + "</button>";
              }).join("") + "</div>";
              showModal("Freeze SDG", body2, []);
              setTimeout(function() {
                document.querySelectorAll("#modalBody button").forEach(function(b2) {
                  b2.onclick = function() {
                    var si = parseInt(b2.getAttribute("data-si"), 10);
                    target.sdgs[si].frozen = true;
                    log("[" + p.name + "] -> [" + target.name + "] Freeze SDG " + target.sdgs[si].id, "special");
                    hideModal();
                    done();
                  };
                });
              }, 30);
            } else {
              target.sanctioned = true;
              log("[" + p.name + "] -> [" + target.name + "] Sanction", "special");
              done();
            }
          };
        });
      }, 30);
    }
    return;
  }

  /* MOU */
  if (card.type === "tradeHand") {
    var opps = state.players.filter(function(pl) { return pl !== p && pl.hand.length > 0; });
    if (!opps.length || !p.hand.length) { log(t("noValid")); done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var target = randChoice(opps);
        var myC = p.hand.pop();
        var tC = target.hand.pop();
        p.hand.push(tC);
        target.hand.push(myC);
        log("[" + p.name + "] -> [" + target.name + "] MOU", "special");
        done();
      }, 1000);
    } else {
      var body = "<div class=\"modal-list\">" + opps.map(function(pl) {
        return "<button data-i=\"" + state.players.indexOf(pl) + "\">" + pl.name + "</button>";
      }).join("") + "</div>";
      showModal(t("selectTarget"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var ti = parseInt(btn.getAttribute("data-i"), 10);
            var target = state.players[ti];
            hideModal();
            var body2 = "<div class=\"modal-list\">" + p.hand.map(function(c, i) {
              return "<button data-i=\"" + i + "\">" + c.name + "</button>";
            }).join("") + "</div>";
            showModal(t("selectOwnCard"), body2, []);
            setTimeout(function() {
              document.querySelectorAll("#modalBody button").forEach(function(b2) {
                b2.onclick = function() {
                  var mi = parseInt(b2.getAttribute("data-i"), 10);
                  hideModal();
                  var body3 = "<div class=\"modal-list\">" + target.hand.map(function(c, i) {
                    return "<button data-i=\"" + i + "\">" + c.name + "</button>";
                  }).join("") + "</div>";
                  showModal(t("selectTheirCard"), body3, []);
                  setTimeout(function() {
                    document.querySelectorAll("#modalBody button").forEach(function(b3) {
                      b3.onclick = function() {
                        var ti2 = parseInt(b3.getAttribute("data-i"), 10);
                        var myC = p.hand.splice(mi, 1)[0];
                        var tC = target.hand.splice(ti2, 1)[0];
                        p.hand.push(tC);
                        target.hand.push(myC);
                        log("[" + p.name + "] -> [" + target.name + "] MOU", "special");
                        hideModal();
                        done();
                      };
                    });
                  }, 30);
                };
              });
            }, 30);
          };
        });
      }, 30);
    }
    return;
  }

  /* Goal Realignment */
  if (card.type === "swapSDG") {
    var opps = state.players.filter(function(pl) { return pl !== p; });
    if (!opps.length) { done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var target = randChoice(opps);
        var tmp = p.sdgs[0];
        p.sdgs[0] = target.sdgs[0];
        target.sdgs[0] = tmp;
        log("[" + p.name + "] -> [" + target.name + "] Goal Realignment", "special");
        done();
      }, 1000);
    } else {
      var body = "<div class=\"modal-list\">" + opps.map(function(pl) {
        return "<button data-i=\"" + state.players.indexOf(pl) + "\">" + pl.name + "</button>";
      }).join("") + "</div>";
      showModal(t("selectTarget"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var ti = parseInt(btn.getAttribute("data-i"), 10);
            var target = state.players[ti];
            hideModal();
            var body2 = "<div class=\"modal-list\">" + p.sdgs.map(function(s, i) {
              return "<button data-i=\"" + i + "\">SDG " + s.id + " (" + s.progress + ")</button>";
            }).join("") + "</div>";
            showModal(t("selectOwnSDG"), body2, []);
            setTimeout(function() {
              document.querySelectorAll("#modalBody button").forEach(function(b2) {
                b2.onclick = function() {
                  var mi = parseInt(b2.getAttribute("data-i"), 10);
                  hideModal();
                  var body3 = "<div class=\"modal-list\">" + target.sdgs.map(function(s, i) {
                    return "<button data-i=\"" + i + "\">SDG " + s.id + " (" + s.progress + ")</button>";
                  }).join("") + "</div>";
                  showModal(t("selectTheirSDG"), body3, []);
                  setTimeout(function() {
                    document.querySelectorAll("#modalBody button").forEach(function(b3) {
                      b3.onclick = function() {
                        var ti2 = parseInt(b3.getAttribute("data-i"), 10);
                        var tmp = p.sdgs[mi];
                        p.sdgs[mi] = target.sdgs[ti2];
                        target.sdgs[ti2] = tmp;
                        log("[" + p.name + "] -> [" + target.name + "] Goal Realignment", "special");
                        hideModal();
                        done();
                      };
                    });
                  }, 30);
                };
              });
            }, 30);
          };
        });
      }, 30);
    }
    return;
  }

  /* History Mirror */
  if (card.type === "history") {
    if (!state.discard.length) { log(t("noValid")); done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var c = state.discard.pop();
        p.hand.push(c);
        log(p.name + " History Mirror: " + c.name, "special");
        done();
      }, 1000);
    } else {
      var body = "<div class=\"modal-list\">" + state.discard.map(function(c, i) {
        return "<button data-i=\"" + i + "\">" + c.name + "</button>";
      }).join("") + "</div>";
      showModal(t("selectFromDiscard"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var i = parseInt(btn.getAttribute("data-i"), 10);
            var c = state.discard.splice(i, 1)[0];
            p.hand.push(c);
            log(p.name + " History Mirror: " + c.name, "special");
            hideModal();
            done();
          };
        });
      }, 30);
    }
    return;
  }

  /* Sustainable Transition */
  if (card.type === "sustain") {
    if (!state.unusedSDGs.length) { log(t("noValid")); done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var newId = state.unusedSDGs.pop();
        var old = p.sdgs[0];
        state.unusedSDGs.push(old.id);
        p.sdgs[0] = { id: newId, progress: old.progress, frozen: false, immune: false };
        log(p.name + " Sustainable Transition -> SDG " + newId, "special");
        done();
      }, 1000);
    } else {
      var body = "<div class=\"modal-list\">" + p.sdgs.map(function(s, i) {
        return "<button data-i=\"" + i + "\">SDG " + s.id + " (" + s.progress + ")</button>";
      }).join("") + "</div>";
      showModal(t("selectSDGSwap"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var i = parseInt(btn.getAttribute("data-i"), 10);
            var old = p.sdgs[i];
            var newId = state.unusedSDGs.pop();
            state.unusedSDGs.push(old.id);
            p.sdgs[i] = { id: newId, progress: old.progress, frozen: false, immune: false };
            log(p.name + " Sustainable Transition -> SDG " + newId, "special");
            hideModal();
            done();
          };
        });
      }, 30);
    }
    return;
  }

  /* Aid Request */
  if (card.type === "aid") {
    var opps = state.players.filter(function(pl) { return pl !== p; });
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var target = randChoice(opps);
        var myIds = p.sdgs.map(function(s) { return s.id; });
        var valid = [];
        target.hand.forEach(function(c, i) {
          if (c.kind === "event" && c.forward && c.forward.some(function(f) { return myIds.indexOf(f) !== -1; })) valid.push(i);
        });
        if (valid.length) {
          var idx = randChoice(valid);
          var c = target.hand.splice(idx, 1)[0];
          p.hand.push(c);
          log("[" + target.name + "] -> [" + p.name + "] Aid: " + c.name, "special");
        } else log(t("noValid"));
        done();
      }, 1000);
    } else {
      var body = "<div class=\"modal-list\">" + opps.map(function(pl) {
        return "<button data-i=\"" + state.players.indexOf(pl) + "\">" + pl.name + "</button>";
      }).join("") + "</div>";
      showModal(t("selectTarget"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var ti = parseInt(btn.getAttribute("data-i"), 10);
            var target = state.players[ti];
            hideModal();
            var myIds = p.sdgs.map(function(s) { return s.id; });
            var valid = [];
            target.hand.forEach(function(c, i) {
              if (c.kind === "event" && c.forward && c.forward.some(function(f) { return myIds.indexOf(f) !== -1; })) {
                valid.push({ i: i, c: c });
              }
            });
            if (!valid.length) { log(t("noValid")); done(); return; }
            if (target.isAI) {
              var pick = randChoice(valid);
              var c = target.hand.splice(pick.i, 1)[0];
              p.hand.push(c);
              log("[" + target.name + "] -> [" + p.name + "] Aid", "special");
              done();
            } else {
              var body2 = "<div class=\"modal-list\">" + valid.map(function(v) {
                return "<button data-i=\"" + v.i + "\">" + v.c.name + "</button>";
              }).join("") + "</div>";
              showModal(t("aidChoose") + " (" + target.name + ")", body2, []);
              setTimeout(function() {
                document.querySelectorAll("#modalBody button").forEach(function(b2) {
                  b2.onclick = function() {
                    var i = parseInt(b2.getAttribute("data-i"), 10);
                    var c = target.hand.splice(i, 1)[0];
                    p.hand.push(c);
                    log("[" + target.name + "] -> [" + p.name + "] Aid: " + c.name, "special");
                    hideModal();
                    done();
                  };
                });
              }, 30);
            }
          };
        });
      }, 30);
    }
    return;
  }

  log(card.name + " OK", "special");
  done();
}

function checkWin() {
  for (var i = 0; i < state.players.length; i++) {
    var pl = state.players[i];
    if (pl.sdgs.every(function(s) { return s.progress >= 3; })) {
      state.isGameOver = true;
      clearAllTimers();
      state.isAIThinking = false;
      state.inputLocked = true;
      hideAINotice();
      showScreen("winScreen");
      document.getElementById("winnerText").textContent = pl.name + " wins!";
      log(pl.name + " WINS!", "win");
      return;
    }
  }
}

/* init */
applyI18n();
