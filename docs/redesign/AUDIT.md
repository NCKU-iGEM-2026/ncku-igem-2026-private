# NCKU-Tainan iGEM 2026 Wiki 重新設計 — 階段 0 盤點報告

> 產出日期：2026-10-04。本階段**只讀不寫**（本報告是唯一新增檔）。
> ⚠️ 本機目錄是使用者複製出來的**沙箱副本**：一律不 push GitHub、不 commit，
> 所有改動留在工作區，等使用者在瀏覽器確認可用後才由使用者自行併入主線。

---

## 0. repo 狀態與環境（重要前提）

| 項目 | 狀態 |
|---|---|
| 目前分支 | `dev`，落後 `origin/dev` **35 個 commit** |
| 遠端 | `github.com:NCKU-iGEM-2026/ncku-igem-2026-private.git`（GitHub，非提示詞假設的 GitLab；repo 內仍留 `.gitlab-ci.yml`，照規矩不改） |
| 本次工作約定 | ❌ 不 push、不 commit；✅ 僅改工作區 → 使用者看過 → 使用者自行併主線 |
| 遠端注意 | `teams.igem.org` 等 iGEM 官方連結照規矩不動；僅 footer GitLab 連結需指向團隊 repo |
| 併回主線風險 | 本地落後 35 commit，實質併入前必須先 `git fetch` + rebase／對照 upstream 改動，否則會蓋掉隊友的工作 |
| `venv/` | **壞掉**：是由原作者電腦（路徑 `/Users/anniexuan/...`）整包複製過來的，interpreter 不存在，無法啟動 Flask |
| 系統 python3 | 3.15.0a2（alpha），未裝 flask — **不建議直接裝進系統** |
| 本機預覽解法 | 需要人類執行一次：`python3.12 -m venv venv && venv/bin/pip install -r dependencies.txt`（或先 `rm -rf venv/` 再建） |
| `styleguide.html` | 尚不存在（階段 1 才建） |
| `static/vendor/` | 尚不存在（GSAP／Lenis／Three.js 皆未下載） |

**現況技術棧**：Flask 3.1.3 + Frozen-Flask 1.0.2（版本釘死於 `dependencies.txt`）、Bootstrap 5.3（自架 `static/bootstrap.min.css`）、原生 JS。
無 Node、無 build step——新互動必須維持「纯 HTML+CSS+原生 JS＋可自架 vendor 庫」路線。

---

## 1. 共用骨架

### `app.py`（50 行）
- `/` → `pages/home.html`；`/<page>` → `pages/<page>.html`（小寫化）。
- `all_wiki_pages` generator 明確列出所有 pages，**新增 HTML 檔會自動進建置**（styleguide.html 會是例外——它會自動進 freeze；階段 9 再處理下架）。
- `python app.py` 開 port 8080；`flask freeze` 輸出 `public/`。

### `wiki/layout.html`（69 行）
- blocks：`title, body_class, header, hero_image, hero_title, lead, page_content, extra_scripts`。
- 預設 hero：全站同一張 `banner/education.avif` 黃帶＋`page-hero-tint`，多數頁面沿用預設 → **hero 辨識度低的根因**。
- 已內建 `#backToTop`（由 `navbar-scroll.js` 驅動）。
- 載入順序：bootstrap → style.css（單檔 10,406 行全站載入）→ bundle → navbar-scroll → menu-germ。

### `wiki/menu.html`（78 行）
- Bootstrap `fixed-top` dark navbar；六個 dropdown：Home / Project / Wet / Dry / HP / Team。
- ⚠️ **選單與任務分組不一致**：`Notebook` 掛在 Project 選單、`Board Game` 掛在 HP 選單；`contribution`、`biosafety-and-security`、`results` 的位置與 iGEM 官方 wiki 結構不完全對齊。階段 2 重做導覽列時需與使用者確認分類。
- 選單未收錄的頁面（靠 generator 進建置）：`entrepreneurship`、`inclusivity`、`sustainability`、`alternative-platform`——這四個「特殊獎」頁目前**沒有入口連結**，階段 2 需決定要不要進選單。

