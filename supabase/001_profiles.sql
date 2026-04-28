-- Board Night MVP - Step 1: profiles
-- Run this in Supabase SQL Editor.

-- 1. Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable row level security
alter table public.profiles enable row level security;

-- 3. Policies
-- Users can read all profiles so names can display against games, events, votes, etc.
drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

-- Users can update their own profile, but not their role.
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- 4. updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- 5. Create a profile automatically whenever a Supabase auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1), 'Player'),
    coalesce(new.email, ''),
    'member'
  )
  on conflict (id) do update
    set username = excluded.username,
        email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 6. Backfill profiles for users who already existed before this table was created
insert into public.profiles (id, username, email, role)
select
  id,
  coalesce(nullif(raw_user_meta_data ->> 'username', ''), split_part(email, '@', 1), 'Player') as username,
  coalesce(email, '') as email,
  'member' as role
from auth.users
on conflict (id) do nothing;

-- 7. After running this, promote yourself to admin by replacing the email below.
-- update public.profiles
-- set role = 'admin'
-- where email = 'your-email@example.com';
