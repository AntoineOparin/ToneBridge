# 🎵 ToneBridge — Project Setup

> Gamified perfect pitch training app with real-time multiplayer, built for the **Bridges** hackathon theme.

---

message.txt
10 Ko
# CLAUDE.md — ToneBridge

This file provides context for AI assistants (Claude, Copilot, etc.) working on this codebase.

---

message.txt
9 Ko
﻿
Antoine Oparin
gettey.
 
 
# CLAUDE.md — ToneBridge

This file provides context for AI assistants (Claude, Copilot, etc.) working on this codebase.

---

## 🧠 Project Summary

**ToneBridge** is a gamified perfect pitch training web app built for the **Bridges** hackathon theme. It bridges the skill gap between people born without perfect pitch and true pitch recognition. Users train by identifying musical notes via microphone or on-screen keyboard, earn XP, maintain streaks, and compete in real-time 1v1 duels.

The "bridge" is both literal (a Three.js animated suspension bridge that grows as users progress) and metaphorical (bridging the pitch skill gap).

---

## 🗂️ Monorepo Structure

```
tonebridge/
├── client/       # React + Vite frontend
├── server/       # Node + Express + Socket.io backend
└── supabase/     # DB migrations and config
```

Always clarify which workspace (`client/` or `server/`) you're working in. Do not mix frontend and backend logic.

---

## 🧰 Stack

### Frontend (`client/`)
- **TypeScript** — strict mode enabled; all files use `.ts` / `.tsx`
- **React 18** + **Vite 5** — framework and build tool
- **Tailwind CSS 3** — all styling; no CSS modules, no inline styles
- **Framer Motion 11** — animations and game feedback (correct/wrong, XP pop-ups, celebrations)
- **pitchy 4** — pitch detection using the McLeod method; runs entirely in-browser
- **Tone.js 15** — note playback and audio synthesis
- **Three.js 0.165** + **@types/three** — 3D bridge scene rendered in `BridgeScene.tsx`
- **Socket.io-client 4** — real-time multiplayer connection
- **React Router DOM 6** — client-side routing
- **Zustand 4** — global state (user session, XP, socket instance)

### Backend (`server/`)
- **TypeScript** — compiled with `tsc`, run via `tsx` in dev
- **Node.js** + **Express 4** + **@types/express** — REST API
- **Socket.io 4** — WebSocket server; handles matchmaking, game rooms, live scoring
- **@supabase/supabase-js 2** — server-side DB access using the service role key
- **cors** + **@types/cors** + **dotenv** — middleware and env management

### Database & Auth
- **Supabase** — Postgres database, email/Google auth, and realtime subscriptions
- Auth is handled client-side via Supabase's SDK; the server verifies JWTs on protected routes

---

## 🔑 Key Concepts

### Pitch Detection Pipeline
```
Mic → getUserMedia() → AudioContext → AnalyserNode
    → Float32Array → pitchy.PitchDetector → [Hz, clarity]
    → noteUtils.hzToNote() → "A4" / "C#3" / etc.
    → compare vs target note → score round
```
- Clarity threshold: only accept readings above `0.9` to avoid false positives
- Detection runs on a `requestAnimationFrame` loop, managed in `usePitchDetection.ts`
- Target notes are always played back via Tone.js before the user responds

### Note Utilities (`client/src/lib/noteUtils.ts`)
- `hzToNote(freq: number): string` — converts Hz to note name (e.g. 440 → "A4")
- `noteToCents(detected: string, target: string): number` — deviation in cents for feedback UI
- `NOTE_FREQUENCIES` in `constants.ts` — full map of note names to Hz values (A0–C8)

### Scoring
- Each correct answer awards base XP, modified by response speed
- Streak multipliers apply after 3+ consecutive correct answers
- ELO is only updated at match end via the server (`server/src/lib/elo.ts`)

### Multiplayer Flow
```
Client joins queue       → emit join_queue { userId, elo }
Server pairs two players → emit match_found { roomId, opponent, noteSequence }
Each round:
  Server plays note seed → both clients get same target note
  Client answers         → emit note_result { roomId, noteIndex, correct, timeMs }
  Server scores + syncs  → emit round_update { scores, currentNote }
Match ends               → emit match_end { winner, eloChange, xpGained }
```
- Note sequences are seeded deterministically (`noteSeeder.ts`) so both players always get the same notes
- Rooms are cleaned up server-side when both players disconnect or match ends

