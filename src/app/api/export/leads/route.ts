// ============================================================================
// PropPilot — Leads CSV export (Phase 9)
// ============================================================================
// GET /api/export/leads → downloads the authenticated user's leads as CSV.
// Owner-scoped via RLS + an explicit user_id filter in the data layer. No
// private documents or internal details are ever included.

import { createClient } from '@/lib/supabase/server';
import { getAllLeadsForExport } from '@/lib/export/data';
import { toCsv } from '@/lib/export/csv';
import { LEAD_COLUMNS } from '@/lib/export/columns';
import { csvResponse, unauthorized } from '@/lib/export/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Explicit auth gate so the endpoint returns a clean 401 rather than throwing.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const leads = await getAllLeadsForExport();
  const csv = toCsv(leads, LEAD_COLUMNS);
  return csvResponse(csv, 'leads');
}
