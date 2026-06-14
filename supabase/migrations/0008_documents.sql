-- ============================================================================
-- PropPilot — Document Vault (Phase 3)
-- ============================================================================
-- Private, per-property document storage (agreements, floor plans, brochures,
-- legal docs, etc.). Unlike property images, documents are PRIVATE: the bucket
-- is non-public and files are only ever served via short-lived signed URLs
-- minted server-side after an ownership + RLS check.
--
-- Includes an append-only access log so every upload / preview / download /
-- delete is auditable. The log is owner-readable (RLS) and written server-side.
--
-- Limits (enforced server-side in the app layer, mirrored by the bucket):
--   * max 5 documents per property
--   * max 25 MB per file
--   * allowed types: PDF, JPG, PNG, WEBP
--
-- This migration runs cleanly on a fresh project AND is safe to re-run on an
-- existing database (idempotent: IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_type') then
    create type public.document_type as enum (
      'agreement',
      'floor_plan',
      'brochure',
      'legal',
      'identity',
      'other'
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_access_action') then
    create type public.document_access_action as enum ('upload', 'preview', 'download', 'delete');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Table: property_documents
-- ----------------------------------------------------------------------------
create table if not exists public.property_documents (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  file_name      text not null,
  file_url       text not null default '',     -- storage object path (NOT a public URL)
  document_type  public.document_type not null default 'other',
  file_size      bigint not null default 0,
  title          text not null default '',
  mime_type      text not null default '',
  uploaded_at    timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists property_documents_property_id_idx on public.property_documents (property_id);
create index if not exists property_documents_user_id_idx     on public.property_documents (user_id);
create index if not exists property_documents_uploaded_at_idx on public.property_documents (uploaded_at desc);

drop trigger if exists property_documents_set_updated_at on public.property_documents;
create trigger property_documents_set_updated_at
  before update on public.property_documents
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Table: document_access_log (append-only audit trail)
-- ----------------------------------------------------------------------------
create table if not exists public.document_access_log (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references public.property_documents(id) on delete set null,
  property_id  uuid references public.properties(id) on delete set null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  action       public.document_access_action not null,
  file_name    text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists document_access_log_user_id_idx     on public.document_access_log (user_id);
create index if not exists document_access_log_document_id_idx  on public.document_access_log (document_id);
create index if not exists document_access_log_property_id_idx  on public.document_access_log (property_id);
create index if not exists document_access_log_created_at_idx   on public.document_access_log (created_at desc);

-- ============================================================================
-- Row Level Security — owner-only access (no cross-tenant access)
-- ============================================================================
alter table public.property_documents enable row level security;

drop policy if exists "property_documents_select_own" on public.property_documents;
create policy "property_documents_select_own"
  on public.property_documents for select
  using (auth.uid() = user_id);

drop policy if exists "property_documents_insert_own" on public.property_documents;
create policy "property_documents_insert_own"
  on public.property_documents for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "property_documents_update_own" on public.property_documents;
create policy "property_documents_update_own"
  on public.property_documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "property_documents_delete_own" on public.property_documents;
create policy "property_documents_delete_own"
  on public.property_documents for delete
  using (auth.uid() = user_id);

-- The access log is owner-readable and owner-insertable (writes happen
-- server-side; a user can never forge another user's audit rows).
alter table public.document_access_log enable row level security;

drop policy if exists "document_access_log_select_own" on public.document_access_log;
create policy "document_access_log_select_own"
  on public.document_access_log for select
  using (auth.uid() = user_id);

drop policy if exists "document_access_log_insert_own" on public.document_access_log;
create policy "document_access_log_insert_own"
  on public.document_access_log for insert
  with check (auth.uid() = user_id);

-- No update/delete policies: the audit trail is append-only.

-- ============================================================================
-- Private storage bucket for documents
-- ============================================================================
-- public = false  ->  objects are never world-readable. Access is granted only
-- via signed URLs minted server-side. 25 MB per object. PDF / JPG / PNG / WEBP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-documents',
  'property-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- Storage policies (objects live under <user_id>/<property_id>/<file>)
-- ----------------------------------------------------------------------------
-- NOTE: there is intentionally NO public read policy. Reads happen exclusively
-- through signed URLs. Authenticated owners may read/write/delete only their
-- own folder (prefix = their auth uid).

drop policy if exists "property_documents_owner_select" on storage.objects;
create policy "property_documents_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property_documents_owner_insert" on storage.objects;
create policy "property_documents_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property_documents_owner_update" on storage.objects;
create policy "property_documents_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property_documents_owner_delete" on storage.objects;
create policy "property_documents_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
