-- ============================================================================
-- PropPilot — Initial Schema Migration
-- ============================================================================
-- Creates the core tables, indexes, foreign keys, triggers and Row Level
-- Security policies for the PropPilot real-estate marketing platform.
--
-- Run this in the Supabase SQL Editor (or via the Supabase CLI) AFTER creating
-- your project. It is idempotent where practical so it can be re-run safely.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type public.property_status as enum ('draft', 'available', 'under_offer', 'sold', 'rented', 'archived');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'property_type') then
    create type public.property_type as enum (
      'apartment', 'house', 'villa', 'townhouse', 'studio', 'penthouse',
      'plot', 'commercial', 'office', 'retail', 'warehouse', 'other'
    );
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Utility: updated_at trigger function
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Table: properties
-- ============================================================================
create table if not exists public.properties (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  property_type   public.property_type not null default 'apartment',
  location        text not null default '',
  price           numeric(14,2) not null default 0,
  carpet_area     numeric(12,2),
  built_up_area   numeric(12,2),
  bedrooms        integer not null default 0,
  bathrooms       integer not null default 0,
  amenities       text[] not null default '{}',
  description     text not null default '',
  status          public.property_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists properties_user_id_idx        on public.properties (user_id);
create index if not exists properties_status_idx         on public.properties (status);
create index if not exists properties_property_type_idx  on public.properties (property_type);
create index if not exists properties_created_at_idx     on public.properties (created_at desc);
create index if not exists properties_bedrooms_idx       on public.properties (bedrooms);
create index if not exists properties_price_idx          on public.properties (price);
-- Trigram-friendly text search on title + location
create index if not exists properties_title_idx          on public.properties using gin (to_tsvector('simple', coalesce(title,'')));
create index if not exists properties_location_idx       on public.properties using gin (to_tsvector('simple', coalesce(location,'')));

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Table: property_images
-- ============================================================================
create table if not exists public.property_images (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  image_url    text not null,
  storage_path text,
  position     integer not null default 0,
  is_cover     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists property_images_property_id_idx on public.property_images (property_id);
create index if not exists property_images_user_id_idx     on public.property_images (user_id);
create index if not exists property_images_position_idx    on public.property_images (property_id, position);

-- ============================================================================
-- Table: marketing_assets
-- ============================================================================
create table if not exists public.marketing_assets (
  id                uuid primary key default gen_random_uuid(),
  property_id       uuid not null references public.properties(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  long_description  text not null default '',
  short_description text not null default '',
  instagram_caption text not null default '',
  facebook_post     text not null default '',
  linkedin_post     text not null default '',
  whatsapp_message  text not null default '',
  provider          text not null default 'template',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- One active marketing kit per property (latest wins via upsert).
create unique index if not exists marketing_assets_property_unique on public.marketing_assets (property_id);
create index if not exists marketing_assets_user_id_idx on public.marketing_assets (user_id);

drop trigger if exists marketing_assets_set_updated_at on public.marketing_assets;
create trigger marketing_assets_set_updated_at
  before update on public.marketing_assets
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Table: landing_pages
-- ============================================================================
create table if not exists public.landing_pages (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null unique,
  public_url  text not null default '',
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists landing_pages_property_unique on public.landing_pages (property_id);
create index if not exists landing_pages_user_id_idx on public.landing_pages (user_id);
create index if not exists landing_pages_slug_idx     on public.landing_pages (slug);

drop trigger if exists landing_pages_set_updated_at on public.landing_pages;
create trigger landing_pages_set_updated_at
  before update on public.landing_pages
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.properties        enable row level security;
alter table public.property_images   enable row level security;
alter table public.marketing_assets  enable row level security;
alter table public.landing_pages     enable row level security;

-- ---- properties -----------------------------------------------------------
drop policy if exists "properties_select_own" on public.properties;
create policy "properties_select_own"
  on public.properties for select
  using (auth.uid() = user_id);

drop policy if exists "properties_insert_own" on public.properties;
create policy "properties_insert_own"
  on public.properties for insert
  with check (auth.uid() = user_id);

drop policy if exists "properties_update_own" on public.properties;
create policy "properties_update_own"
  on public.properties for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "properties_delete_own" on public.properties;
create policy "properties_delete_own"
  on public.properties for delete
  using (auth.uid() = user_id);

-- ---- property_images ------------------------------------------------------
drop policy if exists "property_images_select_own" on public.property_images;
create policy "property_images_select_own"
  on public.property_images for select
  using (auth.uid() = user_id);

drop policy if exists "property_images_insert_own" on public.property_images;
create policy "property_images_insert_own"
  on public.property_images for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "property_images_update_own" on public.property_images;
create policy "property_images_update_own"
  on public.property_images for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "property_images_delete_own" on public.property_images;
create policy "property_images_delete_own"
  on public.property_images for delete
  using (auth.uid() = user_id);

-- ---- marketing_assets -----------------------------------------------------
drop policy if exists "marketing_assets_select_own" on public.marketing_assets;
create policy "marketing_assets_select_own"
  on public.marketing_assets for select
  using (auth.uid() = user_id);

drop policy if exists "marketing_assets_insert_own" on public.marketing_assets;
create policy "marketing_assets_insert_own"
  on public.marketing_assets for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "marketing_assets_update_own" on public.marketing_assets;
create policy "marketing_assets_update_own"
  on public.marketing_assets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "marketing_assets_delete_own" on public.marketing_assets;
create policy "marketing_assets_delete_own"
  on public.marketing_assets for delete
  using (auth.uid() = user_id);

-- ---- landing_pages --------------------------------------------------------
-- Public read so unauthenticated visitors can view published landing pages.
drop policy if exists "landing_pages_select_public" on public.landing_pages;
create policy "landing_pages_select_public"
  on public.landing_pages for select
  using (true);

drop policy if exists "landing_pages_insert_own" on public.landing_pages;
create policy "landing_pages_insert_own"
  on public.landing_pages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "landing_pages_update_own" on public.landing_pages;
create policy "landing_pages_update_own"
  on public.landing_pages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "landing_pages_delete_own" on public.landing_pages;
create policy "landing_pages_delete_own"
  on public.landing_pages for delete
  using (auth.uid() = user_id);
