# 🧠 LOLPicker — Autonomous Tactical Desktop Assistant
 
LOLPicker is an advanced, automated draft assistant and strategic briefer for League of Legends.

Evolving from its origins as a web-based manual drafting tool, LOLPicker is now explicitly a **Native Desktop Application (Electron)**. It securely and automatically syncs with your League of Legends Client (LCU) in real-time, removing the need for any manual input. You simply play the game, and the HUD adapts to you.

Once you lock in your champion, LOLPicker's AI Engine instantly generates a highly personalized, zero-click **Pre-Game Strategic Brief** powered by Google's Gemini LLM.

---

## ✨ Features

- 🔄 **Autonomous LCU Sync:** Automatically detects your game draft phase, hover states, side, assigned roles, bans, and locked-in champions in real-time.
- 🎯 **Algorithmic Draft Recommendations:** Cross-references draft order, team composition, synergy, unplayable counters, and patch meta in its scoring matrix to suggest the mathematically strongest champion.
- 🎲 **Probabilistic Backtracking:** Smartly guesses where locked-in enemy champions are going to play before the draft finishes.
- 🤖 **Pre-Game Strategic Brief (Gemini 2.5 Flash):** The moment you lock-in, LOLPicker instantly writes a custom tactile guide for your game:
  - Macro-level win-conditions for the specific 5v5 compositions on screen.
  - Granular Lane Matchup plan (Level 1-3, Level 3-6, Spikes).
  - Algorithmic predictions on enemy Jungle Pathing.
  - Adaptive sequential Item Build instructions reacting directly to the enemy threats.
- 🧠 **Transparent Scoring Breakdown:** Every recommendation is backed by readable analytic dimensions.

---

## 🏗️ Architecture

LOLPicker uses a multi-service automated architecture:

**Native Desktop App (Electron + React + Vite + league-connect)**  
↓ *(Zero-Click Sync via LCU)*  
**Backend API (Node.js + Express) & AI Strategy Engine**  
↓  
**Google Gemini 2.5 Flash Model APIs & Python Microservices**  
↓  
**External Data Sources (Meta statistics, OP.GG Aggregated Match Data)**

### Services

- **Frontend / Electron** — React application packaged as a native executable. Uses WebSockets and `league-connect` to passively poll `/lol-champ-select/v1/session`.
- **Backend (Node.js)** — Orchestrates the entire draft scoring logic and handles the LLM Schema validations for the Strategic Briefs.
- **Microservices (Python)** — Provide localized meta strength indices.

---

## 🛠️ Tech Stack

### Desktop App (Frontend)
- React, TypeScript, Vite
- Framer Motion (Tactical Animations)
- **Electron** + `league-connect`

### Backend Engine
- Node.js, Express, TypeScript
- `@google/genai` via Axios (Gemini 2.5-Flash)

### Microservices
- Python, FastAPI, Uvicorn

---

## 📦 Setup & Running the Desktop App

Because of its deep LCU integration, LOLPicker runs exclusively as a Desktop application.

### 1. Clone the repository

```bash
git clone https://github.com/meisgooddev/lolpicker.git
cd lolpicker
```

### 2. Configure the Engine (Backend)

```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_key_here
PORT=3001
```
Run the local engine:
```bash
npm run dev
```

### 3. Launch the Tactical HUD (Electron)

In a new terminal:
```bash
cd frontend
npm install
npm run dev:electron
```
*This will open a standalone, transparent tactical overlay that automatically connects to your League of Legends Client!*

**Building Installers (Optional):**
- Compile `.exe` (Windows): `npm run build:win`
- Compile `.dmg` (macOS): `npm run build:mac`
*(Installers are outputted to `frontend/dist_electron`)*

---

## 🌐 Origins & Web Discontinuation

*A huge thank you to everyone who used the original Github Pages web-app.* 

To achieve our vision of a true 100% automated, zero-click interactive Tactical HUD that physically knows who you are playing against at all times, the project had to transition completely into a local Electron lifecycle. The legacy web application infrastructure has been retired in favor of this hyper-integrated desktop experience.

---

## ⚙️ The Recommendation Metagame

The engine scores each champion against heavy math constraints:
- **Draft Position Flexibility:** Avoiding blind-pick vulnerabilities.
- **Team Geometry:** Balancing AP/AD threat levels and filling absent archetype needs (Engage/Peel/Poke).
- **Synergy/Counters:** Direct lane advantage measurements.

---

## 👤 Author

Bruno Rodrigues (James)