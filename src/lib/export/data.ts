// ============================================================================
// PropPilot — Export data layer (Phase 9)
// ============================================================================
// Owner-scoped fetches used by the CSV export route handlers. Every query runs
// through the RLS-bound server client and is additionally filtered by user_id,
// so a user can only ever export their own workspace data. Nothing here touches
// private documents or commission/internal details.

import { requireUser } from '@/lib/data/properties';
import type { Lead, Property } from '@/lib/types';

/** A lead row enriched with its parent property's title for readable exports. */
export interface LeadExportRow extends Lead {
  property_title: string;
}

/**
 * All leads in the current user's workspace (newest first), each annotated with
 * the owning property's title. RLS + the explicit user_id filter guarantee
 * tenant isolation.
 */
export async function getAllLeadsForExport(): Promise<LeadExportRow[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('leads')
    .select('*, properties(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  type Joined = Lead & { properties: { title: string } | null };
  return ((data as Joined[]) ?? []).map(({ properties, ...lead }) => ({
    ...lead,
    property_title: properties?.title ?? '',
  }));
}

/**
 * All properties in the current user's workspace (newest first). Owner-scoped
 * via RLS + user_id filter.
 */
export async function getAllPropertiesForExport(): Promise<Property[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Property[]) ?? [];
}
