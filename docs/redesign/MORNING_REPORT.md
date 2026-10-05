# MORNING REPORT — 2026-10-04 夜間改版交付

## 一句話總結
**P1–P4 全部完成**：設計系統、全站外殼（23 頁換新臉）、首頁沉浸式、內頁編輯式——全部只在本機 `feature/redesign-night` 分支（4 個 commit），**未 push、未部署**，等你在 localhost 確認。

## 怎麼打開
雙擊 repo 裡的 `本機預覽.command` → 瀏覽器自動開 `http://127.0.0.1:8080`（我 bırak 的臨時伺服器已清乾淨，8080 是你的）。

## 建議先看的 5 個頁面
| # | 網址 | 看什麼 |
|---|---|---|
| 1 | `http://127.0.0.1:8080/` | 全新沉浸式首頁：深墨綠全螢幕 hero＋**游標附近的分子粒子場**（會牽線排斥）、"Welcome" 逐字升起、Capture 螢光呼吸底線、磁吸按鈕、數字進場 count-up、bento 卡。往下滾有章節綠色進度軌 |
| 2 | `http://127.0.0.1:8080/styleguide` | 新設計系統總覽：全部色彩 token（含 WCAG 對比標注）、字級階、按鈕/卡片/表格/空白頁骨架。**右上角 🌓 按下去全站變深夜模式** |
| 3 | `http://127.0.0.1:8080/description` | 編輯式內頁範本：hero 加高墨綠化、章節 h2 螢光短線、**頁頂 sticky 章節膠囊導航＋scroll-spy 亮點**、段落捲動淡入。原有翻面卡/引用表全部還在 |
| 4 | `http://127.0.0.1:8080/human-practices` | 編輯式＋深色模式雙重檢視；訪談區塊導覽條很好用。桌遊之外的 HP 頁同樣式 |
| 5 | `http://127.0.0.1:8080/results` | 空白頁新骨架：琥珀色 TODO 徽章＋斜紋佔位區，誠實標示「內容待團隊提供」 |

其他快速點閱：`/team`（深底+人像卡翻新、自拍亭原樣）、`/parts`、`/notebook`、`/lab-book`。
**故意沒動的**：`/engineering`（DBTL rail）、`/board-game`（Firebase 連線）、`/hardware` `/model` `/software` `/education`（hw-nexus/edu-nexus 自持深青宇宙主題）——如發現它們臉變了就是我做錯，請告訴我。

## 新設計系統（「Bioluminescence 生物螢光」）
- **配色**：紙白 `#fffdf7` 底／深墨綠 `#06402e`・`#075a3e`（承接全站既有主綠）／生技 teal `#14b391`／**GFP 螢光綠 `#a0e860`（只當裝飾與暗底文字）**／琥珀 `#d8b26a` 強調線。深色模式＝深夜培養皿 `#04150f` 上螢光發亮。主要搭配都驗算過 WCAG AA。
- **字型**：沿用 Changa（已在 iGEM 伺服器、零風險），以字重＋字距做層次；中文目前落系統字型（見待辦）。
- **動態**：expo-out 主曲線、滾動 reveal／clip 揭露、章節進度軌道、換頁 circle-bloom（View Transitions 全站原本就有，已保留）。`prefers-reduced-motion` 全部關掉裝飾動。
- 詳情與網址：`http://127.0.0.1:8080/styleguide` ＋ `docs/redesign/DESIGN_SYSTEM.md`。

## 已知問題（誠實清單）
1. **深色模式是掃描式覆蓋**：外殼與常見 bootstrap 面已整潔；各頁自購面板（如 description 引用表、quiz/tour 卡）深色下可能有細微對比不佳的角落——看到請標出來我精修。
2. **375px 截圖檢查沒做**（這臺機器沒有可用的無頭 Chromium）； защиты靠 html `overflow-x: clip`（既有）＋新元件全部 width:100% 設計。手機實機請快速滑一輪。
3. **mega menu 只是視覺升級**：DOM 未重構（menu-germ.js 依賴舊結構），所以沒有真正的雙欄 mega menu，只做了加寬面板＋發光停留點。
4. **Lenis 平滑捲動**在亮色內頁啟動；若你覺得「飄」，`static/js/motion.js` 搜 `new window.Lenis` 註解掉一行即可全站關閉。
5. **昨晚的教訓**：dev server 會快取 Jinja 模板，曾出現 curl 拿舊頁面的假故障——`.command` 用的是 debug 模式沒這問題。
6. styleguide 頁目前**會進建置**（app.py generator 自動收錄）；你確認設計定案後我再處理下架或收進選單。

## 需要你的待辦
- [ ] 上傳 **Noto Sans TC woff2 子集**到 iGEM uploads（中文才有正式字體；上傳後我在 tokens 加一行 `--font-zh`）
- [ ] 補 **Key Achievements** 內容（首頁 bento 已有 TODO 徽章）
- [ ] 7 個空白頁內容：results / contribution / biosafety / entrepreneurship / inclusivity / sustainability / alternative-platform
- [ ] 決定：特殊獎四頁要不要進導覽列
- [ ] 確認 footer 的 `gitlab.igem.org/2026/ncku-tainan` 是正確 repo 位址（照你指示設的）
- [ ] （可選）挑 3–5 個 Awwwards/CSSDA 參考站＋喜歡的點，下一輪_direction_更準

## 回溯地圖（全部只在本地）
分支 `feature/redesign-night`，base = `fe93ea1`：
| hash | 階段 |
|---|---|
| `000de95` | P1+P2 設計系統＋全站外殼＋footer 修 GitLab 連結 |
| `86e6a44` | P3 首頁沉浸式（粒子 hero/kinetic/bento，文案零增修） |
| `76d871d` | P4 內頁編輯式（sticky 導航＋scroll-spy＋骨架＋深色掃描） |
| `e087653` | 收尾：註解正體化、hero 鈕對比修正、保護名單補強 |

單步回退：`git revert <hash>`｜整段回退到原貌：`git checkout fe93ea1 -- wiki static && git clean -fd`（會連 docs/ 一起清，慎用）。
結構性驗證已過：freeze EXIT=0、24 頁全 200、每頁 footer 含 CC-BY-4.0＋GitLab、保護檔（LICENSE/.gitlab-ci.yml/DBTL/桌遊/自拍亭 JS）diff 全空、無新增外部網址。
