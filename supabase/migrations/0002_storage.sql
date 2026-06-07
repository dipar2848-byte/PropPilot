-- ============================================================================
-- PropPilot — Storage Bucket & Policies
-- ============================================================================
-- Creates the `property-images` bucket and the RLS policies on storage.objects
-- so that:
--   * each authenticated user can only write/delete inside their own folder
--     (path prefix = their auth uid), and
--   * anyone can read images (bucket is public so landing pages render fast).
--
-- Files are stored at: property-images/<user_id>/<property_id>/<filename>
-- ============================================================================

-- Create the bucket (public read). 5 MB per object, common image mime types.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- Policies on storage.objects
-- ----------------------------------------------------------------------------

-- Public read of property images (landing pages + dashboard).
drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
  on storage.objects for select
  using (bucket_id = 'property-images');

-- Authenticated users may upload only into a folder named after their uid.
drop policy if exists "property_images_owner_insert" on storage.objects;
create policy "property_images_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may update only their own files.
drop policy if exists "property_images_owner_update" on storage.objects;
create policy "property_images_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may delete only their own files.
drop policy if exists "property_images_owner_delete" on storage.objects;
create policy "property_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
