-- supabase/schema.sql
-- FeeLeaks database schema. Run once in the Supabase SQL editor when Supabase is set up.
-- The website talks to the database from the server only (secret key), so row level
-- security is switched on with no public policies: browsers can't read or write directly.

create extension if not exists pg_trgm;

create table institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  aliases text[] not null default '{}',
  type text not null check (type in ('school', 'college', 'university', 'tuition_centre', 'other')),
  city text not null,
  state text not null,
  board text,
  created_at timestamptz not null default now()
);
create index institutions_name_trgm on institutions using gin (name gin_trgm_ops);
create index institutions_city on institutions (lower(city));

create table reports (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions (id) on delete restrict,
  username text not null,
  original_text text not null,
  academic_year text,
  class_or_course text,
  admission_type text check (admission_type in ('new', 'continuing', 'management_quota', 'rte_ews', 'other')),
  reported_total bigint check (reported_total >= 0),
  hike_percent numeric(6, 2),
  -- per-report key derived from the browser's private device ID; can't be linked across reports
  owner_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reports_institution on reports (institution_id, created_at desc);
create index reports_created on reports (created_at desc);

create table fee_components (
  id bigint generated always as identity primary key,
  report_id uuid not null references reports (id) on delete cascade,
  position int not null,
  kind text not null check (kind in ('tuition', 'admission', 'development', 'donation', 'transport', 'books_uniform', 'hostel', 'exam', 'other')),
  label text,
  amount bigint not null check (amount >= 0),
  frequency text not null check (frequency in ('one_time', 'yearly', 'half_yearly', 'quarterly', 'monthly'))
);
create index fee_components_report on fee_components (report_id);

create table report_flags (
  report_id uuid not null references reports (id) on delete cascade,
  kind text not null check (kind in ('donation_capitation', 'no_receipt', 'forced_purchase', 'fee_on_rte_seat', 'refund_refused', 'unapproved_hike')),
  note text,
  primary key (report_id, kind)
);

create table evidence_files (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports (id) on delete cascade,
  kind text not null check (kind in ('receipt', 'circular', 'message', 'other')),
  mime_type text not null,
  size int not null,
  storage_path text not null
);
create index evidence_report on evidence_files (report_id);

create table me_toos (
  report_id uuid not null references reports (id) on delete cascade,
  -- per-report key derived from the browser's private device ID
  device_key text not null,
  created_at timestamptz not null default now(),
  primary key (report_id, device_key)
);

create table push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table follows (
  endpoint text not null references push_subscriptions (endpoint) on delete cascade,
  institution_id uuid not null references institutions (id) on delete cascade,
  primary key (endpoint, institution_id)
);
create index follows_institution on follows (institution_id);

alter table institutions enable row level security;
alter table reports enable row level security;
alter table fee_components enable row level security;
alter table report_flags enable row level security;
alter table evidence_files enable row level security;
alter table me_toos enable row level security;
alter table push_subscriptions enable row level security;
alter table follows enable row level security;

-- Evidence files go in a private storage bucket; the site serves them through its own
-- /evidence/<id> route.
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Fee items and flags of a report, replaced as a whole (used by create and update).
create or replace function replace_report_details(r uuid, p jsonb) returns void
language plpgsql as $$
begin
  delete from fee_components where report_id = r;
  delete from report_flags where report_id = r;
  insert into fee_components (report_id, position, kind, label, amount, frequency)
  select r, c.ord::int, c.value->>'kind', c.value->>'label', (c.value->>'amount')::bigint, c.value->>'frequency'
  from jsonb_array_elements(coalesce(p->'components', '[]'::jsonb)) with ordinality as c(value, ord);
  insert into report_flags (report_id, kind, note)
  select r, f->>'kind', f->>'note'
  from jsonb_array_elements(coalesce(p->'flags', '[]'::jsonb)) as f;
end $$;

-- Creates a report with its fee items, flags and evidence in one transaction.
create or replace function create_report(p jsonb) returns void
language plpgsql as $$
declare
  r uuid := (p->>'id')::uuid;
begin
  insert into reports (id, institution_id, username, original_text, academic_year, class_or_course,
                       admission_type, reported_total, hike_percent, owner_key)
  values (r, (p->>'institution_id')::uuid, p->>'username', p->>'original_text', p->>'academic_year',
          p->>'class_or_course', p->>'admission_type', (p->>'reported_total')::bigint,
          (p->>'hike_percent')::numeric, p->>'owner_key');
  perform replace_report_details(r, p);
  insert into evidence_files (id, report_id, kind, mime_type, size, storage_path)
  select (e->>'id')::uuid, r, e->>'kind', e->>'mime_type', (e->>'size')::int, e->>'storage_path'
  from jsonb_array_elements(coalesce(p->'evidence', '[]'::jsonb)) as e;
end $$;

-- Updates a report's text and structured fields in one transaction.
create or replace function update_report(p jsonb) returns void
language plpgsql as $$
declare
  r uuid := (p->>'id')::uuid;
begin
  update reports set
    institution_id = (p->>'institution_id')::uuid,
    original_text = p->>'original_text',
    academic_year = p->>'academic_year',
    class_or_course = p->>'class_or_course',
    admission_type = p->>'admission_type',
    reported_total = (p->>'reported_total')::bigint,
    hike_percent = (p->>'hike_percent')::numeric,
    updated_at = now()
  where id = r;
  perform replace_report_details(r, p);
end $$;

-- Only the server (secret key) may call these.
revoke execute on function replace_report_details(uuid, jsonb) from public, anon, authenticated;
revoke execute on function create_report(jsonb) from public, anon, authenticated;
revoke execute on function update_report(jsonb) from public, anon, authenticated;

-- Reddit-style votes and comments (same as migrations/002_votes_comments.sql)

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
