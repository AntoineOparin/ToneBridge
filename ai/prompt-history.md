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


### [9] Practice mascot (Forte): calmer coaching UX + API cleanup

**Prompt:**
> Rework the Practice page mascot so it feels less noisy. Coaching tips should come **only** from an explicit tap on Forte, not from hover timers or dwell logic. Hover should do nothing server-side: keep a tiny local UI affordance (e.g. a small “hello” bubble above the sprite) so we don’t spam `useTipBot`. Remove `mascotInteract` / hover plumbing in favor of a single `mascotClick(ctx)` entry point. Render tip content in a **fixed side panel** (not a centered toast) so identify rounds and the piano keyboard stay unobstructed. Update `Practice.tsx` so it calls `mascotClick` with a stable context ref (`mode`, `targetNote`, `levelId`, `streak`) and drops any dead `onMascotHover` props.

**Files affected:**
- `client/src/hooks/useTipBot.ts` — `mascotClick`, removed hover-driven mascot tips
- `client/src/components/character/Forte.tsx` — side aside for tips, hello-on-hover only, happy avatars for tip chrome
- `client/src/pages/Practice.tsx` — `onMascotClick` wiring

**Review notes:**
Confirmed tip IDs starting with `mc-` still route through `pickMascotTip('click', …)`. Verified Forte bottom-right button uses a consistent happy face so mood heuristics don’t fight the art direction.

---

### [10] Identify mode: stable reference playback + avatar polish

**Prompt:**
> In **Name the note** (`mode === 'identify'`), the synthesized reference pitch must fire **once** shortly after the round mounts, and **only again** when the user clicks Replay — never on unrelated React renders (e.g. tip bot state, streak HUD updates). Root cause: an effect depended on the entire `useAudio()` object, which is reallocated every render, so the scheduled `playNote` kept rescheduling. Fix by destructuring `{ playNote }` and listing **only** `[mode, target, playNote]` (plus round remount via parent `key`). Use the same `playNote`-based handler for both initial tutorial-style playback and the Replay button. Also stop showing a “concerned” mouth on the interactive mascot when per-note stats are rough; use **happy** for the corner button and tip-card avatars so it matches the coaching tone.

**Files affected:**
- `client/src/components/game/NoteChallenge.tsx` — `playNote` / `playCorrect` / `playWrong` destructuring; identify `useEffect` deps; replay handler reuse
- `client/src/components/character/Forte.tsx` — avatar mood overrides

**Review notes:**
Ran `tsc` after dependency fix. Singing mode still gates “Sing it” on `hasPlayed` via the same reference pipeline.

---

### [11] Round feedback row: `ScorePopup` placement + skip labeling

**Prompt:**
> Move post-answer feedback (`ScorePopup`: “+10 XP”, “That was …”, “Try again”) out of an absolutely centered layer on top of `NoteDisplay`. It currently blocks the big card and the multiple-choice tiles. Render it in a **dedicated horizontal strip** between the note display and the control row (Replay / Skip / piano), with sensible `min-height`, `max-width`, and smaller type for long wrong-note strings. Extend `RoundResult` with an optional `skipped?: boolean` set only from `handleSkip`. When true, the popup string must read **“Skipped”**, not the generic wrong-answer fallback.

**Files affected:**
- `client/src/components/game/ScorePopup.tsx` — flow layout, responsive font sizing / `line-clamp` behavior
- `client/src/components/game/NoteChallenge.tsx` — feedback strip; `finish()` message logic; `skipped: true` on skip
- `client/src/types/index.ts` — `skipped?: boolean` on `RoundResult`

**Review notes:**
Later merged with upstream `showPopup?: boolean` (multiplayer hides popups): wrap the **entire** feedback strip in `showPopup` so Duel mode doesn’t reserve dead vertical space.

---

### [12] Home page: grid balance for Learn card + dev control removal + copy pass

**Prompt:**
> The Learn (“Pitch theory & technique”) tile used `md:col-span-3`, so it read as a full-width banner and dwarfed the 1-column Profile / Multiplayer cards. Resize it to **`md:col-span-2`** so row two mirrors the 2:1 split of row one (Practice vs Multiplayer). Keep internal layout responsive (`flex-col` on phones, row alignment from `sm` up), shorten body copy, and use `line-clamp` so height stays aligned with adjacent cards. Remove the temporary **“Play bridge animation”** dev button and the inline `MasteryBridge` preview overlay from Home. Rewrite hero and card blurbs in plain, non-marketing language and **avoid em dashes** in user-visible strings.

**Files affected:**
- `client/src/pages/Home.tsx`

**Review notes:**
Purged unused `useState` / `AnimatePresence` / `MasteryBridge` import after removing the dev overlay.

---

