/* ========== CONSTANTS ========== */
var GOAL = 2; // track runs -2..GOAL
var HAND_LIMIT = 5;

/* ========== strings ========== */
var STRINGS = {
  title: "The Green Cabinet", chooseMode: "Choose Game Mode",
  pvc: "Solo / Bot Mode (PvC)", pvp: "Multiplayer (PvP)",
  pvpTitle: "Multiplayer", localPlay: "Same Device (Local)", onlinePlay: "Online Rooms",
  back: "Back", setup: "Game Setup", playerCount: "Players", enterDraft: "Enter SDG Draft",
  draftTitle: "SDG Goal Draft", confirmSDG: "Confirm SDG Selection",
  discardMode: "Discard Mode", playMode: "Play Cards", cancel: "Cancel",
  deck: "Deck", discard: "Discard", hand: "Current Hand", confirmAction: "Confirm Action",
  log: "Game Log", victory: "Victory!", playAgain: "Play Again",
  human: "Human", easyBot: "Easy Bot", basicBot: "Basic Bot", advanceBot: "Advance Bot",
  player: "Player", turnOf: "Turn:", select2: "pick 2 SDGs", selected: "Selected",
  actionPhase: "Action Phase", flipPhase: "Reveal Phase", drawPhase: "Draw Phase",
  botThinking: "Bot thinking...", discardPhase: "Discard: select then confirm",
  playPhase: "Play mode (max", cards: "cards)",
  gameStart: "Draft complete. Game start!", pleaseStart: "Please take action.",
  reshuffle: "Deck empty. Reshuffled.", discarded: "discarded", played: "played",
  forward: "Forward", backward: "Backward", special: "Special",
  historyEvent: "Event", specialCard: "Special", sanctioned: "Sanctioned", goal: "GOAL",
  selectTarget: "Select target player", selectOwnCard: "Select your card to give",
  selectTheirCard: "Select card to take", selectOwnSDG: "Select your SDG",
  selectTheirSDG: "Select opponent's SDG", selectFromDiscard: "Pick from discard",
  selectSDGSwap: "Select SDG to swap", noValid: "No valid targets",
  useVeto: "Use Veto?", yes: "Yes", no: "No",
  capacityChoose: "Capacity: choose one to discard",
  aiDraft: "is choosing 2 SDG goals...", aiPlay: "is deciding plays...",
  aiTarget: "is selecting targets...", next: "Next", onlineSoon: "Online mode coming soon.",
  max2: "Full (2)", picks: "picked", flipReveal: "revealed",
  resetCard: "Back to Square One", reverseCard: "Stance Reversal"
};

var SDG_NAMES = {1:"No Poverty",2:"Zero Hunger",3:"Good Health",4:"Quality Education",5:"Gender Equality",6:"Clean Water",7:"Affordable Energy",8:"Decent Work",9:"Industry Innovation",10:"Reduced Inequalities",11:"Sustainable Cities",12:"Responsible Consumption",13:"Climate Action",14:"Life Below Water",15:"Life on Land",16:"Peace & Justice",17:"Partnerships"};

function t(key) { return STRINGS[key] || key; }
function sdgName(id) { return SDG_NAMES[id] || id; }

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    var key = el.getAttribute("data-i18n");
    if (STRINGS[key]) el.textContent = STRINGS[key];
  });
  if (document.getElementById("gameScreen").classList.contains("active")) updateUI();
  if (document.getElementById("draftScreen").classList.contains("active")) renderDraft();
  if (document.getElementById("setupScreen").classList.contains("active"))
    renderNameInputs(state.mode === "pvp-local" ? "pvp" : "pvc");
}