### `wiki/footer.html`（74 行）
- ✅ CC-BY-4.0 聲明齐全（第 68 行）。
- ⚠️ **第 69 行 GitLab repo 連結是通用的 `https://gitlab.igem.org`**，未指向團隊 repo（應為 `gitlab.igem.org/2026/ncku-tainan` 之類，請人類確認實際 repo 位址）。階段 2 一併修。
- 贊助商跑馬燈（兩軌重複 logo，`sponsor-marquee`）11 家贊助。

---

## 2. 全域現況：色彩・字型・CSS 結構

### 色彩（style.css 高頻 hex）
| hex | 用量 | 角色 |
|---|---|---|
| `#075a3e` | 138 | 主深綠（全站品牌色） |
| `#fffdf7` | 41 | 紙白底 |
| `#1f4a38` | 26 | 深綠變體 |
| `#d8b26a` / `#e6b060` | 35 | 金黃accent（hero 帶） |
| `#14b391` / `#49c5b6` | 17 | 螢光 teal（乾實驗室系） |
| `#a0e860` | 9 | 亮綠（nav hover） |
| `#dfe8e2`、`#cfdcd5`、`#5f6e66`… | — | 中性灰綠階 |
| `#2c3e50→#1abc9c` | inline | home hero 的 CSS gradient（硬碼在 HTML 裡） |

已散/extensions 113 個 CSS 自訂變數（`--eng-*`、`--hwx-*`、`--edu-*`…）但**無全域 `:root` token 檔**——色彩靠複製貼上，無單一真相來源。階段 1 的 `tokens.css` 要把這些收攏。

### 字型
- 全站主體：**Changa**（7 個 weight，`@font-face` 指向 iGEM 靜態槽）——無襯線、偏科技感，**不支持中文**。
- 註記提及 `Noto Sans TC`（僅 1 處）、標題偶見 `Chango`、程式碼用系統 monospace（`--hwx-mono` 等）。
- ⚠️ 中文內容（逐字稿、特殊獎註解、地圖縣市名）落在 fallback 字型上，視覺不一致。若換字型需透過 iGEM uploads 上傳 woff2（清單見 §6）。

### style.css 區塊地圖（10,406 行）
| 行區 | 區塊 | 對應頁 |
|---|---|---|
| 1–480 | 全站基底／navbar／footer／hero | layout+menu+footer |
| 481–1199 | notebook 玻璃窗、team modal、photo booth | notebook+team |
| 1200–1428 | education dashboard+route map | education |
| 1429–1702 | project description 卡翻面／表格 | description |
| 1703–2287 | engineering DBTL rail | engineering |
| 2288–2343 | attributions AI 揭露 | attributions |
| 2344–2652 | education cosmos 側欄 | education+collaboration+promotion+human-practices |
| 2653–2893 | collaboration logo 牆 | collaboration |
| 2894–3057 | home opening 敘事 | home |
| 3058–3339 | promotion 麥克風 | promotion |
| 3340–3749 | lightbox／carousel／PDF 框 | education 系共用 |
| 3750–4499 | The Green Cabinet 桌遊 | board-game |
| 4500–5354 | lab book sheets+print | lab-book |
| 5355–7280 | Hardware CAPTURE-Reader+儀表板 | hardware |
| 7281–7419 | Capture 線上遊戲 | home+board-game |
| 7420–8599 | menu 下細菌動畫 | menu-germ |
| 8600–9332 | deep-teal 處理（**software+model+qx education 共用 `hw-nexus`**） | dry-lab |
| 9333–9568 | software LasReader | software |
| 9569–9717 | model | model |
| 9718–9836 | education content 側 | education |
| 9837–9897 | page transitions（已有轉場雏形） | layout |
| 9898–10215 | education album | education |
| 10216–end | parts registry | parts |

> 前綴統計：`edu-` 74、`hwx-` 75、`hw-` 85、`nb-` 25、`quiz` 22、`tour` 19、`hp-` 11、`parts-` 13、`eng-*` 走變數非 class。**遷移時不可按前綴機械拆分**——`hw-*` 同時服務 hardware/model/software/education 四頁（共 `body.hw-nexus`），這是遷移最大的地雷。

---

## 3. 逐頁盤點

