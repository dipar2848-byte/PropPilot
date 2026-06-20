-- ============================================================================
-- PropPilot — Cashfree payments: orders, idempotent webhook & apply RPC (Phase 6)
-- ============================================================================
-- Adds the server-side machinery for paid subscription upgrades via Cashfree.
-- Everything here is tamper-proof and idempotent: the client can NEVER mark
-- itself paid. A successful payment is applied only by the service role (the
-- verified webhook) through a SECURITY DEFINER RPC that atomically:
--
--   1. marks the matching payment_order 'paid' (idempotent — a duplicate
--      webhook for the same order is a no-op);
--   2. flips the user's subscription to plan='pro', status='active' and sets a
--      one-month current_period_end;
--   3. appends a 'succeeded' row to the transactions ledger.
--
--   * payment_orders — one row per checkout attempt. Owner may READ their own
--                      orders; only the service role / verified webhook may
--                      INSERT or UPDATE (no client writes).
--
-- Plan LIMITS still live in code (src/lib/plans.ts). This migration stores only
-- per-user payment STATE + the apply RPC.
--
-- Idempotent: safe on a fresh project and to re-run. Adds NEW objects only — it
-- does not modify any historical migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enum: payment_order_status
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_order_status') then
    create type public.payment_order_status as enum ('created', 'paid', 'failed', 'expired');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Table: payment_orders
-- ----------------------------------------------------------------------------
-- `order_id` is our own app-generated id sent to Cashfree (the cf_order_id /
-- payment_session_id from the gateway are stored once known). One order may be
-- referenced by multiple webhook deliveries; the apply RPC keys off order_id to
-- stay idempotent.
create table if not exists public.payment_orders (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  order_id             text not null unique,           -- our app order id (sent to gateway)
  plan_id              text not null references public.plans(id),
  amount               integer not null default 0,     -- INR, whole rupees
  currency             text not null default 'INR',
  status               public.payment_order_status not null default 'created',
  provider             text not null default 'cashfree',
  cf_order_id          text not null default '',        -- Cashfree order id
  payment_session_id   text not null default '',        -- Cashfree checkout session
  cf_payment_id        text not null default '',        -- Cashfree payment id (on success)
  paid_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists payment_orders_user_idx   on public.payment_orders (user_id);
create index if not exists payment_orders_status_idx  on public.payment_orders (status);
create index if not exists payment_orders_created_idx on public.payment_orders (created_at desc);

drop trigger if exists payment_orders_set_updated_at on public.payment_orders;
create trigger payment_orders_set_updated_at
  before update on public.payment_orders
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.payment_orders enable row level security;

-- ---- payment_orders: owner read-only; all writes via service role ----------
drop policy if exists "payment_orders_select_own" on public.payment_orders;
create policy "payment_orders_select_own"
  on public.payment_orders for select
  using (auth.uid() = user_id);
-- No client INSERT/UPDATE/DELETE: orders are created and settled only by the
-- trusted server (service role) so a user can never self-upgrade.

-- ----------------------------------------------------------------------------
-- RPC: apply a verified Cashfree payment (service-role only, idempotent).
-- ----------------------------------------------------------------------------
-- Called by the verified webhook (and as a post-return reconciliation) running
-- with the service role. It refuses to do anything unless the order exists and
-- is not already paid, so duplicate webhook deliveries are safe no-ops.
--
-- Returns true when this call transitioned the order to paid (i.e. side-effects
-- were applied); false when the order was already paid (idempotent no-op) or
-- not found.
create or replace function public.apply_subscription_payment(
  p_order_id      text,
  p_cf_payment_id text default '',
  p_period_months integer default 1
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order   public.payment_orders%rowtype;
  v_plan_id text;
begin
  -- Lock the order row to serialise concurrent webhook deliveries.
  select * into v_order
  from public.payment_orders
  where order_id = p_order_id
  for update;

  if not found then
    return false;                         -- unknown order
  end if;

  if v_order.status = 'paid' then
    return false;                         -- already applied — idempotent no-op
  end if;

  v_plan_id := v_order.plan_id;

  -- 1) Mark the order paid.
  update public.payment_orders
     set status        = 'paid',
         cf_payment_id  = coalesce(nullif(p_cf_payment_id, ''), cf_payment_id),
         paid_at        = now()
   where id = v_order.id;

  -- 2) Upgrade the subscription. The user MUST already have a subscription row
  --    (created by handle_new_user); if somehow missing, create one.
  insert into public.subscriptions (user_id, plan, status, current_period_end, provider, provider_ref)
  values (
    v_order.user_id,
    v_plan_id::public.subscription_plan,
    'active'::public.subscription_status,
    now() + make_interval(months => greatest(p_period_months, 1)),
    v_order.provider,
    v_order.order_id
  )
  on conflict (user_id) do update set
    plan               = excluded.plan,
    status             = excluded.status,
    current_period_end = excluded.current_period_end,
    provider           = excluded.provider,
    provider_ref       = excluded.provider_ref;

  -- 3) Append a succeeded transaction to the ledger.
  insert into public.transactions
    (user_id, type, status, amount, currency, plan_id, provider, provider_ref, description)
  values (
    v_order.user_id,
    'subscription'::public.transaction_type,
    'succeeded'::public.transaction_status,
    v_order.amount,
    v_order.currency,
    v_plan_id,
    v_order.provider,
    coalesce(nullif(p_cf_payment_id, ''), v_order.order_id),
    'Upgrade to ' || v_plan_id || ' plan'
  );

  return true;
end;
$$;

-- Only the service role may apply a payment. Never grant to authenticated.
revoke all on function public.apply_subscription_payment(text, text, integer) from public;
grant execute on function public.apply_subscription_payment(text, text, integer) to service_role;
