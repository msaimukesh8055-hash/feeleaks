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

-- Evidence files go in a private storage bucket named "evidence"; the site serves them
-- through its own /evidence/<id> route.
