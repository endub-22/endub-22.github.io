-- Board Night MVP Supabase schema
-- Run this in Supabase SQL Editor after creating the project.
-- This schema supports:
-- - public user profiles linked to auth.users
-- - group-owned game library
-- - events and attendance check-ins
-- - event-linked polls with game options
-- - one active vote per user per poll

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  min_players integer not null default 1 check (min_players >= 1),
  max_players integer not null default 4 check (max_players >= min_players),
  play_time_minutes integer not null default 60 check (play_time_minutes > 0),
  owner_id uuid references public.profiles(id) on delete set null,
  notes text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  event_time time not null,
  location text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'attending' check (status in ('attending', 'not_attending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  closes_at timestamptz,
  is_closed boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, game_id)
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at
before update on public.games
for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_event_attendees_updated_at on public.event_attendees;
create trigger set_event_attendees_updated_at
before update on public.event_attendees
for each row execute function public.set_updated_at();

drop trigger if exists set_polls_updated_at on public.polls;
create trigger set_polls_updated_at
before update on public.polls
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'Player'),
    new.email
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
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

-- MVP policy model:
-- Any signed-in group member can read shared group data.
-- Signed-in users can create records.
-- Users can update/delete their own profile, games, events, attendance, polls, and votes.
-- This is suitable for a small trusted group. Tighten later if you add admin roles.

drop policy if exists "Profiles are readable by signed-in users" on public.profiles;
create policy "Profiles are readable by signed-in users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Games are readable by signed-in users" on public.games;
create policy "Games are readable by signed-in users"
on public.games for select
to authenticated
using (true);

drop policy if exists "Signed-in users can create games" on public.games;
create policy "Signed-in users can create games"
on public.games for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Owners can update games" on public.games;
create policy "Owners can update games"
on public.games for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete games" on public.games;
create policy "Owners can delete games"
on public.games for delete
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Events are readable by signed-in users" on public.events;
create policy "Events are readable by signed-in users"
on public.events for select
to authenticated
using (true);

drop policy if exists "Signed-in users can create events" on public.events;
create policy "Signed-in users can create events"
on public.events for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "Creators can update events" on public.events;
create policy "Creators can update events"
on public.events for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "Creators can delete events" on public.events;
create policy "Creators can delete events"
on public.events for delete
to authenticated
using (auth.uid() = created_by);

drop policy if exists "Attendance is readable by signed-in users" on public.event_attendees;
create policy "Attendance is readable by signed-in users"
on public.event_attendees for select
to authenticated
using (true);

drop policy if exists "Users can check themselves in" on public.event_attendees;
create policy "Users can check themselves in"
on public.event_attendees for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own attendance" on public.event_attendees;
create policy "Users can update own attendance"
on public.event_attendees for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own attendance" on public.event_attendees;
create policy "Users can delete own attendance"
on public.event_attendees for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Polls are readable by signed-in users" on public.polls;
create policy "Polls are readable by signed-in users"
on public.polls for select
to authenticated
using (true);

drop policy if exists "Signed-in users can create polls" on public.polls;
create policy "Signed-in users can create polls"
on public.polls for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "Creators can update polls" on public.polls;
create policy "Creators can update polls"
on public.polls for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "Poll options are readable by signed-in users" on public.poll_options;
create policy "Poll options are readable by signed-in users"
on public.poll_options for select
to authenticated
using (true);

drop policy if exists "Signed-in users can create poll options" on public.poll_options;
create policy "Signed-in users can create poll options"
on public.poll_options for insert
to authenticated
with check (exists (
  select 1 from public.polls p
  where p.id = poll_id
    and p.created_by = auth.uid()
));

drop policy if exists "Votes are readable by signed-in users" on public.poll_votes;
create policy "Votes are readable by signed-in users"
on public.poll_votes for select
to authenticated
using (true);

drop policy if exists "Users can vote once per poll" on public.poll_votes;
create policy "Users can vote once per poll"
on public.poll_votes for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.polls p
    where p.id = poll_id
      and p.is_closed = false
      and (p.closes_at is null or p.closes_at > now())
  )
);

drop policy if exists "Users can change own vote" on public.poll_votes;
create policy "Users can change own vote"
on public.poll_votes for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.polls p
    where p.id = poll_id
      and p.is_closed = false
      and (p.closes_at is null or p.closes_at > now())
  )
);

drop policy if exists "Users can delete own vote" on public.poll_votes;
create policy "Users can delete own vote"
on public.poll_votes for delete
to authenticated
using (auth.uid() = user_id);
