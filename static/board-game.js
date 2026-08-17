/* ========== CONSTANTS ========== */
var GOAL = 3; // track runs -2..GOAL
var HAND_LIMIT = 5;

/* ========== i18n ========== */
var translations = {
  zh: {
    title: "The Green Cabinet", chooseMode: "選擇遊戲模式",
    pvc: "單機／機器人模式 (PvC)", pvp: "多人對戰模式 (PvP)",
    pvpTitle: "多人對戰", localPlay: "同一裝置 (Local)", onlinePlay: "線上房間",
    back: "返回", setup: "遊戲設定", playerCount: "玩家人數", enterDraft: "進入 SDG 選牌",
    draftTitle: "SDG 目標選牌", confirmSDG: "確認選擇 SDG",
    discardMode: "棄牌模式", playMode: "出牌", cancel: "取消選擇",
    deck: "牌堆", discard: "棄牌堆", hand: "目前手牌", confirmAction: "確認執行",
    log: "遊戲紀錄", victory: "勝利！", playAgain: "再玩一次",
    human: "人類玩家", easyBot: "新手機器人", basicBot: "一般機器人", advanceBot: "進階機器人",
    player: "玩家", turnOf: "輪到：", select2: "選擇 2 張 SDG", selected: "已選",
    actionPhase: "行動階段", flipPhase: "翻牌階段", drawPhase: "抽牌階段",
    botThinking: "機器人思考中...", discardPhase: "棄牌模式：選好後請確認",
    playPhase: "出牌模式（最多", cards: "張）",
    gameStart: "SDG 選牌完成，遊戲開始！", pleaseStart: "請開始行動。",
    reshuffle: "牌堆已用盡，重新洗牌。", discarded: "棄掉了", played: "打出了",
    forward: "前進", backward: "後退", special: "特殊效果",
    historyEvent: "歷史事件", specialCard: "特殊功能", sanctioned: "制裁中", goal: "達標",
    selectTarget: "選擇目標玩家", selectOwnSDG: "選擇自己的 SDG",
    selectFromDiscard: "從棄牌堆選一張",
    selectSDGSwap: "選擇要交換的 SDG", noValid: "沒有符合條件的目標",
    useVeto: "是否使用否決權？", yes: "使用", no: "不使用",
    capacityChoose: "能力建構：請選擇棄置一張",
    aiDraft: "正在思考要選哪 2 張 SDG...", aiPlay: "正在決定出牌...",
    aiTarget: "正在選擇目標...", next: "下一步", onlineSoon: "線上模式即將推出，目前請先使用本地模式。",
    max2: "已滿（2人）", picks: "人已選", flipReveal: "翻牌",
    resetCard: "捲土重來", reverseCard: "立場反轉",
    revealHeading: "翻牌階段 · 從抽牌堆頂端翻開", revealNote: "此牌不屬於任何玩家，效果對所有人生效",
    sanctionSkip: "受國際制裁，本回合行動階段無法出牌也無法棄牌", immuneBlocked: "受政策豁免保護，不受影響",
    winSuffix: " 達成兩項 SDG 目標，獲得勝利！", winLog: "獲勝！"
  },
  en: {
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
    selectTarget: "Select target player", selectOwnSDG: "Select your SDG",
    selectFromDiscard: "Pick from discard",
    selectSDGSwap: "Select SDG to swap", noValid: "No valid targets",
    useVeto: "Use Veto?", yes: "Yes", no: "No",
    capacityChoose: "Capacity: choose one to discard",
    aiDraft: "is choosing 2 SDG goals...", aiPlay: "is deciding plays...",
    aiTarget: "is selecting targets...", next: "Next", onlineSoon: "Online mode coming soon.",
    max2: "Full (2)", picks: "picked", flipReveal: "revealed",
    resetCard: "Back to Square One", reverseCard: "Stance Reversal",
    revealHeading: "Reveal Phase · flipped from the top of the deck", revealNote: "Nobody played this — it applies to every player",
    sanctionSkip: "is sanctioned: no cards may be played or discarded this Action Phase", immuneBlocked: "is exempt and unaffected",
    winSuffix: " completes both SDG goals!", winLog: "WINS!"
  }
};

var SDG_NAMES = {
  zh: {1:"消除貧窮",2:"消除飢餓",3:"健康與福祉",4:"優質教育",5:"性別平等",6:"淨水與衛生",7:"可負擔的潔淨能源",8:"尊嚴就業與經濟發展",9:"產業創新與基礎建設",10:"減少不平等",11:"永續城市與社區",12:"責任消費與生產",13:"氣候行動",14:"保育海洋生態",15:"保育陸域生態",16:"和平正義與健全制度",17:"多元夥伴關係"},
  en: {1:"No Poverty",2:"Zero Hunger",3:"Good Health",4:"Quality Education",5:"Gender Equality",6:"Clean Water",7:"Affordable Energy",8:"Decent Work",9:"Industry Innovation",10:"Reduced Inequalities",11:"Sustainable Cities",12:"Responsible Consumption",13:"Climate Action",14:"Life Below Water",15:"Life on Land",16:"Peace & Justice",17:"Partnerships"}
};

var currentLang = localStorage.getItem("tgc_lang") || "zh";
function t(key) { return (translations[currentLang] && translations[currentLang][key]) || translations.zh[key] || key; }
function sdgName(id) { return (SDG_NAMES[currentLang] && SDG_NAMES[currentLang][id]) || id; }
function cardTitle(c) { return currentLang === "en" ? (c.title_en || c.title_zh) : (c.title_zh || c.title_en); }
function cardSub(c) { return currentLang === "en" ? (c.subtitle_en || "") : (c.subtitle_zh || ""); }
function cardDesc(c) { return currentLang === "en" ? (c.description_en || c.description_zh || "") : (c.description_zh || c.description_en || ""); }

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    var key = el.getAttribute("data-i18n");
    if (translations[currentLang][key]) el.textContent = translations[currentLang][key];
  });
  document.getElementById("langSelect").value = currentLang;
  if (document.getElementById("gameScreen").classList.contains("active")) updateUI();
  if (document.getElementById("draftScreen").classList.contains("active")) renderDraft();
  if (document.getElementById("setupScreen").classList.contains("active"))
    renderNameInputs(state.mode === "pvp-local" ? "pvp" : "pvc");
}
document.getElementById("langSelect").onchange = function() {
  currentLang = this.value;
  localStorage.setItem("tgc_lang", currentLang);
  applyI18n();
};

