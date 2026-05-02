# 🎵 ToneBridge — Project Setup

> Gamified perfect pitch training app with real-time multiplayer, built for the **Bridges** hackathon theme.

---

## 🧰 Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | ^18 | UI framework |
| `vite` | ^5 | Build tool / dev server |
| `tailwindcss` | ^3 | Utility-first styling |
| `framer-motion` | ^11 | Duolingo-style animations & celebrations |
| `pitchy` | ^4 | In-browser pitch detection (McLeod method) |
| `tone` | ^15 | Audio synthesis / note playback |
| `three` | ^0.165 | 3D animated bridge visual 🌉 |
| `socket.io-client` | ^4 | Real-time multiplayer |
| `react-router-dom` | ^6 | Client-side routing |
| `zustand` | ^4 | Lightweight global state |

### Backend
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4 | REST API server |
| `socket.io` | ^4 | WebSocket server (1v1 rooms, leaderboard sync) |
| `@supabase/supabase-js` | ^2 | DB client (users, XP, ELO, scores) |
| `cors` | ^2 | Cross-origin requests |
| `dotenv` | ^16 | Environment variable management |

### Database & Auth
| Service | Purpose |
|---|---|
| **Supabase** | Postgres DB + Auth (Google / email) + Realtime subscriptions |

---

## 📁 Folder & File Structure

```
pitchbridge/
│
├── client/                          # React + Vite frontend
│   ├── public/
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── assets/                  # Static images, sounds, fonts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                  # Reusable UI primitives
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── ProgressBar.jsx
│   │   │   │   └── Toast.jsx
│   │   │   │
│   │   │   ├── audio/               # Audio-related components
│   │   │   │   ├── MicInput.jsx     # Mic capture + pitchy pitch detection
│   │   │   │   ├── PianoKeyboard.jsx# On-screen keyboard input
│   │   │   │   └── NoteDisplay.jsx  # Shows detected vs target note
│   │   │   │
│   │   │   ├── bridge/              # The literal bridge 🌉
│   │   │   │   ├── BridgeScene.jsx  # Three.js canvas scene
│   │   │   │   └── BridgeProgress.jsx # Planks fill in as XP grows
│   │   │   │
│   │   │   ├── game/
│   │   │   │   ├── NoteChallenge.jsx    # Single note challenge round
│   │   │   │   ├── ScorePopup.jsx       # Correct/wrong animation
│   │   │   │   ├── StreakCounter.jsx    # Daily streak display
│   │   │   │   └── XPBar.jsx           # XP + level progress
│   │   │   │
│   │   │   └── multiplayer/
│   │   │       ├── Lobby.jsx            # Matchmaking / room creation
│   │   │       ├── DuelArena.jsx        # 1v1 real-time game view
│   │   │       └── Leaderboard.jsx      # Global + friend rankings
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page with bridge hero
│   │   │   ├── Learn.jsx            # Solo lesson mode (Duolingo-style)
│   │   │   ├── Practice.jsx         # Free practice mode
│   │   │   ├── Multiplayer.jsx      # Matchmaking + ranked entry
│   │   │   ├── Profile.jsx          # Stats, ELO, badges, streak
│   │   │   └── Login.jsx            # Supabase auth (Google / email)
│   │   │
│   │   ├── hooks/
│   │   │   ├── usePitchDetection.js # Web Audio API + pitchy logic
│   │   │   ├── useSocket.js         # Socket.io connection & events
│   │   │   ├── useGameState.js      # Round timer, scoring logic
│   │   │   └── useAudio.js          # Tone.js note playback
│   │   │
│   │   ├── lib/
│   │   │   ├── noteUtils.js         # Hz → note name, cents deviation
│   │   │   ├── supabaseClient.js    # Supabase client init
│   │   │   └── constants.js         # NOTE_FREQUENCIES, XP_TABLE, etc.
│   │   │
│   │   ├── store/
│   │   │   └── useStore.js          # Zustand global store (user, XP, socket)
│   │   │
│   │   ├── App.jsx
... (121lignes restantes)

message.txt
9 Ko
﻿
Antoine Oparin
gettey.
 
 
# 🎵 PitchBridge — Project Setup

> Gamified perfect pitch training app with real-time multiplayer, built for the **Bridges** hackathon theme.

---

## 🧰 Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | ^18 | UI framework |
| `vite` | ^5 | Build tool / dev server |
| `tailwindcss` | ^3 | Utility-first styling |
| `framer-motion` | ^11 | Duolingo-style animations & celebrations |
| `pitchy` | ^4 | In-browser pitch detection (McLeod method) |
| `tone` | ^15 | Audio synthesis / note playback |
| `three` | ^0.165 | 3D animated bridge visual 🌉 |
| `socket.io-client` | ^4 | Real-time multiplayer |
| `react-router-dom` | ^6 | Client-side routing |
| `zustand` | ^4 | Lightweight global state |

### Backend
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4 | REST API server |
| `socket.io` | ^4 | WebSocket server (1v1 rooms, leaderboard sync) |
| `@supabase/supabase-js` | ^2 | DB client (users, XP, ELO, scores) |
| `cors` | ^2 | Cross-origin requests |
| `dotenv` | ^16 | Environment variable management |

### Database & Auth
| Service | Purpose |
|---|---|
| **Supabase** | Postgres DB + Auth (Google / email) + Realtime subscriptions |

---

## 📁 Folder & File Structure

```
pitchbridge/
│
├── client/                          # React + Vite frontend
│   ├── public/
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── assets/                  # Static images, sounds, fonts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                  # Reusable UI primitives
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── ProgressBar.jsx
│   │   │   │   └── Toast.jsx
│   │   │   │
│   │   │   ├── audio/               # Audio-related components
│   │   │   │   ├── MicInput.jsx     # Mic capture + pitchy pitch detection
│   │   │   │   ├── PianoKeyboard.jsx# On-screen keyboard input
│   │   │   │   └── NoteDisplay.jsx  # Shows detected vs target note
│   │   │   │
│   │   │   ├── bridge/              # The literal bridge 🌉
│   │   │   │   ├── BridgeScene.jsx  # Three.js canvas scene
│   │   │   │   └── BridgeProgress.jsx # Planks fill in as XP grows
│   │   │   │
│   │   │   ├── game/
│   │   │   │   ├── NoteChallenge.jsx    # Single note challenge round
│   │   │   │   ├── ScorePopup.jsx       # Correct/wrong animation
│   │   │   │   ├── StreakCounter.jsx    # Daily streak display
│   │   │   │   └── XPBar.jsx           # XP + level progress
│   │   │   │
│   │   │   └── multiplayer/
│   │   │       ├── Lobby.jsx            # Matchmaking / room creation
│   │   │       ├── DuelArena.jsx        # 1v1 real-time game view
│   │   │       └── Leaderboard.jsx      # Global + friend rankings
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page with bridge hero
│   │   │   ├── Learn.jsx            # Solo lesson mode (Duolingo-style)
│   │   │   ├── Practice.jsx         # Free practice mode
│   │   │   ├── Multiplayer.jsx      # Matchmaking + ranked entry
│   │   │   ├── Profile.jsx          # Stats, ELO, badges, streak
│   │   │   └── Login.jsx            # Supabase auth (Google / email)
│   │   │
│   │   ├── hooks/
│   │   │   ├── usePitchDetection.js # Web Audio API + pitchy logic
│   │   │   ├── useSocket.js         # Socket.io connection & events
│   │   │   ├── useGameState.js      # Round timer, scoring logic
│   │   │   └── useAudio.js          # Tone.js note playback
│   │   │
│   │   ├── lib/
│   │   │   ├── noteUtils.js         # Hz → note name, cents deviation
│   │   │   ├── supabaseClient.js    # Supabase client init
│   │   │   └── constants.js         # NOTE_FREQUENCIES, XP_TABLE, etc.
│   │   │
│   │   ├── store/
│   │   │   └── useStore.js          # Zustand global store (user, XP, socket)
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                # Tailwind directives
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Node + Express + Socket.io backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js              # Auth helpers / session verify
│   │   │   ├── users.js             # GET/PATCH user profile, XP, ELO
│   │   │   └── leaderboard.js       # Global + weekly rankings
│   │   │
│   │   ├── socket/
│   │   │   ├── index.js             # Socket.io init & middleware
│   │   │   ├── matchmaking.js       # Queue, room pairing logic
│   │   │   ├── gameRoom.js          # 1v1 round logic, note seeding, scoring
│   │   │   └── events.js            # Event name constants
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase.js          # Supabase admin client
│   │   │   ├── elo.js               # ELO rating calculation
│   │   │   └── noteSeeder.js        # Deterministic note sequence generator
│   │   │
│   │   └── index.js                 # Express app entry point
│   │
│   ├── .env                         # SUPABASE_URL, SUPABASE_SERVICE_KEY, PORT
│   └── package.json
│
├── supabase/                        # Supabase local config & migrations
│   ├── migrations/
│   │   ├── 001_users.sql            # users table (id, username, xp, elo, streak)
│   │   ├── 002_scores.sql           # match_results table
│   │   └── 003_leaderboard.sql      # leaderboard view
│   └── config.toml
│
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables

