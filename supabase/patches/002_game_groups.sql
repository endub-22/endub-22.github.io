-- Board Night group model patch
-- Run this after the original schema.sql.
-- Adds:
-- - game groups
-- - group membership and group admins
-- - super admins
-- - invite-code joining
-- - group scoping for games and events

create extension if not exists pgcrypto;

create table if not exists public.super_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.game_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.games add column if not exists group_id uuid references public.game_groups(id) on delete cascade;
alter table public.events add column if not exists group_id uuid references public.game_groups(id) on delete cascade;

create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_games_group_id on public.games(group_id);
create index if not exists idx_events_group_id on public.events(group_id);

create or replace function public.is_super_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.super_admins sa
    where sa.user_id = check_user_id
  );
$$;

create or replace function public.is_group_member(check_group_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_super_admin(check_user_id)
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = check_group_id
        and gm.user_id = check_user_id
    );
$$;

create or replace function public.is_group_admin(check_group_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_super_admin(check_user_id)
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = check_group_id
        and gm.user_id = check_user_id
        and gm.role = 'admin'
    );
$$;

create or replace function public.set_game_group_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_game_groups_updated_at on public.game_groups;
create trigger set_game_groups_updated_at
before update on public.game_groups
for each row execute function public.set_game_group_updated_at();

drop trigger if exists set_group_members_updated_at on public.group_members;
create trigger set_group_members_updated_at
before update on public.group_members
for each row execute function public.set_updated_at();

create or replace function public.add_group_creator_as_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (group_id, user_id) do update set role = 'admin';

  return new;
end;
$$;

drop trigger if exists on_game_group_created_add_admin on public.game_groups;
create trigger on_game_group_created_add_admin
after insert on public.game_groups
for each row execute function public.add_group_creator_as_admin();

create or replace function public.join_group_with_code(join_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
begin
  select id into target_group_id
  from public.game_groups
  where invite_code = upper(trim(join_code));

  if target_group_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return target_group_id;
end;
$$;

alter table public.super_admins enable row level security;
alter table public.game_groups enable row level security;
alter table public.group_members enable row level security;

-- Super admins

drop policy if exists "Super admins can read super admins" on public.super_admins;
create policy "Super admins can read super admins"
on public.super_admins for select
to authenticated
using (public.is_super_admin(auth.uid()) or user_id = auth.uid());

drop policy if exists "Super admins can insert super admins" on public.super_admins;
create policy "Super admins can insert super admins"
on public.super_admins for insert
to authenticated
with check (public.is_super_admin(auth.uid()));

drop policy if exists "Super admins can delete super admins" on public.super_admins;
create policy "Super admins can delete super admins"
on public.super_admins for delete
to authenticated
using (public.is_super_admin(auth.uid()));

-- Game groups

drop policy if exists "Members can read own groups" on public.game_groups;
create policy "Members can read own groups"
on public.game_groups for select
to authenticated
using (public.is_group_member(id, auth.uid()));

drop policy if exists "Authenticated users can create groups" on public.game_groups;
create policy "Authenticated users can create groups"
on public.game_groups for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Group admins can update groups" on public.game_groups;
create policy "Group admins can update groups"
on public.game_groups for update
to authenticated
using (public.is_group_admin(id, auth.uid()))
with check (public.is_group_admin(id, auth.uid()));

drop policy if exists "Super admins can delete groups" on public.game_groups;
create policy "Super admins can delete groups"
on public.game_groups for delete
to authenticated
using (public.is_super_admin(auth.uid()));

-- Group members

drop policy if exists "Group members can read group members" on public.group_members;
create policy "Group members can read group members"
on public.group_members for select
to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Group admins can add members" on public.group_members;
create policy "Group admins can add members"
on public.group_members for insert
to authenticated
with check (public.is_group_admin(group_id, auth.uid()) or user_id = auth.uid());

drop policy if exists "Group admins can update members" on public.group_members;
create policy "Group admins can update members"
on public.group_members for update
to authenticated
using (public.is_group_admin(group_id, auth.uid()))
with check (public.is_group_admin(group_id, auth.uid()));

drop policy if exists "Group admins can remove members" on public.group_members;
create policy "Group admins can remove members"
on public.group_members for delete
to authenticated
using (public.is_group_admin(group_id, auth.uid()) or user_id = auth.uid());

-- Replace game policies so games are group-scoped.

drop policy if exists "Games are readable by signed-in users" on public.games;
drop policy if exists "Signed-in users can create games" on public.games;
drop policy if exists "Owners can update games" on public.games;
drop policy if exists "Owners can delete games" on public.games;

drop policy if exists "Group members can read games" on public.games;
create policy "Group members can read games"
on public.games for select
to authenticated
using (group_id is not null and public.is_group_member(group_id, auth.uid()));

drop policy if exists "Group admins can create games" on public.games;
create policy "Group admins can create games"
on public.games for insert
to authenticated
with check (group_id is not null and public.is_group_admin(group_id, auth.uid()));

drop policy if exists "Group admins can update games" on public.games;
create policy "Group admins can update games"
on public.games for update
to authenticated
using (group_id is not null and public.is_group_admin(group_id, auth.uid()))
with check (group_id is not null and public.is_group_admin(group_id, auth.uid()));

drop policy if exists "Group admins can delete games" on public.games;
create policy "Group admins can delete games"
on public.games for delete
to authenticated
using (group_id is not null and public.is_group_admin(group_id, auth.uid()));

-- Replace event policies so events are group-scoped.

drop policy if exists "Events are readable by signed-in users" on public.events;
drop policy if exists "Signed-in users can create events" on public.events;
drop policy if exists "Creators can update events" on public.events;
drop policy if exists "Creators can delete events" on public.events;

drop policy if exists "Group members can read events" on public.events;
create policy "Group members can read events"
on public.events for select
to authenticated
using (group_id is not null and public.is_group_member(group_id, auth.uid()));

drop policy if exists "Group admins can create events" on public.events;
create policy "Group admins can create events"
on public.events for insert
to authenticated
with check (group_id is not null and public.is_group_admin(group_id, auth.uid()));

drop policy if exists "Group admins can update events" on public.events;
create policy "Group admins can update events"
on public.events for update
to authenticated
using (group_id is not null and public.is_group_admin(group_id, auth.uid()))
with check (group_id is not null and public.is_group_admin(group_id, auth.uid()));

drop policy if exists "Group admins can delete events" on public.events;
create policy "Group admins can delete events"
on public.events for delete
to authenticated
using (group_id is not null and public.is_group_admin(group_id, auth.uid()));

-- Existing rows created before this patch will have no group_id and will be hidden by the new policies.
-- Create a group in the app, then create new games/events inside that group.
