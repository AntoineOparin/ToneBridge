create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text unique not null,
  xp integer not null default 0,
  elo integer not null default 1000,
  streak integer not null default 0,
  last_active date,
  created_at timestamptz not null default now()
);