/* ========== CARD DATABASE ========== */
var eventCards = [
  {
    title_zh:"金融海嘯", title_en:"Financial Crisis",
    subtitle_zh:"西元2008年", subtitle_en:"2008 CE",
    description_zh:"美國次級房貸市場崩盤，雷曼兄弟宣告破產，骨牌效應迅速蔓延全球，堪稱二戰後最嚴重的全球經濟危機之一。",
    description_en:"The U.S. subprime mortgage market collapsed, Lehman Brothers filed for bankruptcy, and the shockwaves rippled across the globe. Widely considered one of the worst economic crises since WWII.",
    forward:[], backward:[1, 8],
    notes:{1:{zh:"存款蒸發，一夜變月光族 QQ",en:"Savings gone overnight, hello paycheck-to-paycheck"},8:{zh:"失業潮爆發，經濟成長直接躺平",en:"Layoffs everywhere, growth just face-planted"}}
  },
  {
    title_zh:"莫拉克颱風", title_en:"Typhoon Morakot",
    subtitle_zh:"西元2009年", subtitle_en:"2009 CE",
    description_zh:"帶來破紀錄豪雨，重創南台灣，小林村遭土石流滅村，多處聚落基礎建設全毀。",
    description_en:"Record-breaking rainfall devastated southern Taiwan, wiping out Xiaolin Village in a landslide and destroying infrastructure across communities.",
    forward:[], backward:[11],
    notes:{11:{zh:"家園一夕全毀，重建路超漫長",en:"Whole villages gone overnight, rebuilding's a long road"}}
  },
  {
    title_zh:"焚書坑儒", title_en:"The Burning of Books and Burying of Scholars",
    subtitle_zh:"西元前213年", subtitle_en:"213 BCE",
    description_zh:"秦始皇下令焚燒諸子百家典籍，並坑殺方士儒生，箝制思想與學術傳承。",
    description_en:"Qin Shi Huang ordered classical texts burned and Confucian scholars buried alive, crushing free thought and scholarship.",
    forward:[], backward:[4],
    notes:{4:{zh:"知識直接被查封，讀書人瑟瑟發抖",en:"Knowledge got straight-up banned, scholars shaking"}}
  },
  {
    title_zh:"開普敦Day Zero", title_en:"Cape Town Day Zero",
    subtitle_zh:"西元2018年", subtitle_en:"2018 CE",
    description_zh:"南非開普敦遭遇嚴重乾旱，水庫存量逼近枯竭，全市面臨關閉自來水供應的危機。",
    description_en:"Cape Town, South Africa faced severe drought as reservoirs nearly ran dry, threatening a city-wide water shutoff.",
    forward:[], backward:[6],
    notes:{6:{zh:"水龍頭快要關到底，全城搶水",en:"Taps almost ran dry, city-wide water panic"}}
  },
  {
    title_zh:"烏俄戰爭", title_en:"Russo-Ukrainian War",
    subtitle_zh:"西元2014年至今", subtitle_en:"2014 CE - present",
    description_zh:"俄羅斯與烏克蘭爆發武裝衝突，戰火摧毀基礎建設，糧食與能源供應鏈受到重創。",
    description_en:"Armed conflict between Russia and Ukraine destroyed infrastructure and disrupted global food and energy supply chains.",
    forward:[], backward:[2, 17],
    notes:{2:{zh:"烏克蘭是糧倉，戰火一燒全球糧價跟著抖",en:"Ukraine's the world's breadbasket, war sent grain prices soaring"},17:{zh:"國際合作被迫重新洗牌，制裁與結盟滿天飛",en:"International alliances got reshuffled overnight, sanctions everywhere"}}
  },
  {
    title_zh:"東非飢荒", title_en:"East African Famine",
    subtitle_zh:"長期反覆發生（以2011年最嚴重）", subtitle_en:"Recurring (worst in 2011)",
    description_zh:"乾旱與衝突交織，東非多國反覆陷入嚴重飢荒，糧食安全長期告急。",
    description_en:"Drought and conflict repeatedly pushed East African nations into severe famine, with food security in constant crisis.",
    forward:[17], backward:[1, 2],
    notes:{1:{zh:"貧窮線一再被戰亂跟乾旱往下拖",en:"Poverty deepened as war and drought kept hitting the same region"},2:{zh:"糧食短缺常態化，孩子吃不飽",en:"Chronic food shortages, kids going hungry"},17:{zh:"國際援助湧入，多方一起撐住局面",en:"International aid stepped up to help hold the line"}}
  },
  {
    title_zh:"阿富汗限制女性受教育", title_en:"Afghanistan Restricts Girls' Education",
    subtitle_zh:"西元2021年", subtitle_en:"2021 CE",
    description_zh:"塔利班重掌政權後禁止女性接受中學以上教育，女性受教權大幅倒退。",
    description_en:"After the Taliban retook power, girls were banned from secondary and higher education, sharply reversing progress on women's education.",
    forward:[], backward:[4, 5, 10],
    notes:{4:{zh:"教室的門直接對女生關上",en:"Classroom doors slammed shut for girls"},5:{zh:"性別平等瞬間開倒車",en:"Gender equality took a massive step backward"},10:{zh:"半數人口被排除在社會之外",en:"Half the population locked out of society"}}
  },
  {
    title_zh:"香港食水含鉛事件", title_en:"Hong Kong Lead-in-Water Scandal",
    subtitle_zh:"西元2015年", subtitle_en:"2015 CE",
    description_zh:"香港部分公共屋邨食水被驗出含鉛量超標，居民健康受威脅。",
    description_en:"Excessive lead levels were found in tap water at several Hong Kong public housing estates, threatening residents' health.",
    forward:[], backward:[3, 6, 11],
    notes:{3:{zh:"SDG3：喝口水都要提心吊膽",en:"Even drinking water became a health scare"},6:{zh:"乾淨用水品質亮紅燈",en:"Clean water quality failed the test"},11:{zh:"社區住宅安全信任感崩盤",en:"Trust in community housing safety took a hit"}}
  },
  {
    title_zh:"石油危機", title_en:"Oil Crisis",
    subtitle_zh:"西元1973年", subtitle_en:"1973 CE",
    description_zh:"中東產油國禁運石油，全球油價暴漲，各國經濟陷入衰退。",
    description_en:"Middle Eastern oil producers imposed an embargo, oil prices soared, and economies worldwide slid into recession.",
    forward:[7], backward:[9],
    notes:{7:{zh:"各國被迫發展替代能源，加速能源轉型",en:"Countries scrambled to develop alternative energy, speeding up the energy transition"},9:{zh:"工業生產全面卡關，供應鏈大亂",en:"Industrial production ground to a halt, supply chains in chaos"}}
  },
  {
    title_zh:"COVID-19封城", title_en:"COVID-19 Lockdowns",
    subtitle_zh:"西元2020年", subtitle_en:"2020 CE",
    description_zh:"新冠疫情爆發，各國實施封鎖措施，經濟活動大幅停擺。",
    description_en:"COVID-19 spread globally, prompting nationwide lockdowns that brought economic activity to a standstill.",
    forward:[3], backward:[8, 17],
    notes:{3:{zh:"病毒傳播被壓下來，救了不少命",en:"Virus spread got contained, saving countless lives"},8:{zh:"店都關了，打工人沒班可上",en:"Shops shut down, workers left without jobs"},17:{zh:"各國防疫各自為政，合作與摩擦並存",en:"Countries went their own way on pandemic response, mixing cooperation and friction"}}
  },
  {
    title_zh:"福島核災", title_en:"Fukushima Nuclear Disaster",
    subtitle_zh:"西元2011年", subtitle_en:"2011 CE",
    description_zh:"東日本大地震引發海嘯，重創福島核電廠，造成輻射外洩。",
    description_en:"The Tohoku earthquake and tsunami crippled the Fukushima nuclear plant, causing a radiation leak.",
    forward:[], backward:[3, 7, 14],
    notes:{3:{zh:"輻射外洩，居民健康風險飆升",en:"Radiation leak sent health risks soaring"},7:{zh:"核能安全信任度重挫",en:"Public trust in nuclear energy took a hit"},14:{zh:"含輻射廢水排放，海洋生態遭殃",en:"Radioactive wastewater release harmed marine ecosystems"}}
  },
  {
    title_zh:"種族隔離制度", title_en:"Apartheid",
    subtitle_zh:"西元1948年至1994年（南非）", subtitle_en:"1948 CE - 1994 CE (South Africa)",
    description_zh:"南非政府依種族實施隔離與差別待遇，長期剝奪黑人基本權利。",
    description_en:"South Africa's government enforced racial segregation and discrimination, systematically denying Black citizens basic rights.",
    forward:[], backward:[4, 10, 16],
    notes:{4:{zh:"有色人種被排除在優質教育之外",en:"Non-white citizens shut out of quality education"},10:{zh:"制度性不平等寫進法律裡",en:"Inequality literally written into law"},16:{zh:"公義與人權形同虛設",en:"Justice and human rights existed only on paper"}}
  },
  {
    title_zh:"快時尚盛行", title_en:"Rise of Fast Fashion",
    subtitle_zh:"約2000年代至今", subtitle_en:"Roughly 2000s - present",
    description_zh:"平價快速時尚崛起，服飾快速生產與淘汰成為主流消費模式。",
    description_en:"Fast fashion took off, with cheap, rapidly produced and discarded clothing becoming the dominant consumption model.",
    forward:[], backward:[12, 13],
    notes:{12:{zh:"衣服穿沒幾次就丟，浪費爆表",en:"Clothes tossed after a few wears, waste through the roof"},13:{zh:"紡織業碳排放居高不下",en:"Textile industry emissions stay sky-high"}}
  },
  {
    title_zh:"澳洲森林大火", title_en:"Australian Bushfires",
    subtitle_zh:"西元2019年至2020年", subtitle_en:"2019 CE - 2020 CE",
    description_zh:"澳洲遭遇史上最嚴重森林大火，燒毀大片林地，無數野生動物喪生。",
    description_en:"Australia suffered its worst wildfire season on record, burning vast forests and killing countless wildlife.",
    forward:[], backward:[13, 15],
    notes:{13:{zh:"極端氣候加乾旱，火勢一發不可收拾",en:"Extreme heat and drought fueled fires that spiraled out of control"},15:{zh:"棲地大面積燒毀，物種瀕臨滅絕",en:"Habitats destroyed on a massive scale, species pushed toward extinction"}}
  },
  {
    title_zh:"墨西哥灣漏油事故", title_en:"Deepwater Horizon Oil Spill",
    subtitle_zh:"西元2010年", subtitle_en:"2010 CE",
    description_zh:"深水地平線鑽油平台爆炸，大量原油外洩污染墨西哥灣。",
    description_en:"The Deepwater Horizon oil rig exploded, spilling massive amounts of crude oil into the Gulf of Mexico.",
    forward:[], backward:[6, 14],
    notes:{6:{zh:"沿岸水質嚴重污染",en:"Coastal water quality took a severe hit"},14:{zh:"海洋生態遭原油重創",en:"Marine ecosystems devastated by the oil spill"}}
  },
  {
    title_zh:"山老鼠盛行", title_en:"Illegal Logging (\"Mountain Rats\")",
    subtitle_zh:"長期存在，當代持續中", subtitle_en:"Ongoing, present-day (Taiwan)",
    description_zh:"台灣山區長期存在盜伐珍貴林木的非法行為，破壞山林生態。",
    description_en:"Illegal logging of valuable timber has long persisted in Taiwan's mountains, damaging forest ecosystems.",
    forward:[], backward:[12, 15],
    notes:{12:{zh:"珍貴木材被非法盜採販售",en:"Precious timber illegally cut and sold"},15:{zh:"森林生態系統遭嚴重破壞",en:"Forest ecosystems seriously damaged"}}
  },
  {
    title_zh:"黑死病", title_en:"The Black Death",
    subtitle_zh:"14世紀（約1347年至1351年）", subtitle_en:"14th century (c. 1347-1351)",
    description_zh:"鼠疫在歐亞大陸大流行，造成數千萬人死亡，社會結構受到重創。",
    description_en:"The Black Death plague swept across Eurasia, killing tens of millions and devastating social structures.",
    forward:[], backward:[1],
    notes:{1:{zh:"勞動力銳減，經濟與生計全面崩壞",en:"Labor force collapsed, livelihoods and economies fell apart"}}
  },
  {
    title_zh:"冷戰", title_en:"The Cold War",
    subtitle_zh:"西元1947年至1991年", subtitle_en:"1947 CE - 1991 CE",
    description_zh:"美蘇兩大陣營長期對峙，軍備競賽與代理人戰爭牽動全球局勢。",
    description_en:"The US and USSR engaged in prolonged rivalry, with an arms race and proxy wars shaping global politics.",
    forward:[], backward:[9, 17],
    notes:{9:{zh:"軍備競賽拉高科技投入，但方向偏向軍事",en:"Arms race drove tech investment, but mostly toward weapons"},17:{zh:"世界分成兩大陣營，合作變得超級困難",en:"World split into two camps, cooperation got a lot harder"}}
  },
  {
    title_zh:"蘇伊士運河堵塞", title_en:"Suez Canal Blockage",
    subtitle_zh:"西元2021年", subtitle_en:"2021 CE",
    description_zh:"貨櫃輪長賜號擱淺堵住蘇伊士運河，全球海運供應鏈大打結。",
    description_en:"The container ship Ever Given ran aground and blocked the Suez Canal, snarling global shipping supply chains.",
    forward:[], backward:[8, 9, 17],
    notes:{8:{zh:"全球貿易停擺，損失以天計算",en:"Global trade ground to a halt, losses piled up by the day"},9:{zh:"供應鏈基礎設施瞬間卡死",en:"Supply chain infrastructure got jammed overnight"},17:{zh:"各國緊急協調搶通航道",en:"Countries scrambled to coordinate and clear the channel"}}
  },
  {
    title_zh:"裹小腳", title_en:"Foot Binding",
    subtitle_zh:"約10世紀至20世紀初（中國）", subtitle_en:"c. 10th century - early 20th century (China)",
    description_zh:"中國古代盛行纏足習俗，女性自幼被迫束腳變形以符合審美標準。",
    description_en:"Foot binding was a widespread custom in imperial China, forcing girls' feet into deformity to fit beauty standards.",
    forward:[], backward:[5, 16],
    notes:{5:{zh:"女性身體被迫服從畸形審美",en:"Women's bodies forced to conform to a painful ideal"},16:{zh:"陋習長期未受法律有效制止",en:"The practice went largely unchecked by law for centuries"}}
  },
  {
    title_zh:"榮譽殺人", title_en:"Honor Killing",
    subtitle_zh:"持續至今", subtitle_en:"Ongoing, present-day",
    description_zh:"部分地區以「維護家族名譽」為由，對違反傳統規範的女性施以暴力甚至殺害。",
    description_en:"In some regions, women who defy traditional norms are subjected to violence or killed in the name of \"family honor.\"",
    forward:[], backward:[5, 16],
    notes:{5:{zh:"女性生命安全被家族「面子」凌駕",en:"Women's safety sacrificed for family \"honor\""},16:{zh:"私刑凌駕司法，暴力被默許",en:"Vigilante violence overrides justice, often going unpunished"}}
  },
  {
    title_zh:"大規模停電", title_en:"Large-Scale Blackouts",
    subtitle_zh:"", subtitle_en:"",
    description_zh:"電網因天災、設備老舊或超載等因素癱瘓，大範圍地區同時斷電。",
    description_en:"Power grids collapse due to disasters, aging infrastructure, or overload, cutting electricity across wide areas.",
    forward:[], backward:[7],
    notes:{7:{zh:"電力系統一夕癱瘓，全城陷入黑暗",en:"Power system goes down overnight, whole city goes dark"}}
  },
  {
    title_zh:"過度包裝文化", title_en:"Overpackaging Culture",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"商品為求精美與促銷，層層包裝造成大量不必要的資源浪費。",
    description_en:"Products are wrapped in excessive layers of packaging for aesthetics or promotion, wasting huge amounts of resources.",
    forward:[], backward:[12, 15],
    notes:{12:{zh:"一顆餅乾包三層，垃圾比商品還多",en:"One cookie, three layers of packaging, more trash than product"},15:{zh:"包裝原料多來自森林資源，過度消耗",en:"Packaging materials often drain forest resources"}}
  },
  {
    title_zh:"幽靈漁網", title_en:"Ghost Fishing Nets",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"廢棄或遺失的漁網持續漂流海中，纏繞並困死大量海洋生物。",
    description_en:"Abandoned or lost fishing nets drift through the ocean, entangling and killing large numbers of marine animals.",
    forward:[], backward:[12, 14],
    notes:{12:{zh:"漁具用完就丟，海洋變垃圾場",en:"Gear tossed and forgotten, ocean turned dumping ground"},14:{zh:"海龜海豚被纏死，慘不忍睹",en:"Turtles and dolphins entangled and killed"}}
  },
  {
    title_zh:"獵巫運動", title_en:"Witch Trials",
    subtitle_zh:"15世紀至17世紀（歐洲）", subtitle_en:"15th century - 17th century (Europe)",
    description_zh:"歐洲曾大規模迫害「女巫」，數萬名女性遭指控並處死。",
    description_en:"Europe saw widespread persecution of accused \"witches,\" with tens of thousands of women tried and executed.",
    forward:[], backward:[5],
    notes:{5:{zh:"女性因偏見與恐懼被大量迫害處死",en:"Women mass-persecuted and executed out of fear and prejudice"}}
  },
  {
    title_zh:"同性婚姻法通過", title_en:"Same-Sex Marriage Legalization",
    subtitle_zh:"多國陸續完成立法（首例：2001年荷蘭）", subtitle_en:"Countries legalized progressively (first: Netherlands, 2001)",
    description_zh:"多國陸續完成同性婚姻合法化，保障婚姻平權。",
    description_en:"Multiple countries legalized same-sex marriage, securing marriage equality.",
    forward:[5, 10, 16], backward:[],
    notes:{5:{zh:"性別平等往前一大步",en:"Big win for gender equality"},10:{zh:"不再因性傾向被差別對待",en:"No more discrimination based on who you love"},16:{zh:"法律終於站在平等這邊",en:"The law finally caught up with equality"}}
  },
  {
    title_zh:"建立自來水系統", title_en:"Modern Tap Water Systems",
    subtitle_zh:"近代至今", subtitle_en:"Modern era - present",
    description_zh:"現代自來水系統普及，提供乾淨用水與衛生保障。",
    description_en:"Modern tap water systems spread widely, providing clean water and sanitation.",
    forward:[3, 6], backward:[],
    notes:{3:{zh:"喝水不再擔心生病",en:"Clean water means fewer waterborne illnesses"},6:{zh:"乾淨用水觸手可及",en:"Safe water within reach for everyone"}}
  },
  {
    title_zh:"世界關燈日", title_en:"Earth Hour",
    subtitle_zh:"每年3月最後一個週六（自2007年起）", subtitle_en:"Last Saturday of March annually (since 2007)",
    description_zh:"全球響應每年關燈一小時，喚起節能與氣候意識。",
    description_en:"A global annual event where people switch off lights for an hour to raise energy and climate awareness.",
    forward:[7, 12, 13], backward:[],
    notes:{7:{zh:"省電意識全民有感",en:"Boosted awareness of energy saving"},12:{zh:"提醒大家想想消費習慣",en:"Got people thinking about consumption"},13:{zh:"全球一起為氣候發聲",en:"A worldwide moment for climate action"}}
  },
  {
    title_zh:"冰島同工同酬", title_en:"Iceland's Equal Pay Law",
    subtitle_zh:"2018年", subtitle_en:"2018 CE",
    description_zh:"冰島立法強制企業證明同工同酬，打擊性別薪資差距。",
    description_en:"Iceland passed a law requiring companies to prove equal pay for equal work, tackling the gender pay gap.",
    forward:[5, 10], backward:[],
    notes:{5:{zh:"男女同工同酬終於有法可管",en:"Equal pay finally has legal teeth"},10:{zh:"薪資不平等被制度正面對決",en:"Wage inequality gets confronted head-on"}}
  },
  {
    title_zh:"全民健保制度上路", title_en:"National Health Insurance Launch",
    subtitle_zh:"1995年（台灣）", subtitle_en:"1995 CE (Taiwan)",
    description_zh:"台灣實施全民健康保險，讓醫療照護不再是有錢人的特權。",
    description_en:"Taiwan launched National Health Insurance, making healthcare accessible regardless of income.",
    forward:[3, 10], backward:[],
    notes:{3:{zh:"看病不再是壓垮家庭的負擔",en:"Getting sick no longer means going broke"},10:{zh:"不分貧富都能獲得醫療照顧",en:"Healthcare access no longer depends on wealth"}}
  },
  {
    title_zh:"法國反食物浪費法", title_en:"France's Anti-Food-Waste Law",
    subtitle_zh:"2018年", subtitle_en:"2018 CE",
    description_zh:"法國立法禁止超市丟棄未售出食物，要求捐贈給慈善機構。",
    description_en:"France banned supermarkets from discarding unsold food, requiring donations to charities instead.",
    forward:[2, 12], backward:[],
    notes:{2:{zh:"多餘食物送到真正需要的人手上",en:"Surplus food reaches people who actually need it"},12:{zh:"從源頭減少浪費",en:"Waste gets cut off at the source"}}
  },
  {
    title_zh:"歐盟2035禁售燃油車", title_en:"EU 2035 Combustion Car Ban",
    subtitle_zh:"2025年通過（2035年起生效）", subtitle_en:"Passed 2025 (effective from 2035)",
    description_zh:"歐盟通過2035年起禁售新燃油車，加速交通運具電動化。",
    description_en:"The EU passed a law banning new fossil-fuel car sales from 2035, accelerating the shift to electric vehicles.",
    forward:[7, 11], backward:[],
    notes:{7:{zh:"交通能源轉向乾淨動力",en:"Transport energy shifts toward cleaner power"},11:{zh:"城市空氣品質有望改善",en:"Cities get a shot at cleaner air"}}
  },
  {
    title_zh:"大阪世博", title_en:"Expo 2025 Osaka",
    subtitle_zh:"2025年", subtitle_en:"2025 CE",
    description_zh:"2025年大阪世博匯聚各國展現創新科技與國際合作成果。",
    description_en:"Expo 2025 Osaka brought nations together to showcase innovation and international cooperation.",
    forward:[9, 17], backward:[],
    notes:{9:{zh:"各國拿出壓箱寶展示創新科技",en:"Countries showed off their latest innovations"},17:{zh:"全球齊聚一堂交流合作",en:"A global stage for collaboration"}}
  },
  {
    title_zh:"Coldplay世界巡迴演唱會「Music of the Spheres」", title_en:"Coldplay's Music of the Spheres World Tour",
    subtitle_zh:"2022年至今", subtitle_en:"2022 CE - present",
    description_zh:"巡演大量採用可再生能源與觀眾發電地板，減少演唱會碳足跡。",
    description_en:"The tour widely used renewable energy and kinetic dance floors to cut its carbon footprint.",
    forward:[7, 13], backward:[],
    notes:{7:{zh:"演唱會也能用乾淨能源供電",en:"Even concerts can run on clean energy"},13:{zh:"巨型演出示範低碳可能性",en:"A massive show proving low-carbon is possible"}}
  },
  {
    title_zh:"聯合國千禧年減貧計畫", title_en:"UN Millennium Development Goals",
    subtitle_zh:"2000年", subtitle_en:"2000 CE",
    description_zh:"聯合國訂定千禧年發展目標，全球合力推動減貧與經濟發展。",
    description_en:"The UN set the Millennium Development Goals, mobilizing global efforts to cut poverty and drive growth.",
    forward:[1, 8], backward:[],
    notes:{1:{zh:"全球貧窮人口大幅下降",en:"Global poverty rates dropped significantly"},8:{zh:"帶動開發中國家經濟成長",en:"Boosted economic growth in developing nations"}}
  },
  {
    title_zh:"綠色革命", title_en:"The Green Revolution",
    subtitle_zh:"1960年代至1990年代", subtitle_en:"1960s - 1990s",
    description_zh:"農業技術與品種改良大幅提升糧食產量，緩解全球飢荒問題。",
    description_en:"Agricultural innovations and improved crop varieties dramatically boosted food production, easing global hunger.",
    forward:[1, 2, 9], backward:[],
    notes:{1:{zh:"農民收入跟著產量一起提升",en:"Farmer incomes rose along with yields"},2:{zh:"糧食產量大爆發，飢荒緩解",en:"Food production surged, hunger eased"},9:{zh:"農業技術大躍進",en:"A major leap in agricultural technology"}}
  },
  {
    title_zh:"紐西蘭女性投票權", title_en:"New Zealand Women's Suffrage",
    subtitle_zh:"1893年", subtitle_en:"1893 CE",
    description_zh:"紐西蘭成為全球第一個賦予女性投票權的國家。",
    description_en:"New Zealand became the first country in the world to grant women the right to vote.",
    forward:[5, 10, 16], backward:[],
    notes:{5:{zh:"女性終於能在選票上發聲",en:"Women finally got a voice at the ballot box"},10:{zh:"政治參與不再只有男性",en:"Political participation no longer men-only"},16:{zh:"民主制度往平等邁進一步",en:"Democracy took a step toward equality"}}
  },
  {
    title_zh:"網際網路普及", title_en:"Rise of the Internet",
    subtitle_zh:"1990年代至今", subtitle_en:"1990s - present",
    description_zh:"網路快速普及全球，但發展初期城鄉與貧富之間的落差同時浮現。",
    description_en:"The internet spread rapidly worldwide, though early access gaps between rich and poor, urban and rural, also emerged.",
    forward:[4, 9], backward:[10],
    notes:{4:{zh:"知識與學習資源大爆發",en:"Access to knowledge and learning resources exploded"},9:{zh:"帶動全球資訊科技基礎建設",en:"Drove massive growth in global digital infrastructure"},10:{zh:"初期資源集中在已開發地區，貧富資訊落差反而擴大",en:"Early access concentrated in wealthier regions, widening the information gap"}}
  },
  {
    title_zh:"高速鐵路通車", title_en:"High Speed Rail Opens",
    subtitle_zh:"2007年（台灣）", subtitle_en:"2007 CE (Taiwan)",
    description_zh:"台灣高鐵通車，大幅縮短南北交通時間，帶動區域發展。",
    description_en:"Taiwan High Speed Rail opened, drastically cutting north-south travel time and spurring regional development.",
    forward:[8, 9, 11], backward:[],
    notes:{8:{zh:"帶動沿線經濟與就業機會",en:"Boosted jobs and economy along the route"},9:{zh:"展現高速運輸基礎建設實力",en:"Showcased high-speed transit infrastructure"},11:{zh:"城市之間的距離感大幅縮短",en:"Cities felt a lot closer together"}}
  },
  {
    title_zh:"海綿城市計畫", title_en:"Sponge City Initiative",
    subtitle_zh:"2010年代至今", subtitle_en:"2010s - present",
    description_zh:"城市透過透水鋪面與綠地設計提升防洪韌性，因應極端降雨。",
    description_en:"Cities adopted permeable surfaces and green spaces to improve flood resilience against extreme rainfall.",
    forward:[11, 13], backward:[],
    notes:{11:{zh:"城市排水更聰明，淹水少一點",en:"Smarter drainage means less flooding"},13:{zh:"提升應對極端氣候的韌性",en:"Boosted resilience to extreme weather"}}
  },
  {
    title_zh:"世界地球日", title_en:"Earth Day",
    subtitle_zh:"每年4月22日（自1970年起）", subtitle_en:"April 22 annually (since 1970)",
    description_zh:"每年4月22日全球舉辦環保活動，喚起大眾對地球生態的重視。",
    description_en:"Held every April 22nd, Earth Day mobilizes global environmental awareness campaigns.",
    forward:[12, 14, 15], backward:[],
    notes:{12:{zh:"提醒大家想想消費習慣",en:"Gets people rethinking consumption habits"},14:{zh:"海洋保育話題被看見",en:"Puts ocean conservation in the spotlight"},15:{zh:"陸地生態保育跟著被關注",en:"Raises attention on land ecosystems"}}
  },
  {
    title_zh:"禁用一次性塑膠", title_en:"Single-Use Plastic Bans",
    subtitle_zh:"多國陸續立法（歐盟自2021年起）", subtitle_en:"Adopted progressively (EU since 2021)",
    description_zh:"多國陸續立法禁用一次性塑膠製品，減少塑膠污染。",
    description_en:"Multiple countries banned single-use plastics to curb plastic pollution.",
    forward:[12, 14, 15], backward:[],
    notes:{12:{zh:"源頭減少一次性垃圾",en:"Cuts disposable waste at the source"},14:{zh:"海洋少一點塑膠垃圾",en:"Less plastic ending up in the ocean"},15:{zh:"陸地生態也跟著鬆一口氣",en:"Land ecosystems get a break too"}}
  },
  {
    title_zh:"全球禁捕商業捕鯨", title_en:"Global Commercial Whaling Moratorium",
    subtitle_zh:"1986年", subtitle_en:"1986 CE",
    description_zh:"國際捕鯨委員會實施全球商業捕鯨禁令，鯨魚族群逐漸恢復。",
    description_en:"The International Whaling Commission enacted a global moratorium on commercial whaling, allowing whale populations to recover.",
    forward:[14], backward:[],
    notes:{14:{zh:"鯨魚終於能喘口氣休養生息",en:"Whale populations finally got a chance to recover"}}
  },
  {
    title_zh:"減塑淨灘活動", title_en:"Beach Cleanup Movements",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"民間團體與政府推動海灘清潔行動，減少海洋與海岸垃圾。",
    description_en:"Community groups and governments organized beach cleanups to reduce ocean and coastal litter.",
    forward:[11, 14, 15], backward:[],
    notes:{11:{zh:"社區一起動手讓環境變乾淨",en:"Communities pitching in to clean up together"},14:{zh:"海洋垃圾少一點是一點",en:"Every bit of ocean trash removed counts"},15:{zh:"沿岸生態也跟著受惠",en:"Coastal ecosystems benefit too"}}
  },
  {
    title_zh:"國家公園設立", title_en:"Establishment of National Parks",
    subtitle_zh:"1872年首座（美國黃石）起至今", subtitle_en:"Since 1872 (Yellowstone, first in the world)",
    description_zh:"各國劃設國家公園保護原始生態與自然景觀。",
    description_en:"Countries designated national parks to protect pristine ecosystems and natural landscapes.",
    forward:[15], backward:[],
    notes:{15:{zh:"珍貴棲地被正式劃界保護",en:"Precious habitats officially protected"}}
  },
  {
    title_zh:"復育瀕危物種", title_en:"Endangered Species Recovery",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"保育組織透過人工繁殖與棲地復育，協助瀕危物種族群回升。",
    description_en:"Conservation groups use captive breeding and habitat restoration to help endangered species recover.",
    forward:[15], backward:[],
    notes:{15:{zh:"瀕危物種數量慢慢回升",en:"Endangered species slowly bouncing back"}}
  },
  {
    title_zh:"世界人權宣言", title_en:"Universal Declaration of Human Rights",
    subtitle_zh:"1948年", subtitle_en:"1948 CE",
    description_zh:"聯合國通過世界人權宣言，確立人人享有基本人權的普世原則。",
    description_en:"The UN adopted the Universal Declaration of Human Rights, establishing basic rights for all people.",
    forward:[5, 10, 16], backward:[],
    notes:{5:{zh:"性別平等被寫入普世人權",en:"Gender equality enshrined as a universal right"},10:{zh:"人人生而平等有了國際共識",en:"Equality got international consensus"},16:{zh:"人權與正義有了共同標準",en:"A shared standard for justice and rights"}}
  },
  {
    title_zh:"COVID-19疫苗國際合作", title_en:"COVID-19 Vaccine International Cooperation",
    subtitle_zh:"2020年至2021年", subtitle_en:"2020 - 2021",
    description_zh:"COVAX等機制促成各國共享疫苗資源，加速全球接種進度。",
    description_en:"Mechanisms like COVAX enabled countries to share vaccine resources, speeding up global vaccination.",
    forward:[3, 17], backward:[],
    notes:{3:{zh:"疫苗更快送到需要的地方",en:"Vaccines reached people faster"},17:{zh:"全球一起分工合作對抗疫情",en:"Countries teamed up to fight the pandemic together"}}
  },
  {
    title_zh:"人類基因組計畫", title_en:"Human Genome Project",
    subtitle_zh:"1990年至2003年", subtitle_en:"1990 - 2003",
    description_zh:"國際科學家合作解碼人類基因組，開啟精準醫療新時代。",
    description_en:"International scientists collaborated to map the human genome, opening the era of precision medicine.",
    forward:[3, 9, 17], backward:[],
    notes:{3:{zh:"為精準醫療打開大門",en:"Paved the way for precision medicine"},9:{zh:"生技研究能量大躍進",en:"A huge leap for biotech research"},17:{zh:"跨國科學合作的經典案例",en:"A textbook case of international science collaboration"}}
  },
  {
    title_zh:"大禹治水", title_en:"Yu the Great Tames the Flood",
    subtitle_zh:"約西元前2000年（傳說時代）", subtitle_en:"c. 2000 BCE (legendary era)",
    description_zh:"相傳大禹以疏導取代圍堵治理黃河水患，奠定治水工程典範。",
    description_en:"Legend has it Yu the Great tamed the Yellow River floods by channeling rather than blocking water, setting an engineering precedent.",
    forward:[6, 9, 11], backward:[],
    notes:{6:{zh:"水患治理讓水資源不再是災難",en:"Flood control turned water from disaster to resource"},9:{zh:"疏導工法成為後世工程典範",en:"His methods became an engineering blueprint"},11:{zh:"聚落終於能安心定居",en:"Settlements could finally live in peace"}}
  },
  {
    title_zh:"商鞅變法", title_en:"Shang Yang's Reforms",
    subtitle_zh:"西元前356年至前338年", subtitle_en:"356 - 338 BCE",
    description_zh:"商鞅在秦國推行法制與土地改革，強化國力與治理效能。",
    description_en:"Shang Yang implemented legal and land reforms in Qin, strengthening state power and governance.",
    forward:[8, 16], backward:[],
    notes:{8:{zh:"土地與稅制改革帶動生產力",en:"Land and tax reforms boosted productivity"},16:{zh:"法制取代人治，制度更透明",en:"Rule of law replaced arbitrary rule, more transparent governance"}}
  },
  {
    title_zh:"科舉制度建立", title_en:"Imperial Examination System",
    subtitle_zh:"西元605年", subtitle_en:"605 CE",
    description_zh:"隋朝建立科舉制度，讓平民也能透過考試晉身官場。",
    description_en:"The Sui dynasty established the imperial examination system, letting commoners rise through merit.",
    forward:[4, 8, 16], backward:[],
    notes:{4:{zh:"讀書變成翻身的機會",en:"Education became a path to a better life"},8:{zh:"階級流動帶動人才發揮",en:"Social mobility unlocked talent"},16:{zh:"選才制度相對公平透明",en:"A relatively fair, merit-based selection system"}}
  },
  {
    title_zh:"雅典民主制度", title_en:"Athenian Democracy",
    subtitle_zh:"西元前508年", subtitle_en:"508 BCE",
    description_zh:"古雅典建立公民直接參與政治的民主制度，影響後世政治體系。",
    description_en:"Ancient Athens established direct citizen participation in politics, influencing political systems ever since.",
    forward:[10, 16], backward:[],
    notes:{10:{zh:"公民（雖有限）獲得政治參與權",en:"Citizens (albeit a limited group) gained a political voice"},16:{zh:"權力不再只掌握在少數貴族手裡",en:"Power no longer concentrated solely among nobles"}}
  },
  {
    title_zh:"文藝復興", title_en:"The Renaissance",
    subtitle_zh:"14世紀至17世紀", subtitle_en:"14th - 17th century",
    description_zh:"歐洲文藝復興帶動藝術、科學與人文思想的全面復興。",
    description_en:"The European Renaissance sparked a revival in art, science, and humanist thought.",
    forward:[4, 9], backward:[],
    notes:{4:{zh:"知識與教育重新被重視",en:"Knowledge and education came back into focus"},9:{zh:"科學與技術創新百花齊放",en:"Scientific and technical innovation flourished"}}
  },
  {
    title_zh:"古騰堡活字印刷", title_en:"Gutenberg's Printing Press",
    subtitle_zh:"約1440年代", subtitle_en:"c. 1440s",
    description_zh:"古騰堡發明活字印刷術，讓書籍大量生產，知識傳播加速。",
    description_en:"Gutenberg's movable type printing press enabled mass book production, accelerating the spread of knowledge.",
    forward:[4, 10], backward:[],
    notes:{4:{zh:"書本變便宜，知識不再是貴族專屬",en:"Books got cheap, knowledge stopped being an elite privilege"},10:{zh:"識字與資訊取得門檻大幅降低",en:"Barriers to literacy and information dropped sharply"}}
  },
  {
    title_zh:"蒸汽機發明", title_en:"Invention of the Steam Engine",
    subtitle_zh:"約1712年至1769年", subtitle_en:"c. 1712 - 1769",
    description_zh:"蒸汽機的發明帶來動力革命，推動工業與交通運輸大幅進展。",
    description_en:"The invention of the steam engine sparked a power revolution, driving major advances in industry and transport.",
    forward:[7, 8], backward:[],
    notes:{7:{zh:"動力來源不再只靠人力獸力",en:"Power sources moved beyond muscle power"},8:{zh:"生產力與經濟活動大幅提升",en:"Productivity and economic activity surged"}}
  },
  {
    title_zh:"工業革命", title_en:"The Industrial Revolution",
    subtitle_zh:"18世紀中至19世紀", subtitle_en:"Mid-18th - 19th century",
    description_zh:"工業革命帶動生產力大躍進，但初期高污染、高工時也付出環境與勞動代價。",
    description_en:"The Industrial Revolution drove massive productivity gains, but early factories brought heavy pollution and grueling labor conditions.",
    forward:[8], backward:[13],
    notes:{8:{zh:"生產力與經濟規模大幅躍進",en:"Productivity and economic output surged"},13:{zh:"高污染、高排放，對氣候造成長期負擔",en:"Heavy pollution and emissions left a long-term climate burden"}}
  },
  {
    title_zh:"哥倫布發現新大陸", title_en:"Columbus Reaches the Americas",
    subtitle_zh:"1492年", subtitle_en:"1492 CE",
    description_zh:"哥倫布抵達美洲開啟東西半球交流，但也帶來殖民剝削與原住民浩劫。",
    description_en:"Columbus's arrival in the Americas opened contact between hemispheres, but also brought colonial exploitation and devastation to Indigenous peoples.",
    forward:[8, 17], backward:[10],
    notes:{8:{zh:"開啟跨大西洋貿易，商業版圖大幅擴張",en:"Opened transatlantic trade, expanding commercial reach"},10:{zh:"殖民與奴役重創原住民，加劇全球不平等",en:"Colonization and enslavement devastated Indigenous peoples, deepening global inequality"},17:{zh:"東西半球從此建立起接觸與往來",en:"Established lasting contact between hemispheres"}}
  },
  {
    title_zh:"社會住宅政策", title_en:"Social Housing Policy",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"政府興建社會住宅，提供中低收入戶可負擔的居住選擇。",
    description_en:"Governments build social housing to provide affordable options for low- and middle-income households.",
    forward:[1], backward:[],
    notes:{1:{zh:"租屋壓力減輕，貧窮循環有機會被打破",en:"Eases housing costs, helps break the poverty cycle"}}
  },
  {
    title_zh:"巴西「家庭補助金」（Bolsa Família）", title_en:"Brazil's Bolsa Família Program",
    subtitle_zh:"2003年", subtitle_en:"2003 CE",
    description_zh:"巴西政府提供條件式現金補助，要求受助家庭送孩子上學並施打疫苗。",
    description_en:"Brazil's conditional cash transfer program requires recipient families to keep kids in school and vaccinated.",
    forward:[1, 2, 4], backward:[],
    notes:{1:{zh:"直接現金挹注，貧困家庭喘口氣",en:"Direct cash support gave poor families breathing room"},2:{zh:"家庭有能力買糧食",en:"Families could afford food"},4:{zh:"孩子上學率明顯提升",en:"School attendance rates rose significantly"}}
  },
  {
    title_zh:"國際稻米研究所（IRRI）成立", title_en:"Founding of IRRI",
    subtitle_zh:"1960年", subtitle_en:"1960 CE",
    description_zh:"IRRI致力研發高產稻米品種，協助亞洲多國提升糧食產量。",
    description_en:"IRRI develops high-yield rice varieties, helping Asian countries boost food production.",
    forward:[2, 9], backward:[],
    notes:{2:{zh:"改良稻種讓更多人吃得飽",en:"Improved rice varieties mean more people get fed"},9:{zh:"農業科研能量大幅提升",en:"Major boost to agricultural research capacity"}}
  },
  {
    title_zh:"維基百科誕生", title_en:"Wikipedia Launches",
    subtitle_zh:"2001年", subtitle_en:"2001 CE",
    description_zh:"維基百科以協作方式建立免費線上百科全書，開放全球共同編輯。",
    description_en:"Wikipedia launched as a free, collaboratively edited online encyclopedia open to contributors worldwide.",
    forward:[4, 17], backward:[],
    notes:{4:{zh:"免費知識人人可得",en:"Free knowledge accessible to everyone"},17:{zh:"全球網友一起協作貢獻",en:"A global community collaborating together"}}
  },
  {
    title_zh:"冰島選出全球首位民選女性總統", title_en:"Iceland Elects First Female Elected President",
    subtitle_zh:"1980年", subtitle_en:"1980 CE",
    description_zh:"冰島選出Vigdís Finnbogadóttir為全球首位經直接民選產生的女性總統。",
    description_en:"Iceland elected Vigdís Finnbogadóttir as the world's first directly elected female president.",
    forward:[5], backward:[],
    notes:{5:{zh:"女性領導力站上世界舞台",en:"Women's leadership took center stage globally"}}
  },
  {
    title_zh:"倫敦下水道系統建立", title_en:"London Sewer System",
    subtitle_zh:"1859年至1875年", subtitle_en:"1859 - 1875",
    description_zh:"倫敦興建現代下水道系統，解決霍亂與污水氾濫問題。",
    description_en:"London built a modern sewer system, solving cholera outbreaks and sewage overflow.",
    forward:[3, 6, 11], backward:[],
    notes:{3:{zh:"霍亂疫情大幅減少",en:"Cholera outbreaks dropped sharply"},6:{zh:"污水不再直接排入水源",en:"Sewage stopped contaminating water sources"},11:{zh:"城市衛生環境大幅改善",en:"Urban sanitation improved dramatically"}}
  },
  {
    title_zh:"海水淡化技術普及", title_en:"Desalination Technology Spreads",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"海水淡化技術日益成熟，協助缺水地區取得穩定淡水來源。",
    description_en:"Desalination technology matured, helping water-scarce regions secure a stable freshwater supply.",
    forward:[6, 9], backward:[],
    notes:{6:{zh:"缺水地區也能有乾淨水喝",en:"Water-scarce regions get access to clean water"},9:{zh:"水資源技術跨出新一步",en:"A tech leap forward for water infrastructure"}}
  },
  {
    title_zh:"LED照明普及", title_en:"LED Lighting Adoption",
    subtitle_zh:"2000年代至今", subtitle_en:"2000s - present",
    description_zh:"LED燈泡逐漸取代傳統燈泡，大幅降低照明耗電量。",
    description_en:"LED bulbs gradually replaced traditional lighting, cutting electricity use significantly.",
    forward:[7, 12], backward:[],
    notes:{7:{zh:"照明用電效率大提升",en:"Lighting efficiency jumped way up"},12:{zh:"資源使用更有效率",en:"More efficient use of resources"}}
  },
  {
    title_zh:"珊瑚礁復育計畫", title_en:"Coral Reef Restoration Projects",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"科學家透過人工復育與移植技術，協助受損珊瑚礁重新生長。",
    description_en:"Scientists use coral farming and transplantation to help damaged reefs regrow.",
    forward:[13, 14], backward:[],
    notes:{13:{zh:"提升海洋生態對氣候變遷的韌性",en:"Boosts marine resilience to climate change"},14:{zh:"珊瑚礁生態系逐漸恢復生機",en:"Reef ecosystems slowly coming back to life"}}
  },
  {
    title_zh:"禁用魚翅政策", title_en:"Shark Fin Bans",
    subtitle_zh:"多國陸續立法", subtitle_en:"Adopted progressively worldwide",
    description_zh:"多國與航空公司禁止魚翅交易與運輸，抑制過度捕撈鯊魚。",
    description_en:"Countries and airlines banned shark fin trade and transport, curbing shark overfishing.",
    forward:[12, 14], backward:[],
    notes:{12:{zh:"消費行為往永續方向調整",en:"Consumption habits shifting toward sustainability"},14:{zh:"鯊魚族群壓力減輕",en:"Less pressure on shark populations"}}
  },
  {
    title_zh:"海龜保育計畫", title_en:"Sea Turtle Conservation Programs",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"保育團體透過巡護海灘、保護產卵地協助海龜族群復育。",
    description_en:"Conservation groups patrol beaches and protect nesting sites to help sea turtle populations recover.",
    forward:[14, 15], backward:[],
    notes:{14:{zh:"海龜數量緩步回升",en:"Sea turtle numbers slowly climbing back"},15:{zh:"沿岸孵化棲地受到保護",en:"Coastal nesting habitats protected"}}
  },
  {
    title_zh:"天然林禁伐政策", title_en:"Primary Forest Logging Bans",
    subtitle_zh:"多國陸續立法", subtitle_en:"Adopted progressively worldwide",
    description_zh:"多國立法禁止砍伐原始天然林，保護森林碳匯與生物多樣性。",
    description_en:"Countries banned logging of primary natural forests, protecting carbon sinks and biodiversity.",
    forward:[13, 15], backward:[],
    notes:{13:{zh:"森林碳匯能力被保留下來",en:"Forest carbon storage capacity preserved"},15:{zh:"原始生態系免於被砍伐破壞",en:"Pristine ecosystems spared from logging"}}
  },
  {
    title_zh:"最低工資制度", title_en:"Minimum Wage Laws",
    subtitle_zh:"各國陸續實施", subtitle_en:"Adopted progressively worldwide",
    description_zh:"政府訂立最低工資標準，保障勞工基本收入水準。",
    description_en:"Governments set minimum wage standards to guarantee workers a baseline income.",
    forward:[1], backward:[],
    notes:{1:{zh:"工資有底線，貧窮風險降低",en:"A wage floor reduces the risk of falling into poverty"}}
  },
  {
    title_zh:"滴灌技術發明", title_en:"Invention of Drip Irrigation",
    subtitle_zh:"1960年代（以色列）", subtitle_en:"1960s (Israel)",
    description_zh:"滴灌技術精準供水給作物根部，大幅提升灌溉用水效率。",
    description_en:"Drip irrigation delivers water precisely to crop roots, dramatically improving irrigation efficiency.",
    forward:[2, 6], backward:[],
    notes:{2:{zh:"缺水地區也能穩定種出糧食",en:"Even dry regions can grow food reliably"},6:{zh:"灌溉用水浪費大幅減少",en:"Cuts irrigation water waste significantly"}}
  },
  {
    title_zh:"糧食銀行成立", title_en:"Founding of Food Banks",
    subtitle_zh:"1967年首創（美國）", subtitle_en:"First founded 1967 (United States)",
    description_zh:"糧食銀行媒合多餘食物與有需要的家庭，減少浪費並協助弱勢。",
    description_en:"Food banks connect surplus food with families in need, reducing waste while supporting the vulnerable.",
    forward:[1, 2, 12], backward:[],
    notes:{1:{zh:"弱勢家庭生活負擔減輕",en:"Eases the burden on struggling families"},2:{zh:"食物直接送到需要的人手上",en:"Food gets to people who need it"},12:{zh:"食物浪費被有效攔截",en:"Food waste intercepted effectively"}}
  },
  {
    title_zh:"國際婦女節（3/8）", title_en:"International Women's Day",
    subtitle_zh:"每年3月8日", subtitle_en:"March 8 annually",
    description_zh:"每年3月8日全球紀念並倡議女性權益與性別平等。",
    description_en:"Celebrated every March 8th worldwide to advocate for women's rights and gender equality.",
    forward:[5], backward:[],
    notes:{5:{zh:"性別平等議題每年都被重新看見",en:"Keeps gender equality in the spotlight every year"}}
  },
  {
    title_zh:"禁止童婚法", title_en:"Child Marriage Bans",
    subtitle_zh:"多國陸續立法", subtitle_en:"Adopted progressively worldwide",
    description_zh:"多國立法禁止未成年結婚，保護兒童權益與身心發展。",
    description_en:"Countries passed laws banning child marriage to protect children's rights and development.",
    forward:[3, 5, 16], backward:[],
    notes:{3:{zh:"早婚早育的健康風險降低",en:"Fewer health risks from early pregnancy"},5:{zh:"女童不再被迫提前進入婚姻",en:"Girls no longer forced into early marriage"},16:{zh:"兒童權益受到法律保障",en:"Children's rights protected by law"}}
  },
  {
    title_zh:"Girls Who Code成立", title_en:"Founding of Girls Who Code",
    subtitle_zh:"2012年", subtitle_en:"2012 CE",
    description_zh:"非營利組織Girls Who Code致力縮小科技領域性別落差，鼓勵女孩學習程式。",
    description_en:"The nonprofit Girls Who Code works to close the tech gender gap by encouraging girls to learn programming.",
    forward:[4, 5], backward:[],
    notes:{4:{zh:"程式教育資源更容易觸及女孩",en:"Coding education made more accessible to girls"},5:{zh:"科技領域性別落差被正視",en:"Tech's gender gap gets real attention"}}
  },
  {
    title_zh:"雨水回收系統", title_en:"Rainwater Harvesting Systems",
    subtitle_zh:"當代", subtitle_en:"Modern",
    description_zh:"建築物設置雨水回收系統，收集雨水再利用於澆灌與沖廁。",
    description_en:"Buildings install rainwater harvesting systems to collect and reuse water for irrigation and flushing.",
    forward:[6, 11], backward:[],
    notes:{6:{zh:"水資源被更有效率地重複利用",en:"Water gets reused more efficiently"},11:{zh:"城市對缺水的抵抗力提升",en:"Cities become more resilient to water shortages"}}
  }
];

