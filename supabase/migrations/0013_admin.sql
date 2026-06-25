-- ============================================================================
-- PropPilot — Admin panel: platform-wide read access & stats (Phase 7)
-- ============================================================================
-- Adds the server-side machinery for the admin panel. A platform admin is a
-- profile row with is_admin = true (the flag is self-promotion-proof — see the
-- profiles_update_own check policy in 0004). Admins must be able to read across
-- ALL tenants (every user's profiles / subscriptions / transactions /
-- properties / leads) WITHOUT bypassing RLS via the service role on the client.
--
-- We do this the safe, declarative way: a SECURITY DEFINER helper
-- public.is_platform_admin() resolves the caller's admin flag, and additional
-- RLS SELECT policies grant admins read-only visibility across tenants. Owners
-- keep their existing owner-only policies; the admin policies are purely
-- additive (Postgres ORs multiple permissive policies together).
--
-- Mutations (grant / revoke Pro) are performed by the trusted server through a
-- SECURITY DEFINER RPC that re-checks the caller is an admin, so the frontend
-- can never be trusted to gate them.
--
-- Idempotent: safe on a fresh project and to re-run. Adds NEW objects only — it
-- does not modify any historical migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: is the current auth user a platform admin?
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so the lookup against public.profiles is not itself subject
-- to the caller's RLS (which would otherwise recurse when used inside profile
-- policies). STABLE — depends only on the current transaction's auth context.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated, service_role;

-- ============================================================================
-- Additive admin SELECT policies (read-only, cross-tenant).
-- Owners keep their existing owner-scoped policies; these grant admins extra
-- visibility. Permissive policies are OR-combined, so a non-admin is unaffected.
-- ============================================================================

-- ---- profiles: admins can read every profile -------------------------------
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_platform_admin());

-- ---- subscriptions: admins can read every subscription ---------------------
drop policy if exists "subscriptions_select_admin" on public.subscriptions;
create policy "subscriptions_select_admin"
  on public.subscriptions for select
  using (public.is_platform_admin());

-- ---- transactions: admins can read every transaction -----------------------
drop policy if exists "transactions_select_admin" on public.transactions;
create policy "transactions_select_admin"
  on public.transactions for select
  using (public.is_platform_admin());

-- ---- properties: admins can read every property ----------------------------
drop policy if exists "properties_select_admin" on public.properties;
create policy "properties_select_admin"
  on public.properties for select
  using (public.is_platform_admin());

-- ---- leads: admins can read every lead -------------------------------------
drop policy if exists "leads_select_admin" on public.leads;
create policy "leads_select_admin"
  on public.leads for select
  using (public.is_platform_admin());

-- ---- payment_orders: admins can read every order ---------------------------
drop policy if exists "payment_orders_select_admin" on public.payment_orders;
create policy "payment_orders_select_admin"
  on public.payment_orders for select
  using (public.is_platform_admin());

-- ============================================================================
-- RPC: platform-wide aggregate stats for the admin overview.
-- ============================================================================
-- SECURITY DEFINER so it can aggregate across tenants, but it FIRST re-checks
-- the caller is an admin and raises otherwise — the frontend is never trusted.
create or replace function public.admin_platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_users',          (select count(*) from public.profiles),
    'admin_users',          (select count(*) from public.profiles where is_admin),
    'total_properties',     (select count(*) from public.properties),
    'published_landing',    (select count(*) from public.landing_pages where is_published),
    'total_leads',          (select count(*) from public.leads),
    'total_documents',      (select count(*) from public.property_documents),
    'subs_trialing',        (select count(*) from public.subscriptions where status = 'trialing'),
    'subs_active',          (select count(*) from public.subscriptions where status = 'active'),
    'subs_pro',             (select count(*) from public.subscriptions where plan = 'pro'),
    'paid_orders',          (select count(*) from public.payment_orders where status = 'paid'),
    'revenue_total',        (select coalesce(sum(amount), 0)
                               from public.transactions
                              where status = 'succeeded' and type = 'subscription')
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_platform_stats() from public;
grant execute on function public.admin_platform_stats() to authenticated, service_role;

-- ============================================================================
-- RPC: grant / revoke a user's Pro subscription (admin-only, audited via ledger)
-- ============================================================================
-- Lets an admin manually flip a user between Free and Pro (e.g. comped accounts
-- or support fixes) without a payment. Re-checks the caller is an admin and is
-- idempotent in the sense that re-running with the same target is harmless.
-- p_action: 'grant' -> pro/active +N months ; 'revoke' -> free/active.
create or replace function public.admin_set_user_plan(
  p_user_id       uuid,
  p_action        text,
  p_period_months integer default 1
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if not public.is_platform_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_action not in ('grant', 'revoke') then
    raise exception 'invalid action %', p_action using errcode = '22023';
  end if;

  if p_action = 'grant' then
    insert into public.subscriptions (user_id, plan, status, current_period_end, provider, provider_ref)
    values (
      p_user_id,
      'pro'::public.subscription_plan,
      'active'::public.subscription_status,
      now() + make_interval(months => greatest(p_period_months, 1)),
      'admin',
      'admin:' || v_caller::text
    )
    on conflict (user_id) do update set
      plan               = excluded.plan,
      status             = excluded.status,
      current_period_end = excluded.current_period_end,
      provider           = excluded.provider,
      provider_ref       = excluded.provider_ref;

    insert into public.transactions
      (user_id, type, status, amount, currency, plan_id, provider, provider_ref, description)
    values (
      p_user_id, 'adjustment'::public.transaction_type, 'succeeded'::public.transaction_status,
      0, 'INR', 'pro', 'admin', 'admin:' || v_caller::text,
      'Admin granted Pro plan'
    );
  else
    update public.subscriptions
       set plan               = 'free'::public.subscription_plan,
           status             = 'active'::public.subscription_status,
           current_period_end = null,
           provider           = 'admin',
           provider_ref       = 'admin:' || v_caller::text
     where user_id = p_user_id;

    insert into public.transactions
      (user_id, type, status, amount, currency, plan_id, provider, provider_ref, description)
    values (
      p_user_id, 'adjustment'::public.transaction_type, 'succeeded'::public.transaction_status,
      0, 'INR', 'free', 'admin', 'admin:' || v_caller::text,
      'Admin revoked Pro plan'
    );
  end if;

  return true;
end;
$$;

revoke all on function public.admin_set_user_plan(uuid, text, integer) from public;
grant execute on function public.admin_set_user_plan(uuid, text, integer) to authenticated, service_role;
