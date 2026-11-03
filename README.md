# 🎮 SAI & KANNA — Digit Guessing Game (Bulls & Cows)

A real-time multiplayer 1v1 digit-guessing game with cyberpunk gaming animations, procedural SFX, elimination scratchpads, turn timers, and 45s disconnect recovery.

---

## 📁 Project Structure

```
number game/
├── 📂 backend/               # WebSocket Server (Node.js + ws + Express)
│   ├── server.js            # Matchmaking, room codes, guess verification, sessions
│   ├── dryrun.js            # Automated E2E verification test suite
│   └── package.json
│
├── 📂 frontend/              # Web Client (React 18 + Vite 5)
│   ├── src/
│   │   ├── components/      # UI screens, 3D tilt cards, HUD, canvas particles, confetti
│   │   ├── utils/           # Web Audio procedural SFX synthesizer
│   │   ├── App.jsx          # Client state machine & WebSocket listener
│   │   ├── index.css        # Cyberpunk gaming theme & animations
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
├── package.json             # Root runner scripts
└── README.md
```

---

## 🚀 How to Run Manually

### Option 1 — In Two Separate Terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
# Runs on ws://localhost:3001
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

---

## 🎯 Gameplay Rules
- **Host** creates a room and chooses code length (1 to 6 digits).
- **Guest** enters the 6-character room code to join.
- Both players secretly choose and lock in their secret numbers.
- Players take turns guessing:
  - 🐂 **Bulls:** Correct digit in the exact right position.
  - 🐄 **Cows:** Correct digit, but in the wrong position.
- First to get all **Bulls** cracks the code and wins!