/* ========== CARD DATABASE ========== */
var eventCards = [
  {title:"Financial Crisis",subtitle:"2008 CE",description:"The U.S. subprime mortgage market collapsed; Lehman Brothers filed for bankruptcy.",forward:[],backward:[1,8]},
  {title:"Typhoon Morakot",subtitle:"2009 CE",description:"Record-breaking rainfall devastated southern Taiwan, wiping out Xiaolin Village.",forward:[],backward:[11]},
  {title:"Burning of Books",subtitle:"213 BCE",description:"Qin Shi Huang ordered classical texts burned and scholars buried alive.",forward:[],backward:[4]},
  {title:"Cape Town Day Zero",subtitle:"2018 CE",description:"Cape Town faced severe drought as reservoirs nearly ran dry.",forward:[],backward:[6]},
  {title:"Russo-Ukrainian War",subtitle:"2014-present",description:"Conflict destroyed infrastructure and disrupted food and energy supply chains.",forward:[],backward:[2,17]},
  {title:"East African Famine",subtitle:"Recurring",description:"Drought and conflict repeatedly pushed East Africa into severe famine.",forward:[17],backward:[1,2]},
  {title:"Afghanistan Girls' Education Ban",subtitle:"2021 CE",description:"After the Taliban retook power, girls were banned from secondary education.",forward:[],backward:[4,5,10]},
  {title:"HK Lead-in-Water Scandal",subtitle:"2015 CE",description:"Excessive lead levels found in tap water at Hong Kong public housing.",forward:[],backward:[3,6,11]},
  {title:"Oil Crisis",subtitle:"1973 CE",description:"Middle Eastern oil embargo sent prices soaring worldwide.",forward:[7],backward:[9]},
  {title:"COVID-19 Lockdowns",subtitle:"2020 CE",description:"Nationwide lockdowns halted economies but helped contain the virus.",forward:[3],backward:[8,17]},
  {title:"Fukushima Disaster",subtitle:"2011 CE",description:"Earthquake and tsunami crippled Fukushima nuclear plant.",forward:[],backward:[3,7,14]},
  {title:"Apartheid",subtitle:"1948-1994",description:"South Africa enforced racial segregation and discrimination.",forward:[],backward:[4,10,16]},
  {title:"Rise of Fast Fashion",subtitle:"2000s-present",description:"Cheap, rapidly produced clothing became the dominant model.",forward:[],backward:[12,13]},
  {title:"Australian Bushfires",subtitle:"2019-2020",description:"Worst wildfire season on record burned vast forests.",forward:[],backward:[13,15]},
  {title:"Deepwater Horizon Oil Spill",subtitle:"2010 CE",description:"Oil rig explosion spilled massive crude into the Gulf of Mexico.",forward:[],backward:[6,14]},
  {title:"Illegal Logging",subtitle:"Ongoing",description:"Illegal logging of valuable timber damages forest ecosystems.",forward:[],backward:[12,15]},
  {title:"The Black Death",subtitle:"14th century",description:"Plague swept Eurasia, killing tens of millions.",forward:[],backward:[1]},
  {title:"The Cold War",subtitle:"1947-1991",description:"US-USSR rivalry with arms race shaped global politics.",forward:[],backward:[9,17]},
  {title:"Suez Canal Blockage",subtitle:"2021 CE",description:"Ever Given ran aground, blocking the Suez Canal.",forward:[],backward:[8,9,17]},
  {title:"Foot Binding",subtitle:"c.10th-20th c.",description:"Custom forcing girls' feet into deformity for beauty standards.",forward:[],backward:[5,16]},
  {title:"Honor Killing",subtitle:"Ongoing",description:"Women subjected to violence in the name of family honor.",forward:[],backward:[5,16]},
  {title:"Large-Scale Blackouts",subtitle:"",description:"Power grids collapse, cutting electricity across wide areas.",forward:[],backward:[7]},
  {title:"Overpackaging Culture",subtitle:"Modern",description:"Excessive packaging wastes huge amounts of resources.",forward:[],backward:[12,15]},
  {title:"Ghost Fishing Nets",subtitle:"Modern",description:"Abandoned nets drift, entangling and killing marine animals.",forward:[],backward:[12,14]},
  {title:"Witch Trials",subtitle:"15th-17th c.",description:"Widespread persecution of accused witches in Europe.",forward:[],backward:[5]},
  {title:"Same-Sex Marriage Legalization",subtitle:"Multiple countries",description:"Multiple countries legalized same-sex marriage.",forward:[5,10,16],backward:[]},
  {title:"Modern Tap Water Systems",subtitle:"Modern era",description:"Modern tap water systems provide clean water and sanitation.",forward:[3,6],backward:[]},
  {title:"Earth Hour",subtitle:"Annually",description:"Global event switching off lights to raise climate awareness.",forward:[7,12,13],backward:[]},
  {title:"Iceland's Equal Pay Law",subtitle:"2018 CE",description:"Iceland required companies to prove equal pay for equal work.",forward:[5,10],backward:[]},
  {title:"National Health Insurance",subtitle:"1995 Taiwan",description:"Taiwan launched NHI, making healthcare accessible.",forward:[3,10],backward:[]},
  {title:"France's Anti-Food-Waste Law",subtitle:"2018 CE",description:"France banned supermarkets from discarding unsold food.",forward:[2,12],backward:[]},
  {title:"EU 2035 Combustion Car Ban",subtitle:"From 2035",description:"EU bans new fossil-fuel car sales from 2035.",forward:[7,11],backward:[]},
  {title:"Expo 2025 Osaka",subtitle:"2025 CE",description:"Nations showcased innovation and international cooperation.",forward:[9,17],backward:[]},
  {title:"Coldplay Music of the Spheres Tour",subtitle:"2022-present",description:"Tour used renewable energy and kinetic dance floors.",forward:[7,13],backward:[]},
  {title:"UN Millennium Development Goals",subtitle:"2000 CE",description:"UN set MDGs mobilizing global efforts to cut poverty.",forward:[1,8],backward:[]},
  {title:"The Green Revolution",subtitle:"1960s-1990s",description:"Crop innovations boosted food production; ecological trade-offs.",forward:[1,2,9],backward:[15]},
  {title:"New Zealand Women's Suffrage",subtitle:"1893 CE",description:"New Zealand became the first country to grant women the vote.",forward:[5,10,16],backward:[]},
  {title:"Rise of the Internet",subtitle:"1990s-present",description:"Internet spread rapidly; early access gaps also emerged.",forward:[4,9],backward:[10]},
  {title:"High Speed Rail Opens",subtitle:"2007 Taiwan",description:"Taiwan HSR cut north-south travel time drastically.",forward:[8,9,11],backward:[]},
  {title:"Sponge City Initiative",subtitle:"2010s-present",description:"Permeable surfaces improve flood resilience.",forward:[11,13],backward:[]},
  {title:"Earth Day",subtitle:"April 22",description:"Annual global environmental awareness campaigns.",forward:[12,14,15],backward:[]},
  {title:"Single-Use Plastic Bans",subtitle:"Worldwide",description:"Countries banned single-use plastics to curb pollution.",forward:[12,14,15],backward:[]},
  {title:"Commercial Whaling Moratorium",subtitle:"1986 CE",description:"IWC enacted a global moratorium on commercial whaling.",forward:[14],backward:[]},
  {title:"Beach Cleanup Movements",subtitle:"Modern",description:"Community beach cleanups reduce ocean and coastal litter.",forward:[11,14,15],backward:[]},
  {title:"Establishment of National Parks",subtitle:"Since 1872",description:"Countries designated national parks to protect ecosystems.",forward:[15],backward:[]},
  {title:"Endangered Species Recovery",subtitle:"Modern",description:"Captive breeding and habitat restoration help species recover.",forward:[15],backward:[]},
  {title:"Universal Declaration of Human Rights",subtitle:"1948 CE",description:"UN adopted the UDHR establishing basic rights for all.",forward:[5,10,16],backward:[]},
  {title:"COVID Vaccine Cooperation",subtitle:"2020-2021",description:"COVAX enabled countries to share vaccine resources.",forward:[3,17],backward:[]},
  {title:"Human Genome Project",subtitle:"1990-2003",description:"International scientists mapped the human genome.",forward:[3,9,17],backward:[]},
  {title:"Yu the Great Tames the Flood",subtitle:"c.2000 BCE",description:"Yu tamed Yellow River floods by channeling water.",forward:[6,9,11],backward:[]},
  {title:"Shang Yang's Reforms",subtitle:"356-338 BCE",description:"Shang Yang implemented legal and land reforms in Qin.",forward:[8,16],backward:[]},
  {title:"Imperial Examination System",subtitle:"605 CE",description:"Sui established exams letting commoners rise by merit.",forward:[4,8,16],backward:[]},
  {title:"Athenian Democracy",subtitle:"508 BCE",description:"Athens established direct citizen participation in politics.",forward:[10,16],backward:[]},
  {title:"The Renaissance",subtitle:"14th-17th c.",description:"European revival in art, science, and humanist thought.",forward:[4,9],backward:[]},
  {title:"Gutenberg's Printing Press",subtitle:"c.1440s",description:"Movable type enabled mass book production.",forward:[4,10],backward:[]},
  {title:"Invention of the Steam Engine",subtitle:"c.1712-1769",description:"Steam engine sparked a power revolution for industry.",forward:[7,8],backward:[]},
  {title:"The Industrial Revolution",subtitle:"18th-19th c.",description:"Massive productivity gains with heavy early pollution.",forward:[8],backward:[13]},
  {title:"Columbus Reaches the Americas",subtitle:"1492 CE",description:"Opened hemispheric contact but brought colonial exploitation.",forward:[8,17],backward:[10]},
  {title:"Social Housing Policy",subtitle:"Modern",description:"Governments build affordable housing for lower incomes.",forward:[1],backward:[]},
  {title:"Brazil's Bolsa Família",subtitle:"2003 CE",description:"Conditional cash transfers requiring school and vaccines.",forward:[1,2,4],backward:[]},
  {title:"Founding of IRRI",subtitle:"1960 CE",description:"Develops high-yield rice varieties for Asia.",forward:[2,9],backward:[]},
  {title:"Wikipedia Launches",subtitle:"2001 CE",description:"Free collaboratively edited online encyclopedia.",forward:[4,17],backward:[]},
  {title:"Iceland First Elected Woman President",subtitle:"1980 CE",description:"Iceland elected the world's first directly elected female president.",forward:[5],backward:[]},
  {title:"London Sewer System",subtitle:"1859-1875",description:"Modern sewers solved cholera and sewage overflow.",forward:[3,6,11],backward:[]},
  {title:"Desalination Technology Spreads",subtitle:"Modern",description:"Helps water-scarce regions secure freshwater.",forward:[6,9],backward:[]},
  {title:"LED Lighting Adoption",subtitle:"2000s-present",description:"LEDs replaced traditional lighting, cutting electricity use.",forward:[7,12],backward:[]},
  {title:"Coral Reef Restoration",subtitle:"Modern",description:"Coral farming and transplantation help reefs regrow.",forward:[13,14],backward:[]},
  {title:"Shark Fin Bans",subtitle:"Worldwide",description:"Bans on shark fin trade curb overfishing.",forward:[12,14],backward:[]},
  {title:"Sea Turtle Conservation",subtitle:"Modern",description:"Beach patrols and nesting protection help turtles recover.",forward:[14,15],backward:[]},
  {title:"Primary Forest Logging Bans",subtitle:"Worldwide",description:"Bans on logging primary forests protect carbon sinks.",forward:[13,15],backward:[]},
  {title:"Minimum Wage Laws",subtitle:"Worldwide",description:"Minimum wage standards guarantee baseline income.",forward:[1],backward:[]},
  {title:"Invention of Drip Irrigation",subtitle:"1960s Israel",description:"Delivers water precisely to roots, improving efficiency.",forward:[2,6],backward:[]},
  {title:"Founding of Food Banks",subtitle:"Since 1967",description:"Connect surplus food with families in need.",forward:[1,2,12],backward:[]},
  {title:"International Women's Day",subtitle:"March 8",description:"Global day advocating women's rights and equality.",forward:[5],backward:[]},
  {title:"Child Marriage Bans",subtitle:"Worldwide",description:"Laws ban child marriage to protect children's rights.",forward:[3,5,16],backward:[]},
  {title:"Founding of Girls Who Code",subtitle:"2012 CE",description:"Works to close the tech gender gap via coding education.",forward:[4,5],backward:[]},
  {title:"Rainwater Harvesting Systems",subtitle:"Modern",description:"Buildings collect rainwater for irrigation and flushing.",forward:[6,11],backward:[]}
];

