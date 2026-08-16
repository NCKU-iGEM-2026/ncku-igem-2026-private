/* ========== CONSTANTS ========== */
var GOAL = 2; // track runs -2..GOAL
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
    selectTarget: "選擇目標玩家", selectOwnCard: "選擇要給出的手牌",
    selectTheirCard: "選擇要拿取的手牌", selectOwnSDG: "選擇自己的 SDG",
    selectTheirSDG: "選擇對方的 SDG", selectFromDiscard: "從棄牌堆選一張",
    selectSDGSwap: "選擇要交換的 SDG", noValid: "沒有符合條件的目標",
    useVeto: "是否使用否決權？", yes: "使用", no: "不使用",
    capacityChoose: "能力建構：請選擇棄置一張",
    aiDraft: "正在思考要選哪 2 張 SDG...", aiPlay: "正在決定出牌...",
    aiTarget: "正在選擇目標...", next: "下一步", onlineSoon: "線上模式即將推出，目前請先使用本地模式。",
    max2: "已滿（2人）", picks: "人已選", flipReveal: "翻牌",
    resetCard: "捲土重來", reverseCard: "立場反轉", deckFlip: "牌堆",
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
    selectTarget: "Select target player", selectOwnCard: "Select your card to give",
    selectTheirCard: "Select card to take", selectOwnSDG: "Select your SDG",
    selectTheirSDG: "Select opponent's SDG", selectFromDiscard: "Pick from discard",
    selectSDGSwap: "Select SDG to swap", noValid: "No valid targets",
    useVeto: "Use Veto?", yes: "Yes", no: "No",
    capacityChoose: "Capacity: choose one to discard",
    aiDraft: "is choosing 2 SDG goals...", aiPlay: "is deciding plays...",
    aiTarget: "is selecting targets...", next: "Next", onlineSoon: "Online mode coming soon.",
    max2: "Full (2)", picks: "picked", flipReveal: "revealed",
    resetCard: "Back to Square One", reverseCard: "Stance Reversal", deckFlip: "Deck",
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
  {title_zh:"金融海嘯",title_en:"Financial Crisis",subtitle_zh:"西元2008年",subtitle_en:"2008 CE",description_zh:"美國次級房貸市場崩盤，雷曼兄弟宣告破產，引發骨牌效應。",description_en:"The U.S. subprime mortgage market collapsed; Lehman Brothers filed for bankruptcy.",forward:[],backward:[1,8]},
  {title_zh:"莫拉克颱風",title_en:"Typhoon Morakot",subtitle_zh:"西元2009年",subtitle_en:"2009 CE",description_zh:"帶來破紀錄豪雨，重創南台灣，小林村遭土石流滅村。",description_en:"Record-breaking rainfall devastated southern Taiwan, wiping out Xiaolin Village.",forward:[],backward:[11]},
  {title_zh:"焚書坑儒",title_en:"Burning of Books",subtitle_zh:"西元前213年",subtitle_en:"213 BCE",description_zh:"秦始皇下令焚燒諸子百家典籍，並坑殺方士儒生，箝制思想言論。",description_en:"Qin Shi Huang ordered classical texts burned and scholars buried alive.",forward:[],backward:[4]},
  {title_zh:"開普敦Day Zero",title_en:"Cape Town Day Zero",subtitle_zh:"西元2018年",subtitle_en:"2018 CE",description_zh:"南非開普敦遭遇嚴重乾旱，水庫存量逼近枯竭，全市面臨限水危機。",description_en:"Cape Town faced severe drought as reservoirs nearly ran dry.",forward:[],backward:[6]},
  {title_zh:"烏俄戰爭",title_en:"Russo-Ukrainian War",subtitle_zh:"西元2014年至今",subtitle_en:"2014-present",description_zh:"俄羅斯與烏克蘭爆發武裝衝突，戰火摧毀基礎建設，糧食與能源供應鏈受創。",description_en:"Conflict destroyed infrastructure and disrupted food and energy supply chains.",forward:[],backward:[2,17]},
  {title_zh:"東非飢荒",title_en:"East African Famine",subtitle_zh:"長期反覆發生",subtitle_en:"Recurring",description_zh:"乾旱與衝突交織，東非多國反覆陷入嚴重飢荒，糧食安全岌岌可危。",description_en:"Drought and conflict repeatedly pushed East Africa into severe famine.",forward:[17],backward:[1,2]},
  {title_zh:"阿富汗限制女性受教育",title_en:"Afghanistan Girls' Education Ban",subtitle_zh:"西元2021年",subtitle_en:"2021 CE",description_zh:"塔利班重掌政權後禁止女性接受中學以上教育，女性受教權大幅倒退。",description_en:"After the Taliban retook power, girls were banned from secondary education.",forward:[],backward:[4,5,10]},
  {title_zh:"香港食水含鉛事件",title_en:"HK Lead-in-Water Scandal",subtitle_zh:"西元2015年",subtitle_en:"2015 CE",description_zh:"香港部分公共屋邨食水被驗出含鉛量超標，居民健康受到威脅。",description_en:"Excessive lead levels found in tap water at Hong Kong public housing.",forward:[],backward:[3,6,11]},
  {title_zh:"石油危機",title_en:"Oil Crisis",subtitle_zh:"西元1973年",subtitle_en:"1973 CE",description_zh:"中東產油國禁運石油，全球油價暴漲，各國經濟陷入衰退。",description_en:"Middle Eastern oil embargo sent prices soaring worldwide.",forward:[7],backward:[9]},
  {title_zh:"COVID-19封城",title_en:"COVID-19 Lockdowns",subtitle_zh:"西元2020年",subtitle_en:"2020 CE",description_zh:"新冠疫情爆發，各國實施封鎖措施，經濟活動大幅停擺。",description_en:"Nationwide lockdowns halted economies but helped contain the virus.",forward:[3],backward:[8,17]},
  {title_zh:"福島核災",title_en:"Fukushima Disaster",subtitle_zh:"西元2011年",subtitle_en:"2011 CE",description_zh:"東日本大地震引發海嘯，重創福島核電廠，造成輻射外洩。",description_en:"Earthquake and tsunami crippled Fukushima nuclear plant.",forward:[],backward:[3,7,14]},
  {title_zh:"種族隔離制度",title_en:"Apartheid",subtitle_zh:"西元1948年至1994年",subtitle_en:"1948-1994",description_zh:"南非政府依種族實施隔離與差別待遇，長期剝奪黑人基本權利。",description_en:"South Africa enforced racial segregation and discrimination.",forward:[],backward:[4,10,16]},
  {title_zh:"快時尚盛行",title_en:"Rise of Fast Fashion",subtitle_zh:"約2000年代至今",subtitle_en:"2000s-present",description_zh:"平價快速時尚崛起，服飾快速生產與淘汰成為主流消費模式。",description_en:"Cheap, rapidly produced clothing became the dominant model.",forward:[],backward:[12,13]},
  {title_zh:"澳洲森林大火",title_en:"Australian Bushfires",subtitle_zh:"西元2019年至2020年",subtitle_en:"2019-2020",description_zh:"澳洲遭遇史上最嚴重森林大火，燒毀大片林地，無數野生動物喪生。",description_en:"Worst wildfire season on record burned vast forests.",forward:[],backward:[13,15]},
  {title_zh:"墨西哥灣漏油事故",title_en:"Deepwater Horizon Oil Spill",subtitle_zh:"西元2010年",subtitle_en:"2010 CE",description_zh:"深水地平線鑽油平台爆炸，大量原油外洩污染墨西哥灣。",description_en:"Oil rig explosion spilled massive crude into the Gulf of Mexico.",forward:[],backward:[6,14]},
  {title_zh:"山老鼠盛行",title_en:"Illegal Logging",subtitle_zh:"長期存在，當代持續中",subtitle_en:"Ongoing",description_zh:"台灣山區長期存在盜伐珍貴林木的非法行為，破壞山林生態。",description_en:"Illegal logging of valuable timber damages forest ecosystems.",forward:[],backward:[12,15]},
  {title_zh:"黑死病",title_en:"The Black Death",subtitle_zh:"14世紀",subtitle_en:"14th century",description_zh:"鼠疫在歐亞大陸大流行，造成數千萬人死亡，社會結構全面動搖。",description_en:"Plague swept Eurasia, killing tens of millions.",forward:[],backward:[1]},
  {title_zh:"冷戰",title_en:"The Cold War",subtitle_zh:"西元1947年至1991年",subtitle_en:"1947-1991",description_zh:"美蘇兩大陣營長期對峙，軍備競賽與代理人戰爭牽動全球局勢。",description_en:"US-USSR rivalry with arms race shaped global politics.",forward:[],backward:[9,17]},
  {title_zh:"蘇伊士運河堵塞",title_en:"Suez Canal Blockage",subtitle_zh:"西元2021年",subtitle_en:"2021 CE",description_zh:"貨櫃輪長賜號擱淺堵住蘇伊士運河，全球海運供應鏈大亂。",description_en:"Ever Given ran aground, blocking the Suez Canal.",forward:[],backward:[8,9,17]},
  {title_zh:"裹小腳",title_en:"Foot Binding",subtitle_zh:"約10世紀至20世紀初",subtitle_en:"c.10th-20th c.",description_zh:"中國古代盛行纏足習俗，女性自幼被迫束腳變形以符合審美標準。",description_en:"Custom forcing girls' feet into deformity for beauty standards.",forward:[],backward:[5,16]},
  {title_zh:"榮譽殺人",title_en:"Honor Killing",subtitle_zh:"持續至今",subtitle_en:"Ongoing",description_zh:"部分地區以「維護家族名譽」為由，對違反傳統規範的女性施以私刑。",description_en:"Women subjected to violence in the name of family honor.",forward:[],backward:[5,16]},
  {title_zh:"大規模停電",title_en:"Large-Scale Blackouts",subtitle_zh:"",subtitle_en:"",description_zh:"電網因天災、設備老舊或超載等因素癱瘓，大範圍地區陷入停電。",description_en:"Power grids collapse, cutting electricity across wide areas.",forward:[],backward:[7]},
  {title_zh:"過度包裝文化",title_en:"Overpackaging Culture",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"商品為求精美與促銷，層層包裝造成大量不必要的資源浪費。",description_en:"Excessive packaging wastes huge amounts of resources.",forward:[],backward:[12,15]},
  {title_zh:"幽靈漁網",title_en:"Ghost Fishing Nets",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"廢棄或遺失的漁網持續漂流海中，纏繞並困死大量海洋生物。",description_en:"Abandoned nets drift, entangling and killing marine animals.",forward:[],backward:[12,14]},
  {title_zh:"獵巫運動",title_en:"Witch Trials",subtitle_zh:"15世紀至17世紀",subtitle_en:"15th-17th c.",description_zh:"歐洲曾大規模迫害「女巫」，數萬名女性遭指控並處以極刑。",description_en:"Widespread persecution of accused witches in Europe.",forward:[],backward:[5]},
  {title_zh:"同性婚姻法通過",title_en:"Same-Sex Marriage Legalization",subtitle_zh:"多國陸續完成立法",subtitle_en:"Multiple countries",description_zh:"多國陸續完成同性婚姻合法化，保障婚姻平權。",description_en:"Multiple countries legalized same-sex marriage.",forward:[5,10,16],backward:[]},
  {title_zh:"建立自來水系統",title_en:"Modern Tap Water Systems",subtitle_zh:"近代至今",subtitle_en:"Modern era",description_zh:"現代自來水系統普及，提供乾淨用水與衛生保障。",description_en:"Modern tap water systems provide clean water and sanitation.",forward:[3,6],backward:[]},
  {title_zh:"世界關燈日",title_en:"Earth Hour",subtitle_zh:"每年3月最後一個週六",subtitle_en:"Annually",description_zh:"全球響應每年關燈一小時，喚起節能與氣候意識。",description_en:"Global event switching off lights to raise climate awareness.",forward:[7,12,13],backward:[]},
  {title_zh:"冰島同工同酬",title_en:"Iceland's Equal Pay Law",subtitle_zh:"西元2018年",subtitle_en:"2018 CE",description_zh:"冰島立法強制企業證明同工同酬，打擊性別薪資差距。",description_en:"Iceland required companies to prove equal pay for equal work.",forward:[5,10],backward:[]},
  {title_zh:"全民健保制度上路",title_en:"National Health Insurance",subtitle_zh:"1995年（台灣）",subtitle_en:"1995 Taiwan",description_zh:"台灣實施全民健康保險，讓醫療照護不再是有錢人的特權。",description_en:"Taiwan launched NHI, making healthcare accessible.",forward:[3,10],backward:[]},
  {title_zh:"法國反食物浪費法",title_en:"France's Anti-Food-Waste Law",subtitle_zh:"西元2018年",subtitle_en:"2018 CE",description_zh:"法國立法禁止超市丟棄未售出食物，要求捐贈給慈善機構。",description_en:"France banned supermarkets from discarding unsold food.",forward:[2,12],backward:[]},
  {title_zh:"歐盟2035禁售燃油車",title_en:"EU 2035 Combustion Car Ban",subtitle_zh:"2035年起生效",subtitle_en:"From 2035",description_zh:"歐盟通過2035年起禁售新燃油車，加速交通運具電動化。",description_en:"EU bans new fossil-fuel car sales from 2035.",forward:[7,11],backward:[]},
  {title_zh:"大阪世博",title_en:"Expo 2025 Osaka",subtitle_zh:"西元2025年",subtitle_en:"2025 CE",description_zh:"2025年大阪世博匯聚各國展現創新科技與國際合作成果。",description_en:"Nations showcased innovation and international cooperation.",forward:[9,17],backward:[]},
  {title_zh:"Coldplay世界巡迴演唱會",title_en:"Coldplay Music of the Spheres Tour",subtitle_zh:"西元2022年至今",subtitle_en:"2022-present",description_zh:"巡演大量採用可再生能源與觀眾發電地板，減少演唱會碳足跡。",description_en:"Tour used renewable energy and kinetic dance floors.",forward:[7,13],backward:[]},
  {title_zh:"聯合國千禧年減貧計畫",title_en:"UN Millennium Development Goals",subtitle_zh:"西元2000年",subtitle_en:"2000 CE",description_zh:"聯合國訂定千禧年發展目標，全球合力推動減貧與經濟發展。",description_en:"UN set MDGs mobilizing global efforts to cut poverty.",forward:[1,8],backward:[]},
  {title_zh:"綠色革命",title_en:"The Green Revolution",subtitle_zh:"1960年代至1990年代",subtitle_en:"1960s-1990s",description_zh:"農業技術與品種改良大幅提升糧食產量，但也帶來生態代價。",description_en:"Crop innovations boosted food production; ecological trade-offs.",forward:[1,2,9],backward:[15]},
  {title_zh:"紐西蘭女性投票權",title_en:"New Zealand Women's Suffrage",subtitle_zh:"西元1893年",subtitle_en:"1893 CE",description_zh:"紐西蘭成為全球第一個賦予女性投票權的國家。",description_en:"New Zealand became the first country to grant women the vote.",forward:[5,10,16],backward:[]},
  {title_zh:"網際網路普及",title_en:"Rise of the Internet",subtitle_zh:"1990年代至今",subtitle_en:"1990s-present",description_zh:"網路快速普及全球，但發展初期城鄉與貧富之間的落差明顯。",description_en:"Internet spread rapidly; early access gaps also emerged.",forward:[4,9],backward:[10]},
  {title_zh:"高速鐵路通車",title_en:"High Speed Rail Opens",subtitle_zh:"2007年（台灣）",subtitle_en:"2007 Taiwan",description_zh:"台灣高鐵通車，大幅縮短南北交通時間，帶動區域發展。",description_en:"Taiwan HSR cut north-south travel time drastically.",forward:[8,9,11],backward:[]},
  {title_zh:"海綿城市計畫",title_en:"Sponge City Initiative",subtitle_zh:"2010年代至今",subtitle_en:"2010s-present",description_zh:"城市透過透水鋪面與綠地設計提升防洪韌性，因應極端氣候。",description_en:"Permeable surfaces improve flood resilience.",forward:[11,13],backward:[]},
  {title_zh:"世界地球日",title_en:"Earth Day",subtitle_zh:"每年4月22日",subtitle_en:"April 22",description_zh:"每年4月22日全球舉辦環保活動，喚起大眾對地球生態的重視。",description_en:"Annual global environmental awareness campaigns.",forward:[12,14,15],backward:[]},
  {title_zh:"禁用一次性塑膠",title_en:"Single-Use Plastic Bans",subtitle_zh:"多國陸續立法",subtitle_en:"Worldwide",description_zh:"多國陸續立法禁用一次性塑膠製品，減少塑膠污染。",description_en:"Countries banned single-use plastics to curb pollution.",forward:[12,14,15],backward:[]},
  {title_zh:"全球禁捕商業捕鯨",title_en:"Commercial Whaling Moratorium",subtitle_zh:"西元1986年",subtitle_en:"1986 CE",description_zh:"國際捕鯨委員會實施全球商業捕鯨禁令，鯨魚族群逐漸恢復。",description_en:"IWC enacted a global moratorium on commercial whaling.",forward:[14],backward:[]},
  {title_zh:"減塑淨灘活動",title_en:"Beach Cleanup Movements",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"民間團體與政府推動海灘清潔行動，減少海洋與海岸垃圾。",description_en:"Community beach cleanups reduce ocean and coastal litter.",forward:[11,14,15],backward:[]},
  {title_zh:"國家公園設立",title_en:"Establishment of National Parks",subtitle_zh:"1872年首座起",subtitle_en:"Since 1872",description_zh:"各國劃設國家公園保護原始生態與自然景觀。",description_en:"Countries designated national parks to protect ecosystems.",forward:[15],backward:[]},
  {title_zh:"復育瀕危物種",title_en:"Endangered Species Recovery",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"保育組織透過人工繁殖與棲地復育，協助瀕危物種族群逐漸回升。",description_en:"Captive breeding and habitat restoration help species recover.",forward:[15],backward:[]},
  {title_zh:"世界人權宣言",title_en:"Universal Declaration of Human Rights",subtitle_zh:"西元1948年",subtitle_en:"1948 CE",description_zh:"聯合國通過世界人權宣言，確立人人享有基本人權的普世價值。",description_en:"UN adopted the UDHR establishing basic rights for all.",forward:[5,10,16],backward:[]},
  {title_zh:"COVID-19疫苗國際合作",title_en:"COVID Vaccine Cooperation",subtitle_zh:"西元2020年至2021年",subtitle_en:"2020-2021",description_zh:"COVAX等機制促成各國共享疫苗資源，加速全球接種進度。",description_en:"COVAX enabled countries to share vaccine resources.",forward:[3,17],backward:[]},
  {title_zh:"人類基因組計畫",title_en:"Human Genome Project",subtitle_zh:"西元1990年至2003年",subtitle_en:"1990-2003",description_zh:"國際科學家合作解碼人類基因組，開啟精準醫療新時代。",description_en:"International scientists mapped the human genome.",forward:[3,9,17],backward:[]},
  {title_zh:"大禹治水",title_en:"Yu the Great Tames the Flood",subtitle_zh:"約西元前2000年",subtitle_en:"c.2000 BCE",description_zh:"相傳大禹以疏導取代圍堵治理黃河水患，奠定治水工程典範。",description_en:"Yu tamed Yellow River floods by channeling water.",forward:[6,9,11],backward:[]},
  {title_zh:"商鞅變法",title_en:"Shang Yang's Reforms",subtitle_zh:"西元前356年至前338年",subtitle_en:"356-338 BCE",description_zh:"商鞅在秦國推行法制與土地改革，強化國力與治理效率。",description_en:"Shang Yang implemented legal and land reforms in Qin.",forward:[8,16],backward:[]},
  {title_zh:"科舉制度建立",title_en:"Imperial Examination System",subtitle_zh:"西元605年",subtitle_en:"605 CE",description_zh:"隋朝建立科舉制度，讓平民也能透過考試晉身官場。",description_en:"Sui established exams letting commoners rise by merit.",forward:[4,8,16],backward:[]},
  {title_zh:"雅典民主制度",title_en:"Athenian Democracy",subtitle_zh:"西元前508年",subtitle_en:"508 BCE",description_zh:"古雅典建立公民直接參與政治的民主制度，影響後世政治發展。",description_en:"Athens established direct citizen participation in politics.",forward:[10,16],backward:[]},
  {title_zh:"文藝復興",title_en:"The Renaissance",subtitle_zh:"14世紀至17世紀",subtitle_en:"14th-17th c.",description_zh:"歐洲文藝復興帶動藝術、科學與人文思想的全面復興。",description_en:"European revival in art, science, and humanist thought.",forward:[4,9],backward:[]},
  {title_zh:"古騰堡活字印刷",title_en:"Gutenberg's Printing Press",subtitle_zh:"約1440年代",subtitle_en:"c.1440s",description_zh:"古騰堡發明活字印刷術，讓書籍大量生產，知識傳播加速。",description_en:"Movable type enabled mass book production.",forward:[4,10],backward:[]},
  {title_zh:"蒸汽機發明",title_en:"Invention of the Steam Engine",subtitle_zh:"約1712年至1769年",subtitle_en:"c.1712-1769",description_zh:"蒸汽機的發明帶來動力革命，推動工業與交通運輸大幅發展。",description_en:"Steam engine sparked a power revolution for industry.",forward:[7,8],backward:[]},
  {title_zh:"工業革命",title_en:"The Industrial Revolution",subtitle_zh:"18世紀中至19世紀",subtitle_en:"18th-19th c.",description_zh:"工業革命帶動生產力大躍進，但初期也伴隨高污染與高工時。",description_en:"Massive productivity gains with heavy early pollution.",forward:[8],backward:[13]},
  {title_zh:"哥倫布發現新大陸",title_en:"Columbus Reaches the Americas",subtitle_zh:"西元1492年",subtitle_en:"1492 CE",description_zh:"哥倫布抵達美洲開啟東西半球交流，但也帶來殖民剝削。",description_en:"Opened hemispheric contact but brought colonial exploitation.",forward:[8,17],backward:[10]},
  {title_zh:"社會住宅政策",title_en:"Social Housing Policy",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"政府興建社會住宅，提供中低收入戶可負擔的居住選擇。",description_en:"Governments build affordable housing for lower incomes.",forward:[1],backward:[]},
  {title_zh:"巴西「家庭補助金」",title_en:"Brazil's Bolsa Família",subtitle_zh:"西元2003年",subtitle_en:"2003 CE",description_zh:"巴西政府提供條件式現金補助，要求受助家庭送孩子上學並接種疫苗。",description_en:"Conditional cash transfers requiring school and vaccines.",forward:[1,2,4],backward:[]},
  {title_zh:"國際稻米研究所（IRRI）成立",title_en:"Founding of IRRI",subtitle_zh:"西元1960年",subtitle_en:"1960 CE",description_zh:"IRRI致力研發高產稻米品種，協助亞洲多國提升糧食產量。",description_en:"Develops high-yield rice varieties for Asia.",forward:[2,9],backward:[]},
  {title_zh:"維基百科誕生",title_en:"Wikipedia Launches",subtitle_zh:"西元2001年",subtitle_en:"2001 CE",description_zh:"維基百科以協作方式建立免費線上百科全書，開放全球共同編輯。",description_en:"Free collaboratively edited online encyclopedia.",forward:[4,17],backward:[]},
  {title_zh:"冰島選出全球首位民選女性總統",title_en:"Iceland First Elected Woman President",subtitle_zh:"西元1980年",subtitle_en:"1980 CE",description_zh:"冰島選出Vigdís Finnbogadóttir，成為全球首位經直接民選產生的女性元首。",description_en:"Iceland elected the world's first directly elected female president.",forward:[5],backward:[]},
  {title_zh:"倫敦下水道系統建立",title_en:"London Sewer System",subtitle_zh:"西元1859年至1875年",subtitle_en:"1859-1875",description_zh:"倫敦興建現代下水道系統，解決霍亂與污水氾濫問題。",description_en:"Modern sewers solved cholera and sewage overflow.",forward:[3,6,11],backward:[]},
  {title_zh:"海水淡化技術普及",title_en:"Desalination Technology Spreads",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"海水淡化技術日益成熟，協助缺水地區取得穩定淡水來源。",description_en:"Helps water-scarce regions secure freshwater.",forward:[6,9],backward:[]},
  {title_zh:"LED照明普及",title_en:"LED Lighting Adoption",subtitle_zh:"2000年代至今",subtitle_en:"2000s-present",description_zh:"LED燈泡逐漸取代傳統燈泡，大幅降低照明耗電量。",description_en:"LEDs replaced traditional lighting, cutting electricity use.",forward:[7,12],backward:[]},
  {title_zh:"珊瑚礁復育計畫",title_en:"Coral Reef Restoration",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"科學家透過人工復育與移植技術，協助受損珊瑚礁重新生長。",description_en:"Coral farming and transplantation help reefs regrow.",forward:[13,14],backward:[]},
  {title_zh:"禁用魚翅政策",title_en:"Shark Fin Bans",subtitle_zh:"多國陸續立法",subtitle_en:"Worldwide",description_zh:"多國與航空公司禁止魚翅交易與運輸，抑制過度捕撈鯊魚。",description_en:"Bans on shark fin trade curb overfishing.",forward:[12,14],backward:[]},
  {title_zh:"海龜保育計畫",title_en:"Sea Turtle Conservation",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"保育團體透過巡護海灘、保護產卵地協助海龜族群逐漸復育。",description_en:"Beach patrols and nesting protection help turtles recover.",forward:[14,15],backward:[]},
  {title_zh:"天然林禁伐政策",title_en:"Primary Forest Logging Bans",subtitle_zh:"多國陸續立法",subtitle_en:"Worldwide",description_zh:"多國立法禁止砍伐原始天然林，保護森林碳匯與生物多樣性。",description_en:"Bans on logging primary forests protect carbon sinks.",forward:[13,15],backward:[]},
  {title_zh:"最低工資制度",title_en:"Minimum Wage Laws",subtitle_zh:"各國陸續實施",subtitle_en:"Worldwide",description_zh:"政府訂立最低工資標準，保障勞工基本收入水準。",description_en:"Minimum wage standards guarantee baseline income.",forward:[1],backward:[]},
  {title_zh:"滴灌技術發明",title_en:"Invention of Drip Irrigation",subtitle_zh:"1960年代（以色列）",subtitle_en:"1960s Israel",description_zh:"滴灌技術精準供水給作物根部，大幅提升灌溉用水效率。",description_en:"Delivers water precisely to roots, improving efficiency.",forward:[2,6],backward:[]},
  {title_zh:"糧食銀行成立",title_en:"Founding of Food Banks",subtitle_zh:"1967年首創",subtitle_en:"Since 1967",description_zh:"糧食銀行媒合多餘食物與有需要的家庭，減少浪費並協助弱勢。",description_en:"Connect surplus food with families in need.",forward:[1,2,12],backward:[]},
  {title_zh:"國際婦女節",title_en:"International Women's Day",subtitle_zh:"每年3月8日",subtitle_en:"March 8",description_zh:"每年3月8日全球紀念並倡議女性權益與性別平等。",description_en:"Global day advocating women's rights and equality.",forward:[5],backward:[]},
  {title_zh:"禁止童婚法",title_en:"Child Marriage Bans",subtitle_zh:"多國陸續立法",subtitle_en:"Worldwide",description_zh:"多國立法禁止未成年結婚，保護兒童權益與身心發展。",description_en:"Laws ban child marriage to protect children's rights.",forward:[3,5,16],backward:[]},
  {title_zh:"Girls Who Code成立",title_en:"Founding of Girls Who Code",subtitle_zh:"西元2012年",subtitle_en:"2012 CE",description_zh:"非營利組織Girls Who Code致力縮小科技領域性別落差，推動女性程式教育。",description_en:"Works to close the tech gender gap via coding education.",forward:[4,5],backward:[]},
  {title_zh:"雨水回收系統",title_en:"Rainwater Harvesting Systems",subtitle_zh:"當代",subtitle_en:"Modern",description_zh:"建築物設置雨水回收系統，收集雨水再利用於澆灌與沖廁。",description_en:"Buildings collect rainwater for irrigation and flushing.",forward:[6,11],backward:[]}
];

