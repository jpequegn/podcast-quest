-- Questions table for generated quiz questions
create type question_type as enum (
  'factual_recall',
  'speaker_attribution',
  'trend_identification',
  'prediction',
  'connect_the_dots'
);

create type question_format as enum ('multiple_choice', 'open');

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid references episodes(id) on delete cascade,
  second_episode_id uuid references episodes(id) on delete set null,
  type question_type not null,
  format question_format not null,
  text text not null,
  options text[] default null,
  correct_answer text not null,
  model_answer text,
  scoring_rubric text,
  topic text not null,
  source_quote text,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_topic on questions (topic);
create index if not exists idx_questions_type on questions (type);
create index if not exists idx_questions_episode on questions (episode_id);

alter table questions enable row level security;

create policy "Questions are publicly readable"
  on questions for select
  using (true);