var specialCards = [
  {title:"Sustainable Transition",type:"sustain",description:"Swap one of your SDGs with an unused one; progress is kept."},
  {title:"Veto",type:"veto",description:"Cancel a special card about to resolve; it is discarded unused."},
  {title:"Policy Exemption",type:"immunity",description:"Choose one of your SDGs; immune to negatives this turn."},
  {title:"Back to Square One",type:"reset",description:"Reset any non-GOAL SDG progress to zero."},
  {title:"International Sanctions",type:"sanction",description:"Target player cannot play or discard next Action Phase."},
  {title:"Capacity Building",type:"capacity",description:"Draw one extra in Draw Phase; discard one of those drawn."},
  {title:"Stance Reversal",type:"reverse",description:"Flip the sign of any SDG's progress (+2 -> -2, -1 -> +1)."},
  {title:"Lessons from History",type:"history",description:"Look at top 5 discard cards; take 1, return rest in order."},
  {title:"MOU",type:"tradeHand",description:"Swap one chosen hand card with another player."},
  {title:"Goal Realignment",type:"swapSDG",description:"Swap one SDG each with another player; progress kept."}
];

/* ========== STATE ========== */
var state = {
  mode: "local", isGameOver: false, timers: [], inputLocked: false,
  players: [], currentPlayer: 0, phase: "action",
  deck: [], discard: [], unusedSDGs: [],
  selectedCards: [], modeAction: null, maxPlay: 2,
  capacityActive: false, isAIThinking: false,
  draftCounts: {}, draftCurrentPlayer: 0, draftSelected: [],
  previewDeltas: {},
  cardNextResolver: null
};

