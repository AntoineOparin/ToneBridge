# ToneBridge

> Gamified perfect pitch training with real-time 1v1 multiplayer — built for **DawsHacks 2026** under the theme **Bridges**.

---

## What is ToneBridge?

Most people are never born with perfect pitch. ToneBridge bridges that gap — turning ear training into a progression-based game where you unlock notes level by level, compete in live duels, and watch a suspension bridge grow as your skill does.

The bridge is both literal and metaphorical:
- **Literal** — a Three.js animated suspension bridge grows plank by plank as you gain XP and clear levels
- **Metaphorical** — the app bridges the skill gap between someone who can't identify a note by ear and someone who can

---

## Features

- **Singleplayer practice** — level-gated curriculum (10 levels, C4 → full chromatic scale); each level introduces new notes through a tutorial before practice begins
- **Two challenge types** — identify the note by ear (piano keyboard input) or sing it back into the mic (pitch detection via microphone)
- **Forte** — an in-game character who gives contextual tips and reacts to your performance
- **Real-time 1v1 duels** — 60-second matches, most correct notes wins; skipping a note costs a point
- **ELO rating system** — chess-style rating (k=32, expected score formula); gain more ELO beating stronger opponents, lose less to weaker ones
- **Rematch system** — both players can request a rematch within 15 seconds; disconnect is handled gracefully
- **Global leaderboard** — ranked by ELO with a top-3 podium
- **Profile page** — per-note accuracy, XP history, streak, level progress
- **Learn section** — short reads on pitch theory, cents, and how the ear maps frequency

---

## Theme Connection

> "Your project must be connected to Bridges in some way."

ToneBridge bridges the pitch recognition skill gap — a real barrier between musicians and non-musicians. The app's core metaphor is the literal suspension bridge that grows as you learn: each note you master is a plank laid across the gap. In multiplayer, you and your opponent each build your side of the bridge in real time — the first to complete it wins.

---

## Tech Stack

### Frontend (`client/`)
| Package | Purpose |
|---|---|
| React 18 + Vite 5 | UI framework and build tool |
| TypeScript (strict) | Type safety across the entire frontend |
| Tailwind CSS 3 | Utility-first styling |
| Framer Motion 11 | Animations, game feedback, celebrations |
| Three.js 0.165 | 3D suspension bridge scene |
| pitchy 4 | In-browser pitch detection (McLeod method) |
| Tone.js 15 | Note playback and audio synthesis |
| Socket.io-client 4 | Real-time multiplayer connection |
| React Router DOM 6 | Client-side routing |
| Zustand 4 | Global state (XP, practice progress, session) |

### Backend (`server/`)
| Package | Purpose |
|---|---|
| Node.js + Express 4 | REST API |
| TypeScript (ESM) | Type-safe server code |
| Socket.io 4 | WebSocket server — matchmaking, game rooms, live scoring |
| @supabase/supabase-js 2 | Server-side DB access (service role) |

### Database & Auth
| Service | Purpose |
|---|---|
| Supabase (Postgres) | Users, ELO, XP, note stats, match results |
| Supabase Auth | Google OAuth — passwordless login |

---

## Architecture

### Pitch Detection Pipeline
```
Mic → getUserMedia() → AudioContext → AnalyserNode
    → Float32Array → pitchy.PitchDetector
    → [frequency Hz, clarity]
    → hzToNote() → "A4" / "C#3" / etc.
    → compare vs target → score round
```
Clarity threshold of `0.9` filters out noise. Detection runs on a `requestAnimationFrame` loop in `usePitchDetection.ts`.

### Multiplayer Socket Flow
```
Client emits join_queue { userId, elo }
Server pairs two players → emits match_found { roomId, opponentId, noteSequence }
Each answer:
  Client emits note_result { roomId, correct, skipped }
  Server updates score → emits round_update { scores }
60s timer ends:
  Server calculates ELO → emits match_end { winner, scores, eloChange }
```
Note sequences are generated server-side with a seeded LCG so both players get identical notes in the same order. Rooms are in-memory only; they are cleaned up on match end or disconnect.

