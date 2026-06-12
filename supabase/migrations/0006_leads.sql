-- ============================================================================
-- PropPilot — Leads
-- ============================================================================
-- Captures inquiries from public landing pages and links them to a property +
-- its owning agent. The property owner can read/manage their own leads only.
--
-- Public (anonymous) submission is handled by a SECURITY DEFINER RPC
-- (submit_public_lead) so that anonymous visitors NEVER get direct INSERT
-- access to the table. The RPC validates the slug, resolves the owning
-- property/user server-side, and inserts the lead atomically.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum ('new', 'contacted', 'closed');
  end if;
end$$;

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  phone       text not null,
  message     text not null default '',
  status      public.lead_status not null default 'new',
  source      text not null default 'landing_page',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists leads_user_id_idx     on public.leads (user_id);
create index if not exists leads_property_id_idx  on public.leads (property_id);
create index if not exists leads_status_idx       on public.leads (user_id, status);
create index if not exists leads_created_at_idx    on public.leads (created_at desc);
-- Case-insensitive search helpers on name + phone.
create index if not exists leads_name_lower_idx   on public.leads (lower(name));
create index if not exists leads_phone_idx         on public.leads (phone);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security — owner-only access
-- ============================================================================
alter table public.leads enable row level security;

drop policy if exists "leads_select_own" on public.leads;
create policy "leads_select_own"
  on public.leads for select
  using (auth.uid() = user_id);

-- Authenticated owners may insert leads for their own properties (e.g. manual
-- entry). Anonymous public submissions go through the RPC below instead.
drop policy if exists "leads_insert_own" on public.leads;
create policy "leads_insert_own"
  on public.leads for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "leads_update_own" on public.leads;
create policy "leads_update_own"
  on public.leads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "leads_delete_own" on public.leads;
create policy "leads_delete_own"
  on public.leads for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- Public lead submission RPC (SECURITY DEFINER)
-- ============================================================================
-- Resolves the property + owner from a published landing-page slug, then
-- inserts the lead. Anonymous callers never touch the leads table directly.
-- Basic server-side validation guards against empty / oversized payloads.
-- ============================================================================
create or replace function public.submit_public_lead(
  p_slug    text,
  p_name    text,
  p_phone   text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_id uuid;
  v_owner_id    uuid;
  v_status      public.property_status;
  v_lead_id     uuid;
  v_name        text := btrim(coalesce(p_name, ''));
  v_phone       text := btrim(coalesce(p_phone, ''));
  v_message     text := btrim(coalesce(p_message, ''));
begin
  -- Resolve the property + owner for a published landing page only.
  select lp.property_id, lp.user_id
    into v_property_id, v_owner_id
  from public.landing_pages lp
  where lp.slug = p_slug
    and lp.is_published = true
  limit 1;

  if v_property_id is null then
    raise exception 'landing page not found' using errcode = 'no_data_found';
  end if;

  -- Block lead capture on archived/sold/rented properties.
  select p.status into v_status from public.properties p where p.id = v_property_id;
  if v_status in ('archived', 'sold', 'rented') then
    raise exception 'listing not accepting inquiries' using errcode = 'check_violation';
  end if;

  -- Minimal server-side validation (frontend is never trusted).
  if v_name = '' or length(v_name) > 120 then
    raise exception 'invalid name' using errcode = 'check_violation';
  end if;
  if v_phone = '' or length(v_phone) > 20 then
    raise exception 'invalid phone' using errcode = 'check_violation';
  end if;
  if length(v_message) > 2000 then
    v_message := left(v_message, 2000);
  end if;

  insert into public.leads (property_id, user_id, name, phone, message, status, source)
  values (v_property_id, v_owner_id, v_name, v_phone, v_message, 'new', 'landing_page')
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

grant execute on function public.submit_public_lead(text, text, text, text) to anon, authenticated;
