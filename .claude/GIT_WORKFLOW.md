# Remote 協作架構（給 AI 助手看的說明）

我們是 2026 iGEM ncku-tainan 團隊，正在開發 iGEM Wiki 專案。

## 目前的 Git 架構與 Remote 設定

這個專案有兩個 git remote：

- **origin**：指向 GitHub Private Repo
  `git@github.com:NCKU-iGEM-2026/ncku-igem-2026-private.git`
  這是隊友之間平常開發、日常協作用的主要倉庫。
- **igem-official**：指向 iGEM 官方 GitLab
  `https://gitlab.igem.org/2026/ncku-tainan.git`
  這個只在 Wiki Freeze 截止日前夕才會一次性 push `main` 分支，平常絕對不能碰。

## 分支策略與協作規範（重要）

### 1. 主分支保護原則

- 嚴禁直接在 `main` 或 `dev` 分支上直接修改程式碼並 push！
- `main` 分支僅作為最終穩定版本與官方同步用。
- `dev` 分支是團隊的集成基準分支，所有新進度都必須透過 Pull Request (PR) 合併進來。

### 2. 標準開發流程（切分支 ➡️ 開發 ➡️ 發 PR）

- 開發/編輯任何內容前，請引導我先更新 `dev` 分支：
  ```bash
  git checkout dev && git pull origin dev
  ```
- 從 `dev` 切出專屬功能或內容分支（命名規則：`content/頁面名稱` 或 `feature/功能名稱`，例如 `git checkout -b content/notebook`）。
- 只修改我負責的頁面與資源，完成後 push 到我的專屬分支：
  ```bash
  git push origin <我的分支名稱>
  ```
- 引導我到 GitHub 針對 `origin` 發起 Pull Request（目標分支為 `dev`），並等待 Web Lead 審查與合併。

## 指令防護規則

請你在協助我做 Git 操作時遵守以下指令防護規則：

1. 除非我明確說「要推到官方 GitLab / igem-official」，否則所有 push / pull 都只針對 origin（GitHub），絕對不要對 igem-official 做任何操作。
2. 提交前提醒我用 `git status` 與 `git diff` 確認變更內容，避免盲目 `git add .` 誤加不該提交的暫存檔或不相關程式碼。
3. 如果要 push 到 igem-official，務必先跟我再次確認（代表要公開給評審與其他隊伍看到），並提醒我先檢查狀態是否乾淨、且必須是從 `main` 分支推送。
4. 不要修改或刪除 LICENSE、頁尾的 license 聲明與 GitLab repo 連結（iGEM 評審規定必須保留）。

## 開始寫 Wiki要注意的事情

### 切回並更新基準分支

每天（泛指上次有 git commit 後）在開始任何編輯之前，先切回 `dev` 並拉取最新進度，確保本地環境與團隊同步。

```bash
git checkout dev
git pull origin dev
```

### 建立任務分支

嚴禁直接在 `dev` 上修改。從最新的 `dev` 切出本次任務的分支：

```bash
git checkout -b <頁面或任務名稱>
# 例如：git checkout -b notebook
```

### 本地開發與編輯

跟 claude 一起寫被指派到的部分～

### 檢查變更檔案

```bash
git status
git diff
```

### 提交變更（Commit）

```bash
git add <實際變更的檔案>
git commit -m "說明這次改了什麼"
```

### 同步最新 dev（防衝突檢查）

推送前再次同步遠端 `dev` 分支，提前在本地解決潛在衝突：

```bash
git pull origin dev
```

### 推送分支至遠端倉庫

將個人的專屬分支推送到 GitHub（`origin`）：

```bash
git push origin <我的分支名稱>
```

### 發起 Pull Request（PR）

1. 開啟 GitHub 倉庫頁面，點擊 **Compare & pull request**。
2. 目標分支（base branch）選擇 `dev`。
3. 簡述本次修改內容，並指定 Dry Lab 成員進行審查（Review）。
4. 審查通過後由審查者執行合併（Merge）。