### The Bridge 🌉 (`client/src/components/bridge/`)
- `BridgeScene.tsx` — Three.js canvas; suspension bridge with towers, cables, and planks
- Planks are added procedurally based on user XP level (one plank per level milestone)
- During 1v1 matches, each player builds their half of the bridge as they score — first to complete their half triggers a win animation
- On the Home page, the bridge is the hero element and animates on load

---

## 📁 Important Files

| File | Purpose |
|---|---|
| `client/src/hooks/usePitchDetection.ts` | Core mic + pitchy loop |
| `client/src/hooks/useSocket.ts` | Socket.io connection, event listeners |
| `client/src/hooks/useGameState.ts` | Round timer, answer validation, XP calc |
| `client/src/hooks/useAudio.ts` | Tone.js note playback |
| `client/src/lib/noteUtils.ts` | Hz ↔ note name conversions |
| `client/src/lib/constants.ts` | NOTE_FREQUENCIES, XP_TABLE, game config |
| `client/src/store/useStore.ts` | Zustand store (user, XP, socket, game state) |
| `client/src/components/bridge/BridgeScene.tsx` | Three.js bridge rendering |
| `client/src/types/index.ts` | Shared frontend types (User, MatchResult, NoteEvent, etc.) |
| `server/src/socket/matchmaking.ts` | Queue and room pairing logic |
| `server/src/socket/gameRoom.ts` | 1v1 round management |
| `server/src/lib/elo.ts` | ELO rating update formula |
| `server/src/lib/noteSeeder.ts` | Seeded note sequence generation |
| `server/src/types/index.ts` | Shared backend types (Room, QueueEntry, SocketPayloads, etc.) |
| `supabase/migrations/` | DB schema — always check before modifying tables |

---

## 🗃️ Database Schema (Supabase)

### `users`
```sql
id          uuid primary key  -- from Supabase Auth
username    text unique
xp          integer default 0
level       integer default 1
elo         integer default 1000
streak      integer default 0
last_active date
```

### `match_results`
```sql
id          uuid primary key
player_a    uuid references users(id)
player_b    uuid references users(id)
winner      uuid references users(id)
elo_change  integer
played_at   timestamptz default now()
```

### `leaderboard` (view)
```sql
-- Ordered by elo desc, then xp desc
-- Exposed via server/src/routes/leaderboard.ts
```

---

## ⚙️ Environment Variables

### `client/.env`
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SERVER_URL=http://localhost:4000
```

### `server/.env`
```
PORT=4000
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
CLIENT_URL=http://localhost:5173
```

---

## ✅ Conventions

- **TypeScript**: strict mode on (`"strict": true` in `tsconfig.json`); no `any` — use `unknown` and narrow, or define a proper type
- **Types**: shared types live in `src/types/index.ts` in each workspace; do not inline complex types in component files
- **Components**: PascalCase, one component per file, `.tsx` extension
- **Hooks**: camelCase prefixed with `use`, `.ts` extension, live in `client/src/hooks/`
- **Utilities**: plain typed functions in `client/src/lib/` or `server/src/lib/`, `.ts` extension
- **Socket events**: event name constants and payload types defined in `server/src/socket/events.ts` — always import from there, never hardcode event strings
- **Styling**: Tailwind only; no custom CSS unless absolutely necessary for Three.js canvas
- **State**: Zustand for global state; `useState`/`useReducer` for local component state only
- **No prop drilling**: if data needs to go more than 2 levels deep, put it in the Zustand store

---

## ⚠️ Gotchas

- **TypeScript**: never use `any` — if a type is unknown at call time, use `unknown` and narrow it; Socket.io payloads must be typed via generics or cast after validation
- `pitchy` requires a `Float32Array` from `getFloatTimeDomainData()`, not `getByteTimeDomainData()`
- Tone.js requires user gesture before `AudioContext` can start — always trigger `Tone.start()` on a button click
- Three.js `OrbitControls` must be imported separately; it is not in the core bundle
- Socket.io rooms are in-memory only — do not rely on them surviving a server restart
- Supabase RLS (Row Level Security) is enabled — always test queries as the authenticated user role, not the service role
- `VITE_` prefix is required for all env vars exposed to the frontend
message.txt
9 Ko