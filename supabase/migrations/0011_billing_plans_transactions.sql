-- ============================================================================
-- PropPilot — Billing catalog, transactions ledger & usage credits (Phase 4)
-- ============================================================================
-- Completes the Phase 4 subscription foundation begun in 0010 by adding:
--
--   * plans            — a DB-backed catalog of purchasable plans (kept in sync
--                        with the code source-of-truth in src/lib/plans.ts).
--                        Publicly readable (pricing page) but admin/service-role
--                        write only.
--   * transactions     — an append-only billing/credit ledger. One row per
--                        payment / refund / manual credit adjustment. Owner can
--                        READ their own rows; only the service role / payment
--                        webhook may INSERT (users can never fabricate a payment).
--   * usage_counters   — per-user, per-period credit tracking for metered
--                        features (e.g. AI generations). Server-side increments
--                        via a SECURITY DEFINER RPC so the count can never be
--                        tampered with from the client.
--
-- All tables are owner-scoped under RLS. Plan LIMITS live in code
-- (src/lib/plans.ts); this migration stores per-user STATE + catalog only.
--
-- Idempotent: safe on a fresh project and to re-run. Adds NEW objects only —
-- it does not modify any historical migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('subscription', 'credit_purchase', 'refund', 'adjustment');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_status') then
    create type public.transaction_status as enum ('pending', 'succeeded', 'failed', 'refunded');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Table: plans (catalog)
-- ----------------------------------------------------------------------------
create table if not exists public.plans (
  id                       text primary key,          -- 'free' | 'pro'
  name                     text not null,
  price_monthly            integer not null default 0, -- INR, whole rupees
  max_properties           integer,                    -- null = unlimited
  max_landing_pages        integer,                    -- null = unlimited
  max_ai_generations_month integer,                    -- null = unlimited
  max_documents_property   integer not null default 5,
  is_active                boolean not null default true,
  sort_order               integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- Seed / keep the catalog in sync with src/lib/plans.ts.
insert into public.plans
  (id, name, price_monthly, max_properties, max_landing_pages, max_ai_generations_month, max_documents_property, sort_order)
values
  ('free', 'Free', 0,   3,    1,    10,   5, 0),
  ('pro',  'Pro',  999, null, null, null, 5, 1)
on conflict (id) do update set
  name                     = excluded.name,
  price_monthly            = excluded.price_monthly,
  max_properties           = excluded.max_properties,
  max_landing_pages        = excluded.max_landing_pages,
  max_ai_generations_month = excluded.max_ai_generations_month,
  max_documents_property   = excluded.max_documents_property,
  sort_order               = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Table: transactions (append-only billing / credit ledger)
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            public.transaction_type not null default 'subscription',
  status          public.transaction_status not null default 'pending',
  amount          integer not null default 0,  -- INR, whole rupees (can be 0)
  currency        text not null default 'INR',
  plan_id         text references public.plans(id),
  provider        text not null default '',     -- e.g. 'cashfree'
  provider_ref    text not null default '',     -- gateway order/payment id
  description     text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists transactions_user_id_idx    on public.transactions (user_id);
create index if not exists transactions_status_idx      on public.transactions (status);
create index if not exists transactions_created_at_idx  on public.transactions (created_at desc);

-- ----------------------------------------------------------------------------
-- Table: usage_counters (per-user, per-period credit tracking)
-- ----------------------------------------------------------------------------
-- `period` is a yyyy-mm string; one row per (user, feature, period).
create table if not exists public.usage_counters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  feature     text not null,                 -- e.g. 'ai_generation'
  period      text not null,                 -- 'YYYY-MM'
  used        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, feature, period)
);

create index if not exists usage_counters_user_idx on public.usage_counters (user_id);

drop trigger if exists usage_counters_set_updated_at on public.usage_counters;
create trigger usage_counters_set_updated_at
  before update on public.usage_counters
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RPC: increment a usage counter atomically (server-side, tamper-proof).
-- Returns the new used value. Runs as definer so the client cannot fake counts.
-- ----------------------------------------------------------------------------
create or replace function public.increment_usage(p_feature text, p_amount integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_period text := to_char(now(), 'YYYY-MM');
  v_used integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.usage_counters (user_id, feature, period, used)
  values (v_uid, p_feature, v_period, greatest(p_amount, 0))
  on conflict (user_id, feature, period)
  do update set used = public.usage_counters.used + greatest(p_amount, 0)
  returning used into v_used;

  return v_used;
end;
$$;

grant execute on function public.increment_usage(text, integer) to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.plans            enable row level security;
alter table public.transactions     enable row level security;
alter table public.usage_counters   enable row level security;

-- ---- plans: world-readable catalog; no client writes ----------------------
drop policy if exists "plans_select_all" on public.plans;
create policy "plans_select_all"
  on public.plans for select
  using (true);
-- No insert/update/delete policies: catalog is managed by the service role.

-- ---- transactions: owner read-only; inserts via service role only ---------
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);
-- No client INSERT/UPDATE/DELETE: a user can never fabricate a payment record.

-- ---- usage_counters: owner read-only; writes via increment_usage RPC -------
drop policy if exists "usage_counters_select_own" on public.usage_counters;
create policy "usage_counters_select_own"
  on public.usage_counters for select
  using (auth.uid() = user_id);
-- No client INSERT/UPDATE/DELETE: counts are mutated only by the definer RPC.
