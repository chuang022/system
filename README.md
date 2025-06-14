# 🧠 認知功能檢測系統

本系統整合了 MMSE 簡易智能量表與 CDT 畫鐘測驗，協助使用者於線上進行初步的認知功能篩檢與紀錄追蹤。

---

### 🏠 首頁畫面
用戶可輸入 Email 開始測驗，並依序完成 MMSE 與 CDT 項目。

![首頁畫面](https://raw.githubusercontent.com/chuang022/system/main/docs/system_home.png)


### 🖥️ 測驗進行中畫面
提供視覺化操作界面，包含作答、畫圖、AI 預測等功能。

![系統畫面](docs/system_ui.png)

---
### 📊 測驗結果畫面
系統將自動計分並列出錯誤明細，協助初步辨識使用者的認知狀態與弱點類型。

![測驗結果畫面](docs/system_result.png)

---
### 🕒 CDT 畫鐘測驗畫面
使用者需於畫布上繪製時鐘，並正確標示指定時間（例如上午 11:10），系統可即時紀錄作答圖像。

![CDT 測驗畫面](docs/cdt_draw.png)

---
### 🧾 測驗總結頁面
系統根據 MMSE 與 CDT 測驗結果整合初步評估與 AI 模型推論，協助使用者理解目前認知狀態並提供建議。

![總結畫面](docs/final_result.png)

---
## ⚙️ 技術架構
- **前端**：React.js + React Router DOM + Axios + JavaScript (ES6+) + CSS + HTML5 / JSX + Webpack & Babel
- **後端**：FastAPI（Python）+ Pydantic + Uvicorn + mysql-connector-python + PyTorch & Torchvision + Pillow (PIL)
- **資料庫** : MySQL
- **功能模組**：MMSE 題組、Canvas 畫鐘、模型分析（VGG16）、結果儲存

---

## 📁 專案目錄結構（簡略）
