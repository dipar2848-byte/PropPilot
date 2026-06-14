import { requireUser } from '@/lib/data/properties';
import type {
  PropertyDocument,
  DocumentAccessLog,
  PropertyPrivateDetails,
} from '@/lib/types';

export const DOCUMENTS_BUCKET = 'property-documents';
export const MAX_DOCUMENTS_PER_PROPERTY = 5;
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25 MB
export const ALLOWED_DOCUMENT_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** Lists documents for a property (owner-scoped via RLS). */
export async function listPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('property_documents')
    .select('*')
    .eq('user_id', user.id)
    .eq('property_id', propertyId)
    .order('uploaded_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PropertyDocument[]) ?? [];
}

/** Number of documents already stored for a property (for the 5-doc limit). */
export async function getPropertyDocumentCount(propertyId: string): Promise<number> {
  const { supabase, user } = await requireUser();
  const { count, error } = await supabase
    .from('property_documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('property_id', propertyId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Fetches a single document owned by the current user. */
export async function getDocument(documentId: string): Promise<PropertyDocument | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('property_documents')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', documentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PropertyDocument | null) ?? null;
}

/** Recent access-log entries for a property (owner-only). */
export async function listDocumentAccessLog(
  propertyId: string,
  limit = 25,
): Promise<DocumentAccessLog[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('document_access_log')
    .select('*')
    .eq('user_id', user.id)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as DocumentAccessLog[]) ?? [];
}

/** Fetches the private details record for a property (owner-only). */
export async function getPrivateDetails(
  propertyId: string,
): Promise<PropertyPrivateDetails | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('property_private_details')
    .select('*')
    .eq('user_id', user.id)
    .eq('property_id', propertyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PropertyPrivateDetails | null) ?? null;
}
