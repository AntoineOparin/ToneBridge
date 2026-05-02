# AI Prompt History

Log of prompts submitted to Claude Code (Anthropic) during DawsHacks 2026 development.
All generated code was reviewed and understood before committing.

---

## 2026-05-02

---

### [1] Project scaffolding

**Prompt:**
> Read the project spec and scaffold the full monorepo structure — `client/` (React + Vite + TypeScript), `server/` (Node + Express + Socket.io + TypeScript ESM), and `supabase/migrations/`. Set up tsconfig, Tailwind, path aliases, and all package.json files. Everything must be TypeScript strict mode — no JavaScript files.

**Files affected:**
- Root monorepo structure
- `client/vite.config.ts`, `client/tsconfig.json`, `client/tailwind.config.js`
- `server/tsconfig.json`, `server/package.json`
- `supabase/migrations/001_users.sql`, `002_scores.sql`, `003_leaderboard.sql`

**Review notes:**
Reviewed all config files. Adjusted Tailwind color scales (`brand`, `surface`, `accent`) to match our design intent. Confirmed strict mode was on in both tsconfigs.

---

### [2] Supabase Google OAuth auth flow

**Prompt:**
> Implement full authentication using Supabase Google OAuth. The client should handle session state via `supabase.auth.getSession()` and `onAuthStateChange`. Add a `ProtectedRoute` component that redirects unauthenticated users to `/login`. On first login, auto-insert the user into `public.users` via a Postgres trigger so we don't have to handle that in application code.

**Files affected:**
- `client/src/pages/Login.tsx`
- `client/src/App.tsx`
- `supabase/migrations/004_profile_complete.sql` — trigger `handle_new_user()`

**Review notes:**
Verified the trigger fires correctly in Supabase dashboard after running the migration. Confirmed `.maybeSingle()` is used instead of `.single()` to avoid 406 errors when no row exists yet. Added `.catch(() => setLoading(false))` manually after noticing blank screen on cold load.

---

### [3] Leaderboard page

**Prompt:**
> Build a `/leaderboard` page that fetches all users from `public.users` ordered by ELO descending (limit 50). Display a top-3 podium (arranged 2nd / 1st / 3rd) and a staggered ranked list below. Highlight the current user's row. Use Framer Motion for entrance animations and Three.js for a background scene (animated bar columns + floating particles). No mock data — all values from the live database.

**Files affected:**
- `client/src/pages/Leaderboard.tsx`
- `client/src/lib/theme.ts` — extracted Tailwind colors for Three.js hex conversion

**Review notes:**
Had to extract Tailwind config colors into `theme.ts` to fix a TypeScript `implicit any` error from importing the config directly. Three.js scene uses `AdditiveBlending` on particles for the glow effect — kept opacity low (0.5) so it doesn't overpower the UI. Verified RLS policy ("Public read" on `users`) was needed for the leaderboard query to work.

---

### [4] Real-time 1v1 multiplayer — core system

**Prompt:**
> Implement a full real-time 1v1 multiplayer mode. Two players join a matchmaking queue via Socket.io. The server pairs the first two players, assigns them to a shared room, and sends both a deterministically seeded note sequence (50 notes, same for both). Each player answers note challenges independently — the server receives results, updates scores server-side, and broadcasts `round_update` to the room. Match ends after 60 seconds via a server-side `setTimeout`. Reuse the existing `NoteChallenge` component from singleplayer. Show live scores for both players with a progress bar.

**Files affected:**
- `server/src/socket/matchmaking.ts` — queue array, LCG note sequence generator, `startMatch()`
- `server/src/socket/gameRoom.ts` — `createRoom()`, `endMatch()`, `registerGameRoom()`
- `server/src/socket/events.ts` — event name constants
- `client/src/pages/Multiplayer.tsx` — state machine (`idle | queuing | playing | results`)
- `client/src/components/multiplayer/DuelArena.tsx` — timer, scores, NoteChallenge integration
- `client/src/components/multiplayer/Lobby.tsx` — animated waiting screen

**Review notes:**
Verified the seeded LCG produces the same sequence for a given seed — tested manually with two console logs. Confirmed `noteIndex` advances client-side only; server only tracks score totals, not which note each player is on. The `listenersAttached` ref prevents duplicate socket listeners on re-render.

---

### [5] Singing pitch challenges in multiplayer

**Prompt:**
> Every 4th challenge in multiplayer should be a singing challenge instead of identify mode (`index % 4 === 3 → 'sing'`). The existing `NoteChallenge` component already supports both modes via a `mode` prop — wire this up in `DuelArena`. Ensure the mic stops cleanly between rounds so there's no audio bleed.

