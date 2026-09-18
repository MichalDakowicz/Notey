-- Jot. — full backend schema.
-- Paste into Supabase Studio → SQL editor → Run. Safe to re-run.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────── tables

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  year_label text not null default 'First year',
  avatar_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  code text not null default '',
  prof text not null default '',
  tint smallint not null default 0 check (tint between 0 and 4),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notebook_id uuid not null references public.notebooks (id) on delete cascade,
  title text not null default 'Untitled note',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notebook_id uuid not null references public.notebooks (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  starts_at time not null,
  room text not null default ''
);

create index if not exists notebooks_user_idx on public.notebooks (user_id, position);
create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index if not exists notes_notebook_idx on public.notes (notebook_id);
create index if not exists class_sessions_user_day_idx on public.class_sessions (user_id, weekday, starts_at);

-- Full-text search over titles and bodies, for when a term grows past
-- what the client filters comfortably.
create index if not exists notes_fts_idx
  on public.notes using gin (to_tsvector('english', title || ' ' || body));

-- ───────────────────────────────────────────── keep updated_at honest

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_touch_updated_at on public.notes;
create trigger notes_touch_updated_at
  before update on public.notes
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────── a profile row for every signup

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────── row level security

alter table public.profiles enable row level security;
alter table public.notebooks enable row level security;
alter table public.notes enable row level security;
alter table public.class_sessions enable row level security;

drop policy if exists "profiles are private" on public.profiles;
create policy "profiles are private" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own notebooks" on public.notebooks;
create policy "own notebooks" on public.notebooks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own classes" on public.class_sessions;
create policy "own classes" on public.class_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────── storage

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

-- Both buckets are laid out as <user-id>/<file>, so the first path
-- segment is the owner check.
drop policy if exists "own avatar files" on storage.objects;
create policy "own avatar files" on storage.objects
  for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own export files" on storage.objects;
create policy "own export files" on storage.objects
  for all
  using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);
