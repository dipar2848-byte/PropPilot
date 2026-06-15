'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/data/properties';
import {
  DOCUMENTS_BUCKET,
  MAX_DOCUMENTS_PER_PROPERTY,
  MAX_DOCUMENT_BYTES,
  ALLOWED_DOCUMENT_MIME,
  getPropertyDocumentCount,
  getDocument,
} from '@/lib/data/documents';
import { documentUploadSchema } from '@/lib/validation';
import { sanitiseFileName } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';
import type { DocumentAccessAction } from '@/lib/types';

export interface DocumentActionState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export interface SignedUrlState {
  error?: string;
  url?: string;
}

function flattenZod(error: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Append-only audit log write. Never throws — auditing must not break the action. */
async function logAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    userId: string;
    propertyId: string | null;
    documentId: string | null;
    action: DocumentAccessAction;
    fileName: string;
  },
): Promise<void> {
  try {
    await supabase.from('document_access_log').insert({
      user_id: params.userId,
      property_id: params.propertyId,
      document_id: params.documentId,
      action: params.action,
      file_name: params.fileName,
    });
  } catch (e) {
    console.error('audit log write failed:', e);
  }
}

/** Uploads a single document for a property. Enforces 5-doc / 25MB / type limits. */
export async function uploadDocumentAction(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const { supabase, user } = await requireUser();

  const rl = rateLimit(`docs:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return { error: 'Too many uploads. Please wait a moment and try again.' };
  }

  const parsed = documentUploadSchema.safeParse({
    propertyId: formData.get('propertyId'),
    title: formData.get('title'),
    document_type: formData.get('document_type'),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error) };
  }
  const { propertyId, title, document_type } = parsed.data;

  // Verify ownership of the property (never trust the client).
  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!property) return { error: 'Property not found.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { fieldErrors: { file: 'Choose a file to upload.' } };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { fieldErrors: { file: 'File exceeds the 25MB size limit.' } };
  }
  if (!ALLOWED_DOCUMENT_MIME.includes(file.type as (typeof ALLOWED_DOCUMENT_MIME)[number])) {
    return { fieldErrors: { file: 'Only PDF, JPG, PNG and WEBP files are allowed.' } };
  }

  // Server-side enforcement of the 5-document limit.
  const count = await getPropertyDocumentCount(propertyId);
  if (count >= MAX_DOCUMENTS_PER_PROPERTY) {
    return { error: `You can store up to ${MAX_DOCUMENTS_PER_PROPERTY} documents per property.` };
  }

  const path = `${user.id}/${propertyId}/${sanitiseFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: inserted, error: rowError } = await supabase
    .from('property_documents')
    .insert({
      property_id: propertyId,
      user_id: user.id,
      file_name: file.name.slice(0, 200),
      file_url: path,
      document_type,
      file_size: file.size,
      title: title || file.name.slice(0, 160),
      mime_type: file.type,
    })
    .select('id, file_name')
    .single();

  if (rowError || !inserted) {
    // Best-effort cleanup of the orphaned object.
    try {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    } catch {
      /* ignore */
    }
    return { error: `Could not save document: ${rowError?.message ?? 'unknown error'}` };
  }

  await logAccess(supabase, {
    userId: user.id,
    propertyId,
    documentId: inserted.id,
    action: 'upload',
    fileName: inserted.file_name,
  });

  revalidatePath(`/properties/${propertyId}/documents`);
  revalidatePath(`/properties/${propertyId}`);
  return { message: 'Document uploaded.' };
}

/**
 * Mints a short-lived signed URL for a document the current user owns. Logs the
 * access (preview or download). The private bucket never exposes public URLs.
 */
export async function getDocumentSignedUrlAction(
  documentId: string,
  action: 'preview' | 'download' = 'preview',
): Promise<SignedUrlState> {
  const { supabase, user } = await requireUser();

  const doc = await getDocument(documentId);
  if (!doc) return { error: 'Document not found.' };

  const rl = rateLimit(`docurl:${user.id}`, 60, 60_000);
  if (!rl.success) return { error: 'Too many requests. Please wait a moment.' };

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.file_url, 60, action === 'download' ? { download: doc.file_name } : undefined);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? 'Could not generate a secure link.' };
  }

  await logAccess(supabase, {
    userId: user.id,
    propertyId: doc.property_id,
    documentId: doc.id,
    action,
    fileName: doc.file_name,
  });

  return { url: data.signedUrl };
}

/** Deletes a document (storage object + row) owned by the current user. */
export async function deleteDocumentAction(
  documentId: string,
  propertyId: string,
): Promise<DocumentActionState> {
  const { supabase, user } = await requireUser();

  const doc = await getDocument(documentId);
  if (!doc) return { error: 'Document not found.' };

  const { error } = await supabase
    .from('property_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id);
  if (error) return { error: error.message };

  // Remove the storage object (use admin client to bypass any edge cases).
  try {
    const admin = createAdminClient();
    await admin.storage.from(DOCUMENTS_BUCKET).remove([doc.file_url]);
  } catch (e) {
    console.error('Document storage cleanup failed:', e);
  }

  await logAccess(supabase, {
    userId: user.id,
    propertyId: doc.property_id,
    documentId: null, // row is gone; keep the audit entry
    action: 'delete',
    fileName: doc.file_name,
  });

  revalidatePath(`/properties/${propertyId}/documents`);
  revalidatePath(`/properties/${propertyId}`);
  return { message: 'Document deleted.' };
}