function trackTimeout(fn, ms) {
  if (state.isGameOver) return null;
  var id = setTimeout(function() {
    state.timers = state.timers.filter(function(x) { return x !== id; });
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
function hideAINotice() { document.getElementById("ai-notice").classList.remove("show"); }

/* Manual Next card announcement (no auto timer) */
function showCardAnnouncement(playerName, card, options) {
  options = options || {};
  return new Promise(function(resolve) {
    if (state.isGameOver) { resolve(); return; }
    state.inputLocked = true;
    document.getElementById("announcePlayer").textContent = playerName + " " + t("played");
    document.getElementById("announceCardName").textContent = card.title;
    document.getElementById("announceSub").textContent = card.subtitle || (card.kind === "event" ? t("historyEvent") : t("specialCard"));
    document.getElementById("announceDesc").textContent = card.description || "";

    var effectsEl = document.getElementById("announceEffects");
    effectsEl.innerHTML = "";
    var affected = options.affectedSDGs || [];
    if (affected.length) {
      affected.forEach(function(a) {
        var tag = document.createElement("span");
        tag.className = "sticky-note " + (a.delta > 0 ? "up" : "down");
        tag.textContent = "SDG " + a.id + " " + (a.delta > 0 ? "+" : "") + a.delta;
        effectsEl.appendChild(tag);
      });
    } else if (card.kind === "event") {
      (card.forward || []).forEach(function(id) {
        var tag = document.createElement("span");
        tag.className = "sticky-note up";
        tag.textContent = "SDG " + id + " +1";
        effectsEl.appendChild(tag);
      });
      (card.backward || []).forEach(function(id) {
        var tag = document.createElement("span");
        tag.className = "sticky-note down";
        tag.textContent = "SDG " + id + " -1";
        effectsEl.appendChild(tag);
      });
    } else {
      var tag = document.createElement("span");
      tag.className = "sticky-note special";
      tag.textContent = t("special");
      effectsEl.appendChild(tag);
    }
    if (options.targetName) {
      var tn = document.createElement("span");
      tn.className = "sticky-note special";
      tn.textContent = "-> " + options.targetName;
      effectsEl.appendChild(tn);
    }

    var modal = document.getElementById("card-play-modal");
    modal.classList.add("show");
    state.cardNextResolver = function() {
      modal.classList.remove("show");
      state.inputLocked = false;
      state.cardNextResolver = null;
      resolve();
    };
  });
}
document.getElementById("btnCardNext").onclick = function() {
  if (state.cardNextResolver) state.cardNextResolver();
};

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
document.getElementById("startBtn").onclick = startDraft;

function startDraft() {
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
  state.draftCounts = {};
  for (var k = 1; k <= 17; k++) state.draftCounts[k] = 0;
  state.draftCurrentPlayer = 0;
  state.draftSelected = [];
  showScreen("draftScreen");
  renderDraft();
}

/* ========== DRAFT: same SDG may be picked by up to 2 players ========== */
function renderDraft() {
  if (state.isGameOver) return;
  var p = state.players[state.draftCurrentPlayer];
  document.getElementById("draftStatus").textContent = t("turnOf") + " " + p.name + (p.isAI ? " (Bot)" : "") + " - " + t("select2");
  document.getElementById("draftCount").textContent = t("selected") + " " + state.draftSelected.length + " / 2";
  var grid = document.getElementById("draftGrid");
  grid.innerHTML = "";
  for (var id = 1; id <= 17; id++) {
    var cnt = state.draftCounts[id] || 0;
    var full = cnt >= 2;
    var sel = state.draftSelected.indexOf(id) !== -1;
    var div = document.createElement("div");
    div.className = "sdg-pick" + (full && !sel ? " disabled" : "") + (sel ? " selected" : "");
    div.innerHTML = "<strong>SDG " + id + "</strong><br><span style=\"font-size:0.72rem;color:#8a7a6a;\">" + sdgName(id) + "</span>" +
      "<div class=\"pick-count\">" + (full ? t("max2") : cnt + " " + t("picks")) + "</div>";
    if (!full && !p.isAI) {
      (function(sid) { div.onclick = function() { toggleDraftSelect(sid); }; })(id);
    }
    grid.appendChild(div);
  }
  document.getElementById("draftPicks").textContent = state.players.map(function(pl) {
    return pl.name + ": " + (pl.sdgs.map(function(x){ return "SDG "+x.id; }).join(", ") || "-");
  }).join(" | ");
  document.getElementById("btnConfirmDraft").disabled = state.draftSelected.length !== 2 || p.isAI;
  if (p.isAI) {
    showAINotice("[" + p.name + "] " + t("aiDraft"));
    log("[" + p.name + "] " + t("aiDraft"), "ai");
    trackTimeout(function() { hideAINotice(); aiDraftPick(); }, 1000);
  }
}
function toggleDraftSelect(id) {
  var idx = state.draftSelected.indexOf(id);
  if (idx >= 0) state.draftSelected.splice(idx, 1);
  else if (state.draftSelected.length < 2 && (state.draftCounts[id] || 0) < 2) state.draftSelected.push(id);
  renderDraft();
}
document.getElementById("btnConfirmDraft").onclick = function() {
  if (state.draftSelected.length !== 2) return;
  confirmDraftPick(state.draftSelected.slice());
};
function confirmDraftPick(ids) {
  var p = state.players[state.draftCurrentPlayer];
  ids.forEach(function(id) {
    p.sdgs.push({ id: id, progress: 0, immune: false });
    state.draftCounts[id] = (state.draftCounts[id] || 0) + 1;
  });
  state.draftSelected = [];
  state.draftCurrentPlayer++;
  if (state.draftCurrentPlayer >= state.players.length) { startGame(); return; }
  renderDraft();
}
function aiDraftPick() {
  if (state.isGameOver) return;
  var p = state.players[state.draftCurrentPlayer];
  if (!p.isAI) return;
  var avail = [];
  for (var id = 1; id <= 17; id++) {
    if ((state.draftCounts[id] || 0) < 2) avail.push(id);
  }
  var picks;
  if (p.difficulty === "easy") picks = shuffle(avail.slice()).slice(0, 2);
  else picks = avail.slice().sort(function(a,b){ return Math.abs(a-9)-Math.abs(b-9); }).slice(0, 2);
  if (picks.length < 2) picks = shuffle(avail.slice()).slice(0, 2);
  state.draftSelected = picks;
  renderDraft();
  trackTimeout(function() { confirmDraftPick(picks); }, 400);
}

function startGame() {
  state.unusedSDGs = [];
  for (var id = 1; id <= 17; id++) {
    var left = 2 - (state.draftCounts[id] || 0);
    for (var n = 0; n < left; n++) state.unusedSDGs.push(id);
  }
  shuffle(state.unusedSDGs);
  state.deck = [];
  eventCards.forEach(function(c) {
    state.deck.push({
      title: c.title, subtitle: c.subtitle, description: c.description,
      forward: (c.forward || []).slice(), backward: (c.backward || []).slice(),
      kind: "event", id: Math.random().toString(36).slice(2)
    });
  });
  specialCards.forEach(function(c) {
    for (var i = 0; i < 2; i++) {
      state.deck.push({
        title: c.title, type: c.type, description: c.description,
        kind: "special", id: Math.random().toString(36).slice(2) + i
      });
    }
  });
  shuffle(state.deck);
  state.discard = [];
  state.players.forEach(function(p) {
    for (var i = 0; i < HAND_LIMIT; i++) {
      if (!state.deck.length) reshuffle();
      if (state.deck.length) p.hand.push(state.deck.pop());
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
  log(getCurrentPlayer().name + ": " + t("pleaseStart"), "sys");
  updateUI();
  maybeTriggerAI();
}
function reshuffle() {
  if (!state.discard.length) return;
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
          if (s.id === id && s.progress < GOAL) {
            if (!state.previewDeltas[pi]) state.previewDeltas[pi] = {};
            state.previewDeltas[pi][si] = (state.previewDeltas[pi][si] || 0) + 1;
          }
        });
      });
    });
    (card.backward || []).forEach(function(id) {
      state.players.forEach(function(pl, pi) {
        pl.sdgs.forEach(function(s, si) {
          if (s.id === id && s.progress < GOAL && !s.immune) {
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
  document.getElementById("handCount").textContent = "(" + p.hand.length + "/" + HAND_LIMIT + ")";
  var phaseText = t("actionPhase");
  if (state.isAIThinking) phaseText = t("botThinking");
  else if (state.phase === "flip") phaseText = t("flipPhase");
  else if (state.phase === "draw") phaseText = t("drawPhase");
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
  var range = GOAL + 2; // -2 to GOAL
  state.players.forEach(function(pl, idx) {
    var div = document.createElement("div");
    div.className = "player-card" + (idx === state.currentPlayer ? " current" : "") +
      (pl.sanctioned ? " sanctioned" : "") + (pl.isAI ? " ai-tag" : "");
    div.setAttribute("data-sanction", t("sanctioned"));
    var html = "<div class=\"player-name\">" + pl.name + (idx === state.currentPlayer ? " (current)" : "") +
      (pl.isAI ? " [" + pl.difficulty + "]" : "") + "</div>";
    pl.sdgs.forEach(function(s, si) {
      var cur = s.progress;
      var delta = (state.previewDeltas[idx] && state.previewDeltas[idx][si]) || 0;
      var preview = clamp(cur + delta, -2, GOAL);
      var pct = ((cur + 2) / range) * 100;
      var previewPct = ((preview + 2) / range) * 100;
      html += "<div class=\"sdg-row\"><div class=\"sdg-badge " + (cur >= GOAL ? "goal" : "") + "\">SDG " + s.id + "</div>" +
        "<div class=\"progress-bar\"><div class=\"progress-fill " + (cur < 0 ? "negative" : "") + "\" style=\"width:" + pct + "%\"></div>" +
        (delta !== 0 ? "<div class=\"progress-preview " + (delta < 0 ? "negative" : "") + "\" style=\"left:0;width:" + Math.max(pct, previewPct) + "%;\"></div>" : "") +
        "<div class=\"progress-text\">" + (cur >= GOAL ? t("goal") : cur) + (delta ? " -> " + preview : "") +
        (s.immune ? " [immune]" : "") + "</div></div></div>" +
        "<div class=\"progress-labels\"><span>-2</span><span>-1</span><span>0</span><span>1</span><span>GOAL</span></div>" +
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
      effect = "<div class=\"card-effect\">" + (card.description || "") + "</div>";
    }
    div.innerHTML = "<div class=\"card-header\">" + (card.kind === "event" ? t("historyEvent") : t("specialCard")) + "</div>" +
      "<div class=\"card-body\"><div class=\"card-name\">" + card.title + "</div>" + effect + "</div>";
    if (!p.isAI && !cannot && !state.inputLocked && !state.isGameOver) {
      (function(i) { div.onclick = function() { onCardClick(i); }; })(idx);
    }
    handEl.appendChild(div);
  });
}

/* ========== ACTIONS ========== */
document.getElementById("btnDiscardMode").onclick = function() {
  if (state.inputLocked || state.isGameOver) return;
  var p = getCurrentPlayer();
  if (p.sanctioned) { log(p.name + " " + t("sanctioned")); return; }
  state.modeAction = "discard"; state.selectedCards = []; updateUI();
};
document.getElementById("btnPlayMode").onclick = function() {
  if (state.inputLocked || state.isGameOver) return;
  var p = getCurrentPlayer();
  if (p.sanctioned) { log(p.name + " " + t("sanctioned")); return; }
  state.modeAction = "play";
  state.maxPlay = 2;
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
    log(p.name + " " + t("discarded") + ": " + c.title);
  });
  state.selectedCards = []; state.modeAction = null;
  endActionPhase();
}

async function executePlay() {
  var p = getCurrentPlayer();
  var sorted = state.selectedCards.slice().sort(function(a,b){return b-a;});
  var cards = [];
  sorted.forEach(function(i) { cards.unshift(p.hand.splice(i, 1)[0]); });
  state.selectedCards = []; state.modeAction = null;
  for (var ci = 0; ci < cards.length; ci++) {
    if (state.isGameOver) break;
    var card = cards[ci];
    if (card.kind === "special" && card.type !== "veto") {
      var vetoed = await askVeto(card, p);
      if (vetoed) {
        state.discard.push(card);
        continue;
      }
    }
    state.discard.push(card);
    var affected = [];
    if (card.kind === "event") {
      (card.forward || []).forEach(function(id) { affected.push({id:id, delta:1}); });
      (card.backward || []).forEach(function(id) { affected.push({id:id, delta:-1}); });
    }
    await showCardAnnouncement(p.name, card, { affectedSDGs: affected });
    log(p.name + " " + t("played") + ": " + card.title, card.kind === "event" ? "up" : "special");
    updateUI();
    await new Promise(function(r) { resolveCard(card, false, r); });
  }
  if (!state.isGameOver) endActionPhase();
}

function askVeto(card, caster) {
  return new Promise(function(resolve) {
    var holders = [];
    state.players.forEach(function(pl) {
      var idx = pl.hand.findIndex(function(c) { return c.type === "veto"; });
      if (idx >= 0 && !pl.isAI) holders.push({ pl: pl, idx: idx });
    });
    var autoVetoed = false;
    state.players.forEach(function(pl) {
      if (autoVetoed || !pl.isAI || pl.difficulty !== "advance") return;
      var idx = pl.hand.findIndex(function(c) { return c.type === "veto"; });
      if (idx >= 0 && pl !== caster && (card.type === "reset" || card.type === "sanction" || card.type === "reverse")) {
        pl.hand.splice(idx, 1);
        state.discard.push({ type: "veto", title: "Veto", kind: "special" });
        log(pl.name + " Veto!", "ai");
        autoVetoed = true;
        resolve(true);
      }
    });
    if (autoVetoed) return;
    if (!holders.length) { resolve(false); return; }
    var h = holders[0];
    showModal(t("useVeto"), "<p>" + h.pl.name + ": " + card.title + "</p>", [
      { label: t("yes"), class: "success", fn: function() {
        h.pl.hand.splice(h.idx, 1);
        state.discard.push({ type: "veto", title: "Veto", kind: "special" });
        log(h.pl.name + " Veto!", "special");
        resolve(true);
      }},
      { label: t("no"), class: "danger", fn: function() { resolve(false); }}
    ]);
  });
}

function endActionPhase() {
  if (state.isGameOver) return;
  state.modeAction = null; state.selectedCards = [];
  getCurrentPlayer().sdgs.forEach(function(s) { s.immune = false; });
  state.phase = "flip";
  doFlipPhase();
}

/* Flip phase: reveal top deck event; skip specials */
async function doFlipPhase() {
  if (state.isGameOver) return;
  updateUI();
  var tries = 0;
  while (tries < 20) {
    if (!state.deck.length) reshuffle();
    if (!state.deck.length) break;
    var card = state.deck.pop();
    if (card.kind === "special") {
      state.discard.push(card);
      tries++;
      continue;
    }
    var affected = [];
    (card.forward || []).forEach(function(id) { affected.push({id:id, delta:1}); });
    (card.backward || []).forEach(function(id) { affected.push({id:id, delta:-1}); });
    log(t("flipReveal") + ": " + card.title, "sys");
    await showCardAnnouncement("Deck", card, { affectedSDGs: affected });
    await new Promise(function(r) { resolveEvent(card, false, r); });
    break;
  }
  state.phase = "draw";
  doDrawPhase();
}

function doDrawPhase() {
  if (state.isGameOver) return;
  var p = getCurrentPlayer();
  var need = HAND_LIMIT - p.hand.length;
  if (p.capacityNext) { need += 1; p.capacityNext = false; state.capacityActive = true; }
  var drawn = [];
  for (var i = 0; i < need; i++) {
    if (!state.deck.length) reshuffle();
    if (!state.deck.length) break;
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
        return "<button data-i=\"" + i + "\">" + c.title + "</button>";
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
  if (p.sanctioned) {
    log(p.name + " " + t("sanctioned"), "ai");
    endActionPhase();
    return;
  }
  state.isAIThinking = true;
  updateUI();
  showAINotice("[" + p.name + "] " + t("aiPlay"));
  log("[" + p.name + "] " + t("aiPlay"), "ai");
  await delay(1000);
  hideAINotice();
  if (state.isGameOver) return;

  var playable = [];
  p.hand.forEach(function(c, i) { if (c.type !== "veto") playable.push(i); });
  if (playable.length && Math.random() > 0.25) {
    var n = Math.min(playable.length, 2);
    shuffle(playable);
    var idxs = playable.slice(0, n);
    var cards = [];
    idxs.sort(function(a,b){return b-a;}).forEach(function(i) { cards.unshift(p.hand.splice(i, 1)[0]); });
    for (var ci = 0; ci < cards.length; ci++) {
      if (state.isGameOver) break;
      var card = cards[ci];
      if (card.kind === "special" && card.type !== "veto") {
        var vetoed = await askVeto(card, p);
        if (vetoed) { state.discard.push(card); continue; }
      }
      state.discard.push(card);
      var affected = [];
      if (card.kind === "event") {
        (card.forward || []).forEach(function(id) { affected.push({id:id, delta:1}); });
        (card.backward || []).forEach(function(id) { affected.push({id:id, delta:-1}); });
      }
      await showCardAnnouncement(p.name, card, { affectedSDGs: affected });
      log(p.name + " " + t("played") + ": " + card.title, "ai");
      await new Promise(function(r) { resolveCard(card, true, r); });
    }
  } else {
    var n2 = Math.min(2, p.hand.length);
    for (var j = 0; j < n2; j++) {
      var c = p.hand.pop();
      state.discard.push(c);
      log(p.name + " " + t("discarded") + ": " + c.title, "ai");
    }
  }
  state.isAIThinking = false;
  if (!state.isGameOver) endActionPhase();
}

/* ========== RESOLVE ========== */
function isValidNeg(s) { return s.progress < GOAL && !s.immune; }

function resolveCard(card, isAI, done) {
  if (state.isGameOver) { done(); return; }
  if (card.kind === "event") resolveEvent(card, isAI, done);
  else resolveSpecial(card, isAI, done);
}

function resolveEvent(card, isAI, done) {
  (card.forward || []).forEach(function(id) {
    state.players.forEach(function(pl) {
      pl.sdgs.forEach(function(s) {
        if (s.id === id && s.progress < GOAL) {
          s.progress = clamp(s.progress + 1, -2, GOAL);
          log(pl.name + " SDG " + id + " -> " + s.progress, "up");
        }
      });
    });
  });
  if (!card.backward || !card.backward.length) { done(); return; }
  state.players.forEach(function(pl) {
    pl.sdgs.forEach(function(s) {
      if (card.backward.indexOf(s.id) !== -1 && isValidNeg(s)) {
        s.progress = clamp(s.progress - 1, -2, GOAL);
        log(pl.name + " SDG " + s.id + " -> " + s.progress, "down");
      }
    });
  });
  done();
}

function resolveSpecial(card, isAI, done) {
  var p = getCurrentPlayer();

  if (card.type === "capacity") {
    p.capacityNext = true;
    log(p.name + " Capacity", "special");
    done(); return;
  }

  if (card.type === "immunity") {
    if (isAI) {
      p.sdgs[0].immune = true;
      log(p.name + " Immunity", "ai");
      done();
    } else {
      pickSDG(p, t("selectOwnSDG"), function(si) {
        p.sdgs[si].immune = true;
        log(p.name + " SDG " + p.sdgs[si].id + " immune", "special");
        done();
      });
    }
    return;
  }

  if (card.type === "reset") {
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var best = null;
        state.players.forEach(function(pl) {
          if (pl === p) return;
          pl.sdgs.forEach(function(s) {
            if (s.progress > 0 && s.progress < GOAL && (!best || s.progress > best.s.progress))
              best = { pl: pl, s: s };
          });
        });
        if (best) {
          best.s.progress = 0;
          log("[" + p.name + "] -> [" + best.pl.name + "] " + t("resetCard") + " SDG " + best.s.id, "special");
        } else log(t("noValid"));
        done();
      }, 1000);
    } else {
      pickAnySDG(t("resetCard"), function(pl, si) {
        if (pl.sdgs[si].progress >= GOAL) { log(t("noValid")); done(); return; }
        pl.sdgs[si].progress = 0;
        log("[" + p.name + "] -> [" + pl.name + "] " + t("resetCard") + " SDG " + pl.sdgs[si].id, "special");
        done();
      });
    }
    return;
  }

  if (card.type === "reverse") {
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var best = null;
        state.players.forEach(function(pl) {
          if (pl === p) return;
          pl.sdgs.forEach(function(s) {
            if (s.progress > 0 && s.progress < GOAL && (!best || s.progress > best.s.progress))
              best = { pl: pl, s: s };
          });
        });
        if (best) {
          best.s.progress = clamp(-best.s.progress, -2, GOAL);
          log("[" + p.name + "] -> [" + best.pl.name + "] " + t("reverseCard") + " SDG " + best.s.id, "special");
        } else log(t("noValid"));
        done();
      }, 1000);
    } else {
      pickAnySDG(t("reverseCard"), function(pl, si) {
        if (pl.sdgs[si].progress >= GOAL) { log(t("noValid")); done(); return; }
        pl.sdgs[si].progress = clamp(-pl.sdgs[si].progress, -2, GOAL);
        log("[" + p.name + "] -> [" + pl.name + "] " + t("reverseCard") + " SDG " + pl.sdgs[si].id + " -> " + pl.sdgs[si].progress, "special");
        done();
      });
    }
    return;
  }

  if (card.type === "sanction") {
    var opps = state.players.filter(function(pl) { return pl !== p; });
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var bestP = null, max = -99;
        opps.forEach(function(pl) {
          var tot = pl.sdgs.reduce(function(a,s){ return a + s.progress; }, 0);
          if (tot > max) { max = tot; bestP = pl; }
        });
        if (bestP) { bestP.sanctioned = true; log("[" + p.name + "] -> [" + bestP.name + "] Sanction", "special"); }
        done();
      }, 1000);
    } else {
      pickPlayer(opps, t("selectTarget"), function(target) {
        target.sanctioned = true;
        log("[" + p.name + "] -> [" + target.name + "] Sanction", "special");
        done();
      });
    }
    return;
  }

  if (card.type === "history") {
    var top = state.discard.slice(-5);
    if (!top.length) { log(t("noValid")); done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var c = state.discard.pop();
        p.hand.push(c);
        log(p.name + " History: " + c.title, "special");
        done();
      }, 1000);
    } else {
      var body = "<div class=\"modal-list\">" + top.map(function(c, i) {
        var realIdx = state.discard.length - top.length + i;
        return "<button data-i=\"" + realIdx + "\">" + c.title + "</button>";
      }).join("") + "</div>";
      showModal(t("selectFromDiscard"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var i = parseInt(btn.getAttribute("data-i"), 10);
            var c = state.discard.splice(i, 1)[0];
            p.hand.push(c);
            log(p.name + " History: " + c.title, "special");
            hideModal();
            done();
          };
        });
      }, 30);
    }
    return;
  }

  if (card.type === "sustain") {
    if (!state.unusedSDGs.length) { log(t("noValid")); done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var newId = state.unusedSDGs.pop();
        var old = p.sdgs[0];
        state.unusedSDGs.push(old.id);
        p.sdgs[0] = { id: newId, progress: old.progress, immune: false };
        log(p.name + " Transition -> SDG " + newId, "special");
        done();
      }, 1000);
    } else {
      pickSDG(p, t("selectSDGSwap"), function(si) {
        var old = p.sdgs[si];
        var newId = state.unusedSDGs.pop();
        state.unusedSDGs.push(old.id);
        p.sdgs[si] = { id: newId, progress: old.progress, immune: false };
        log(p.name + " Transition -> SDG " + newId, "special");
        done();
      });
    }
    return;
  }

  if (card.type === "tradeHand") {
    var opps3 = state.players.filter(function(pl) { return pl !== p && pl.hand.length; });
    if (!opps3.length || !p.hand.length) { log(t("noValid")); done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var target = randChoice(opps3);
        var myC = p.hand.pop(), tC = target.hand.pop();
        p.hand.push(tC); target.hand.push(myC);
        log("[" + p.name + "] -> [" + target.name + "] MOU", "special");
        done();
      }, 1000);
    } else {
      pickPlayer(opps3, t("selectTarget"), function(target) {
        pickHandCard(p, t("selectOwnCard"), function(mi) {
          pickHandCard(target, t("selectTheirCard"), function(ti) {
            var myC = p.hand.splice(mi, 1)[0];
            var tC = target.hand.splice(ti, 1)[0];
            p.hand.push(tC); target.hand.push(myC);
            log("[" + p.name + "] -> [" + target.name + "] MOU", "special");
            done();
          });
        });
      });
    }
    return;
  }

  if (card.type === "swapSDG") {
    var opps2 = state.players.filter(function(pl) { return pl !== p; });
    if (!opps2.length) { done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        var target = randChoice(opps2);
        var tmp = p.sdgs[0];
        p.sdgs[0] = target.sdgs[0];
        target.sdgs[0] = tmp;
        log("[" + p.name + "] -> [" + target.name + "] Goal Realignment", "special");
        done();
      }, 1000);
    } else {
      pickPlayer(opps2, t("selectTarget"), function(target) {
        pickSDG(p, t("selectOwnSDG"), function(mi) {
          pickSDG(target, t("selectTheirSDG"), function(ti) {
            var tmp = p.sdgs[mi];
            p.sdgs[mi] = target.sdgs[ti];
            target.sdgs[ti] = tmp;
            log("[" + p.name + "] -> [" + target.name + "] Goal Realignment", "special");
            done();
          });
        });
      });
    }
    return;
  }

  log(card.title + " OK", "special");
  done();
}