### 內容豐富（重設計主戰場）
| 頁面 | 行數 | body_class | JS（DOM 掛鉤要點） | 現況與建議 |
|---|---|---|---|---|
| **home** 489 | — | capture-game, count-up, site-quiz, site-tour（`[data-count-to]`、`#siteTour`、`#quizOpen`、`.cap-*`） | 已有 story 敘事段＋count-up＋ quiz/tour。**建議：沉浸式主場**——把 jumbotron 換成 WebGL 粒子 hero（保留 `Welcome`+slogan 文案）、story 段接 ScrollTrigger pin、SVG 細菌 icon 保留 |
| **hardware** 1513 | `hw-nexus` | hardware-bench（`.hwx-*`）, hardware-cutaway（`#hw3d-*`、`[data-view]`） | 10 大 section、剖面圖、儀表板、Markdown log。全研究最重。**單獨一輪處理**；剖面 canvas 不得碰 |
| **model** 868 | `hw-nexus` | model-charts（canvas 自繪圖表） | 10 sections。編輯式：sticky TOC＋圖表 reveal；`hw-nexus` 深青色底已是半沉浸式 |
| **software** 1047 | `hw-nexus` | software-fit（`#swLab`）, lasreader-curve-fit | 擬合互動。編輯式＋ interact sandbox 視覺翻新 |
| **description** 440 | — | 無 JS | 8 sections、翻面卡、引用表。已有完整敘事骨架——編輯式直接加分：段落 reveal、引文標示（`desc-pending` badge 要保留，它標記缺引用处） |
| **team** 571 | — | team-bio-modal（`.polaroid-*`）, webcam-booth（camera！） | 47 張人像、翻面卡＋自拍亭。flip card 保留結構、強化 hover／focus |
| **education** 420 | `edu-nexus` | taiwan-map（`#edu-map` SVG）, education-{album,sidebar,gallery,counters}, edu-lightbox | 地圖＋側欄＋相簿＋counters＋ 4 個 iframe。互動密度全站第二高；Deep-teal cosmos 底已自成一格，翻新以「不加新機制、只升級質感」為原則 |
| **collaboration** 450 | — | education-gallery, edu-lightbox, education-sidebar | 80 張圖的 logo 牆＋相簿。編輯式画廊化 |
| **promotion** 236 | — | education-gallery, edu-lightbox, education-sidebar | 麥克風互動。編輯式＋保留 mic keys |
| **human-practices** 259 | — | 同上三件套 | 8 sections 10 圖。編輯式 |
| **notebook** 273 | — | notebook-{counters,hover-image,sort}（`#nbLedger`、`#nbSort`、`[data-hover-img]`） | 帳簿排序＋hover 照。玻璃窗區（style.css 481–780）正在建設期，只能微調不能重做 |
| **board-game** 464 | — | board-game.js（≈ 155KB 完整遊戲！）, board-game-net.js, sgd-progress（`.sgd-*`） | 綠能櫥遊戏＋Firebase 連線。**邏輯零更動**，只做外框／排版翻新（`[data-i18n]` 雙語要留） |
| **lab-book** 167 | — | 無 JS（print 樣式在 5181） | 玻璃窗(proto cols)已有設計語彙，統一化即可 |
| **engineering** 170 | `engineering-page` | engineering-dbtl（67KB！`#engineering-*`、`[data-stage]`、`.engineering-arc`）, engineering-gallery | 已有完整 rail+環形 DBTL 互動，最近才打磨過——**建議近乎不動**，只套 tokens |
| **parts** 210 | — | 無 JS | registry 列表。編輯式表格翻新 |
| **attributions** 67 | — | 無 | 已有 AI 揭露區（judge handbook 2026 p.95 要求，**文字不可刪減**） |

### 內容空白（只做骨架，禁止捏造）
`results` `contribution` `biosafety-and-security` `entrepreneurship` `inclusivity` `sustainability` `alternative-platform`
（共 7 頁，均為 11–14 行空壳；部分註解留中文提示如「特殊獎SDGs」）
→ 統一「即將上線」編輯式骨架＋顯眼 `<!-- TODO: 內容待團隊提供 -->`＋視覺佔位；不做假資料。**是否進導覽列請使用者拍板。**

---

