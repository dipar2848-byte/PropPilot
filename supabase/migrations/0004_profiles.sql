-- ============================================================================
-- PropPilot — Agent Profiles
-- ============================================================================
-- Per-agent profile linked 1:1 to auth.users. Landing pages pull agent contact
-- details from here (NEVER from environment variables).
--
-- RLS: each agent can read & edit ONLY their own profile. An additional
-- SECURITY DEFINER pathway (the public landing RPC, see 0005) exposes the
-- minimal public contact fields for a published property's owner.
-- ============================================================================

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null default '',
  phone           text not null default '',
  whatsapp_number text not null default '',
  email           text not null default '',
  agency_name     text,
  profile_photo_url text,
  is_admin        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists profiles_is_admin_idx on public.profiles (is_admin) where is_admin = true;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-provision a profile row whenever a new auth user is created.
-- Pulls full_name/email from the signup metadata when available.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Backfill profiles for any users that already exist.
-- ----------------------------------------------------------------------------
insert into public.profiles (id, full_name, email)
select u.id,
       coalesce(u.raw_user_meta_data->>'full_name', ''),
       coalesce(u.email, '')
from auth.users u
on conflict (id) do nothing;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  -- Prevent privilege escalation: a user can never flip their own is_admin flag.
  with check (auth.uid() = id and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));

-- No delete policy: profiles are removed via auth.users cascade only.
