-- Yoga Club schema. Run this in the Supabase SQL editor for a fresh project.

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  password_hash text not null,
  venmo_handle text,
  created_at timestamptz not null default now()
);
create unique index if not exists members_email_unique_idx on members (lower(email));

-- Migrating an existing table:
--   alter table members add column if not exists email text;
--   alter table members add column if not exists password_hash text;
--   alter table members drop constraint if exists members_name_key;
--   create unique index if not exists members_email_unique_idx on members (lower(email));
--   -- backfill any rows missing email/password_hash, then make NOT NULL:
--   alter table members alter column email set not null;
--   alter table members alter column password_hash set not null;

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

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  start_date date not null,
  end_date date not null,
  join_closes_at date,
  required_dows int[] not null default '{}',
  penalty_usd numeric not null default 0,
  reveal_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (challenge_id, member_id)
);
create index if not exists challenge_participants_challenge_id_idx on challenge_participants (challenge_id);
create index if not exists challenge_participants_member_id_idx on challenge_participants (member_id);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_token_hash_idx on password_reset_tokens (token_hash);

-- Profile photos + per-challenge ratings/photos were added after the
-- original MVP schema above; these are idempotent for both a fresh install
-- and an existing table.
alter table members add column if not exists avatar_url text;
alter table check_ins add column if not exists challenge_id uuid references challenges(id) on delete set null;
alter table check_ins add column if not exists rating int check (rating between 1 and 5);
alter table check_ins add column if not exists photo_url text;
create index if not exists check_ins_challenge_id_idx on check_ins (challenge_id);
