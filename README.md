# 🧠 LOLPicker — Smart Draft Assistant for League of Legends

LOLPicker is a web-based draft assistant that recommends the optimal champion pick in League of Legends based on real-time draft context.

It analyzes your team, the enemy team, pick order, and role to generate a competitive-level recommendation using a custom scoring engine.

---

## 🚀 Live Demo

- 🌐 Frontend: https://meisgooddev.github.io/lolpicker/  
- ⚙️ Backend: https://lolpicker.onrender.com  

---

## ✨ Features

- 🎯 Role-based champion recommendations  
- 🔁 Draft order awareness (early / mid / late pick logic)  
- 🧩 Team composition analysis (AP/AD, frontline, engage, scaling, etc.)  
- 🤝 Synergy detection with allied champions  
- ⚔️ Counter-picking against enemy champions  
- 📊 Meta weighting system  
- 🧠 Transparent scoring breakdown for each recommendation  

---

## 🏗️ Architecture

This project follows a simple full-stack architecture:

Frontend (React + Vite)  
↓  
Backend API (Node.js + Express)  
↓  
Champion Data (Riot Data Dragon)  

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Axios
- Framer Motion

### Backend
- Node.js
- Express
- TypeScript
- Riot Data Dragon API

### Deployment
- GitHub Pages (Frontend)
- Render (Backend)

---

## ⚙️ How It Works

The recommendation engine scores each champion based on multiple weighted factors:

- Draft order (safe blind picks vs counter picks)
- Team needs (AP/AD balance, engage, peel, scaling)
- Synergy with allies
- Counters vs enemies
- Meta strength

Each champion receives a final score and the system returns:
- 🥇 Best pick
- 🥈 Alternative picks

---

## 📦 Local Setup

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

Backend runs on: http://localhost:3001

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Environment Variables

Create:
```bash
frontend/.env.production
```

```bash
VITE_API_URL=http://localhost:3001
```

## 🌐 Deployment

### Frontend (GitHub Pages)

The frontend is built using Vite and deployed automatically via GitHub Actions.

After every push to the main branch:
- The frontend is built (npm run build)
- The dist folder is deployed to GitHub Pages

Live URL:
https://meisgooddev.github.io/lolpicker/

---

### Backend (Render)

The backend is deployed as a Node.js Web Service on Render.

- Automatically deploys on every push to main
- Runs using:
  npm install
  npm run start
- Uses the port provided by Render via process.env.PORT

Live API:
https://lolpicker.onrender.com

Available endpoints:
- /api/champions
- /api/recommend
- /api/health

---

### Notes on Render Free Tier

- The backend may go to sleep after ~15 minutes of inactivity
- The first request after inactivity may take 10–60 seconds (cold start)
- No manual action is required — the server wakes up automatically on request

---

## ✨ Feature Improvements (Planned)

- Advanced draft archetype detection
- User accounts and saved champion pools
- Performance optimizations and caching
- Better handling of cold starts (loading states, pre-warm strategies)
- Real-time personal user data integration (win rates, pick rates)  
- Scan for current draft, auto-detection (bans, picks, etc.)
- Add explanations for each recommendation

---

## 📌 Motivation

This project was built to simulate competitive-level draft decision-making in League of Legends.

The goal was to create a system that doesn't just suggest champions randomly, but actually "thinks" like a high-level player:
- understanding team composition
- recognizing win conditions
- adapting to draft order and enemy picks

It started as a small experimental project and evolved into a full-stack application combining game knowledge, heuristics, and clean UI design.

---

## 👀 How to View / Use

1. Open the website:
https://meisgooddev.github.io/lolpicker/

2. Select:
- Team side (Blue / Red)
- Pick position (1–10)
- Your role

3. Add:
- Allied champions
- Enemy champions

4. Click:
"Generate Recommendation"

5. View:
- Best pick
- Score breakdown
- Alternative options

⚠️ Note:
If the backend has been inactive, the first request may take a few seconds to respond.

---

## ⭐ If You Like This Project

- Give it a star on GitHub
- Share it with friends
- Use it in your own games
- Build on top of it

---

## 👤 Author

Bruno Rodrigues (James)