### [13] Git: sync `develop`, resolve `NoteChallenge` rebase conflict

**Prompt:**
> Pull latest `origin/develop`, push local commits. During `git pull --rebase`, `client/src/components/game/NoteChallenge.tsx` conflicted: upstream added `showPopup?: boolean` to suppress `ScorePopup` in multiplayer, while our branch moved `ScorePopup` into a dedicated strip below `NoteDisplay`. Resolve by **keeping both behaviors**: retain the refactored layout and wrap the feedback strip in `{showPopup && (…)}` so Duel passes `showPopup={false}` without restoring the old centered overlay.

**Files affected:**
- `client/src/components/game/NoteChallenge.tsx` (conflict resolution only)

**Review notes:**
Re-ran `npx tsc --noEmit` after merge. Pushed rebased `develop` to origin.

---

### [14] Mobile layout experiment (reverted)

**Prompt:**
> Run a full client pass for small viewports: shared responsive header, tighter hero type scale, `PianoKeyboard` as a 2×2 / 4-column grid, Forte tips anchored for narrow screens, safe-area padding, `StreakCounter` density, MasteryBridge / LevelTutorial overflow. **Follow-up:** revert that entire changeset — keep the tree aligned with desktop-first layout; only retain separate bugfixes (e.g. `playNote` stable deps) where they were merged independently.

**Files affected:**
- (Reverted) would have touched `SiteHeader` (since deleted), `index.css`, many `px-*` / `Forte` / `PianoKeyboard` files
- **Retained elsewhere:** `NoteChallenge` / `useAudio` patterns from other tasks

**Review notes:**
`git restore` on the feature branch; removed untracked `client/src/components/layout/`. No mobile-specific code left in `develop` from that experiment.

---

### [15] Server healthcheck route

**Prompt:**
> Add a lightweight healthcheck endpoint at `GET /api/healthcheck` so deployment pipelines and monitors can verify the server is alive. It should return JSON with `{ status: "ok", uptime: <seconds> }`. Follow the existing Express router pattern in `server/src/routes/` and mount it alongside the other API routers in `index.ts`. Keep it stateless and dependency-free.

**Files affected:**
- `server/src/routes/healthcheck.ts` — new router
- `server/src/index.ts` — mount at `/api/healthcheck`

**Review notes:**
Verified with `curl http://localhost:4000/api/healthcheck`. TypeScript strict mode passed.

---

### [16] Login page theme alignment

**Prompt:**
> Apply the ToneBridge Tailwind theme to the Login page. Replace hardcoded `bg-gray-950` and `text-gray-400` with `bg-surface-950` and `text-surface-400`. Use `text-brand-400` for the "Bridge" accent in the title. Restyle the Google sign-in button as a dark card (`bg-surface-800`, `border-surface-700`) with a hover glow to `brand-500/50`. Add Framer Motion staggered entrance animations matching the Landing page timing. Include a custom SVG bridge icon above the title. Also fix `Home.tsx` to use `bg-surface-950` and `text-surface-400` for consistency.

**Files affected:**
- `client/src/pages/Login.tsx`
- `client/src/pages/Home.tsx`

**Review notes:**
Verified `npx tsc --noEmit` passes. The BridgeIcon SVG uses `currentColor` set to `text-brand-400` so it inherits the theme.

---

### [17] PianoKeyboard: adaptive centered layout

**Prompt:**
> Fix the multiple-choice piano tile layout so it centers and sizes itself to the exact number of options passed, rather than using a rigid `grid-cols-2 sm:grid-cols-4` that leaves gaps when fewer than 4 options are supplied. Switch the container to `flex flex-wrap justify-center` and give each key `min-w-[140px] flex-1 max-w-[180px]` so it naturally fills space. Keep the existing state styling (emerald for correct, red for wrong pick, surface for idle).

**Files affected:**
- `client/src/components/audio/PianoKeyboard.tsx`

**Review notes:**
Verified with `IDENTIFY_CHOICES = 4` in constants. Tiles now center in a single row on desktop and wrap gracefully on narrow screens.

---

### [18] Bridge component overhaul: BridgeScene, BridgeProgress, MasteryBridge polish

**Prompt:**
> The bridge components (`BridgeScene.tsx` and `BridgeProgress.tsx`) are empty TODO stubs. Implement them coherently with the app theme. `BridgeScene` should be a decorative SVG suspension bridge with pulsing pillar lights, suspension cables, and a mist overlay. `BridgeProgress` should replace the linear progress bar on the Practice page: an SVG with two stone pillars, suspension cables, and planks that light up in `brand-500` as the user's level progress increases. Include level labels on each pillar. For `MasteryBridge`, polish the overlay banners by wrapping them in `surface-900/60` backdrop-blur cards with `surface-800` borders so the text is readable over the Three.js canvas.

