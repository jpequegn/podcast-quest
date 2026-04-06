-- Game sessions table for tracking play history and measuring learning
create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  question_count int not null,
  avg_score int not null,
  total_score int not null,
  answers jsonb not null default '[]',
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);

create index if not exists idx_game_sessions_topic on game_sessions (topic);
create index if not exists idx_game_sessions_completed on game_sessions (completed_at desc);

alter table game_sessions enable row level security;

create policy "Game sessions are publicly readable and writable"
  on game_sessions for all
  using (true)
  with check (true);
