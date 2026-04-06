-- Add optional player name for leaderboard display
alter table game_sessions add column player_name text;

create index if not exists idx_game_sessions_avg_score on game_sessions (avg_score desc);
