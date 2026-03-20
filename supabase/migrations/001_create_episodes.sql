-- Episodes table for the P3 podcast corpus
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  podcast text not null,
  published_at timestamptz,
  key_topics text[] not null default '{}',
  quotes text[] not null default '{}',
  key_takeaways text[] not null default '{}',
  full_summary text not null default '',
  created_at timestamptz not null default now()
);

-- Index for topic-based queries
create index if not exists idx_episodes_key_topics on episodes using gin (key_topics);

-- Enable row-level security
alter table episodes enable row level security;

-- Allow public read access (game needs to read episodes)
create policy "Episodes are publicly readable"
  on episodes for select
  using (true);
