-- ════════════════════════════════════════
--  Run this ONCE in Supabase SQL Editor
--  (Dashboard → SQL Editor → New query)
-- ════════════════════════════════════════

-- Settings (single row, id always = 1)
create table if not exists settings (
  id            int primary key default 1,
  title         text default '',
  genre         text default '',
  tagline       text default '',
  description   text default '',
  author_name   text default '',
  author_bio    text default '',
  schedule      text default '',
  gate_enabled  boolean default true,
  gate_title    text default '',
  gate_msg      text default '',
  password      text default 'author123',
  updated_at    timestamptz default now()
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- Chapters
create table if not exists chapters (
  id            uuid primary key default gen_random_uuid(),
  chapter_order int not null default 1,
  num           text default '',
  title         text not null,
  teaser        text default '',
  epigraph      text default '',
  body          text default '',
  status        text default 'draft' check (status in ('free','locked','draft')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists chapters_order_idx on chapters(chapter_order);

-- Readers (email subscribers)
create table if not exists readers (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz default now()
);

-- Contact messages
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  subject    text,
  body       text,
  created_at timestamptz default now()
);

-- ── Row Level Security ──────────────────
-- Allow public read of published chapters
alter table chapters enable row level security;
create policy "public can read published chapters"
  on chapters for select
  using (status in ('free', 'locked'));

-- Settings readable by all (title, tagline etc for the site)
alter table settings enable row level security;
create policy "public can read settings"
  on settings for select using (true);

-- Readers: anyone can insert their own email
alter table readers enable row level security;
create policy "anyone can subscribe"
  on readers for insert with check (true);

-- Messages: anyone can send
alter table messages enable row level security;
create policy "anyone can message"
  on messages for insert with check (true);

-- ── Service role policies (for dashboard writes) ──
-- The dashboard uses the anon key but we grant it write access
-- via a simple password check in the app layer (not RLS)
-- For a fully locked-down setup, use a service role key in a serverless function

-- Allow anon to update settings (password-gated in app)
create policy "anon can update settings"
  on settings for update using (true);

-- Allow anon to insert/update/delete chapters (password-gated in app)
create policy "anon can manage chapters"
  on chapters for all using (true);

-- Allow anon to read readers/messages (password-gated in app)
create policy "anon can read readers"
  on readers for select using (true);
create policy "anon can read messages"
  on messages for select using (true);
create policy "anon can delete messages"
  on messages for delete using (true);