## 4. 外部資源稽核（iGEM 紅線）

**✅ 無違規的「資源載入」**：全站 CSS/JS 皆自架或指向 `static.igem.wiki`；無 Google Fonts／CDN；Bootstrap 已自架。
**⚠️ 分類清單**（重設計時不可把非白名單連結當成「檔住」誤修，也不可新增）：

| 類別 | 網域 | 處置 |
|---|---|---|
| 功能必需（保留） | `*.firebasedatabase.app`×2（桌遊連線）、`console.firebase.google.com` | 不動 |
| 內容引用連結（可留） | en/zh/gan.wikipedia.org ×153、doi.org ×10、parts.igem.org | 是文字超連結不是資源載入；description 的引用位待補（已有 `desc-pending` 標記） |
| 社群／聯絡（保留） | instagram、facebook、share.google | footer 既有 |
| 其它團隊頁（可留） | teams.igem.org ×4、`igem-ncku-software.github.io` ×2 | 確認後保留 |
| 文件腳註（無害） | getbootstrap.com、popper.js.org、docs.gitlab.com、palletsprojects.com、pypi.org、python.org | 多在 vendor 檔头註解，不動 |
| **必修** | footer `gitlab.igem.org` 通用連結 | 改成團隊 repo 確切位址 |

---

## 5. 風險與不可破壞清單（全階段貼身守則）

1. **`hw-nexus` 一底四頁**：hardware/model/software/（qx education 變體）共用——改 `style.css` 該區段（8600–9332）牽動四頁。遷移時按「頁」不按「前缀」。
2. **Firebase 桌遊連線**：board-game-net.js 的 RTDB 位址與 `[data-i18n]` 雙語鍵不可動。
3. **webcam-booth**：相機權限流程動不得。
4. **engineering-dbtl（67KB）／board-game.js（155KB）**：剛完成的大模組，外殼翻新時只調 CSS，JS 不動。
5. **雙 repo**：沙箱無	push；併回 upstream 前先 fetch 比對 35 個落後 commit。
6. **壞 venv**：任何 `flask freeze`／`python app.py` 驗證前都要先重建 venv（見 §0）。
7. **既存 page transitions**（style.css 9837）：升級成 View Transitions 前先確認不會與現有轉場打架。
8. **iGEM uploads**：新素材（字型、hero 圖）只能列清單請人上傳，禁捏造 `static.igem.wiki` 路徑。

---

## 6. 需要人類處理的事項（彙總）

- [ ] 重建 venv（python3.12 + `pip install -r dependencies.txt`），恢复本機預覽／freeze 能力
- [ ] 確認 GitLab 團隊 repo 正確位址（footer 用）
- [ ] 下載 vendor 庫到 `static/vendor/`：GSAP 3（gsap.min.js + ScrollTrigger.min.js）、Lenis（lenis.min.js）；（Three.js 視首頁方案再定）
- [ ] 若要換字型：上傳 Inter／Space Grotesk + Noto Sans TC 的 woff2 子集到 iGEM uploads
- [ ] 補齊 7 個空白頁內容（或明確說「維持骨架」）
- [ ] 拍板：特殊獎四頁要不要進導覽列；Notebook 歸 Project 還是 Wet Lab
- [ ] 挑 3–5 個參考網站（Awwwards／CSSDA）＋喜歡什麼點，貼進總綱
- [ ] 每個階段結束在瀏覽器實際看過，確認後才進下一階段／才考慮併主線

---

## 7. 階段建議（依盤點微調原計畫）

- 階段 1（tokens+base+motion）：同時收攏 113 個散裝變數進 `:root`，舊變數以 alias 過渡。
- 階段 2（外殼）：一併修 footer GitLab 連結、決定特殊獎頁導覽。
- 階段 3（home）：Slogan「Secure the future, Capture the cure.」做 kinetic type；count-up 已存在，接 ScrollTrigger 即可。
- 階段 6（Dry Lab）：**拆兩次**——(a) hardware（1,513 行＋兩支大 JS），(b) software+model。
- 階段 7 補充：engineering **列最低優先**（剛打磨完，只套 tokens）。
- 階段 9（QA）：加驗「桌遊連線」「自拍亭」兩項功能回歸。
