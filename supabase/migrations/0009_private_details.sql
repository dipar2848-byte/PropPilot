-- ============================================================================
-- PropPilot — Private Property Details (Phase 3)
-- ============================================================================
-- Strictly internal, owner-only information about a deal: the real owner's
-- contact details, commission terms, deal stage and private notes.
--
-- CRITICAL: this data must NEVER be exposed publicly. It is:
--   * owner-only via RLS (auth.uid() = user_id),
--   * NOT referenced by get_public_landing,
--   * NOT used by the AI marketing kit,
--   * NOT returned by any anon-granted RPC.
--
-- One private record per property (unique on property_id).
--
-- Idempotent: safe to run on a fresh project and to re-run on an existing one.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'commission_type') then
    create type public.commission_type as enum ('percentage', 'fixed');
  end if;
end$$;

create table if not exists public.property_private_details (
  id                    uuid primary key default gen_random_uuid(),
  property_id           uuid not null references public.properties(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  owner_name            text not null default '',
  owner_phone           text not null default '',
  owner_email           text not null default '',
  alternate_contact     text not null default '',
  commission_type       public.commission_type not null default 'percentage',
  commission_percentage numeric(6, 3),
  commission_amount     numeric(14, 2),
  expected_commission   numeric(14, 2),
  deal_stage            text not null default '',
  internal_notes        text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Exactly one private record per property.
create unique index if not exists property_private_details_property_unique
  on public.property_private_details (property_id);

create index if not exists property_private_details_user_id_idx
  on public.property_private_details (user_id);

drop trigger if exists property_private_details_set_updated_at on public.property_private_details;
create trigger property_private_details_set_updated_at
  before update on public.property_private_details
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security — owner-only access (no cross-tenant access)
-- ============================================================================
alter table public.property_private_details enable row level security;

drop policy if exists "private_details_select_own" on public.property_private_details;
create policy "private_details_select_own"
  on public.property_private_details for select
  using (auth.uid() = user_id);

drop policy if exists "private_details_insert_own" on public.property_private_details;
create policy "private_details_insert_own"
  on public.property_private_details for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "private_details_update_own" on public.property_private_details;
create policy "private_details_update_own"
  on public.property_private_details for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "private_details_delete_own" on public.property_private_details;
create policy "private_details_delete_own"
  on public.property_private_details for delete
  using (auth.uid() = user_id);