/* Selection helpers */
function pickPlayer(list, title, cb) {
  var body = "<div class=\"modal-list\">" + list.map(function(pl) {
    return "<button data-i=\"" + state.players.indexOf(pl) + "\">" + pl.name + "</button>";
  }).join("") + "</div>";
  showModal(title, body, []);
  setTimeout(function() {
    document.querySelectorAll("#modalBody button").forEach(function(btn) {
      btn.onclick = function() {
        var i = parseInt(btn.getAttribute("data-i"), 10);
        hideModal();
        cb(state.players[i]);
      };
    });
  }, 30);
}
function pickSDG(player, title, cb) {
  var body = "<div class=\"modal-list\">" + player.sdgs.map(function(s, i) {
    return "<button data-i=\"" + i + "\">SDG " + s.id + " (" + s.progress + ")</button>";
  }).join("") + "</div>";
  showModal(title, body, []);
  setTimeout(function() {
    document.querySelectorAll("#modalBody button").forEach(function(btn) {
      btn.onclick = function() {
        var i = parseInt(btn.getAttribute("data-i"), 10);
        hideModal();
        cb(i);
      };
    });
  }, 30);
}
function pickAnySDG(title, cb) {
  var body = "<div class=\"modal-list\">";
  state.players.forEach(function(pl, pi) {
    pl.sdgs.forEach(function(s, si) {
      if (s.progress >= GOAL) return;
      body += "<button data-p=\"" + pi + "\" data-s=\"" + si + "\">" + pl.name + " SDG " + s.id + " (" + s.progress + ")</button>";
    });
  });
  body += "</div>";
  showModal(title, body, []);
  setTimeout(function() {
    document.querySelectorAll("#modalBody button").forEach(function(btn) {
      btn.onclick = function() {
        var pi = parseInt(btn.getAttribute("data-p"), 10);
        var si = parseInt(btn.getAttribute("data-s"), 10);
        hideModal();
        cb(state.players[pi], si);
      };
    });
  }, 30);
}
function pickHandCard(player, title, cb) {
  var body = "<div class=\"modal-list\">" + player.hand.map(function(c, i) {
    return "<button data-i=\"" + i + "\">" + c.title + "</button>";
  }).join("") + "</div>";
  showModal(title, body, []);
  setTimeout(function() {
    document.querySelectorAll("#modalBody button").forEach(function(btn) {
      btn.onclick = function() {
        var i = parseInt(btn.getAttribute("data-i"), 10);
        hideModal();
        cb(i);
      };
    });
  }, 30);
}

function checkWin() {
  for (var i = 0; i < state.players.length; i++) {
    var pl = state.players[i];
    if (pl.sdgs.every(function(s) { return s.progress >= GOAL; })) {
      state.isGameOver = true;
      clearAllTimers();
      state.isAIThinking = false;
      state.inputLocked = true;
      hideAINotice();
      showScreen("winScreen");
      document.getElementById("winnerText").textContent = pl.name + " completes both SDG goals!";
      log(pl.name + " WINS!", "win");
      return;
    }
  }
}

/* init */
applyI18n();