var specialCards = [
  {title_zh:"永續轉型",title_en:"Sustainable Transition",type:"sustain",description_zh:"將自己一張未使用的 SDG 替換成新的，並保留原本的進度。",description_en:"Swap one of your SDGs with an unused one; progress is kept."},
  {title_zh:"否決權",title_en:"Veto",type:"veto",description_zh:"取消一張即將生效的特殊牌，該牌直接棄置且不生效。",description_en:"Cancel a special card about to resolve; it is discarded unused."},
  {title_zh:"政策豁免",title_en:"Policy Exemption",type:"immunity",description_zh:"指定自己一張 SDG，本回合免受負面效果影響。",description_en:"Choose one of your SDGs; immune to negatives this turn."},
  {title_zh:"捲土重來",title_en:"Back to Square One",type:"reset",description_zh:"將任一玩家一張尚未達標的 SDG 進度歸零。",description_en:"Reset any non-GOAL SDG progress to zero."},
  {title_zh:"國際制裁",title_en:"International Sanctions",type:"sanction",description_zh:"指定的玩家下一個行動階段無法出牌或棄牌。",description_en:"Target player cannot play or discard next Action Phase."},
  {title_zh:"能力建構",title_en:"Capacity Building",type:"capacity",description_zh:"抽牌階段多抽 1 張，並從中棄置 1 張。",description_en:"Draw one extra in Draw Phase; discard one of those drawn."},
  {title_zh:"立場反轉",title_en:"Stance Reversal",type:"reverse",description_zh:"將任一 SDG 的進度正負反轉（+2 變 -2，-1 變 +1）。",description_en:"Flip the sign of any SDG's progress (+2 -> -2, -1 -> +1)."},
  {title_zh:"歷史借鏡",title_en:"Lessons from History",type:"history",description_zh:"檢視棄牌堆最上方 5 張，選 1 張加入手牌，其餘依序放回。",description_en:"Look at top 5 discard cards; take 1, return rest in order."},
  {title_zh:"合作備忘錄",title_en:"MOU",type:"tradeHand",description_zh:"與任一玩家交換一張各自指定的手牌。",description_en:"Swap one chosen hand card with another player."},
  {title_zh:"目標重整",title_en:"Goal Realignment",type:"swapSDG",description_zh:"與任一玩家交換一張 SDG，進度保留。",description_en:"Swap one SDG each with another player; progress kept."}
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
    document.getElementById("announceCardName").textContent = cardTitle(card);
    document.getElementById("announceSub").textContent = cardSub(card) || (card.kind === "event" ? t("historyEvent") : t("specialCard"));
    document.getElementById("announceDesc").textContent = cardDesc(card);

    var effectsEl = document.getElementById("announceEffects");
    effectsEl.innerHTML = "";
    var affected = options.affectedSDGs || [];
    if (affected.length) {
      affected.forEach(function(a) {
        var tag = document.createElement("span");
        tag.className = "sticky-note " + (a.delta > 0 ? "up" : "down");
        tag.textContent = "SDG " + a.id + " " + (a.delta > 0 ? "📈" : "📉") + " " + (a.delta > 0 ? "+" : "") + a.delta;
        effectsEl.appendChild(tag);
      });
    } else if (card.kind === "event") {
      (card.forward || []).forEach(function(id) {
        var tag = document.createElement("span");
        tag.className = "sticky-note up";
        tag.textContent = "SDG " + id + " 📈 +1";
        effectsEl.appendChild(tag);
      });
      (card.backward || []).forEach(function(id) {
        var tag = document.createElement("span");
        tag.className = "sticky-note down";
        tag.textContent = "SDG " + id + " 📉 -1";
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
      title_zh: c.title_zh, title_en: c.title_en,
      subtitle_zh: c.subtitle_zh, subtitle_en: c.subtitle_en,
      description_zh: c.description_zh, description_en: c.description_en,
      forward: (c.forward || []).slice(), backward: (c.backward || []).slice(),
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
      effect = "<div class=\"card-effect\">" + cardDesc(card) + "</div>";
    }
    div.innerHTML = "<div class=\"card-header\">" + (card.kind === "event" ? t("historyEvent") : t("specialCard")) + "</div>" +
      "<div class=\"card-body\"><div class=\"card-name\">" + cardTitle(card) + "</div>" + effect + "</div>";
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
    if (!holders.length) { resolve(false); return; }
    var h = holders[0];
    showModal(t("useVeto"), "<p>" + h.pl.name + ": " + cardTitle(card) + "</p>", [
      { label: t("yes"), class: "success", fn: function() {
        h.pl.hand.splice(h.idx, 1);
        state.discard.push({ type: "veto", title_zh: "否決權", title_en: "Veto", kind: "special" });
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
    log(t("flipReveal") + ": " + cardTitle(card), "sys");
    await showCardAnnouncement(t("deckFlip"), card, { affectedSDGs: affected });
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
    return "<button data-i=\"" + i + "\">" + cardTitle(c) + "</button>";
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
      document.getElementById("winnerText").textContent = pl.name + t("winSuffix");
      log(pl.name + " " + t("winLog"), "win");
      return;
    }
  }
}

/* init */
applyI18n();
