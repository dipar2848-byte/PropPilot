-- ============================================================================
-- PropPilot — Reconcile property_images schema with the codebase
-- ============================================================================
-- Some databases were provisioned from an earlier schema where the image
-- column was named `url` and `storage_path` / `is_cover` did not exist. The
-- entire codebase (types, data layer, components, and the SECURITY DEFINER
-- landing RPCs) expects `image_url`, `storage_path` and `is_cover`.
--
-- This migration is fully IDEMPOTENT and self-healing: it inspects the live
-- schema and only makes the changes that are actually missing. It is safe to
-- run on a database that already matches the canonical schema (it becomes a
-- no-op) and on one that still has the legacy `url` column.
-- ============================================================================

do $$
declare
  has_image_url boolean;
  has_url       boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'property_images' and column_name = 'image_url'
  ) into has_image_url;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'property_images' and column_name = 'url'
  ) into has_url;

  -- Case 1: legacy `url` exists and `image_url` does not -> rename it.
  if has_url and not has_image_url then
    execute 'alter table public.property_images rename column url to image_url';
  -- Case 2: both exist (partial migration) -> copy any data then drop `url`.
  elsif has_url and has_image_url then
    execute 'update public.property_images set image_url = url where (image_url is null or image_url = '''') and url is not null';
    execute 'alter table public.property_images drop column url';
  end if;
end$$;

-- Ensure the expected columns exist (no-ops if already present).
alter table public.property_images
  add column if not exists image_url    text,
  add column if not exists storage_path text,
  add column if not exists is_cover     boolean not null default false,
  add column if not exists position     integer not null default 0;

-- image_url must be non-null going forward. Backfill any nulls defensively.
update public.property_images set image_url = '' where image_url is null;
alter table public.property_images alter column image_url set not null;

-- Re-create the expected indexes (idempotent).
create index if not exists property_images_property_id_idx on public.property_images (property_id);
create index if not exists property_images_user_id_idx     on public.property_images (user_id);
create index if not exists property_images_position_idx    on public.property_images (property_id, position);
