-- 004_practice_progress.sql
-- Adds singleplayer practice progress (level, level XP, tutorial flags, per-note
-- accuracy stats) and locks the data behind row-level security so each user can
-- only read/write their own rows.

-- ------------------------------------------------------------------
-- 1. Extend `users` with practice columns
-- ------------------------------------------------------------------
alter table users
  add column if not exists level integer not null default 1,
  add column if not exists level_xp integer not null default 0,
  add column if not exists tutorial_completed integer[] not null default '{}'::integer[];

-- ------------------------------------------------------------------
-- 2. Per-note training stats
-- ------------------------------------------------------------------
create table if not exists note_stats (
  user_id uuid not null references users(id) on delete cascade,
  note text not null,
  correct integer not null default 0,
  incorrect integer not null default 0,
  recent_misses text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  primary key (user_id, note)
);

create index if not exists note_stats_user_id_idx on note_stats (user_id);

-- ------------------------------------------------------------------
-- 3. Row-level security
--    Users may only see / insert / update rows that belong to them.
--    `users.id` is expected to equal `auth.uid()` (the Supabase auth ID).
-- ------------------------------------------------------------------
alter table users enable row level security;
alter table note_stats enable row level security;

drop policy if exists "users select own" on users;
create policy "users select own"
  on users for select
  using (auth.uid() = id);

drop policy if exists "users insert own" on users;
create policy "users insert own"
  on users for insert
  with check (auth.uid() = id);

drop policy if exists "users update own" on users;
create policy "users update own"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "note_stats select own" on note_stats;
create policy "note_stats select own"
  on note_stats for select
  using (auth.uid() = user_id);

drop policy if exists "note_stats insert own" on note_stats;
create policy "note_stats insert own"
  on note_stats for insert
  with check (auth.uid() = user_id);

drop policy if exists "note_stats update own" on note_stats;
create policy "note_stats update own"
  on note_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