### File Structure
```
ToneBridge/
├── client/src/
│   ├── components/
│   │   ├── audio/          # MicInput, PianoKeyboard, NoteDisplay
│   │   ├── bridge/         # BridgeScene (Three.js), BridgeProgress, MasteryBridge
│   │   ├── character/      # Forte avatar and reactions
│   │   ├── game/           # NoteChallenge, ScorePopup, XPBar, StreakCounter
│   │   ├── multiplayer/    # DuelArena, Lobby
│   │   ├── practice/       # LevelTutorial
│   │   └── ui/             # Button, Modal, ProgressBar, Toast
│   ├── hooks/              # usePitchDetection, useAudio, useSocket, useGameState, useProgressSync
│   ├── lib/                # noteUtils, curriculum, constants, supabaseClient, theme
│   ├── pages/              # Home, Landing, Login, Practice, Multiplayer, Leaderboard, Profile, Learn
│   ├── store/              # Zustand store (useStore)
│   └── types/              # Shared TypeScript types
├── server/src/
│   ├── routes/             # auth, users, leaderboard, healthcheck
│   ├── socket/             # index, matchmaking, gameRoom, events
│   └── lib/                # elo, noteSeeder, supabase
└── supabase/migrations/    # SQL schema — users, scores, leaderboard view, note stats
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- Google OAuth credentials (configured in Supabase Auth settings)

### Setup

```bash
# 1. Clone
git clone https://github.com/AntoineOparin/ToneBridge.git
cd ToneBridge

# 2. Frontend deps
cd client && npm install

# 3. Backend deps
cd ../server && npm install
```

### Environment Variables

**`client/.env`**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SERVER_URL=http://localhost:4000
```

**`server/.env`**
```env
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
CLIENT_URL=http://localhost:5173
```

### Database Migrations

Run each file in `supabase/migrations/` in order via the Supabase SQL editor:
1. `001_users.sql`
2. `002_scores.sql`
3. `003_leaderboard.sql`
4. `004_practice_progress.sql`
5. `004_profile_complete.sql`

### Start

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

App runs at `http://localhost:5173`.

---

## Team & Roles

| Member | Role |
|---|---|
| Diego Bouda | Full-stack development, multiplayer system, audio/pitch pipeline |
| Antoine Oparin | Full-stack development, bridge visuals (Three.js), curriculum design |

---

## AI Usage Disclosure

Claude Code (Anthropic) was used as a coding assistant throughout this project. Its role was to accelerate implementation — generating boilerplate, debugging type errors, and suggesting patterns. All code was reviewed, understood, and deliberately integrated by team members. Architectural decisions, feature design, and the project concept originated with the team. No code was copy-pasted blindly; every file was read and reasoned about before merging.

Specific areas where AI assisted:
- Scaffolding the TypeScript monorepo structure
- Socket.io matchmaking and room logic
- Supabase RLS policy setup
- ELO calculation implementation
- Framer Motion animation patterns

---

## Answers to Guiding Questions

**How does your project embody the theme of Bridges?**
ToneBridge bridges the gap between people who cannot identify musical notes by ear and those who can. The suspension bridge growing with your XP is a direct visual metaphor — each plank is a note you've learned. In multiplayer, you and your opponent build the bridge together, from opposite sides.

**What new concepts did you learn?**
Real-time WebSocket rooms with Socket.io, in-browser pitch detection with the McLeod method (pitchy), Three.js 3D scene rendering, ELO rating math, and Supabase Row Level Security policies.

**What aspect are you most proud of?**
The full multiplayer pipeline: two players joining a queue, getting matched, playing the same seeded note sequence simultaneously, and seeing live score updates — all in under 60 seconds of real-time play.

**What was the most challenging?**
Pitch detection accuracy. Getting the microphone input, running pitchy's McLeod algorithm, filtering out noise via the clarity threshold, and turning raw Hz into a reliable note name — then making it responsive enough to not feel laggy during a singing challenge.

**Given more time, what would you improve?**
Sharps and flats in the practice curriculum, a friend-list for private duels, and mobile support (the piano keyboard doesn't work well on small screens).