**Files affected:**
- `client/src/components/multiplayer/DuelArena.tsx` — `getMode(index)` function

**Review notes:**
Simple change. Confirmed `pitch.stop()` is called inside `NoteChallenge`'s `finish()` callback when `singing` is true, so mic releases correctly between rounds.

---

### [6] Disconnect handling

**Prompt:**
> If a player disconnects mid-match, the server should detect this via Socket.io's `disconnect` event, immediately end the match with `reason: 'disconnect'`, and notify the remaining player. The remaining client should show an "Opponent left" message and automatically return to the idle menu after 3 seconds — no action buttons needed in this case.

**Files affected:**
- `server/src/socket/gameRoom.ts` — `disconnect` handler calling `endMatch(..., 'disconnect')`
- `client/src/components/multiplayer/DuelArena.tsx` — `isDisconnect` branch in results overlay
- `client/src/pages/Multiplayer.tsx` — `setTimeout` auto-reset on disconnect reason

**Review notes:**
Tested by closing one browser tab mid-match. Confirmed the remaining player sees the overlay and is redirected. Confirmed rooms are cleaned from the `rooms` Map so no memory leak.

---

### [7] ELO rating system + rematch

**Prompt:**
> On match end, calculate ELO changes using the chess formula (k=32, expected score = 1 / (1 + 10^((opponentElo - playerElo) / 400))). Update both players' ELO in Supabase immediately after the match. Show the delta (+N / -N) on the results screen. Add a rematch system: if both players request a rematch within 15 seconds, start a new match immediately. If only one requests and time expires, emit `rematch_declined` and auto-queue that player for a new opponent.

**Files affected:**
- `server/src/lib/elo.ts` — `calculateElo(winnerElo, loserElo)`
- `server/src/socket/gameRoom.ts` — ELO update in `endMatch()`, Supabase writes
- `server/src/socket/matchmaking.ts` — `rematchPending` Map, 15s timeout, `REMATCH_REQUEST` handler
- `client/src/pages/Multiplayer.tsx` — local ELO optimistic update, `handleRematch()`
- `client/src/components/multiplayer/DuelArena.tsx` — ELO delta display, rematch/find-new/leave buttons

**Review notes:**
ELO update to Supabase is fire-and-forget (`Promise.all(...).catch(...)`) to avoid blocking the `match_end` emit. Verified the formula produces sensible values: 1000 vs 1000 → ±16, 800 vs 1200 → winner gains ~29, loser loses ~3.

---

### [8] Suppress feedback popups in multiplayer + skip penalty

**Prompt:**
> In singleplayer, `NoteChallenge` shows a `ScorePopup` ("+10 XP", "That was C#3") after each answer. This should be hidden in multiplayer — the pacing is too fast for popups to be useful. Add a `showPopup?: boolean` prop to `NoteChallenge` (default `true`) and pass `showPopup={false}` from `DuelArena`. Additionally, skipping a note in multiplayer should deduct 1 point from the player's score (minimum 0), both client-side optimistically and server-side authoritatively. Send `skipped: true` in the `note_result` payload.

**Files affected:**
- `client/src/components/game/NoteChallenge.tsx` — `showPopup` prop, conditional render
- `client/src/components/multiplayer/DuelArena.tsx` — pass `showPopup={false}`, detect skip via `answer === null`
- `client/src/pages/Multiplayer.tsx` — `handleNoteResult(correct, skipped?)`, optimistic score decrement
- `server/src/socket/gameRoom.ts` — `data.skipped` branch, `Math.max(0, player.score - 1)`

**Review notes:**
Skip is detected when `outcome === 'incorrect' && result.answer === null` — this distinguishes a skip from a wrong answer (which has a non-null answer). Singleplayer is unaffected: `showPopup` defaults to `true` and no `skipped` payload is sent from Practice.

---

### [9] Project README and AI disclosure

**Prompt:**
> Write a complete `README.md` at the repo root suitable for DawsHacks judging. Include: project description, how it connects to the Bridges theme, full feature list, tech stack table, architecture diagrams (pitch detection pipeline, socket event flow, file structure), local setup instructions with env vars and migration order, team roles, and an honest AI usage disclosure section. Also answer the hackathon's guiding questions.

**Files affected:**
- `README.md` (created)

**Review notes:**
Reviewed all sections. Updated team roles table to reflect actual work split. AI disclosure is honest and specific — lists which areas Claude assisted with and clarifies that all code was reviewed before merging.

---

*Last updated: 2026-05-02*
