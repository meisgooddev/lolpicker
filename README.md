# 🧠 LOLPicker — Smart Draft Assistant for League of Legends

LOLPicker is an advanced draft assistant that recommends the optimal champion pick in League of Legends based on real-time draft context.

It analyzes your team, the enemy team, pick order, and role to generate a competitive-level recommendation using a custom scoring engine. With recent updates, LOLPicker now features **Native Desktop Integration (Electron)** that automatically syncs with the League of Legends Client (LCU) in real-time.

---

## 🚀 Live Demo

- 🌐 **Web Frontend:** https://meisgooddev.github.io/lolpicker/ (Manual Draft Entry)
- 🖥️ **Desktop App:** Build the Electron App locally for Real-Time LCU sync!
- ⚙️ **Backend:** https://lolpicker.onrender.com  

---

## ✨ Features

- 🎯 **Role-based recommendations**
- 🔄 **Real-Time Client Sync (LCU):** Automatically detects your game draft, hover states, side, and role.
- 🎲 **Probabilistic Enemy Role Assignment:** A smart backtracking algorithm guesses where enemy locked champions will go.
- 🧩 **Team composition analysis** (AP/AD, frontline, engage, scaling, etc.)  
- 🤝 **Synergy detection** with allied champions  
- ⚔️ **Counter-picking** against enemy champions  
- 📊 **Meta weighting system**  
- 🧠 **Transparent scoring breakdown** for each recommendation  

---

## 🏗️ Architecture

LOLPicker uses a multi-service architecture:

Desktop App (Electron + React + Vite + league-connect)  
↓ *(or Web Frontend via GitHub Pages)*  
Backend API (Node.js + Express)  
↓  
Python Microservices (FastAPI)  
↓  
External Data Sources (Meta statistics, aggregated match data)

### Services

- **Frontend / Electron** — Web App (React) packaged as a native desktop application. Syncs with local League Client via WebSocket (`/lol-champ-select/v1/session`).
- **Backend (Node.js)** — Orchestrates scoring and validates draft constraints.
- **Meta Service (Python)** — Provides patch/role/elo-based champion strength.
- **OPGG MCP Service (Python)** — Provides matchup and player-related data.

---

## 🛠️ Tech Stack

### Frontend & Desktop
- React
- TypeScript
- Vite
- Framer Motion
- Desktop: **Electron** + `league-connect`

### Backend
- Node.js
- Express
- TypeScript

### Python Services
- FastAPI
- Uvicorn
- Requests

---

## 📦 Local Setup & Building the Desktop App

### 1. Clone the repository

```bash
git clone https://github.com/meisgooddev/lolpicker.git
cd lolpicker
```

### 2. Run Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:3001`

### 3. Run Frontend / Electron App

To run as a **Native App (Real-Time HUD with LCU):**
```bash
cd frontend
npm install
npm run dev:electron
```
*This will open a standalone window that automatically hooks into your League of Legends Client!*

**Building the Installers:**
- Compile `.exe` (Windows): `npm run build:win`
- Compile `.dmg` (macOS): `npm run build:mac`
- Generic Builder: `npm run build:electron`

*Note: Installers will be generated in `frontend/dist_electron`.*

### 4. Environment Variables

Create `frontend/.env.production`:
```bash
VITE_API_URL=http://localhost:3001
```

---

## 🌐 Deployment

### Frontend (GitHub Pages)

The frontend is deployed automatically via GitHub Actions for web users. Live URL: https://meisgooddev.github.io/lolpicker/

### Backend (Render)

The backend is deployed automatically on Render. Live API: https://lolpicker.onrender.com

---

## ⚙️ How It Works (The Engine)

The recommendation engine scores each champion based on multiple weighted factors:

- Draft position (safe blind picks vs counter picks)
- Team needs (AP/AD balance, engage, peel, scaling)
- Synergy with allies
- Counters vs enemies
- Meta strength

Each champion receives a final score and the system presents the best pick along with viable alternatives.

---

## ✨ Feature Improvements (Planned)

- Advanced draft archetype detection
- User accounts and saved champion pools
- Performance optimizations and caching
- Add explanations for each recommendation explicitly in text 

---

## 📌 Motivation

This project was built to simulate competitive-level draft decision-making in League of Legends.

The goal was to create a system that doesn't just suggest champions randomly, but actually "thinks" like a high-level player:
- understanding team composition
- recognizing win conditions
- adapting to draft order and enemy picks

It started as a small experimental project and evolved into a full-stack application combining game knowledge, heuristics, LCU architecture, and clean UI design.

---

## ⭐ If You Like This Project

- Give it a star on GitHub
- Share it with friends
- Use it in your own games
- Build on top of it

---

## 👤 Author

Bruno Rodrigues (James)