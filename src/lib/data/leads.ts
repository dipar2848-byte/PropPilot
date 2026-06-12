import { requireUser } from '@/lib/data/properties';
import type { Lead, LeadStatus } from '@/lib/types';

export interface LeadCounts {
  total: number;
  new: number;
  contacted: number;
  closed: number;
}

export interface LeadFilters {
  q?: string;
  status?: string;
}

const EMPTY_COUNTS: LeadCounts = { total: 0, new: 0, contacted: 0, closed: 0 };

/** Lead counts for a single property (owner-scoped via RLS). */
export async function getPropertyLeadCounts(propertyId: string): Promise<LeadCounts> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('leads')
    .select('status')
    .eq('user_id', user.id)
    .eq('property_id', propertyId);

  if (error) throw new Error(error.message);

  return tally((data as { status: LeadStatus }[]) ?? []);
}

/** Lead counts across the whole workspace. */
export async function getWorkspaceLeadCounts(): Promise<LeadCounts> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('leads')
    .select('status')
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  return tally((data as { status: LeadStatus }[]) ?? []);
}

function tally(rows: { status: LeadStatus }[]): LeadCounts {
  const counts: LeadCounts = { ...EMPTY_COUNTS, total: rows.length };
  for (const r of rows) {
    if (r.status === 'new') counts.new += 1;
    else if (r.status === 'contacted') counts.contacted += 1;
    else if (r.status === 'closed') counts.closed += 1;
  }
  return counts;
}

/** Lists leads for a property, optionally filtered by query (name/phone) + status. */
export async function listPropertyLeads(
  propertyId: string,
  filters: LeadFilters = {},
): Promise<Lead[]> {
  const { supabase, user } = await requireUser();

  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  const status = (filters.status ?? '').trim();
  if (status && ['new', 'contacted', 'closed'].includes(status)) {
    query = query.eq('status', status as LeadStatus);
  }

  const q = (filters.q ?? '').trim();
  if (q) {
    // Escape PostgREST wildcards / commas to keep the OR filter well-formed.
    const safe = q.replace(/[%,()]/g, ' ');
    query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Lead[]) ?? [];
}

/** Fetches a single lead owned by the current user. */
export async function getLead(leadId: string): Promise<Lead | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', leadId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Lead | null) ?? null;
}
