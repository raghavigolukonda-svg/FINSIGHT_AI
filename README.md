# FinSight AI — Complete Setup Guide

## 📁 Folder Structure
```
FinSight/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── transactions.py
│   │   ├── fraud.py
│   │   ├── risk.py
│   │   ├── market.py
│   │   └── analytics.py
│   └── services/
│       ├── __init__.py
│       └── ml_service.py
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── utils/
│           └── api.js
│
├── START_BACKEND.bat    ← Double-click to start backend
├── START_FRONTEND.bat   ← Double-click to start frontend
└── README.md
```

---

## ⚡ EASIEST WAY — Double Click

1. Double-click **START_BACKEND.bat** → wait for "Backend running"
2. Double-click **START_FRONTEND.bat** → wait for "Frontend running"
3. Open browser → **http://localhost:5173**

---

## 💻 VS Code Terminal Commands

### Open project in VS Code
```
Open VS Code → File → Open Folder → Select the FinSight folder
```

### Terminal 1 — Backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install fastapi uvicorn[standard] scikit-learn numpy pandas python-multipart httpx
python main.py
```

### Terminal 2 — Frontend (Ctrl+Shift+` for new terminal)
```powershell
cd frontend
npm install
npm run dev
```

### Open in browser
```
http://localhost:5173   ← Dashboard
http://localhost:8000/docs  ← API Docs
```

---

## ✅ What You Will See
- 6 tabs: Overview, Fraud Intel, Transactions, Risk Profiles, Market Intel, Live Checker
- Real-time live clock in top right
- ML fraud scoring in Live Checker tab
- Interactive risk radar charts
- 500 seeded transactions on first run