/* Annotations live on each card in eventCards (notes: {sdgId: {zh, en}}),
   generated verbatim from the team's bilingual card spreadsheet. */
function sdgNote(card, sdgId) {
  var entry = card && card.notes ? card.notes[sdgId] : null;
  if (!entry) return "";
  return (currentLang === "en" ? entry.en : entry.zh) || "";
}

var specialCards = [
  {
    title_zh:"永續轉型", title_en:"Sustainable Transition", type:"sustain",
    description_zh:"從尚未被任何玩家使用的目標牌堆中抽一張，用它替換掉自己手上正在追蹤的一張SDG目標牌；替換後，新目標牌的進度直接沿用被換掉那張目標牌原本的步數位置（不歸零）。",
    description_en:"Draw one card from the unused target card deck and swap it in for one of your own target cards. The new target card keeps the exact same progress (step count) as the card it replaced — it does not reset to zero."
  },
  {
    title_zh:"否決權", title_en:"Veto", type:"veto",
    description_zh:"當任何玩家即將使用一張特殊功能牌時，你可以立即打出「否決權」，宣告抵銷該張特殊功能牌的效果；被抵銷的特殊功能牌視為完全未發生，直接進入棄牌堆。",
    description_en:"At any time, when a player (including yourself) is about to resolve a Special Action card, you may play Veto to cancel that card's effect. The countered card is discarded and treated as if it were never played."
  },
  {
    title_zh:"政策豁免", title_en:"Policy Exemption", type:"immunity",
    description_zh:"指定自己的一張目標牌，宣告該目標牌在本回合內免疫所有負面效果（包含後退、歸零、正負交換等）；正面效果仍正常生效。",
    description_en:"Choose one of your own target cards. For the current round, that card is immune to all negative effects (setbacks, resets, sign-flips, etc.). Positive effects still apply normally."
  },
  {
    title_zh:"捲土重來", title_en:"Back to Square One", type:"reset",
    description_zh:"指定任意一張目標牌（可為自己或其他玩家的），將該目標牌的步數直接歸零，回到起始點；已抵達GOAL的目標牌已鎖定，不受此效果影響。",
    description_en:"Choose any target card — yours or another player's — and reset its progress to zero, sending it back to the starting point. Target cards that have already reached GOAL are locked and unaffected."
  },
  {
    title_zh:"國際制裁", title_en:"International Sanctions", type:"sanction",
    description_zh:"指定一名玩家，該玩家在下一個回合的行動階段中，無法執行卡牌也無法棄牌。",
    description_en:"Choose a target player. During their next turn's Action Phase, that player cannot take any action at all — they may not play cards, and they may not discard."
  },
  {
    title_zh:"能力建構", title_en:"Capacity Building", type:"capacity",
    description_zh:"在補牌階段額外多抽1張牌（比平常多抽一張），從所有抽到的牌中挑選1張棄置，其餘正常收入手牌（仍受手牌上限5張限制）。",
    description_en:"During your Draw Phase, draw one extra card. From all the cards drawn this phase, discard any one card of your choice, and keep the rest in hand (still subject to the normal 5-card hand limit)."
  },
  {
    title_zh:"立場反轉", title_en:"Stance Reversal", type:"reverse",
    description_zh:"指定任意一張目標牌，將其目前的步數正負互換（例如原本+2格變成-2格，原本-1格變成+1格）；可指定自己或其他玩家的目標牌。",
    description_en:"Choose any target card and flip its current progress from positive to negative or vice versa (e.g., a card at +2 becomes -2, a card at -1 becomes +1). Can target your own or another player's card."
  },
  {
    title_zh:"歷史借鏡", title_en:"Lessons from History", type:"history",
    description_zh:"檢視棄牌堆最上方的5張牌（不足5張則全部檢視），從中選擇1張加入手牌，其餘依原順序放回棄牌堆頂端。",
    description_en:"Look at the top 5 cards of the discard pile (or all of them if fewer than 5 remain). Choose 1 to add to your hand, then return the rest to the top of the discard pile in their original order."
  }
];

