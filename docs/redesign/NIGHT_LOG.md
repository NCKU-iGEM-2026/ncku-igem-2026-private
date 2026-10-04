# NIGHT LOG — 2026-10-04 深夜自主改版日誌

> 規則：不 push、不部署、不碰 本機預覽.command / .venv-preview/ / LICENSE /
> .gitlab-ci.yml / 三大保護模組 JS（engineering DBTL rail、board-game+Firebase、webcam-booth）。
> 每階段本機 commit 一次；驗證不過不進下一階段，修 3 次失敗就回退。

## 起手式（22:35–22:50）
- 22:35 盤點完成（唯讀），產出 `docs/redesign/AUDIT.md`。
- 22:38 發現 `venv/` 是原作者電腦複製過來的壞環境 → `rm -rf venv && python3.11 -m venv venv && venv/bin/pip install -r dependencies.txt`。**驗證**：`venv/bin/python -c "import flask, flask_frozen"` → OK。
- 22:39 `flask freeze` 成功（public/ 23 頁全生出）；起 `python app.py` 抽測 6 頁全 200（後已 kill，8080 歸還給 本機預覽.command）。
- 22:42 下載 GSAP 3.13 + ScrollTrigger + Lenis 1.1.20 至 `static/vendor/`（僅此三檔；抓檔用 curl 於本機執行，頁面本身零外部引用）。
- 22:47 建立並切換分支 `feature/redesign-night`。
- 確認 本機預覽.command 與 .venv-preview/ 由 `.git/info/exclude` 排除、.venv-preview 環境健康（flask OK）→ 兩個都不碰。

## P1 設計系統（22:50–23:10）
- 新建 `static/css/tokens.css`：「Bioluminescence 生物螢光」色彩系統（紙白 #fffdf7 / 深墨綠 #06402e / 生技 teal #14b391 / GFP 螢光 #a0e860 / 琥珀 #d8b26a）＋ 深色模式（深夜 #04150f 上螢光文字）＋字級 clamp 階 / 間距 / 圓角 / 陰影 / easing token。主要搭配已驗算 WCAG AA。
- 新建 `static/css/base.css`：data-theme 深色覆蓋、閱讀進度條 #rxProgress、深淺色切換鈕、[data-reveal] 純 CSS 降級動畫、sticky 目錄 rx-toc、自訂遊標、View Transitions、focus-visible。
- 新建 `static/css/motion.css`：Lenis 配套、章節進度軌道 rx-chapter-rail、kinetic type 拆字類 rx-split、呼吸光暈、scroll cue。
- 新建 `docs/redesign/DESIGN_SYSTEM.md`、`wiki/pages/styleguide.html`（token/元件展示頁，自動進 freeze）。
- 驗證：freeze OK → curl 每頁 200 → 外部網址 grep 乾淨 → 保護檔 diff 為空。
- commit：`P1 設計系統：tokens/base/motion + styleguide` → hash 見 MORNING_REPORT。