**Files affected:**
- `client/src/components/bridge/BridgeScene.tsx` — new SVG decorative bridge
- `client/src/components/bridge/BridgeProgress.tsx` — new themed progress indicator
- `client/src/components/bridge/MasteryBridge.tsx` — overlay card styling
- `client/src/pages/Practice.tsx` — swap linear bar for `BridgeProgress`, remove unused `motion` import

**Review notes:**
Plank count set to 14 with staggered `framer-motion` transitions. Both BridgeScene and BridgeProgress use `surface-*` and `brand-*` colors exclusively. TypeScript passed.

---

### [19] MasteryBridge: dev replay control

**Prompt:**
> Add a replay mechanism to `MasteryBridge` so the level-up animation can be re-triggered during development without requiring a full level clear. Introduce a `replayCount` state that increments when a "Replay animation" button is clicked; wire this into the `useEffect` dependency array so the Three.js scene rebuilds. Reset `completedRef` on each replay so the full sequence plays again. Place the button in the top-right corner with `z-20` so it sits above the canvas.

**Files affected:**
- `client/src/components/bridge/MasteryBridge.tsx`

**Review notes:**
The cleanup function disposes the previous renderer and removes the old `<canvas>` from the DOM before the new effect runs, so there is no memory leak or duplicate canvas.

---

### [20] MasteryBridge: add visible bridge deck for Forte

**Prompt:**
> Forte appears to walk on air because there is no visible surface beneath him. Add a static bridge deck between the two pillars: a `BoxGeometry` spanning the gap at y ≈ 1.52, plus thin edge rails on both sides. Lower Forte's base Y position from 1.6 to 1.54 so his feet touch the deck. Replace the hardcoded `1.6` Y values in the animation loop with a `FORTE_Y` constant for maintainability.

**Files affected:**
- `client/src/components/bridge/MasteryBridge.tsx`

**Review notes:**
Deck material uses `surface-600` with high roughness to look like weathered stone. Rails at `surface-500` with slight metalness.

---

### [21] MasteryBridge: parabolic bridge deck + Forte follows the curve

**Prompt:**
> The current bridge deck is a straight horizontal slab, which looks unrealistic for a suspension bridge. Replace it with a segmented parabolic deck that sags in the middle (modeled as `deckY(x) = pillarTop - sin((x+4)/8 * PI) * sag`). Each segment should be a small `BoxGeometry` rotated to match the local slope of the curve, with edge rails rotated the same way. Update Forte's animation loop so his Y position tracks `deckY(x)` as he walks across, and add a slight forward `rotation.z` based on the deck's slope so he leans into the incline.

**Files affected:**
- `client/src/components/bridge/MasteryBridge.tsx`

**Review notes:**
`deckY` and `deckSlope` are helper functions defined inside the effect. Segment count is 20, which is smooth enough at the current camera distance. Step lift is reduced from 0.18 to 0.12 since the slope already provides natural vertical motion.

---

### [22] Auth routing: redirect logged-in users away from public landing pages

**Prompt:**
> Fix the client-side auth routing so authenticated users cannot see the Landing page (`/`) or Login page (`/login`) by manually typing the URL or using the back button. Introduce a `PublicOnlyRoute` wrapper component that redirects to `/home` when `session` is present. Apply it to both `/` and `/login`. Remove the redundant `useEffect` + `navigate` session checks inside `Login.tsx` since the router now handles the redirect before the component mounts.

**Files affected:**
- `client/src/App.tsx` — `PublicOnlyRoute` component + route wrapping
- `client/src/pages/Login.tsx` — removed `useEffect` session redirect logic

**Review notes:**
The `useEffect` in `Login.tsx` was causing a brief flash of the login UI before redirecting. `PublicOnlyRoute` blocks render at the router level, so the flash is gone. Verified `Navigate` uses `replace` so back-button behavior is correct.

---

### [23] CORS troubleshooting: trailing slash in `CLIENT_URL`

**Prompt:**
> Multiplayer Socket.io polling is failing with a CORS error: the browser sends `Origin: http://localhost:5173` but the server responds with `Access-Control-Allow-Origin: http://localhost:5173/`. The mismatch causes a hard block. Investigate the server CORS configuration and the `.env` file. Fix the origin mismatch so the WebSocket handshake succeeds.

**Files affected:**
- `server/.env` — removed trailing slash from `CLIENT_URL`

**Review notes:**
Root cause: `dotenv` loaded `CLIENT_URL=http://localhost:5173/` verbatim, and both `cors` middleware and `socket.io` do exact string matching on the `origin` option. No code change needed; the server process must be restarted after editing `.env` since `dotenv/config` reads the file once at startup.

---

*Last updated: 2026-05-02*
