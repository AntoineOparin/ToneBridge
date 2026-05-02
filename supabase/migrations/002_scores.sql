create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  winner_id uuid references users(id),
  loser_id uuid references users(id),
  winner_elo_change integer not null,
  loser_elo_change integer not null,
  xp_gained integer not null,
  played_at timestamptz not null default now()
);
