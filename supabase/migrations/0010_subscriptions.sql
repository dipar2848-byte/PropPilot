-- ============================================================================
-- PropPilot — Subscriptions & Plans (Phase 4)
-- ============================================================================
-- Tracks each user's billing plan and trial window. Every user gets exactly one
-- subscription row (auto-provisioned on signup, starting a free trial). Plan
-- limits themselves are defined in code (src/lib/plans.ts) so they can evolve
-- without a migration; this table stores only the per-user state.
--
-- Plans:
--   * free   — limited usage after the trial ends
--   * pro    — paid, higher/unlimited limits
--
-- Status:
--   * trialing  — within the trial window
--   * active    — paid & current
--   * past_due  — payment failed / awaiting renewal
--   * canceled  — downgraded to free limits
--
-- Owner-only RLS. Billing transitions (active/past_due/canceled) are applied
-- server-side (service role / payment webhook in a later phase); a user can
-- read their own row but can never self-promote to a paid plan.
--
-- Idempotent: safe on a fresh project and to re-run.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_plan') then
    create type public.subscription_plan as enum ('free', 'pro');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');
  end if;
end$$;

create table if not exists public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  plan              public.subscription_plan not null default 'free',
  status            public.subscription_status not null default 'trialing',
  trial_started_at  timestamptz not null default now(),
  trial_ends_at     timestamptz not null default (now() + interval '7 days'),
  current_period_end timestamptz,
  provider          text not null default '',
  provider_ref      text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx   on public.subscriptions (status);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-provision a trialing subscription whenever a new auth user is created.
-- Extends the existing handle_new_user() (which also creates the profile).
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

  insert into public.subscriptions (user_id, plan, status, trial_started_at, trial_ends_at)
  values (new.id, 'free', 'trialing', now(), now() + interval '7 days')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Backfill a subscription for any existing users that don't have one yet.
insert into public.subscriptions (user_id, plan, status, trial_started_at, trial_ends_at)
select u.id, 'free', 'trialing', now(), now() + interval '7 days'
from auth.users u
on conflict (user_id) do nothing;

-- ============================================================================
-- Row Level Security — owner-only read; no client-side plan changes
-- ============================================================================
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- A user may insert their OWN starter row (defensive, in case the trigger did
-- not run), but only on the free/trialing defaults — they can never grant
-- themselves a paid plan or an arbitrary status.
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (
    auth.uid() = user_id
    and plan = 'free'
    and status = 'trialing'
  );

-- No client-side UPDATE/DELETE policies: paid transitions are applied with the
-- service role (payment webhook / admin) which bypasses RLS.
