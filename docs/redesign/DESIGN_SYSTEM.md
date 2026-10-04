# DESIGN SYSTEM —「Bioluminescence 生物螢光」

NCKU-Tainan iGEM 2026 wiki 全新品牌系統。靈感：螢光蛋白在培養皿中發光、
DNA 双螺旋的深度、金色菌落在暗處的光暈。專業科學感為骨，生物發光為魂。

## 1. 色彩系統

### 亮色模式（預設）
| Token | 色值 | 角色 | 對比驗證（on paper #fffdf7） |
|---|---|---|---|
| `--c-ink` | `#06402e` | 主墨綠：H1、導覽基底 | 10.9:1 AAA |
| `--c-ink-2` | `#075a3e` | 品牌綠（承接全站既有 138 處主色） | 7.8:1 AAA |
| `--c-text` | `#1e2b24` | 正文 | 13.9:1 AAA |
| `--c-text-2` | `#46564d` | 次級文字 | 7.7:1 AAA |
| `--c-text-3` | `#5f6e66` | 圖說、輔助 | 5.6:1 AA |
| `--c-teal` | `#14b391` | 互動強調（連結、進度） | 裝飾/large text |
| `--c-teal-deep` | `#0d8a70` | teal 文字級 | 4.6:1 AA |
| `--c-glow` | `#a0e860` | GFP 螢光：只用於裝飾、圖形、暗底 | — |
| `--c-amber` | `#d8b26a` | 琥珀強調線（承接既有 35 處） | 裝飾 |
| `--c-amber-deep` | `#8a6a1f` | 琥珀文字級 | 4.9:1 AA |
| `--c-paper` | `#fffdf7` | 頁面底（培養皿白） | — |
| `--c-line` | `#dfe8e2` | 分隔線 | — |

### 深色模式（`html[data-theme="dark"]`）
深夜 greenhouse：`#04150f` 底上，文字轉螢光。
`--c-text #e7f2ea`（15.8:1）、`--c-glow #b8f57e`、teal `#2edbb4`。
切換偏好存 `localStorage.rx-theme`，跟隨系統 `prefers-color-scheme` 為初始值。

### 使用紀律
- 螢光綠 `--c-glow` **永不**直接當淺底上的正文色；只在 ink/dark 底上或作裝飾。
- 每頁強調色 ≤ 2 種：品牌綠為常駐，teal（乾實驗室）/琥珀（HP、教育）按語境二選一。
- 既有 hex 遷移對照：#075a3e→`--c-ink-2`、#fffdf7→`--c-paper`、#d8b26a→`--c-amber`、#5f6e66→`--c-text-3`。

## 2. 字型
- **維持 Changa**（全站 7 weights 已在 iGEM 伺服器上，零上傳成本、零載入風險）。
  以 weight+字距+大小寫營造層次：kicker 700/0.14em/uppercase，正文 regular。
- 中文標點混排目前落系統 fallback（Noto Sans TC 系統版）；**待辦**：上傳 Noto Sans TC woff2 子集後，
  於 tokens 加 `--font-zh` 一地掛上即可全站生效。
- 數字一律 `font-variant-numeric: tabular-nums`（count-up 不抖動）。

## 3. 字級階（fluid clamp）
`--fs-hero 2.6→5.4rem` / `h1 2.1→3.4` / `h2 1.6→2.4` / `h3 1.25→1.6` /
`lead 1.05→1.3` / body 1rem / small 0.875 / kicker 0.78。

## 4. 網格與間距
8pt 基準：`--sp-1..9`（0.25→7rem）。容器 `--shell-max 1180px`、
閱讀寬 `--reading-max 68ch`。導覽高 84px、縮合後 62px。

## 5. 元件清單（styleguide.html 實際展示）
玻璃卡 `.rx-card`｜按鈕 `.rx-btn`（solid / ghost / magnetic）｜kicker 標籤｜
數據 `.rx-stat`｜进度條 #rxProgress｜導覽列（滾縮＋mega menu）｜行動全螢幕選單｜
深淺色鈕｜自訂游標｜reveal / clip 揭露｜sticky 目錄 scroll-spy｜空白頁骨架 `.rx-coming-soon`。

## 6. 動態原則
- 曲線：`--ease-out`（expo-out）為全站主曲線；回彈 `--ease-spring` 僅鈕按 feedback。
- 時長：fast 0.22s（hover）、med 0.45s（切換）、slow 0.8s（hero）。
- stagger 0.06–0.09s；滾動敘事 scrub 只在首頁；`prefers-reduced-motion` 時：
  粒子停、scrub 關、游標關、reveal 全部直接可見（CSS !important 兜底）。
- 換頁：View Transitions（circle bloom）＋ Lenis 平滑捲動；Lenis 對 `#engineering`、
  `#hw3d-view`、`.cap-field`、`.board-game-page` 以 `data-lenis-prevent` 局部停用，
  不干預 DBTL 滾輪翻頁、剖面圖旋轉、抓阿漢遊戲與桌遊的內部捲動。

## 7. 深色模式遷移策略
舊 style.css 多数頁面白底；`base.css` 先以 `html[data-theme="dark"]` 覆蓋
body/container/table/footer 底色文字，逐頁細修。shallow-first：
外殼（導覽/頁尾/hero）先支援，內頁保底可讀，特殊深色頁（education cosmos、
hw-nexus）原本就深，視為通過。

## 8. iGEM 合規
- vendor 僅 GSAP 3.13 / ScrollTrigger / Lenis 三檔自架（static/vendor/，MIT license 檔頭保留）。
- 新視覺一律 CSS/SVG/Canvas 自製，不新增任何外部網址、不捏造 static.igem.wiki 路徑。
- footer 保留 CC-BY-4.0 + GitLab repo 連結（https://gitlab.igem.org/2026/ncku-tainan）。
