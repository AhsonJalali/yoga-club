-- Yoga Club schema. Run this in the Supabase SQL editor for a fresh project.

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  venmo_handle text,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructor text not null default 'Yoga With Adriene',
  youtube_url text not null,
  duration_minutes int not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  session_date date not null,
  status text not null default 'done' check (status in ('done', 'skipped')),
  note text,
  created_at timestamptz not null default now(),
  unique (member_id, session_date)
);
-- If you applied an earlier version of this schema, run this to add the column:
-- alter table check_ins add column if not exists status text not null default 'done' check (status in ('done', 'skipped'));

create index if not exists check_ins_session_date_idx on check_ins (session_date);
create index if not exists check_ins_member_id_idx on check_ins (member_id);