### `client/.env`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SERVER_URL=http://localhost:4000
```

### `server/.env`
```env
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
CLIENT_URL=http://localhost:5173
```

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/your-team/pitchbridge
cd pitchbridge

# 2. Install frontend deps
cd client && npm install

# 3. Install backend deps
cd ../server && npm install

# 4. Run both (from root — use two terminals or concurrently)
# Terminal 1:
cd client && npm run dev

# Terminal 2:
cd server && npm run dev
```

---

## 🌉 Bridge Feature Notes

- The `BridgeScene.jsx` component renders a **Three.js suspension bridge**
- Bridge planks are added procedurally as the user gains XP / completes lessons
- During a 1v1 match, each player's side of the bridge builds in real-time as they score — the first to "complete" their half wins the visual
- On the Home page, the bridge serves as the hero animation and a progress metaphor for new visitors

---

## 🎯 Pitch Detection Flow

```
Microphone
  └─► navigator.mediaDevices.getUserMedia()
        └─► AudioContext → AnalyserNode
              └─► Float32Array (time domain)
                    └─► pitchy.PitchDetector.forFloat32Array()
                          └─► [frequency, clarity]
                                └─► noteUtils.hzToNote(freq)
                                      └─► "A4", "C#3", etc.
                                            └─► Compare vs target → score
```

---

## 📡 Multiplayer Socket Events

| Event | Direction | Payload |
|---|---|---|
| `join_queue` | Client → Server | `{ userId, elo }` |
| `match_found` | Server → Client | `{ roomId, opponent, noteSequence }` |
| `note_result` | Client → Server | `{ roomId, noteIndex, correct, timeMs }` |
| `round_update` | Server → Client | `{ scores, currentNote }` |
| `match_end` | Server → Client | `{ winner, eloChange, xpGained }` |
| `leave_room` | Client → Server | `{ roomId }` |
message.txt
9 Ko