/* ========== STATE ========== */
var state = {
  mode: "local", isGameOver: false, timers: [], inputLocked: false,
  players: [], currentPlayer: 0, phase: "action",
  deck: [], discard: [], unusedSDGs: [],
  selectedCards: [], modeAction: null, maxPlay: 2,
  capacityActive: false, isAIThinking: false,
  draftCounts: {}, draftCurrentPlayer: 0, draftSelected: [], aiDraftPending: false,
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
/* Tick marks under each progress bar, derived from GOAL so the scale and the
   labels can never drift apart if the goal distance is retuned. */
var _trackLabelsCache = null;
function trackLabelsHtml() {
  if (_trackLabelsCache) return _trackLabelsCache;
  var out = "";
  for (var v = -2; v <= GOAL; v++) out += "<span>" + (v === GOAL ? "GOAL" : v) + "</span>";
  _trackLabelsCache = out;
  return out;
}
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

/* One sticky note per moved SDG, carrying the step change and, where the team
   has supplied one, the annotation for that SDG on that card. */
function makeStickyNote(card, sdgId, delta) {
  var note = document.createElement("span");
  var text = sdgNote(card, sdgId);
  note.className = "sticky-note " + (delta > 0 ? "up" : "down") + (text ? "" : " plain");

  var head = document.createElement("div");
  head.className = "sticky-note-head";
  var sdg = document.createElement("span");
  sdg.className = "sticky-note-sdg";
  sdg.textContent = "SDG " + sdgId;
  var d = document.createElement("span");
  d.className = "sticky-note-delta";
  d.textContent = (delta > 0 ? "📈 +" : "📉 ") + delta;
  head.appendChild(sdg);
  head.appendChild(d);
  note.appendChild(head);

  if (text) {
    var title = document.createElement("div");
    title.className = "sticky-note-title";
    title.textContent = sdgName(sdgId);
    note.appendChild(title);
    var body = document.createElement("div");
    body.className = "sticky-note-text";
    body.textContent = text;
    note.appendChild(body);
  }
  return note;
}

/* Manual Next card announcement (no auto timer).
   options.reveal marks the Reveal Phase flip, which nobody plays — it is turned
   over from the deck — so it must not be announced as "<name> played". */
function showCardAnnouncement(playerName, card, options) {
  options = options || {};
  return new Promise(function(resolve) {
    if (state.isGameOver) { resolve(); return; }
    state.inputLocked = true;
    var whoEl = document.getElementById("announcePlayer");
    whoEl.textContent = options.reveal ? t("revealHeading") : playerName + " " + t("played");
    whoEl.className = "card-announce-player" + (options.reveal ? " reveal" : "");
    document.getElementById("announceCardName").textContent = cardTitle(card);
    document.getElementById("announceSub").textContent = options.reveal
      ? t("revealNote")
      : (cardSub(card) || (card.kind === "event" ? t("historyEvent") : t("specialCard")));
    document.getElementById("announceDesc").textContent = cardDesc(card);

    var effectsEl = document.getElementById("announceEffects");
    effectsEl.innerHTML = "";
    var affected = options.affectedSDGs || [];
    if (affected.length) {
      affected.forEach(function(a) {
        effectsEl.appendChild(makeStickyNote(card, a.id, a.delta));
      });
    } else if (card.kind === "event") {
      (card.forward || []).forEach(function(id) {
        effectsEl.appendChild(makeStickyNote(card, id, 1));
      });
      (card.backward || []).forEach(function(id) {
        effectsEl.appendChild(makeStickyNote(card, id, -1));
      });
    } else {
      var tag = document.createElement("span");
      tag.className = "sticky-note special plain";
      tag.textContent = t("special");
      effectsEl.appendChild(tag);
    }
    if (options.targetName) {
      var tn = document.createElement("span");
      tn.className = "sticky-note special plain";
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
  state.aiDraftPending = false;
  startTutorial();
}

/* ========== RULES WALKTHROUGH ==========
   Shown between setup and the draft, so finishing it drops straight into play.
   Both languages sit on the page together rather than following the toggle. */
var TUTORIAL_STEPS = [
  {
    zh: { title: "歡迎來到 The Green Cabinet", body: [
      "你將扮演一個政治陣營的領導者，帶領自己的陣營推進 2 項永續發展目標（SDGs）。",
      "在象徵國際議會的舞台上提出政策、運用歷史事件與特殊策略工具，讓自己的目標前進，也可以干擾其他陣營。",
      "核心概念：永續發展不是單一路線，每個政策都可能同時帶來不同影響。"
    ]},
    en: { title: "Welcome to The Green Cabinet", body: [
      "You lead a political camp, and your camp has 2 Sustainable Development Goals (SDGs) to advance.",
      "On a stage standing in for an international assembly, you propose policies and use historical events and special tools to push your goals forward — or hold rival camps back.",
      "The core idea: sustainability is never a single path, and every policy can cut more than one way."
    ]}
  },
  {
    zh: { title: "遊戲目標", body: [
      "每位玩家開始時取得：1 個個人軌道板、2 張 SDG 目標牌、5 張功能牌。",
      "你的 2 張 SDG 目標牌會公開放置，所有人都看得到你在追求什麼。",
      "第一位讓自己 2 張 SDG 目標牌全部抵達 GOAL 的玩家獲勝。"
    ]},
    en: { title: "How You Win", body: [
      "Every player starts with 1 personal track board, 2 SDG goal cards, and 5 action cards.",
      "Your 2 goal cards sit face up, so everyone can see what you are working toward.",
      "The first player to bring both of their SDG goals all the way to GOAL wins."
    ]}
  },
  {
    zh: { title: "個人軌道板", body: [
      "每張 SDG 目標牌都從起始點 0 出發，距離 GOAL 有 3 格。",
      "起始點之前還有 -1、-2 兩格，所以目標可以被推進，也可以被推退。",
      "重要規則：目標牌一旦抵達 GOAL 就會鎖定，之後不再受任何功能牌影響。"
    ]},
    en: { title: "Your Progress Track", body: [
      "Each goal card starts at 0, which is 3 steps away from GOAL.",
      "There are also -1 and -2 spaces below the start, so goals can be pushed backward as well as forward.",
      "Key rule: once a goal reaches GOAL it is locked, and no action card can touch it again."
    ]}
  },
  {
    zh: { title: "目標牌", body: [
      "目標牌對應聯合國 17 項永續發展目標，共 17 種，每種 2 張。",
      "每位玩家抽 2 張目標牌，而且不能拿到相同種類的目標。",
      "因為每種只有 2 張，同一個 SDG 最多只會有 2 位玩家同時追求。"
    ]},
    en: { title: "Goal Cards", body: [
      "The goal cards match the UN's 17 Sustainable Development Goals: 17 kinds, 2 copies of each.",
      "Each player takes 2 goal cards, and never two of the same kind.",
      "Because there are only 2 copies of each, at most 2 players can chase the same SDG."
    ]}
  },
  {
    zh: { title: "功能牌：歷史與現代事件", body: [
      "大部分功能牌以歷史事件、現代事件、政策、法律、公約、科技突破、社會運動、災害與環境事件為主題。",
      "每張牌會讓 1～3 個 SDG 前進或後退，而且是影響「所有玩家」持有的同編號目標。",
      "正向事件比負向事件多，讓整體遊戲比較有建設感。",
      "也有雙重效果的牌：例如「COVID-19 封城」讓 SDG3 前進、SDG8 後退，因為防疫有助健康，但封城衝擊經濟。"
    ]},
    en: { title: "Action Cards: Real Events", body: [
      "Most action cards come from real history: events, policies, laws, treaties, technological breakthroughs, social movements, disasters and environmental crises.",
      "Each card moves 1-3 SDGs forward or backward, and it affects that SDG for every player holding it — not just you.",
      "Positive events outnumber negative ones, so the game keeps a constructive feel.",
      "Some cards cut both ways: 'COVID-19 Lockdowns' moves SDG3 forward but SDG8 back, because containment helped health while lockdowns hurt the economy."
    ]}
  },
  {
    zh: { title: "特殊功能牌（共 8 種）", body: [
      "永續轉型：換掉自己一張目標牌，新目標沿用原本的步數，不歸零。",
      "否決權：任何玩家即將使用特殊功能牌時，可立刻打出以抵銷該牌效果。",
      "政策豁免：指定自己一張目標牌，本回合免疫所有負面效果；正面效果仍生效。",
      "捲土重來：指定任一張尚未達標的目標牌，將其步數歸零。",
      "國際制裁：指定一名玩家，其下一回合的行動階段無法出牌也無法棄牌。",
      "能力建構：補牌階段多抽 1 張，再從抽到的牌中棄掉 1 張。",
      "立場反轉：指定任一張目標牌，將其步數正負互換。",
      "歷史借鏡：檢視棄牌堆最上方 5 張，選 1 張加入手牌，其餘依原順序放回。"
    ]},
    en: { title: "Special Action Cards (8 in total)", body: [
      "Sustainable Transition: swap one of your goals for an unused one, keeping its exact progress.",
      "Veto: when any player is about to resolve a special card, play this at once to cancel it.",
      "Policy Exemption: one of your goals is immune to all negative effects this round; positive effects still land.",
      "Back to Square One: reset any goal that has not yet reached GOAL back to zero.",
      "International Sanctions: the chosen player may neither play nor discard during their next Action Phase.",
      "Capacity Building: draw 1 extra card in the Draw Phase, then discard 1 of the cards drawn.",
      "Stance Reversal: flip any goal's progress from positive to negative or back.",
      "Lessons from History: look at the top 5 cards of the discard pile, take 1, and return the rest in order."
    ]}
  },
  {
    zh: { title: "回合流程 ① 行動階段", body: [
      "輪到你時，你可以選擇棄牌，或是使用功能牌。",
      "棄牌：可以棄掉任意張手牌，棄牌不會觸發卡片效果。",
      "使用功能牌：打出並執行效果，每回合最多執行 2 張。",
      "你可以幫助自己、干擾其他玩家、影響所有人，或操作 SDG 之間的關係。"
    ]},
    en: { title: "Turn Flow ① Action Phase", body: [
      "On your turn you may either discard, or play action cards.",
      "Discard: throw away any number of cards from your hand; discarding never triggers their effects.",
      "Play: resolve the cards you play, up to 2 per turn.",
      "You can help yourself, disrupt a rival, affect everyone at once, or work the relationships between SDGs."
    ]}
  },
  {
    zh: { title: "回合流程 ② 翻牌階段", body: [
      "行動階段結束後，從抽牌堆頂端翻開一張牌，立刻執行它的效果。",
      "這張牌會影響所有玩家，包括你自己，是每回合最大的變數。",
      "如果翻到的是特殊功能牌，就把它放入棄牌堆，然後重新翻開下一張。"
    ]},
    en: { title: "Turn Flow ② Reveal Phase", body: [
      "Once your action phase ends, flip the top card of the deck and resolve it immediately.",
      "It affects every player, you included — the biggest swing of each turn.",
      "If the flipped card is a special action card, discard it and flip the next one instead."
    ]}
  },
  {
    zh: { title: "回合流程 ③ 補牌階段", body: [
      "從抽牌堆補牌，把手牌補回 5 張，然後換下一位玩家。",
      "如果抽牌堆用完了，就把棄牌堆重新洗牌，形成新的抽牌堆。"
    ]},
    en: { title: "Turn Flow ③ Draw Phase", body: [
      "Draw from the deck until your hand is back to 5 cards, then play passes to the next player.",
      "If the deck runs out, shuffle the discard pile to form a new deck."
    ]}
  },
  {
    zh: { title: "這款遊戲想說的事", body: [
      "SDGs 之間彼此連動：一個政策可能同時影響多個目標。",
      "永續發展存在取捨：有些事件會讓一項目標前進、另一項目標後退。",
      "合作與競爭並存：你可以和別人合作，也可以阻礙競爭者。",
      "用歷史理解 SDGs：遊戲事件橫跨古代到現代，讓我們看見 SDGs 雖然 2015 年才正式形成，但人類早就一直在面對貧窮、教育、平等、能源、環境、和平與國際合作等問題。"
    ]},
    en: { title: "What This Game Is About", body: [
      "The SDGs are interconnected: a single policy can move several goals at once.",
      "Sustainability involves trade-offs: some events push one goal forward while setting another back.",
      "Cooperation and competition coexist: you can work with others, or stand in their way.",
      "History makes the SDGs legible: the events span antiquity to today, showing that although the SDGs were only formalised in 2015, humanity has long wrestled with poverty, education, equality, energy, environment, peace and international cooperation."
    ]}
  }
];

var tutorialIndex = 0;

function startTutorial() {
  tutorialIndex = 0;
  showScreen("tutorialScreen");
  renderTutorial();
}

function renderTutorial() {
  var step = TUTORIAL_STEPS[tutorialIndex];
  var last = tutorialIndex === TUTORIAL_STEPS.length - 1;

  document.getElementById("tutorialStepNum").textContent =
    (tutorialIndex + 1) + " / " + TUTORIAL_STEPS.length;

  var dots = document.getElementById("tutorialDots");
  dots.innerHTML = "";
  TUTORIAL_STEPS.forEach(function(_, i) {
    var d = document.createElement("span");
    d.className = "tutorial-dot" + (i === tutorialIndex ? " current" : (i < tutorialIndex ? " done" : ""));
    dots.appendChild(d);
  });

  ["zh", "en"].forEach(function(lang) {
    var suffix = lang === "zh" ? "Zh" : "En";
    document.getElementById("tutorialTitle" + suffix).textContent = step[lang].title;
    var ul = document.getElementById("tutorialBody" + suffix);
    ul.innerHTML = "";
    step[lang].body.forEach(function(line) {
      var li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    });
  });

  document.getElementById("btnTutorialNext").textContent = last ? "開始遊戲 Start game" : "下一步 Next";
  document.getElementById("tutorialScreen").scrollIntoView({ block: "start" });
}

function finishTutorial() {
  showScreen("draftScreen");
  renderDraft();
}

document.getElementById("btnTutorialNext").onclick = function() {
  if (tutorialIndex < TUTORIAL_STEPS.length - 1) {
    tutorialIndex++;
    renderTutorial();
  } else {
    finishTutorial();
  }
};
document.getElementById("btnTutorialSkip").onclick = finishTutorial;

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
  // aiDraftPick() re-renders to show its picks highlighted, so only arm the
  // timer once per bot — otherwise a stale one fires after the draft moved on.
  if (p.isAI && !state.aiDraftPending) {
    state.aiDraftPending = true;
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
  state.aiDraftPending = false;
  state.draftCurrentPlayer++;
  if (state.draftCurrentPlayer >= state.players.length) { startGame(); return; }
  renderDraft();
}
function aiDraftPick() {
  if (state.isGameOver) return;
  var p = state.players[state.draftCurrentPlayer];
  if (!p || !p.isAI) { state.aiDraftPending = false; return; }
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
      title_zh: c.title_zh, title_en: c.title_en,
      subtitle_zh: c.subtitle_zh, subtitle_en: c.subtitle_en,
      description_zh: c.description_zh, description_en: c.description_en,
      forward: (c.forward || []).slice(), backward: (c.backward || []).slice(),
      notes: c.notes,
      kind: "event", id: Math.random().toString(36).slice(2)
    });
  });
  specialCards.forEach(function(c) {
    for (var i = 0; i < 2; i++) {
      state.deck.push({
        title_zh: c.title_zh, title_en: c.title_en, type: c.type,
        description_zh: c.description_zh, description_en: c.description_en,
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
        "<div class=\"sdg-progress-bar\"><div class=\"progress-fill " + (cur < 0 ? "negative" : "") + "\" style=\"width:" + pct + "%\"></div>" +
        (delta !== 0 ? "<div class=\"progress-preview " + (delta < 0 ? "negative" : "") + "\" style=\"left:0;width:" + Math.max(pct, previewPct) + "%;\"></div>" : "") +
        "<div class=\"progress-text\">" + (cur >= GOAL ? t("goal") : cur) + (delta ? " -> " + preview : "") +
        (s.immune ? " [immune]" : "") + "</div></div></div>" +
        "<div class=\"progress-labels\">" + trackLabelsHtml() + "</div>" +
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
    div.className = "hand-card " + (card.kind === "event" ? "event" : "special") +
      (state.selectedCards.indexOf(idx) !== -1 ? " selected" : "") + (cannot ? " disabled-card" : "");
    var effect = "";
    if (card.kind === "event") {
      effect = "<div class=\"card-fwd\">" + (card.forward.length ? t("forward") + ":" + card.forward.join(",") : "") + "</div>" +
               "<div class=\"card-bwd\">" + (card.backward.length ? t("backward") + ":" + card.backward.join(",") : "") + "</div>";
    } else {
      effect = "<div class=\"card-effect\">" + cardDesc(card) + "</div>";
    }
    div.innerHTML = "<div class=\"hand-card-header\">" + (card.kind === "event" ? t("historyEvent") : t("specialCard")) + "</div>" +
      "<div class=\"hand-card-body\"><div class=\"card-name\">" + cardTitle(card) + "</div>" + effect + "</div>";
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
    log(p.name + " " + t("discarded") + ": " + cardTitle(c));
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
    log(p.name + " " + t("played") + ": " + cardTitle(card), card.kind === "event" ? "up" : "special");
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
    var advanceHolder = null;
    state.players.forEach(function(pl) {
      if (advanceHolder || !pl.isAI || pl.difficulty !== "advance") return;
      var idx = pl.hand.findIndex(function(c) { return c.type === "veto"; });
      if (idx >= 0 && pl !== caster && (card.type === "reset" || card.type === "sanction" || card.type === "reverse")) {
        advanceHolder = { pl: pl, idx: idx };
      }
    });
    if (advanceHolder) {
      showAINotice("[" + advanceHolder.pl.name + "] " + t("aiTarget"));
      trackTimeout(function() {
        hideAINotice();
        advanceHolder.pl.hand.splice(advanceHolder.idx, 1);
        state.discard.push({ type: "veto", title_zh: "否決權", title_en: "Veto", kind: "special" });
        log(advanceHolder.pl.name + " Veto!", "ai");
        resolve(true);
      }, 1000);
      return;
    }
    // Any holder may counter, so offer it to each in turn until one accepts.
    var i = 0;
    (function askNext() {
      if (state.isGameOver || i >= holders.length) { resolve(false); return; }
      var pl = holders[i++].pl;
      var idx = pl.hand.findIndex(function(c) { return c.type === "veto"; });
      if (idx < 0) { askNext(); return; }
      showModal(t("useVeto"), "<p>" + pl.name + ": " + cardTitle(card) + "</p>", [
        { label: t("yes"), class: "success", fn: function() {
          pl.hand.splice(idx, 1);
          state.discard.push({ type: "veto", title_zh: "否決權", title_en: "Veto", kind: "special" });
          log(pl.name + " Veto!", "special");
          resolve(true);
        }},
        { label: t("no"), class: "danger", fn: askNext }
      ]);
    })();
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
    log(t("flipReveal") + ": " + cardTitle(card), "sys");
    await showCardAnnouncement("", card, { affectedSDGs: affected, reveal: true });
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
        return "<button data-i=\"" + i + "\">" + cardTitle(c) + "</button>";
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
  // Policy Exemption covers "this round", so it holds through the caster's own
  // reveal phase and every opponent's turn, and lapses as their next turn opens.
  state.players[next].sdgs.forEach(function(s) { s.immune = false; });
  state.phase = "action";
  state.modeAction = null;
  log("--- " + t("turnOf") + " " + getCurrentPlayer().name + " ---", "sys");
  checkWin();
  if (!state.isGameOver) { updateUI(); maybeTriggerAI(); }
}

/* ========== TURN START ========== */
async function maybeTriggerAI() {
  if (state.isGameOver) return;
  var p = getCurrentPlayer();
  if (!p || state.phase !== "action") return;
  // A sanctioned player may neither play nor discard, so there is no action for
  // them to take — skip straight to the reveal phase. Without this a sanctioned
  // human is stuck: both action buttons refuse, and nothing ends the turn.
  if (p.sanctioned) {
    log(p.name + " " + t("sanctionSkip"), p.isAI ? "ai" : "sys");
    showAINotice(p.name + " " + t("sanctionSkip"));
    await delay(1200);
    hideAINotice();
    if (!state.isGameOver) endActionPhase();
    return;
  }
  if (!p.isAI) return;
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
      log(p.name + " " + t("played") + ": " + cardTitle(card), "ai");
      await new Promise(function(r) { resolveCard(card, true, r); });
    }
  } else {
    var n2 = Math.min(2, p.hand.length);
    for (var j = 0; j < n2; j++) {
      var c = p.hand.pop();
      state.discard.push(c);
      log(p.name + " " + t("discarded") + ": " + cardTitle(c), "ai");
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
            if (s.progress > 0 && isValidNeg(s) && (!best || s.progress > best.s.progress))
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
        var s = pl.sdgs[si];
        if (!isValidNeg(s)) { log(pl.name + " SDG " + s.id + " " + t("immuneBlocked"), "special"); done(); return; }
        s.progress = 0;
        log("[" + p.name + "] -> [" + pl.name + "] " + t("resetCard") + " SDG " + s.id, "special");
        done();
      }, done);
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
            if (s.progress > 0 && isValidNeg(s) && (!best || s.progress > best.s.progress))
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
        var s = pl.sdgs[si];
        if (!isValidNeg(s)) { log(pl.name + " SDG " + s.id + " " + t("immuneBlocked"), "special"); done(); return; }
        s.progress = clamp(-s.progress, -2, GOAL);
        log("[" + p.name + "] -> [" + pl.name + "] " + t("reverseCard") + " SDG " + s.id + " -> " + s.progress, "special");
        done();
      }, done);
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
        log(p.name + " History: " + cardTitle(c), "special");
        done();
      }, 1000);
    } else {
      var body = "<div class=\"modal-list\">" + top.map(function(c, i) {
        var realIdx = state.discard.length - top.length + i;
        return "<button data-i=\"" + realIdx + "\">" + cardTitle(c) + "</button>";
      }).join("") + "</div>";
      showModal(t("selectFromDiscard"), body, []);
      setTimeout(function() {
        document.querySelectorAll("#modalBody button").forEach(function(btn) {
          btn.onclick = function() {
            var i = parseInt(btn.getAttribute("data-i"), 10);
            var c = state.discard.splice(i, 1)[0];
            p.hand.push(c);
            log(p.name + " History: " + cardTitle(c), "special");
            hideModal();
            done();
          };
        });
      }, 30);
    }
    return;
  }

  if (card.type === "sustain") {
    // Draw from the unused-goal deck, skipping any goal this player already
    // tracks so nobody ends up holding the same SDG twice. The replaced goal
    // goes back to the bottom, and the new one inherits its step position.
    var takeUnused = function(player) {
      for (var i = state.unusedSDGs.length - 1; i >= 0; i--) {
        var id = state.unusedSDGs[i];
        var held = player.sdgs.some(function(s) { return s.id === id; });
        if (!held) return state.unusedSDGs.splice(i, 1)[0];
      }
      return null;
    };
    var swapGoal = function(si) {
      var old = p.sdgs[si];
      var newId = takeUnused(p);
      if (newId === null) { log(t("noValid")); done(); return; }
      state.unusedSDGs.unshift(old.id);
      p.sdgs[si] = { id: newId, progress: old.progress, immune: old.immune };
      log(p.name + " " + cardTitle(card) + ": SDG " + old.id + " -> SDG " + newId + " (" + old.progress + ")", "special");
      done();
    };
    if (!state.unusedSDGs.length) { log(t("noValid")); done(); return; }
    if (isAI) {
      showAINotice("[" + p.name + "] " + t("aiTarget"));
      trackTimeout(function() { hideAINotice(); swapGoal(0); }, 1000);
    } else {
      pickSDG(p, t("selectSDGSwap"), swapGoal);
    }
    return;
  }

  log(cardTitle(card) + " OK", "special");
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
/* Targets for Back to Square One / Stance Reversal. GOAL-locked cards and cards
   under Policy Exemption cannot be hit, so they are not offered as choices. */
function pickAnySDG(title, cb, onNoTarget) {
  var body = "<div class=\"modal-list\">";
  var count = 0;
  state.players.forEach(function(pl, pi) {
    pl.sdgs.forEach(function(s, si) {
      if (!isValidNeg(s)) return;
      count++;
      body += "<button data-p=\"" + pi + "\" data-s=\"" + si + "\">" + pl.name + " SDG " + s.id + " (" + s.progress + ")</button>";
    });
  });
  body += "</div>";
  if (!count) { log(t("noValid")); (onNoTarget || function() {})(); return; }
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
      document.getElementById("winnerText").textContent = pl.name + t("winSuffix");
      log(pl.name + " " + t("winLog"), "win");
      return;
    }
  }
}

/* init */
applyI18n();
