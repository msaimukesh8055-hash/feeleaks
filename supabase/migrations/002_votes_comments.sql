-- supabase/migrations/002_votes_comments.sql
-- Reddit-style votes and comments. Run once in the Supabase SQL editor
-- (already included in schema.sql for new projects).

create table if not exists votes (
  target text not null,          -- e.g. 'case:31' or 'comment:<uuid>'
  device_key text not null,      -- per-target key from the browser's private ID; can't be linked across targets
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (target, device_key)
);
create index if not exists votes_device_key on votes (device_key);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  target text not null,
  parent_id uuid references comments (id) on delete cascade,
  username text not null,
  body text not null check (char_length(body) <= 2000),
  owner_key text not null,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_target on comments (target, created_at);

create or replace view vote_scores as
  select target, sum(value)::int as score from votes group by target;

create or replace view comment_counts as
  select target, count(*)::int as count from comments where not deleted group by target;

alter table votes enable row level security;
alter table comments enable row level security;
revoke all on vote_scores, comment_counts from anon, authenticated;
